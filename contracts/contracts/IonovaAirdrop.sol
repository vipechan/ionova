// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Ionova Wallet Connection Airdrop
 * @dev One-time 100 IONX airdrop for new wallet connections
 */
contract IonovaAirdrop {
    // Constants
    uint256 public constant AIRDROP_AMOUNT = 100 * 10**18; // 100 IONX
    
    // State
    address public ionxToken;
    address public owner;
    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;
    uint256 public totalUsersAirdropped;
    
    // Events
    event AirdropClaimed(address indexed user, uint256 amount);
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
     * @dev Claim 100 IONX airdrop (once per address)
     */
    function claimAirdrop() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(getBalance() >= AIRDROP_AMOUNT, "Insufficient airdrop funds");
        
        hasClaimed[msg.sender] = true;
        totalClaimed += AIRDROP_AMOUNT;
        totalUsersAirdropped++;
        
        // Transfer IONX
        IERC20(ionxToken).transfer(msg.sender, AIRDROP_AMOUNT);
        
        emit AirdropClaimed(msg.sender, AIRDROP_AMOUNT);
    }
    
    /**
     * @dev Check if address has claimed
     */
    function hasClaimedAirdrop(address user) external view returns (bool) {
        return hasClaimed[user];
    }
    
    /**
     * @dev Get remaining airdrop balance
     */
    function getBalance() public view returns (uint256) {
        return IERC20(ionxToken).balanceOf(address(this));
    }
    
    /**
     * @dev Get remaining airdrops available
     */
    function getRemainingAirdrops() external view returns (uint256) {
        return getBalance() / AIRDROP_AMOUNT;
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
     * @dev Get airdrop statistics
     */
    function getStats() external view returns (
        uint256 _totalClaimed,
        uint256 _totalUsers,
        uint256 _remainingAirdrops,
        uint256 _contractBalance
    ) {
        return (
            totalClaimed,
            totalUsersAirdropped,
            getBalance() / AIRDROP_AMOUNT,
            getBalance()
        );
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
