// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Ionova Validator Fraction NFT Sale
 * @dev ERC-1155 NFTs representing validator fractions with bonding curve pricing
 *
 * Key Features:
 * - Each fraction is an NFT (tradeable on OpenSea, etc.)
 * - Price increases from $10 to $100 per fraction
 * - 1,800,000 total fractions (100,000 per validator)
 * - Fractions earn proportional validator revenue
 * - Fully tradeable on secondary markets
 * - KYC/AML compliant with whitelist
 */
contract ValidatorFractionNFT is ERC1155, Ownable, ReentrancyGuard, Pausable {
    // Constants - Validators
    uint256 public constant TOTAL_FRACTIONS = 1_800_000;
    uint256 public constant FRACTIONS_PER_VALIDATOR = 100_000;
    uint256 public constant VALIDATORS_FOR_SALE = 18;
    
    // Reserved Validators (not for sale)
    uint256 public constant RESERVED_VALIDATORS = 3;
    uint256 public constant RESERVED_FRACTIONS = 300_000; // 3 × 100,000
    uint256 public constant TOTAL_ACTIVE_FRACTIONS = 2_100_000; // Sold + Reserved

    // Pricing (in USDC/USDT with 6 decimals)
    uint256 public constant START_PRICE = 10 * 10**6; // $10
    uint256 public constant END_PRICE = 100 * 10**6; // $100
    uint256 public constant PRICE_RANGE = END_PRICE - START_PRICE; // $90
    
    // IONX Emission Schedule
    uint256 public constant INITIAL_DAILY_EMISSION = 1_000_000 * 10**18; // 1M IONX/day
    uint256 public constant HALVING_INTERVAL = 730 days; // 2 years
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public immutable GENESIS_TIMESTAMP; // Set at deployment

    // State
    uint256 public fractionsSold;
    address public usdcToken; // USDC address
    address public usdtToken; // USDT address
    address public treasury;
    address public ionxToken; // IONX token for rewards

    // Supported tokens
    mapping(address => bool) public supportedTokens;

    // Sale timing
    uint256 public saleStartTime;
    uint256 public saleEndTime;

    // KYC Verification
    mapping(address => bool) public kycVerified;
    mapping(address => bool) public kycAdmins;
    bool public kycRequired = true;

    // Optimized fraction tracking
    mapping(address => uint256) public totalFractionsOwned;

    // Reward tracking
    uint256 public totalRewardsDistributed;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public pendingRewards;
    
    // Reserved fraction holders
    address public treasuryReserved;    // Validator #19
    address public ecosystemReserved;   // Validator #20
    address public foundationReserved;  // Validator #21

    // Affiliate System
    enum AffiliateRank { Starter, Bronze, Silver, Gold }
    
    struct RankRequirement {
        uint256 downlineRequired;
        uint256 selfRequired;
        uint256 commissionRate; // in basis points (500 = 5%)
    }
    
    mapping(address => address) public referredBy;
    mapping(address => uint256) public selfSales;
    mapping(address => uint256) public downlineSales;
    
    // Commission balances per token: user => token => amount
    mapping(address => mapping(address => uint256)) public commissionBalance;
    mapping(address => uint256) public totalCommissionEarned;
    mapping(address => AffiliateRank) public affiliateRank;
    mapping(AffiliateRank => RankRequirement) public rankRequirements;
    
    uint256 public totalCommissionsPaid;

    // Events
    event FractionPurchased(address indexed buyer, uint256 indexed fractionId, uint256 price);
    event RewardsClaimed(address indexed owner, uint256 amount);
    event KYCStatusUpdated(address indexed user, bool verified);
    event KYCAdminUpdated(address indexed admin, bool status);
    event SaleTimesUpdated(uint256 startTime, uint256 endTime);
    event IonxTokenUpdated(address indexed tokenAddress);
    event CommissionEarned(address indexed referrer, address indexed buyer, uint256 commission, uint256 saleAmount);
    event CommissionClaimed(address indexed user, uint256 amount);
    event RankUpgraded(address indexed user, AffiliateRank newRank);

    constructor(
        address _usdcToken,
        address _usdtToken,
        address _treasury,
        address _treasuryReserved,
        address _ecosystemReserved,
        address _foundationReserved,
        string memory _uri,
        uint256 _saleStartTime,
        uint256 _saleEndTime
    ) ERC1155(_uri) {
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_usdtToken != address(0), "Invalid USDT token");
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
        
        // Set genesis timestamp for emission calculation
        GENESIS_TIMESTAMP = block.timestamp;
        
        // Initialize reserved fractions (each gets 100,000)
        totalFractionsOwned[_treasuryReserved] = FRACTIONS_PER_VALIDATOR;
        totalFractionsOwned[_ecosystemReserved] = FRACTIONS_PER_VALIDATOR;
        totalFractionsOwned[_foundationReserved] = FRACTIONS_PER_VALIDATOR;
        
        // Owner is KYC admin by default
        kycAdmins[msg.sender] = true;
        
        // Initialize rank requirements
        rankRequirements[AffiliateRank.Starter] = RankRequirement(0, 0, 500); // 5%
        rankRequirements[AffiliateRank.Bronze] = RankRequirement(1000 * 10**6, 100 * 10**6, 1000); // 10%
        rankRequirements[AffiliateRank.Silver] = RankRequirement(10000 * 10**6, 1000 * 10**6, 1500); // 15%
        rankRequirements[AffiliateRank.Gold] = RankRequirement(100000 * 10**6, 5000 * 10**6, 2000); // 20%
    }

    // Modifiers
    modifier whenSaleActive() {
        require(block.timestamp >= saleStartTime, "Sale not started");
        require(block.timestamp <= saleEndTime, "Sale ended");
        _;
    }

    modifier onlyKYCVerified() {
        if (kycRequired) {
            require(kycVerified[msg.sender], "KYC verification required");
        }
        _;
    }

    modifier onlyKYCAdmin() {
        require(kycAdmins[msg.sender], "Not KYC admin");
        _;
    }

    // KYC Management
    function setKYCStatus(address user, bool verified) external onlyKYCAdmin {
        kycVerified[user] = verified;
        emit KYCStatusUpdated(user, verified);
    }

    function setKYCStatusBatch(address[] calldata users, bool[] calldata statuses) external onlyKYCAdmin {
        require(users.length == statuses.length, "Length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            kycVerified[users[i]] = statuses[i];
            emit KYCStatusUpdated(users[i], statuses[i]);
        }
    }

    function setKYCAdmin(address admin, bool status) external onlyOwner {
        kycAdmins[admin] = status;
        emit KYCAdminUpdated(admin, status);
    }

    function setKYCRequired(bool required) external onlyOwner {
        kycRequired = required;
    }

    // Sale Time Management
    function setSaleTimes(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_endTime > _startTime, "Invalid times");
        saleStartTime = _startTime;
        saleEndTime = _endTime;
        emit SaleTimesUpdated(_startTime, _endTime);
    }

    // IONX Token Management
    function setIonxToken(address _ionxToken) external onlyOwner {
        require(_ionxToken != address(0), "Invalid address");
        ionxToken = _ionxToken;
        emit IonxTokenUpdated(_ionxToken);
    }

    // Pricing functions
    function getFractionPrice(uint256 fractionNumber) public pure returns (uint256) {
        require(fractionNumber > 0 && fractionNumber <= TOTAL_FRACTIONS, "Invalid fraction");
        uint256 priceIncrease = (fractionNumber * PRICE_RANGE) / TOTAL_FRACTIONS;
        return START_PRICE + priceIncrease;
    }

    function getTotalCost(uint256 quantity) public view returns (uint256) {
        require(fractionsSold + quantity <= TOTAL_FRACTIONS, "Exceeds available");
        uint256 totalCost = 0;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 fractionNumber = fractionsSold + i + 1;
            totalCost += getFractionPrice(fractionNumber);
        }
        return totalCost;
    }

    // Purchase
    function buyFractions(uint256 quantity, address referrer, address paymentToken) external nonReentrant whenNotPaused whenSaleActive onlyKYCVerified {
        require(quantity > 0, "Must buy at least 1");
        require(fractionsSold + quantity <= TOTAL_FRACTIONS, "Exceeds available");
        require(supportedTokens[paymentToken], "Unsupported payment token");
        
        uint256 totalCost = getTotalCost(quantity);
        
        // Set referrer (only first time)
        if (referredBy[msg.sender] == address(0) && referrer != address(0) && referrer != msg.sender) {
            referredBy[msg.sender] = referrer;
        }
        
        // Track self sales
        selfSales[msg.sender] += totalCost;
        
        // Calculate and distribute commission
        address userReferrer = referredBy[msg.sender];
        uint256 commission = 0;
        
        if (userReferrer != address(0)) {
            commission = calculateCommission(userReferrer, totalCost);
            commissionBalance[userReferrer][paymentToken] += commission;
            totalCommissionEarned[userReferrer] += commission;
            downlineSales[userReferrer] += totalCost;
            
            // Check for rank upgrade
            checkAndUpgradeRank(userReferrer);
            
            // Transfer payment: (totalCost - commission) to treasury, commission stays in contract
            IERC20(paymentToken).transferFrom(msg.sender, treasury, totalCost - commission);
            IERC20(paymentToken).transferFrom(msg.sender, address(this), commission);
            
            emit CommissionEarned(userReferrer, msg.sender, commission, totalCost);
        } else {
            // No referrer, full amount to treasury
            IERC20(paymentToken).transferFrom(msg.sender, treasury, totalCost);
        }
        
        // Mint NFTs
        for (uint256 i = 0; i < quantity; i++) {
            uint256 fractionId = fractionsSold + i + 1;
            _mint(msg.sender, fractionId, 1, "");
            emit FractionPurchased(msg.sender, fractionId, getFractionPrice(fractionId));
        }
        
        fractionsSold += quantity;
        totalFractionsOwned[msg.sender] += quantity;
        
        // Initialize lastClaimTime for new buyer if not set
        if (lastClaimTime[msg.sender] == 0) {
            lastClaimTime[msg.sender] = block.timestamp;
        }
    }

    function getCurrentPrice() external view returns (uint256) {
        if (fractionsSold >= TOTAL_FRACTIONS) {
            return 0;
        }
        return getFractionPrice(fractionsSold + 1);
    }

    function getValidatorForFraction(uint256 fractionId) public pure returns (uint256) {
        require(fractionId > 0 && fractionId <= TOTAL_FRACTIONS, "Invalid fraction");
        return (fractionId - 1) / FRACTIONS_PER_VALIDATOR;
    }

    // Gas-optimized - uses mapping instead of loop
    function getTotalFractionsOwned(address owner) public view returns (uint256) {
        return totalFractionsOwned[owner];
    }

    function getOwnershipPercentage(address owner) external view returns (uint256) {
        uint256 fractionsOwned = totalFractionsOwned[owner];
        return (fractionsOwned * 1_000_000) / TOTAL_FRACTIONS; // 6 decimals precision
    }

    // Rewards - Legacy function kept for compatibility
    function calculateRewardForFraction(uint256 fractionId) public view returns (uint256) {
        // Deprecated - use calculatePendingRewards instead
        return 0;
    }

    function getPendingRewards(address owner) external view returns (uint256) {
        return calculatePendingRewards(owner);
    }

    function getSaleStats()
        external
        view
        returns (
            uint256 _fractionsSold,
            uint256 _fractionsRemaining,
            uint256 _currentPrice,
            uint256 _totalRaised,
            uint256 _percentSold
        )
    {
        _fractionsSold = fractionsSold;
        _fractionsRemaining = TOTAL_FRACTIONS - fractionsSold;
        _currentPrice = fractionsSold < TOTAL_FRACTIONS ? getFractionPrice(fractionsSold + 1) : 0;
        
        uint256 raised = 0;
        for (uint256 i = 1; i <= fractionsSold; i++) {
            raised += getFractionPrice(i);
        }
        _totalRaised = raised;
        _percentSold = (fractionsSold * 100) / TOTAL_FRACTIONS;
    }

    // Override _beforeTokenTransfer to update totalFractionsOwned on transfers
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // Update totalFractionsOwned on transfers (not on mints)
        if (from != address(0) && to != address(0)) {
            uint256 totalAmount = 0;
            for (uint256 i = 0; i < amounts.length; i++) {
                totalAmount += amounts[i];
            }
            totalFractionsOwned[from] -= totalAmount;
            totalFractionsOwned[to] += totalAmount;
        }
    }

    // URI management
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    // Pausable
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");
        IERC20(token).transfer(owner(), balance);
    }

    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH balance");
        payable(owner()).transfer(balance);
    }

    // Allow contract to receive ETH
    receive() external payable {}
    
    // ==================== IONX REWARD SYSTEM ====================
    
    /**
     * @dev Get current daily IONX emission based on halving schedule
     */
    function getCurrentDailyEmission() public view returns (uint256) {
        uint256 timeSinceGenesis = block.timestamp - GENESIS_TIMESTAMP;
        uint256 halvingsPassed = timeSinceGenesis / HALVING_INTERVAL;
        
        // Max 15 halvings (30 years)
        if (halvingsPassed >= 15) {
            return INITIAL_DAILY_EMISSION / (2 ** 15);
        }
        
        return INITIAL_DAILY_EMISSION / (2 ** halvingsPassed);
    }
    
    /**
     * @dev Get emission per second
     */
    function getEmissionPerSecond() public view returns (uint256) {
        return getCurrentDailyEmission() / SECONDS_PER_DAY;
    }
    
    /**
     * @dev Calculate total active fractions (sold + reserved)
     */
    function getTotalActiveFractions() public view returns (uint256) {
        return fractionsSold + RESERVED_FRACTIONS;
    }
    
    /**
     * @dev Calculate reward per fraction per day
     * Equal distribution across all active fractions (sold + reserved)
     */
    function getRewardPerFraction() public view returns (uint256) {
        uint256 activePool = getTotalActiveFractions();
        if (activePool == 0) return 0;
        
        uint256 dailyEmission = getCurrentDailyEmission();
        return dailyEmission / activePool;
    }
    
    /**
     * @dev Calculate pending rewards for a user
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        uint256 userFractions = totalFractionsOwned[user];
        if (userFractions == 0) return 0;
        
        uint256 timeSinceLastClaim = block.timestamp - lastClaimTime[user];
        if (timeSinceLastClaim == 0) return pendingRewards[user];
        
        uint256 rewardPerSecond = getEmissionPerSecond();
        uint256 activePool = getTotalActiveFractions();
        
        // User's share of emission per second
        uint256 userRewardPerSecond = (rewardPerSecond * userFractions) / activePool;
        uint256 accruedRewards = userRewardPerSecond * timeSinceLastClaim;
        
        return pendingRewards[user] + accruedRewards;
    }
    
    /**
     * @dev Claim IONX rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = calculatePendingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        // Update state
        pendingRewards[msg.sender] = 0;
        lastClaimTime[msg.sender] = block.timestamp;
        totalRewardsDistributed += rewards;
        
        // Transfer IONX
        require(ionxToken != address(0), "IONX token not set");
        IERC20(ionxToken).transfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Update pending rewards (called internally before balance changes)
     */
    function _updatePendingRewards(address user) internal {
        if (user == address(0)) return;
        
        uint256 pending = calculatePendingRewards(user);
        pendingRewards[user] = pending;
        lastClaimTime[user] = block.timestamp;
    }
    
    /**
     * @dev Get comprehensive reward stats for a user
     */
    function getRewardStats(address user) external view returns (
        uint256 userFractions,
        uint256 pendingRewardAmount,
        uint256 dailyRewardRate,
        uint256 annualRewardRate,
        uint256 rewardPerFraction,
        uint256 totalEmissionToday,
        uint256 userSharePercentage
    ) {
        userFractions = totalFractionsOwned[user];
        pendingRewardAmount = calculatePendingRewards(user);
        rewardPerFraction = getRewardPerFraction();
        totalEmissionToday = getCurrentDailyEmission();
        
        dailyRewardRate = (rewardPerFraction * userFractions);
        annualRewardRate = dailyRewardRate * 365;
        
        uint256 activePool = getTotalActiveFractions();
        userSharePercentage = activePool > 0 ? (userFractions * 10000) / activePool : 0;
    }
    
    // Affiliate System Functions
    
    /**
     * @dev Calculate commission for a referrer based on their rank
     */
    function calculateCommission(address referrer, uint256 saleAmount) public view returns (uint256) {
        AffiliateRank rank = affiliateRank[referrer];
        RankRequirement memory req = rankRequirements[rank];
        return (saleAmount * req.commissionRate) / 10000;
    }
    
    /**
     * @dev Check and automatically upgrade rank if thresholds met
     */
    function checkAndUpgradeRank(address user) internal {
        AffiliateRank currentRank = affiliateRank[user];
        
        // Check from highest to lowest rank
        if (currentRank < AffiliateRank.Gold && 
            downlineSales[user] >= rankRequirements[AffiliateRank.Gold].downlineRequired &&
            selfSales[user] >= rankRequirements[AffiliateRank.Gold].selfRequired) {
            affiliateRank[user] = AffiliateRank.Gold;
            emit RankUpgraded(user, AffiliateRank.Gold);
        }
        else if (currentRank < AffiliateRank.Silver && 
            downlineSales[user] >= rankRequirements[AffiliateRank.Silver].downlineRequired &&
            selfSales[user] >= rankRequirements[AffiliateRank.Silver].selfRequired) {
            affiliateRank[user] = AffiliateRank.Silver;
            emit RankUpgraded(user, AffiliateRank.Silver);
        }
        else if (currentRank < AffiliateRank.Bronze && 
            downlineSales[user] >= rankRequirements[AffiliateRank.Bronze].downlineRequired &&
            selfSales[user] >= rankRequirements[AffiliateRank.Bronze].selfRequired) {
            affiliateRank[user] = AffiliateRank.Bronze;
            emit RankUpgraded(user, AffiliateRank.Bronze);
        }
    }
    
    /**
     * @dev Claim accumulated commission in specified token (USDC or USDT)
     */
    function claimCommission(address token) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        uint256 amount = commissionBalance[msg.sender][token];
        require(amount > 0, "No commission to claim");
        
        commissionBalance[msg.sender][token] = 0;
        totalCommissionsPaid += amount;
        
        IERC20(token).transfer(msg.sender, amount);
        
        emit CommissionClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Claim all commissions in both USDC and USDT
     */
    function claimAllCommissions() external nonReentrant {
        uint256 usdcAmount = commissionBalance[msg.sender][usdcToken];
        uint256 usdtAmount = commissionBalance[msg.sender][usdtToken];
        
        require(usdcAmount > 0 || usdtAmount > 0, "No commission to claim");
        
        if (usdcAmount > 0) {
            commissionBalance[msg.sender][usdcToken] = 0;
            totalCommissionsPaid += usdcAmount;
            IERC20(usdcToken).transfer(msg.sender, usdcAmount);
            emit CommissionClaimed(msg.sender, usdcAmount);
        }
        
        if (usdtAmount > 0) {
            commissionBalance[msg.sender][usdtToken] = 0;
            totalCommissionsPaid += usdtAmount;
            IERC20(usdtToken).transfer(msg.sender, usdtAmount);
            emit CommissionClaimed(msg.sender, usdtAmount);
        }
    }
    
    /**
     * @dev Get comprehensive affiliate statistics for a user
     */
    function getAffiliateStats(address user) external view returns (
        AffiliateRank rank,
        uint256 pendingCommission,
        uint256 totalEarned,
        uint256 selfSalesTotal,
        uint256 downlineSalesTotal,
        uint256 commissionRate
    ) {
        rank = affiliateRank[user];
        // Sum commissions from both tokens
        pendingCommission = commissionBalance[user][usdcToken] + commissionBalance[user][usdtToken];
        totalEarned = totalCommissionEarned[user];
        selfSalesTotal = selfSales[user];
        downlineSalesTotal = downlineSales[user];
        commissionRate = rankRequirements[rank].commissionRate;
    }
    
    /**
     * @dev Get commission balance for specific token
     */
    function getCommissionBalance(address user, address token) external view returns (uint256) {
        require(supportedTokens[token], "Unsupported token");
        return commissionBalance[user][token];
    }
    
    /**
     * @dev Get commission balances for both tokens
     */
    function getCommissionBalances(address user) external view returns (uint256 usdcBalance, uint256 usdtBalance) {
        usdcBalance = commissionBalance[user][usdcToken];
        usdtBalance = commissionBalance[user][usdtToken];
    }
    
    /**
     * @dev Get requirements for next rank
     */
    function getNextRankRequirements(address user) external view returns (
        AffiliateRank nextRank,
        uint256 downlineNeeded,
        uint256 selfNeeded
    ) {
        AffiliateRank current = affiliateRank[user];
        
        if (current == AffiliateRank.Gold) {
            return (AffiliateRank.Gold, 0, 0); // Already at max rank
        }
        
        nextRank = AffiliateRank(uint8(current) + 1);
        RankRequirement memory req = rankRequirements[nextRank];
        
        downlineNeeded = req.downlineRequired > downlineSales[user] 
            ? req.downlineRequired - downlineSales[user] 
            : 0;
        selfNeeded = req.selfRequired > selfSales[user] 
            ? req.selfRequired - selfSales[user] 
            : 0;
    }
    
    /**
     * @dev Get rank name as string
     */
    function getRankName(AffiliateRank rank) public pure returns (string memory) {
        if (rank == AffiliateRank.Starter) return "Starter";
        if (rank == AffiliateRank.Bronze) return "Bronze";
        if (rank == AffiliateRank.Silver) return "Silver";
        if (rank == AffiliateRank.Gold) return "Gold";
        return "Unknown";
    }
    
    /**
     * @dev Get user's referrer
     */
    function getMyReferrer() external view returns (address) {
        return referredBy[msg.sender];
    }
}
