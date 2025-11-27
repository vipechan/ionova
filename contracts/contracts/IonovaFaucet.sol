// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Ionova Testnet Faucet
 * @dev Distributes testnet IONX tokens to developers
 * 
 * Features:
 * - Rate limiting (1 request per 24 hours per address)
 * - Configurable drip amount
 * - Admin controls
 * - Emergency pause
 * - Balance monitoring
 */
contract IonovaFaucet is Ownable, ReentrancyGuard, Pausable {
    
    // Faucet parameters
    uint256 public dripAmount;           // Amount of IONX per request (in wei)
    uint256 public cooldownPeriod;       // Time between requests (seconds)
    uint256 public maxBalance;           // Max balance to receive from faucet
    
    // Tracking
    mapping(address => uint256) public lastRequestTime;
    mapping(address => uint256) public totalReceived;
    uint256 public totalDistributed;
    uint256 public totalRequests;
    
    // Events
    event TokensRequested(address indexed recipient, uint256 amount, uint256 timestamp);
    event ParametersUpdated(uint256 dripAmount, uint256 cooldownPeriod, uint256 maxBalance);
    event FaucetFunded(address indexed funder, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    
    constructor() {
        dripAmount = 10 ether;           // 10 IONX per request
        cooldownPeriod = 24 hours;       // Once per day
        maxBalance = 100 ether;          // Max 100 IONX total from faucet
    }
    
    /**
     * @dev Request testnet IONX
     */
    function requestTokens() external nonReentrant whenNotPaused {
        require(
            block.timestamp >= lastRequestTime[msg.sender] + cooldownPeriod,
            "Cooldown period not passed. Please wait."
        );
        
        require(
            totalReceived[msg.sender] + dripAmount <= maxBalance,
            "Maximum faucet balance reached for this address"
        );
        
        require(
            address(this).balance >= dripAmount,
            "Faucet is empty. Please contact admin."
        );
        
        require(
            msg.sender.balance < 50 ether,
            "You have enough IONX. Leave some for others!"
        );
        
        // Update tracking
        lastRequestTime[msg.sender] = block.timestamp;
        totalReceived[msg.sender] += dripAmount;
        totalDistributed += dripAmount;
        totalRequests++;
        
        // Send IONX
        (bool success, ) = msg.sender.call{value: dripAmount}("");
        require(success, "Transfer failed");
        
        emit TokensRequested(msg.sender, dripAmount, block.timestamp);
    }
    
    /**
     * @dev Check if address can request tokens
     */
    function canRequest(address user) external view returns (
        bool eligible,
        uint256 timeUntilNext,
        uint256 remainingAllowance,
        string memory reason
    ) {
        // Check cooldown
        uint256 nextRequestTime = lastRequestTime[user] + cooldownPeriod;
        if (block.timestamp < nextRequestTime) {
            return (
                false,
                nextRequestTime - block.timestamp,
                maxBalance - totalReceived[user],
                "Cooldown period not passed"
            );
        }
        
        // Check max balance
        if (totalReceived[user] + dripAmount > maxBalance) {
            return (
                false,
                0,
                0,
                "Maximum faucet balance reached"
            );
        }
        
        // Check faucet balance
        if (address(this).balance < dripAmount) {
            return (
                false,
                0,
                maxBalance - totalReceived[user],
                "Faucet is empty"
            );
        }
        
        // Check user balance
        if (user.balance >= 50 ether) {
            return (
                false,
                0,
                maxBalance - totalReceived[user],
                "You have enough IONX"
            );
        }
        
        return (
            true,
            0,
            maxBalance - totalReceived[user],
            "Eligible to request"
        );
    }
    
    /**
     * @dev Get faucet statistics
     */
    function getFaucetStats() external view returns (
        uint256 faucetBalance,
        uint256 _dripAmount,
        uint256 _cooldownPeriod,
        uint256 _totalDistributed,
        uint256 _totalRequests,
        uint256 requestsRemaining
    ) {
        faucetBalance = address(this).balance;
        _dripAmount = dripAmount;
        _cooldownPeriod = cooldownPeriod;
        _totalDistributed = totalDistributed;
        _totalRequests = totalRequests;
        requestsRemaining = faucetBalance / dripAmount;
    }
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 lastRequest,
        uint256 totalReceived_,
        uint256 nextRequestTime,
        bool canRequestNow
    ) {
        lastRequest = lastRequestTime[user];
        totalReceived_ = totalReceived[user];
        nextRequestTime = lastRequest + cooldownPeriod;
        canRequestNow = block.timestamp >= nextRequestTime 
            && totalReceived[user] + dripAmount <= maxBalance
            && address(this).balance >= dripAmount
            && user.balance < 50 ether;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update faucet parameters
     */
    function updateParameters(
        uint256 _dripAmount,
        uint256 _cooldownPeriod,
        uint256 _maxBalance
    ) external onlyOwner {
        require(_dripAmount > 0, "Drip amount must be > 0");
        require(_cooldownPeriod > 0, "Cooldown must be > 0");
        require(_maxBalance >= _dripAmount, "Max balance must be >= drip amount");
        
        dripAmount = _dripAmount;
        cooldownPeriod = _cooldownPeriod;
        maxBalance = _maxBalance;
        
        emit ParametersUpdated(_dripAmount, _cooldownPeriod, _maxBalance);
    }
    
    /**
     * @dev Fund the faucet
     */
    function fundFaucet() external payable {
        require(msg.value > 0, "Must send IONX");
        emit FaucetFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
        emit EmergencyWithdrawal(owner(), balance);
    }
    
    /**
     * @dev Reset user's faucet stats (for testing)
     */
    function resetUser(address user) external onlyOwner {
        lastRequestTime[user] = 0;
        totalReceived[user] = 0;
    }
    
    /**
     * @dev Pause faucet
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause faucet
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Allow contract to receive IONX
    receive() external payable {
        emit FaucetFunded(msg.sender, msg.value);
    }
}
