// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Ionova Validator Fraction NFT Sale (Upgradeable)
 * @dev UUPS Upgradeable version with future-proof architecture
 * 
 * Upgrade Path:
 * - Deploy implementation contract
 * - Deploy UUPS proxy pointing to implementation
 * - Initialize via proxy
 * - Future upgrades: Deploy new implementation → call upgradeTo()
 */
contract ValidatorFractionNFTUpgradeable is 
    Initializable,
    ERC1155Upgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable 
{
    // ==================== STORAGE (DO NOT CHANGE ORDER) ====================
    // CRITICAL: When upgrading, new storage variables MUST be added at the END
    
    // Constants (stored as immutable for upgradeable)
    uint256 public constant TOTAL_FRACTIONS = 1_800_000;
    uint256 public constant FRACTIONS_PER_VALIDATOR = 100_000;
    uint256 public constant VALIDATORS_FOR_SALE = 18;
    uint256 public constant RESERVED_VALIDATORS = 3;
    uint256 public constant RESERVED_FRACTIONS = 300_000;
    uint256 public constant TOTAL_ACTIVE_FRACTIONS = 2_100_000;
    
    uint256 public constant START_PRICE = 10 * 10**6;
    uint256 public constant END_PRICE = 100 * 10**6;
    uint256 public constant PRICE_RANGE = END_PRICE - START_PRICE;
    
    // IONX Emission Schedule - 79% of supply distributed over 15 years
    uint256 public constant INITIAL_DAILY_EMISSION = 10_821_918 * 10**18; // ~10.82M IONX/day
    uint256 public constant HALVING_INTERVAL = 365 days; // 1 year (annual halving)
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    // Slot 1-10: Core contract state
    uint256 public fractionsSold;
    address public usdcToken;
    address public usdtToken;
    address public treasury;
    address public ionxToken;
    uint256 public saleStartTime;
    uint256 public saleEndTime;
    uint256 public GENESIS_TIMESTAMP;
    
    // Slot 11-20: Mappings
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public kycVerified;
    mapping(address => bool) public kycAdmins;
    bool public kycRequired;
    mapping(address => uint256) public totalFractionsOwned;
    
    // Slot 21-30: Rewards
    uint256 public totalRewardsDistributed;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public pendingRewards;
    address public treasuryReserved;
    address public ecosystemReserved;
    address public foundationReserved;
    
    // Slot 31-40: Affiliate system
    mapping(address => address) public referredBy;
    mapping(address => uint256) public selfSales;
    mapping(address => uint256) public downlineSales;
    mapping(address => mapping(address => uint256)) public commissionBalance;
    mapping(address => uint256) public totalCommissionEarned;
    mapping(address => AffiliateRank) public affiliateRank;
    mapping(AffiliateRank => RankRequirement) public rankRequirements;
    uint256 public totalCommissionsPaid;
    
    // Enums and Structs
    enum AffiliateRank { Starter, Bronze, Silver, Gold }
    
    struct RankRequirement {
        uint256 downlineRequired;
        uint256 selfRequired;
        uint256 commissionRate;
    }
    
    // ==================== STORAGE GAP FOR FUTURE UPGRADES ====================
    // Reserve 50 storage slots for future functionality
    uint256[50] private __gap;
    
    // ==================== EVENTS ====================
    event FractionPurchased(address indexed buyer, uint256 indexed fractionId, uint256 price);
    event RewardsClaimed(address indexed owner, uint256 amount);
    event CommissionEarned(address indexed referrer, address indexed buyer, uint256 commission, uint256 saleAmount);
    event CommissionClaimed(address indexed user, uint256 amount);
    event RankUpgraded(address indexed user, AffiliateRank newRank);
    event ContractUpgraded(address indexed newImplementation, uint256 version);
    
    // ==================== INITIALIZATION ====================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract (replaces constructor)
     * @notice Called once during proxy deployment
     */
    function initialize(
        address _usdcToken,
        address _usdtToken,
        address _treasury,
        address _treasuryReserved,
        address _ecosystemReserved,
        address _foundationReserved,
        string memory _uri,
        uint256 _saleStartTime,
        uint256 _saleEndTime
    ) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        require(_usdcToken != address(0), "Invalid USDC");
        require(_usdtToken != address(0), "Invalid USDT");
        require(_treasury != address(0), "Invalid treasury");
        require(_treasuryReserved != address(0), "Invalid treasury reserved");
        require(_ecosystemReserved != address(0), "Invalid ecosystem reserved");
        require(_foundationReserved != address(0), "Invalid foundation reserved");
        require(_saleEndTime > _saleStartTime, "Invalid sale times");
        
        usdcToken = _usdcToken;
        usdtToken = _usdtToken;
        supportedTokens[_usdcToken] = true;
        supportedTokens[_usdtToken] = true;
        
        treasury = _treasury;
        treasuryReserved = _treasuryReserved;
        ecosystemReserved = _ecosystemReserved;
        foundationReserved = _foundationReserved;
        
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
        GENESIS_TIMESTAMP = block.timestamp;
        
        // Initialize reserved fractions
        totalFractionsOwned[_treasuryReserved] = FRACTIONS_PER_VALIDATOR;
        totalFractionsOwned[_ecosystemReserved] = FRACTIONS_PER_VALIDATOR;
        totalFractionsOwned[_foundationReserved] = FRACTIONS_PER_VALIDATOR;
        
        // KYC setup
        kycAdmins[msg.sender] = true;
        kycRequired = true;
        
        // Affiliate ranks
        rankRequirements[AffiliateRank.Starter] = RankRequirement(0, 0, 500);
        rankRequirements[AffiliateRank.Bronze] = RankRequirement(1000 * 10**6, 100 * 10**6, 1000);
        rankRequirements[AffiliateRank.Silver] = RankRequirement(10000 * 10**6, 1000 * 10**6, 1500);
        rankRequirements[AffiliateRank.Gold] = RankRequirement(100000 * 10**6, 5000 * 10**6, 2000);
    }
    
    // ==================== UPGRADE AUTHORIZATION ====================
    
    /**
     * @dev Authorize upgrade to new implementation
     * @notice Only owner can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        emit ContractUpgraded(newImplementation, getVersion());
    }
    
    /**
     * @dev Get current contract version
     */
    function getVersion() public pure returns (uint256) {
        return 1; // Increment this in upgraded versions
    }
    
    /**
     * @dev Get implementation address
     */
    function getImplementation() public view returns (address) {
        return _getImplementation();
    }
    
    // ==================== FUTURE-PROOF HOOKS ====================
    
    /**
     * @dev Hook for future functionality before purchases
     * @notice Can be overridden in upgrades
     */
    function _beforePurchase(address buyer, uint256 quantity, uint256 cost) internal virtual {
        // Override in future versions to add new logic
        // Example: Apply dynamic bonuses, special promotions, etc.
    }
    
    /**
     * @dev Hook for future functionality after purchases
     */
    function _afterPurchase(address buyer, uint256 quantity, uint256 cost) internal virtual {
        // Override for post-purchase logic
        // Example: Trigger airdrops, update external contracts, etc.
    }
    
    /**
     * @dev Hook for future reward calculation modifications
     */
    function _modifyRewards(address user, uint256 baseReward) internal virtual returns (uint256) {
        // Override to apply multipliers, bonuses, etc.
        return baseReward;
    }
    
    // ==================== PLACEHOLDER: Add your existing functions here ====================
    // Copy all functions from ValidatorFractionNFT.sol
    // Replace constructor() with initialize()
    // Add virtual keyword to upgradeable functions
    
    // Example placeholder for buyFractions:
    function buyFractions(uint256 quantity, address referrer, address paymentToken) 
        external 
        virtual 
        nonReentrant 
        whenNotPaused 
    {
        // Implementation from original contract
        // with _beforePurchase and _afterPurchase hooks
    }
}
