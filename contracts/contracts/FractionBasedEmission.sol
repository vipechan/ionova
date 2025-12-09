// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IONXToken.sol";
import "./ValidatorFractionNFT.sol";

/**
 * @title FractionBasedEmission
 * @notice Distributes IONX rewards proportionally based on fraction holdings
 * @dev Tracks all fraction holders and distributes rewards automatically
 */
contract FractionBasedEmission is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    IONXToken public ionxToken;
    ValidatorFractionNFT public validatorNFT;
    
    /// @notice Total fractions in circulation
    uint256 public totalFractionsSold;
    
    /// @notice Accumulated rewards per fraction (scaled by 1e18)
    uint256 public accumulatedRewardsPerFraction;
    
    /// @notice User data for reward tracking
    struct UserRewardData {
        uint256 fractionsOwned;
        uint256 rewardDebt;           // Accumulated rewards already accounted for
        uint256 pendingRewards;        // Claimable rewards
        uint256 totalClaimed;          // Lifetime claimed
        uint256 lastClaimTime;
    }
    
    mapping(address => UserRewardData) public userData;
    
    /// @notice All fraction holders (for iteration)
    address[] public holders;
    mapping(address => bool) public isHolder;
    
    /// @notice Statistics
    uint256 public totalDistributed;
    uint256 public totalClaimed;
    uint256 public lastDistributionTime;
    
    // ============ EVENTS ============
    
    event RewardsDistributed(uint256 amount, uint256 perFraction, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount);
    event HolderAdded(address indexed holder, uint256 fractions);
    event HolderUpdated(address indexed holder, uint256 oldFractions, uint256 newFractions);
    event HolderRemoved(address indexed holder);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _ionxToken, address _validatorNFT) {
        ionxToken = IONXToken(_ionxToken);
        validatorNFT = ValidatorFractionNFT(_validatorNFT);
        lastDistributionTime = block.timestamp;
    }
    
    // ============ CORE DISTRIBUTION LOGIC ============
    
    /**
     * @notice Distribute rewards to all fraction holders
     * @param totalRewards Total IONX to distribute
     */
    function distributeRewards(uint256 totalRewards) external onlyOwner nonReentrant {
        require(totalRewards > 0, "No rewards to distribute");
        require(totalFractionsSold > 0, "No fractions sold");
        
        // Calculate rewards per fraction (scaled by 1e18 for precision)
        uint256 rewardsPerFraction = (totalRewards * 1e18) / totalFractionsSold;
        
        // Update accumulated rewards
        accumulatedRewardsPerFraction += rewardsPerFraction;
        
        // Update statistics
        totalDistributed += totalRewards;
        lastDistributionTime = block.timestamp;
        
        emit RewardsDistributed(totalRewards, rewardsPerFraction, block.timestamp);
    }
    
    /**
     * @notice Update pending rewards for a user
     * @param user Address to update
     */
    function updatePendingRewards(address user) internal {
        UserRewardData storage data = userData[user];
        
        if (data.fractionsOwned > 0) {
            // Calculate new rewards since last update
            uint256 accumulated = (accumulatedRewardsPerFraction * data.fractionsOwned) / 1e18;
            uint256 newRewards = accumulated - data.rewardDebt;
            
            data.pendingRewards += newRewards;
            data.rewardDebt = accumulated;
        }
    }
    
    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        updatePendingRewards(msg.sender);
        
        UserRewardData storage data = userData[msg.sender];
        uint256 pending = data.pendingRewards;
        
        require(pending > 0, "No rewards to claim");
        
        // Reset pending
        data.pendingRewards = 0;
        data.totalClaimed += pending;
        data.lastClaimTime = block.timestamp;
        
        // Update global stats
        totalClaimed += pending;
        
        // Transfer rewards (assumes this contract has approval)
        ionxToken.distributeValidatorRewards(
            _toArray(msg.sender),
            _toArray(pending)
        );
        
        emit RewardsClaimed(msg.sender, pending);
    }
    
    /**
     * @notice Auto-claim for a user (can be called by anyone)
     * @param user Address to claim for
     */
    function autoClaimFor(address user) external nonReentrant {
        updatePendingRewards(user);
        
        UserRewardData storage data = userData[user];
        uint256 pending = data.pendingRewards;
        
        require(pending > 0, "No rewards to claim");
        
        // Reset pending
        data.pendingRewards = 0;
        data.totalClaimed += pending;
        data.lastClaimTime = block.timestamp;
        
        // Update global stats
        totalClaimed += pending;
        
        // Transfer rewards
        ionxToken.distributeValidatorRewards(
            _toArray(user),
            _toArray(pending)
        );
        
        emit RewardsClaimed(user, pending);
    }
    
    /**
     * @notice Batch claim for multiple users (gas-efficient)
     * @param users Array of addresses
     */
    function batchClaim(address[] calldata users) external nonReentrant {
        address[] memory recipients = new address[](users.length);
        uint256[] memory amounts = new uint256[](users.length);
        uint256 totalAmount = 0;
        uint256 count = 0;
        
        for (uint256 i = 0; i < users.length; i++) {
            updatePendingRewards(users[i]);
            
            UserRewardData storage data = userData[users[i]];
            uint256 pending = data.pendingRewards;
            
            if (pending > 0) {
                recipients[count] = users[i];
                amounts[count] = pending;
                count++;
                
                data.pendingRewards = 0;
                data.totalClaimed += pending;
                data.lastClaimTime = block.timestamp;
                totalAmount += pending;
                
                emit RewardsClaimed(users[i], pending);
            }
        }
        
        if (totalAmount > 0) {
            totalClaimed += totalAmount;
            
            // Create properly sized arrays
            address[] memory finalRecipients = new address[](count);
            uint256[] memory finalAmounts = new uint256[](count);
            
            for (uint256 i = 0; i < count; i++) {
                finalRecipients[i] = recipients[i];
                finalAmounts[i] = amounts[i];
            }
            
            ionxToken.distributeValidatorRewards(finalRecipients, finalAmounts);
        }
    }
    
    // ============ HOLDER MANAGEMENT ============
    
    /**
     * @notice Register a new holder or update existing
     * @param holder Address of holder
     * @param fractions Number of fractions owned
     */
    function updateHolder(address holder, uint256 fractions) external onlyOwner {
        updatePendingRewards(holder);
        
        UserRewardData storage data = userData[holder];
        uint256 oldFractions = data.fractionsOwned;
        
        // Update total fractions
        if (fractions > oldFractions) {
            totalFractionsSold += (fractions - oldFractions);
        } else if (fractions < oldFractions) {
            totalFractionsSold -= (oldFractions - fractions);
        }
        
        // Update user data
        data.fractionsOwned = fractions;
        data.rewardDebt = (accumulatedRewardsPerFraction * fractions) / 1e18;
        
        // Add to holders list if new
        if (!isHolder[holder] && fractions > 0) {
            holders.push(holder);
            isHolder[holder] = true;
            emit HolderAdded(holder, fractions);
        }
        // Remove from holders if balance is zero
        else if (isHolder[holder] && fractions == 0) {
            _removeHolder(holder);
            emit HolderRemoved(holder);
        }
        // Just update
        else {
            emit HolderUpdated(holder, oldFractions, fractions);
        }
    }
    
    /**
     * @notice Sync all holders from ValidatorNFT contract
     */
    function syncAllHolders() external onlyOwner {
        // This would need to iterate through all NFT holders
        // Implementation depends on ValidatorNFT structure
        // For gas efficiency, might need to be done in batches
    }
    
    /**
     * @notice Remove a holder from the list
     */
    function _removeHolder(address holder) internal {
        isHolder[holder] = false;
        
        // Find and remove from array
        for (uint256 i = 0; i < holders.length; i++) {
            if (holders[i] == holder) {
                holders[i] = holders[holders.length - 1];
                holders.pop();
                break;
            }
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Calculate pending rewards for a user
     * @param user Address to check
     * @return Pending rewards amount
     */
    function pendingRewards(address user) external view returns (uint256) {
        UserRewardData memory data = userData[user];
        
        if (data.fractionsOwned == 0) {
            return data.pendingRewards;
        }
        
        uint256 accumulated = (accumulatedRewardsPerFraction * data.fractionsOwned) / 1e18;
        uint256 newRewards = accumulated - data.rewardDebt;
        
        return data.pendingRewards + newRewards;
    }
    
    /**
     * @notice Get user reward info
     */
    function getUserInfo(address user) external view returns (
        uint256 fractions,
        uint256 pending,
        uint256 claimed,
        uint256 lastClaim
    ) {
        UserRewardData memory data = userData[user];
        
        uint256 accumulated = (accumulatedRewardsPerFraction * data.fractionsOwned) / 1e18;
        uint256 newRewards = accumulated - data.rewardDebt;
        
        return (
            data.fractionsOwned,
            data.pendingRewards + newRewards,
            data.totalClaimed,
            data.lastClaimTime
        );
    }
    
    /**
     * @notice Get all holders
     */
    function getAllHolders() external view returns (address[] memory) {
        return holders;
    }
    
    /**
     * @notice Get holder count
     */
    function getHolderCount() external view returns (uint256) {
        return holders.length;
    }
    
    /**
     * @notice Calculate rewards for a given number of fractions
     * @param fractions Number of fractions
     * @param rewardAmount Total reward amount
     * @return Expected rewards
     */
    function calculateRewards(uint256 fractions, uint256 rewardAmount) 
        external 
        view 
        returns (uint256) 
    {
        if (totalFractionsSold == 0) return 0;
        return (rewardAmount * fractions) / totalFractionsSold;
    }
    
    /**
     * @notice Get distribution statistics
     */
    function getStats() external view returns (
        uint256 _totalFractions,
        uint256 _totalDistributed,
        uint256 _totalClaimed,
        uint256 _holderCount,
        uint256 _lastDistribution,
        uint256 _accumulatedPer
    ) {
        return (
            totalFractionsSold,
            totalDistributed,
            totalClaimed,
            holders.length,
            lastDistributionTime,
            accumulatedRewardsPerFraction
        );
    }
    
    // ============ HELPER FUNCTIONS ============
    
    function _toArray(address addr) internal pure returns (address[] memory) {
        address[] memory arr = new address[](1);
        arr[0] = addr;
        return arr;
    }
    
    function _toArray(uint256 value) internal pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](1);
        arr[0] = value;
        return arr;
    }
}
