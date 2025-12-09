// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IUniswapV2Router.sol";

/**
 * @title ProtocolRevenueBurner
 * @notice Distributes protocol revenue: 40% burn, 50% LPs, 10% treasury
 * @dev Used by DEX, Lending, NFT marketplace for buyback & burn
 */
contract ProtocolRevenueBurner is Ownable {
    // Distribution percentages (in basis points, 10000 = 100%)
    uint256 public constant BURN_SHARE = 4000;      // 40%
    uint256 public constant LP_SHARE = 5000;        // 50%
    uint256 public constant TREASURY_SHARE = 1000;  // 10%
    
    address public immutable IONX;
    address public treasury;
    address public dexRouter;
    
    uint256 public totalBurned;
    uint256 public totalToLPs;
    uint256 public totalToTreasury;
    
    // Events
    event RevenueBurned(uint256 amount, uint256 ionxBurned);
    event RevenueDistributed(uint256 burned, uint256 toLPs, uint256 toTreasury);
    
    constructor(
        address _ionx,
        address _treasury,
        address _dexRouter
    ) {
        IONX = _ionx;
        treasury = _treasury;
        dexRouter = _dexRouter;
    }
    
    /**
     * @notice Distribute protocol revenue
     * @param feeToken Token in which fees were collected (USDC, ETH, etc.)
     * @param feeAmount Amount of fees collected
     */
    function distributeRevenue(address feeToken, uint256 feeAmount) external {
        require(feeAmount > 0, "No fees to distribute");
        
        // Calculate shares
        uint256 burnAmount = (feeAmount * BURN_SHARE) / 10000;
        uint256 lpAmount = (feeAmount * LP_SHARE) / 10000;
        uint256 treasuryAmount = (feeAmount * TREASURY_SHARE) / 10000;
        
        // 1. Buy IONX and burn
        uint256 ionxBurned = _buyAndBurn(feeToken, burnAmount);
        totalBurned += ionxBurned;
        
        // 2. Send to LPs (handled by calling contract)
        totalToLPs += lpAmount;
        
        // 3. Send to treasury
        IERC20(feeToken).transfer(treasury, treasuryAmount);
        totalToTreasury += treasuryAmount;
        
        emit RevenueDistributed(ionxBurned, lpAmount, treasuryAmount);
    }
    
    /**
     * @notice Buy IONX from DEX and burn it
     * @param feeToken Token to use for buying
     * @param amount Amount to spend
     * @return ionxBurned Amount of IONX burned
     */
    function _buyAndBurn(address feeToken, uint256 amount) 
        internal 
        returns (uint256 ionxBurned) 
    {
        // Approve DEX router
        IERC20(feeToken).approve(dexRouter, amount);
        
        // Swap path: feeToken -> IONX
        address[] memory path = new address[](2);
        path[0] = feeToken;
        path[1] = IONX;
        
        // Execute swap
        uint256[] memory amounts = IUniswapV2Router(dexRouter)
            .swapExactTokensForTokens(
                amount,
                0, // Accept any amount (could add slippage protection)
                path,
                address(this),
                block.timestamp + 300
            );
        
        ionxBurned = amounts[1];
        
        // Burn the IONX
        IERC20(IONX).transfer(address(0), ionxBurned);
        
        emit RevenueBurned(amount, ionxBurned);
        
        return ionxBurned;
    }
    
    /**
     * @notice Update treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
    }
    
    /**
     * @notice Get total statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 burned,
            uint256 toLPs,
            uint256 toTreasury
        ) 
    {
        return (totalBurned, totalToLPs, totalToTreasury);
    }
}
