// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Add to ValidatorFractionNFT.sol

contract DynamicCommissionManager {
    
    // Maximum supported levels (admin can set 4-10)
    uint8 public constant MIN_LEVELS = 4;
    uint8 public constant MAX_LEVELS = 10;
    
    // Current active levels
    uint8 public activeLevels = 4;
    
    // Commission rates for each rank and level
    // Format: commissionRates[rank][level] = rate (in basis points, 100 = 1%)
    mapping(AffiliateRank => mapping(uint8 => uint256)) public commissionRates;
    
    // Events
    event CommissionRatesUpdated(AffiliateRank rank, uint8[] levels, uint256[] rates);
    event ActiveLevelsUpdated(uint8 newLevels);
    
    /**
     * @notice Initialize default commission rates
     */
    function initializeCommissionRates() internal {
        // Starter: 5%, 2%, 1%, 0.5%
        commissionRates[AffiliateRank.Starter][1] = 500;  // 5%
        commissionRates[AffiliateRank.Starter][2] = 200;  // 2%
        commissionRates[AffiliateRank.Starter][3] = 100;  // 1%
        commissionRates[AffiliateRank.Starter][4] = 50;   // 0.5%
        
        // Bronze: 10%, 5%, 2%, 1%
        commissionRates[AffiliateRank.Bronze][1] = 1000;  // 10%
        commissionRates[AffiliateRank.Bronze][2] = 500;   // 5%
        commissionRates[AffiliateRank.Bronze][3] = 200;   // 2%
        commissionRates[AffiliateRank.Bronze][4] = 100;   // 1%
        
        // Silver: 15%, 8%, 3%, 1.5%
        commissionRates[AffiliateRank.Silver][1] = 1500;  // 15%
        commissionRates[AffiliateRank.Silver][2] = 800;   // 8%
        commissionRates[AffiliateRank.Silver][3] = 300;   // 3%
        commissionRates[AffiliateRank.Silver][4] = 150;   // 1.5%
        
        // Gold: 20%, 10%, 5%, 2%
        commissionRates[AffiliateRank.Gold][1] = 2000;    // 20%
        commissionRates[AffiliateRank.Gold][2] = 1000;    // 10%
        commissionRates[AffiliateRank.Gold][3] = 500;     // 5%
        commissionRates[AffiliateRank.Gold][4] = 200;     // 2%
    }
    
    /**
     * @notice Set number of active commission levels (4-10)
     * @param newLevels Number of levels to activate
     */
    function setActiveLevels(uint8 newLevels) external onlyOwner {
        require(newLevels >= MIN_LEVELS && newLevels <= MAX_LEVELS, "Invalid level count");
        activeLevels = newLevels;
        emit ActiveLevelsUpdated(newLevels);
    }
    
    /**
     * @notice Set commission rates for a specific rank
     * @param rank The affiliate rank
     * @param levels Array of level numbers (1-10)
     * @param rates Array of rates in basis points (100 = 1%)
     */
    function setCommissionRates(
        AffiliateRank rank,
        uint8[] calldata levels,
        uint256[] calldata rates
    ) external onlyOwner {
        require(levels.length == rates.length, "Length mismatch");
        require(levels.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < levels.length; i++) {
            require(levels[i] >= 1 && levels[i] <= MAX_LEVELS, "Invalid level");
            require(rates[i] <= 5000, "Rate too high (max 50%)");
            
            commissionRates[rank][levels[i]] = rates[i];
        }
        
        emit CommissionRatesUpdated(rank, levels, rates);
    }
    
    /**
     * @notice Set commission rates for all ranks at once (batch)
     * @param levels Array of level numbers
     * @param starterRates Rates for Starter rank
     * @param bronzeRates Rates for Bronze rank
     * @param silverRates Rates for Silver rank
     * @param goldRates Rates for Gold rank
     */
    function setAllCommissionRates(
        uint8[] calldata levels,
        uint256[] calldata starterRates,
        uint256[] calldata bronzeRates,
        uint256[] calldata silverRates,
        uint256[] calldata goldRates
    ) external onlyOwner {
        require(
            levels.length == starterRates.length &&
            levels.length == bronzeRates.length &&
            levels.length == silverRates.length &&
            levels.length == goldRates.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < levels.length; i++) {
            require(levels[i] >= 1 && levels[i] <= MAX_LEVELS, "Invalid level");
            
            commissionRates[AffiliateRank.Starter][levels[i]] = starterRates[i];
            commissionRates[AffiliateRank.Bronze][levels[i]] = bronzeRates[i];
            commissionRates[AffiliateRank.Silver][levels[i]] = silverRates[i];
            commissionRates[AffiliateRank.Gold][levels[i]] = goldRates[i];
        }
        
        emit CommissionRatesUpdated(AffiliateRank.Starter, levels, starterRates);
        emit CommissionRatesUpdated(AffiliateRank.Bronze, levels, bronzeRates);
        emit CommissionRatesUpdated(AffiliateRank.Silver, levels, silverRates);
        emit CommissionRatesUpdated(AffiliateRank.Gold, levels, goldRates);
    }
    
    /**
     * @notice Get commission rate for a specific rank and level
     * @param rank The affiliate rank
     * @param level The downline level (1-10)
     * @return rate Commission rate in basis points
     */
    function getCommissionRate(AffiliateRank rank, uint8 level) 
        public 
        view 
        returns (uint256) 
    {
        if (level > activeLevels) {
            return 0;
        }
        return commissionRates[rank][level];
    }
    
    /**
     * @notice Get all commission rates for a rank
     * @param rank The affiliate rank
     * @return levels Array of level numbers
     * @return rates Array of commission rates
     */
    function getRankCommissionRates(AffiliateRank rank) 
        external 
        view 
        returns (uint8[] memory levels, uint256[] memory rates) 
    {
        levels = new uint8[](activeLevels);
        rates = new uint256[](activeLevels);
        
        for (uint8 i = 0; i < activeLevels; i++) {
            levels[i] = i + 1;
            rates[i] = commissionRates[rank][i + 1];
        }
    }
    
    /**
     * @notice Calculate commission for a purchase
     * @param referrerAddress The address of the referrer
     * @param level The downline level
     * @param purchaseAmount The purchase amount
     * @return commission The commission amount
     */
    function calculateCommission(
        address referrerAddress,
        uint8 level,
        uint256 purchaseAmount
    ) internal view returns (uint256) {
        if (level > activeLevels) {
            return 0;
        }
        
        AffiliateRank rank = affiliateRank[referrerAddress];
        uint256 rate = commissionRates[rank][level];
        
        return (purchaseAmount * rate) / 10000;
    }
    
    /**
     * @notice Get total commission for all levels
     * @param rank The affiliate rank
     * @param purchaseAmount The purchase amount
     * @return total Total commission across all active levels
     */
    function getTotalCommission(AffiliateRank rank, uint256 purchaseAmount) 
        external 
        view 
        returns (uint256 total) 
    {
        for (uint8 i = 1; i <= activeLevels; i++) {
            uint256 rate = commissionRates[rank][i];
            total += (purchaseAmount * rate) / 10000;
        }
    }
    
    /**
     * @notice Check if commission structure is valid
     * @dev Ensures rates decrease as level increases
     */
    function validateCommissionStructure(AffiliateRank rank) 
        external 
        view 
        returns (bool valid) 
    {
        valid = true;
        uint256 prevRate = type(uint256).max;
        
        for (uint8 i = 1; i <= activeLevels; i++) {
            uint256 currentRate = commissionRates[rank][i];
            
            // Each level should have lower or equal rate than previous
            if (currentRate > prevRate) {
                valid = false;
                break;
            }
            
            prevRate = currentRate;
        }
    }
    
    /**
     * @notice Preview commission distribution
     * @param purchaseAmount The purchase amount
     * @return distribution Array of commission amounts per level
     */
    function previewCommissionDistribution(
        AffiliateRank rank,
        uint256 purchaseAmount
    ) external view returns (uint256[] memory distribution) {
        distribution = new uint256[](activeLevels);
        
        for (uint8 i = 0; i < activeLevels; i++) {
            uint8 level = i + 1;
            uint256 rate = commissionRates[rank][level];
            distribution[i] = (purchaseAmount * rate) / 10000;
        }
    }
}
