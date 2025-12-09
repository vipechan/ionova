// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPriceOracle.sol";
import "../interfaces/IGovernance.sol";

/**
 * @title DynamicFeeManager
 * @notice Manages dynamic transaction fees based on IONX price
 * @dev Uses oracle to maintain stable USD-denominated fees
 */
contract DynamicFeeManager {
    // Price oracle
    IPriceOracle public priceOracle;
    IGovernance public governance;
    
    // Fee parameters
    uint256 public targetFeeUSDCents = 50;  // 0.50 USD default
    uint256 public baseFeePerGas;            // Current base fee in IONX
    
    // Fee bounds (in IONX with 18 decimals)
    uint256 public minBaseFee = 0.001 ether;  // 0.001 IONX
    uint256 public maxBaseFee = 10 ether;     // 10 IONX
    
    // Adjustment parameters
    uint256 public constant MAX_ADJUSTMENT_PERCENT = 10; // 10% max change per update
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    uint256 public lastUpdateTime;
    
    // Statistics
    uint256 public totalBurned;
    uint256 public updateCount;
    
    // Events
    event BaseFeeUpdated(uint256 newBaseFee, uint256 ionxPrice, uint256 timestamp);
    event BoundsUpdated(uint256 newMin, uint256 newMax);
    event TargetFeeUpdated(uint256 newTargetCents);
    event OracleUpdated(address newOracle);
    event FeeBurned(uint256 amount, uint256 blockNumber);
    
    /**
     * @notice Constructor
     * @param _priceOracle Price oracle address
     * @param _governance Governance contract address
     * @param _initialBaseFee Initial base fee
     */
    constructor(
        address _priceOracle,
        address _governance,
        uint256 _initialBaseFee
    ) {
        require(_priceOracle != address(0), "Invalid oracle");
        require(_governance != address(0), "Invalid governance");
        require(_initialBaseFee >= minBaseFee && _initialBaseFee <= maxBaseFee, "Invalid base fee");
        
        priceOracle = IPriceOracle(_priceOracle);
        governance = IGovernance(_governance);
        baseFeePerGas = _initialBaseFee;
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Update base fee based on current IONX price
     * @dev Can be called by anyone but limited by UPDATE_INTERVAL
     */
    function updateBaseFee() external {
        require(block.timestamp >= lastUpdateTime + UPDATE_INTERVAL, "Too soon");
        require(priceOracle.isHealthy(), "Oracle unhealthy");
        
        // Get current IONX price
        (uint256 ionxPriceUSD,) = priceOracle.getIONXPrice();
        require(ionxPriceUSD > 0, "Invalid price");
        
        // Calculate target base fee to maintain USD cost
        // targetFee (USD) / ionxPrice (USD/IONX) = baseFee (IONX)
        uint256 targetFeeUSD = targetFeeUSDCents * 1e16; // Convert cents to 18 decimals
        uint256 targetBaseFee = (targetFeeUSD * 1e18) / ionxPriceUSD;
        
        // Apply gradual adjustment (max 10% change)
        uint256 newBaseFee = _applyGradualAdjustment(baseFeePerGas, targetBaseFee);
        
        // Apply bounds
        if (newBaseFee < minBaseFee) newBaseFee = minBaseFee;
        if (newBaseFee > maxBaseFee) newBaseFee = maxBaseFee;
        
        baseFeePerGas = newBaseFee;
        lastUpdateTime = block.timestamp;
        updateCount++;
        
        emit BaseFeeUpdated(newBaseFee, ionxPriceUSD, block.timestamp);
    }
    
    /**
     * @notice Apply gradual adjustment to prevent sudden changes
     * @param current Current base fee
     * @param target Target base fee
     * @return Adjusted fee
     */
    function _applyGradualAdjustment(uint256 current, uint256 target) 
        internal 
        pure 
        returns (uint256) 
    {
        if (target > current) {
            // Increase: max 10%
            uint256 maxIncrease = (current * (100 + MAX_ADJUSTMENT_PERCENT)) / 100;
            return target > maxIncrease ? maxIncrease : target;
        } else {
            // Decrease: max 10%
            uint256 maxDecrease = (current * (100 - MAX_ADJUSTMENT_PERCENT)) / 100;
            return target < maxDecrease ? maxDecrease : target;
        }
    }
    
    /**
     * @notice Calculate transaction fee
     * @param gasUsed Amount of gas used
     * @param priorityTip User-specified tip for validators
     * @return totalFee Total fee (base + tip)
     * @return burned Amount that will be burned
     * @return toValidator Amount that goes to validator
     */
    function calculateFee(uint256 gasUsed, uint256 priorityTip) 
        external 
        view 
        returns (uint256 totalFee, uint256 burned, uint256 toValidator) 
    {
        burned = (baseFeePerGas * gasUsed) / 1e18;
        toValidator = (priorityTip * gasUsed) / 1e18;
        totalFee = burned + toValidator;
    }
    
    /**
     * @notice Record burned fees
     * @param amount Amount burned
     */
    function recordBurn(uint256 amount) external {
        // In production, this would be called by block producer
        totalBurned += amount;
        emit FeeBurned(amount, block.number);
    }
    
    /**
     * @notice Estimate fee in USD
     * @param gasUsed Gas to be used
     * @return feeUSD Estimated fee in USD (18 decimals)
     */
    function estimateFeeUSD(uint256 gasUsed) external view returns (uint256 feeUSD) {
        (uint256 ionxPriceUSD,) = priceOracle.getIONXPrice();
        uint256 feeIONX = (baseFeePerGas * gasUsed) / 1e18;
        feeUSD = (feeIONX * ionxPriceUSD) / 1e18;
    }
    
    /**
     * @notice Update fee bounds (governance only)
     * @param _minBaseFee New minimum base fee
     * @param _maxBaseFee New maximum base fee
     */
    function updateFeeBounds(uint256 _minBaseFee, uint256 _maxBaseFee) external {
        require(governance.isAuthorized(msg.sender), "Not authorized");
        require(_minBaseFee < _maxBaseFee, "Invalid bounds");
        require(_maxBaseFee <= 100 ether, "Max too high");
        
        minBaseFee = _minBaseFee;
        maxBaseFee = _maxBaseFee;
        
        emit BoundsUpdated(_minBaseFee, _maxBaseFee);
    }
    
    /**
     * @notice Update target USD fee (governance only)
     * @param newTargetCents New target fee in USD cents
     */
    function updateTargetFee(uint256 newTargetCents) external {
        require(governance.isAuthorized(msg.sender), "Not authorized");
        require(newTargetCents >= 1 && newTargetCents <= 100000, "Invalid target"); // $0.01 - $1000
        
        targetFeeUSDCents = newTargetCents;
        
        emit TargetFeeUpdated(newTargetCents);
    }
    
    /**
     * @notice Update price oracle (governance only)
     * @param newOracle New oracle address
     */
    function updateOracle(address newOracle) external {
        require(governance.isAuthorized(msg.sender), "Not authorized");
        require(newOracle != address(0), "Invalid oracle");
        
        priceOracle = IPriceOracle(newOracle);
        
        emit OracleUpdated(newOracle);
    }
    
    /**
     * @notice Emergency fee override (governance only, emergency mode)
     * @param manualFee Manually set fee
     */
    function emergencySetFee(uint256 manualFee) external {
        require(governance.isAuthorized(msg.sender), "Not authorized");
        require(governance.emergencyMode(), "Not in emergency");
        require(manualFee >= minBaseFee && manualFee <= maxBaseFee, "Out of bounds");
        
        baseFeePerGas = manualFee;
        lastUpdateTime = block.timestamp;
        
        emit BaseFeeUpdated(manualFee, 0, block.timestamp);
    }
    
    /**
     * @notice Get current fee status
     * @return Current base fee, target USD fee, last update time
     */
    function getFeeStatus() external view returns (
        uint256 currentBaseFee,
        uint256 targetUSDCents,
        uint256 lastUpdate,
        bool oracleHealthy
    ) {
        return (
            baseFeePerGas,
            targetFeeUSDCents,
            lastUpdateTime,
            priceOracle.isHealthy()
        );
    }
}
