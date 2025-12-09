// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Ionova Wallet Connection Airdrop with Referrals
 * @dev 50 IONX base airdrop + 12.5 IONX referral bonus per direct referral
 */
contract IonovaAirdrop {
    // Constants
    uint256 public constant BASE_AIRDROP_AMOUNT = 50 * 10**18; // 50 IONX
    uint256 public constant REFERRAL_BONUS = 12.5 * 10**18; // 12.5 IONX per referral
    
    // State
    address public ionxToken;
    address public owner;
    mapping(address => bool) public hasClaimed;
    mapping(address => address) public referrer; // User => their referrer
    mapping(address => uint256) public referralCount; // Count of successful referrals
    mapping(address => uint256) public totalEarned; // Total IONX earned (base + referrals)
    
    uint256 public totalClaimed;
    uint256 public totalUsersAirdropped;
    uint256 public totalReferralBonusPaid;
    
    // Events
    event AirdropClaimed(address indexed user, uint256 baseAmount, address indexed referredBy);
    event ReferralBonusPaid(address indexed referrer, address indexed referee, uint256 bonusAmount);
    event AirdropFunded(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _ionxToken) {
        ionxToken = _ionxToken;
        owner = msg.sender;
    }
    
    /**
     * @dev Claim 50 IONX base airdrop + register referrer
     * @param _referrer Address of the person who referred (optional, use address(0) if none)
     */
    function claimAirdrop(address _referrer) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(getBalance() >= BASE_AIRDROP_AMOUNT, "Insufficient airdrop funds");
        require(_referrer != msg.sender, "Cannot refer yourself");
        
        // Mark as claimed
        hasClaimed[msg.sender] = true;
        totalClaimed += BASE_AIRDROP_AMOUNT;
        totalUsersAirdropped++;
        totalEarned[msg.sender] = BASE_AIRDROP_AMOUNT;
        
        // Register referrer if provided and valid
        if (_referrer != address(0) && hasClaimed[_referrer]) {
            referrer[msg.sender] = _referrer;
            referralCount[_referrer]++;
            
            // Pay 12.5 IONX referral bonus to referrer
            if (getBalance() >= REFERRAL_BONUS) {
                totalReferralBonusPaid += REFERRAL_BONUS;
                totalEarned[_referrer] += REFERRAL_BONUS;
                IERC20(ionxToken).transfer(_referrer, REFERRAL_BONUS);
                emit ReferralBonusPaid(_referrer, msg.sender, REFERRAL_BONUS);
            }
        }
        
        // Transfer base 50 IONX to claimer
        IERC20(ionxToken).transfer(msg.sender, BASE_AIRDROP_AMOUNT);
        
        emit AirdropClaimed(msg.sender, BASE_AIRDROP_AMOUNT, _referrer);
    }
    
    /**
     * @dev Check if address has claimed
     */
    function hasClaimedAirdrop(address user) external view returns (bool) {
        return hasClaimed[user];
    }
    
    /**
     * @dev Get user's referral stats
     */
    function getReferralStats(address user) external view returns (
        uint256 refs,
        uint256 totalBonusEarned,
        uint256 totalReceived
    ) {
        return (
            referralCount[user],
            referralCount[user] * REFERRAL_BONUS,
            totalEarned[user]
        );
    }
    
    /**
     * @dev Get who referred a user
     */
    function getRefer(address user) external view returns (address) {
        return referrer[user];
    }
    
    /**
     * @dev Get remaining airdrop balance
     */
    function getBalance() public view returns (uint256) {
        return IERC20(ionxToken).balanceOf(address(this));
    }
    
    /**
     * @dev Get remaining base airdrops available
     */
    function getRemainingAirdrops() external view returns (uint256) {
        return getBalance() / BASE_AIRDROP_AMOUNT;
    }
    
    /**
     * @dev Fund airdrop contract (owner only)
     */
    function fundAirdrop(uint256 amount) external onlyOwner {
        IERC20(ionxToken).transferFrom(msg.sender, address(this), amount);
        emit AirdropFunded(amount);
    }
    
    /**
     * @dev Withdraw unclaimed funds (owner only)
     */
    function withdrawUnclaimed() external onlyOwner {
        uint256 balance = getBalance();
        IERC20(ionxToken).transfer(owner, balance);
    }
    
    /**
     * @dev Get comprehensive airdrop statistics
     */
    function getStats() external view returns (
        uint256 _totalClaimed,
        uint256 _totalUsers,
        uint256 _totalReferralBonus,
        uint256 _remainingAirdrops,
        uint256 _contractBalance
    ) {
        return (
            totalClaimed,
            totalUsersAirdropped,
            totalReferralBonusPaid,
            getBalance() / BASE_AIRDROP_AMOUNT,
            getBalance()
        );
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
