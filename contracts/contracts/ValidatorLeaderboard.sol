// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ValidatorFractionNFT.sol";

/**
 * @title ValidatorLeaderboard
 * @dev Track and display top performers across multiple categories
 * @notice Real-time leaderboards for validator fraction sale
 */
contract ValidatorLeaderboard {
    ValidatorFractionNFT public saleContract;
    
    // Leaderboard categories
    enum LeaderboardType {
        TopHolders,           // Most fractions owned
        TopBuyers,            // Largest single purchases
        TopSpenders,          // Total USD spent
        TopAffiliates,        // Highest commission earnings
        TopRewardEarners,     // Most IONX claimed
        EarlyBirds,           // First 100 buyers
        WhaleWatchers         // Purchases > 1000 fractions
    }
    
    // Entry structure
    struct LeaderboardEntry {
        address user;
        uint256 value;
        uint256 timestamp;
        string username; // Optional ENS or custom name
    }
    
    // Track entries per category
    mapping(LeaderboardType => LeaderboardEntry[]) public leaderboards;
    mapping(address => string) public usernames;
    mapping(address => bool) public isVerified; // Verified/notable users
    
    // Track all-time records
    struct Record {
        address holder;
        uint256 value;
        uint256 timestamp;
        string category;
    }
    
    Record public largestSinglePurchase;
    Record public highestTotalHoldings;
    Record public highestCommissionEarned;
    Record public mostIONXClaimed;
    
    // Events
    event LeaderboardUpdated(LeaderboardType indexed category, address indexed user, uint256 value);
    event RecordBroken(string category, address indexed user, uint256 newValue, uint256 oldValue);
    event UsernameSet(address indexed user, string username);
    event UserVerified(address indexed user);
    
    constructor(address payable _saleContract) {
        saleContract = ValidatorFractionNFT(_saleContract);
    }
    
    /**
     * @dev Update all leaderboards for a user
     */
    function updateLeaderboards(address user) external {
        _updateTopHolders(user);
        _updateTopSpenders(user);
        _updateTopAffiliates(user);
        _updateTopRewardEarners(user);
    }
    
    /**
     * @dev Get top N entries for a category
     */
    function getTopN(LeaderboardType category, uint256 n) 
        external 
        view 
        returns (LeaderboardEntry[] memory) 
    {
        LeaderboardEntry[] storage entries = leaderboards[category];
        uint256 count = entries.length < n ? entries.length : n;
        
        LeaderboardEntry[] memory result = new LeaderboardEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = entries[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get user's rank in a category
     */
    function getUserRank(LeaderboardType category, address user) 
        external 
        view 
        returns (uint256 rank, uint256 value) 
    {
        LeaderboardEntry[] storage entries = leaderboards[category];
        
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].user == user) {
                return (i + 1, entries[i].value);
            }
        }
        
        return (0, 0); // Not ranked
    }
    
    /**
     * @dev Set custom username
     */
    function setUsername(string memory name) external {
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        usernames[msg.sender] = name;
        emit UsernameSet(msg.sender, name);
    }
    
    /**
     * @dev Mark user as verified (admin only)
     */
    function verifyUser(address user) external {
        // Add access control
        isVerified[user] = true;
        emit UserVerified(user);
    }
    
    // Internal update functions
    
    function _updateTopHolders(address user) internal {
        uint256 holdings = saleContract.totalFractionsOwned(user);
        if (holdings == 0) return;
        
        _insertOrUpdate(LeaderboardType.TopHolders, user, holdings);
        
        // Check all-time record
        if (holdings > highestTotalHoldings.value) {
            emit RecordBroken("Highest Holdings", user, holdings, highestTotalHoldings.value);
            highestTotalHoldings = Record(user, holdings, block.timestamp, "Top Holder");
        }
    }
    
    function _updateTopSpenders(address user) internal {
        // Calculate total spent (would need tracking in main contract)
        uint256 totalSpent = _calculateTotalSpent(user);
        if (totalSpent == 0) return;
        
        _insertOrUpdate(LeaderboardType.TopSpenders, user, totalSpent);
    }
    
    function _updateTopAffiliates(address user) internal {
        uint256 totalEarned = saleContract.totalCommissionEarned(user);
        if (totalEarned == 0) return;
        
        _insertOrUpdate(LeaderboardType.TopAffiliates, user, totalEarned);
        
        // Check all-time record
        if (totalEarned > highestCommissionEarned.value) {
            emit RecordBroken("Highest Commission", user, totalEarned, highestCommissionEarned.value);
            highestCommissionEarned = Record(user, totalEarned, block.timestamp, "Top Affiliate");
        }
    }
    
    function _updateTopRewardEarners(address user) internal {
        // Would need tracking of total claimed in main contract
        uint256 totalClaimed = _getTotalRewardsClaimed(user);
        if (totalClaimed == 0) return;
        
        _insertOrUpdate(LeaderboardType.TopRewardEarners, user, totalClaimed);
        
        // Check all-time record
        if (totalClaimed > mostIONXClaimed.value) {
            emit RecordBroken("Most IONX Claimed", user, totalClaimed, mostIONXClaimed.value);
            mostIONXClaimed = Record(user, totalClaimed, block.timestamp, "Top Reward Earner");
        }
    }
    
    function _insertOrUpdate(
        LeaderboardType category, 
        address user, 
        uint256 value
    ) internal {
        LeaderboardEntry[] storage entries = leaderboards[category];
        
        // Check if user already exists
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].user == user) {
                entries[i].value = value;
                entries[i].timestamp = block.timestamp;
                _sortLeaderboard(category);
                emit LeaderboardUpdated(category, user, value);
                return;
            }
        }
        
        // Add new entry
        entries.push(LeaderboardEntry({
            user: user,
            value: value,
            timestamp: block.timestamp,
            username: usernames[user]
        }));
        
        _sortLeaderboard(category);
        emit LeaderboardUpdated(category, user, value);
    }
    
    function _sortLeaderboard(LeaderboardType category) internal {
        LeaderboardEntry[] storage entries = leaderboards[category];
        
        // Bubble sort (optimize for production)
        for (uint256 i = 0; i < entries.length; i++) {
            for (uint256 j = i + 1; j < entries.length; j++) {
                if (entries[j].value > entries[i].value) {
                    LeaderboardEntry memory temp = entries[i];
                    entries[i] = entries[j];
                    entries[j] = temp;
                }
            }
        }
        
        // Keep only top 100
        if (entries.length > 100) {
            for (uint256 i = 100; i < entries.length; i++) {
                entries.pop();
            }
        }
    }
    
    // Helper functions (would integrate with main contract tracking)
    
    function _calculateTotalSpent(address user) internal view returns (uint256) {
        // This would need purchase tracking in main contract
        // For now, estimate from fractions owned
        uint256 fractions = saleContract.totalFractionsOwned(user);
        // Rough estimate - would need actual tracking
        return fractions * 25 * 1e6; // Assume $25 avg
    }
    
    function _getTotalRewardsClaimed(address user) internal view returns (uint256) {
        // This would need claim tracking in main contract
        return 0; // Placeholder
    }
    
    /**
     * @dev Get comprehensive leaderboard stats
     */
    function getLeaderboardStats() external view returns (
        uint256 totalEntries,
        uint256 totalHolders,
        uint256 totalAffiliates,
        uint256 avgHoldings,
        Record memory largestPurchase,
        Record memory topHolder,
        Record memory topAffiliate
    ) {
        totalEntries = leaderboards[LeaderboardType.TopHolders].length;
        totalHolders = totalEntries;
        totalAffiliates = leaderboards[LeaderboardType.TopAffiliates].length;
        
        // Calculate average
        uint256 totalFractions = 0;
        LeaderboardEntry[] storage holders = leaderboards[LeaderboardType.TopHolders];
        for (uint256 i = 0; i < holders.length; i++) {
            totalFractions += holders[i].value;
        }
        avgHoldings = totalHolders > 0 ? totalFractions / totalHolders : 0;
        
        largestPurchase = largestSinglePurchase;
        topHolder = highestTotalHoldings;
        topAffiliate = highestCommissionEarned;
    }
}
