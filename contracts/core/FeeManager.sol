// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeManager
 * @notice Manages dynamic EIP-1559 style base fees with 100% burn
 * @dev Base fee adjusts based on network utilization
 */
contract FeeManager is Ownable {
    // State variables
    uint256 public baseFeePerGas;
    uint256 public constant TARGET_UTILIZATION = 50; // 50%
    uint256 public constant MIN_BASE_FEE = 0.01 ether;
    uint256 public constant MAX_BASE_FEE = 1.0 ether;
    uint256 public constant ADJUSTMENT_FACTOR = 1125; // 12.5% = 1125/1000
    
    uint256 public totalBurned;
    
    // Events
    event BaseFeeUpdated(uint256 newBaseFee, uint256 blockUtilization);
    event BaseFeesBurned(uint256 amount, uint256 blockNumber);
    
    constructor() {
        baseFeePerGas = 0.05 ether; // Start at 0.05 IONX
    }
    
    /**
     * @notice Update base fee based on block utilization
     * @param blockUtilization Percentage of block gas limit used (0-100)
     */
    function updateBaseFee(uint256 blockUtilization) external onlyOwner {
        require(blockUtilization <= 100, "Invalid utilization");
        
        uint256 newBaseFee;
        
        if (blockUtilization > TARGET_UTILIZATION) {
            // Network congested: increase 12.5%
            newBaseFee = (baseFeePerGas * ADJUSTMENT_FACTOR) / 1000;
        } else {
            // Network underutilized: decrease 12.5%
            newBaseFee = (baseFeePerGas * 1000) / ADJUSTMENT_FACTOR;
        }
        
        // Clamp between min and max
        if (newBaseFee < MIN_BASE_FEE) newBaseFee = MIN_BASE_FEE;
        if (newBaseFee > MAX_BASE_FEE) newBaseFee = MAX_BASE_FEE;
        
        baseFeePerGas = newBaseFee;
        
        emit BaseFeeUpdated(newBaseFee, blockUtilization);
    }
    
    /**
     * @notice Burn base fees (called by block producer)
     * @param gasUsed Amount of gas used in transaction
     */
    function burnBaseFee(uint256 gasUsed) external onlyOwner {
        uint256 burnAmount = baseFeePerGas * gasUsed / 1e18;
        
        // Burn IONX (implementation depends on IONX token contract)
        _burn(address(this), burnAmount);
        
        totalBurned += burnAmount;
        
        emit BaseFeesBurned(burnAmount, block.number);
    }
    
    /**
     * @notice Calculate transaction fee
     * @param gasUsed Amount of gas used
     * @param priorityTip User-specified tip for validators
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
    
    // Internal burn function (to be connected to IONX token)
    function _burn(address account, uint256 amount) internal {
        // Implementation would call IONX token burn function
        // This is a placeholder
    }
}
