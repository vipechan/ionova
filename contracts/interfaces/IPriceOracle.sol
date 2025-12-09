// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle implementations
 */
interface IPriceOracle {
    /**
     * @notice Get the current IONX/USD price
     * @return price IONX price in USD with 18 decimals (e.g., 1e17 = $0.10)
     * @return updatedAt Timestamp of last price update
     */
    function getIONXPrice() external view returns (uint256 price, uint256 updatedAt);
    
    /**
     * @notice Check if oracle is healthy and price is fresh
     * @return healthy True if oracle is functioning correctly
     */
    function isHealthy() external view returns (bool healthy);
}

/**
 * @title IGovernance
 * @notice Interface for DAO governance
 */
interface IGovernance {
    function isAuthorized(address caller) external view returns (bool);
    function emergencyMode() external view returns (bool);
}
