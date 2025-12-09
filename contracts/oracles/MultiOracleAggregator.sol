// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPriceOracle.sol";

/**
 * @title MultiOracleAggregator
 * @notice Aggregates multiple price oracles and returns median price
 * @dev Provides redundancy and manipulation resistance
 */
contract MultiOracleAggregator is IPriceOracle {
    // Oracle addresses
    IPriceOracle public oracle1;
    IPriceOracle public oracle2;
    IPriceOracle public oracle3;
    
    address public governance;
    
    // Median calculation parameters
    uint256 public constant MAX_DEVIATION = 20; // 20% max deviation allowed
    
    // Events
    event OraclesUpdated(address oracle1, address oracle2, address oracle3);
    event PriceDeviation(uint256 price1, uint256 price2, uint256 price3, uint256 median);
    
    constructor(
        address _oracle1,
        address _oracle2,
        address _oracle3,
        address _governance
    ) {
        require(_oracle1 != address(0) && _oracle2 != address(0) && _oracle3 != address(0), "Invalid oracles");
        require(_governance != address(0), "Invalid governance");
        
        oracle1 = IPriceOracle(_oracle1);
        oracle2 = IPriceOracle(_oracle2);
        oracle3 = IPriceOracle(_oracle3);
        governance = _governance;
    }
    
    /**
     * @notice Get median price from 3 oracles
     * @return price Median price
     * @return updatedAt Latest update timestamp
     */
    function getIONXPrice() external view override returns (uint256 price, uint256 updatedAt) {
        (uint256 price1, uint256 time1) = oracle1.getIONXPrice();
        (uint256 price2, uint256 time2) = oracle2.getIONXPrice();
        (uint256 price3, uint256 time3) = oracle3.getIONXPrice();
        
        // Calculate median
        uint256 median = _median(price1, price2, price3);
        
        // Check for excessive deviation
        uint256 maxDeviation = _maxDeviation(price1, price2, price3, median);
        require(maxDeviation <= MAX_DEVIATION, "Price deviation too high");
        
        // Return median with latest timestamp
        uint256 latestTime = _max(time1, _max(time2, time3));
        return (median, latestTime);
    }
    
    /**
     * @notice Check if all oracles are healthy
     * @return healthy True if at least 2 oracles are healthy
     */
    function isHealthy() external view override returns (bool healthy) {
        uint8 healthyCount = 0;
        
        if (oracle1.isHealthy()) healthyCount++;
        if (oracle2.isHealthy()) healthyCount++;
        if (oracle3.isHealthy()) healthyCount++;
        
        return healthyCount >= 2;
    }
    
    /**
     * @notice Calculate median of three numbers
     */
    function _median(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        if (a > b) {
            if (b > c) return b;      // a > b > c
            else if (a > c) return c; // a > c > b
            else return a;            // c > a > b
        } else {
            if (a > c) return a;      // b > a > c
            else if (b > c) return c; // b > c > a
            else return b;            // c > b > a
        }
    }
    
    /**
     * @notice Calculate maximum deviation from median
     * @return Deviation percentage (0-100)
     */
    function _maxDeviation(uint256 price1, uint256 price2, uint256 price3, uint256 median) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 dev1 = _deviation(price1, median);
        uint256 dev2 = _deviation(price2, median);
        uint256 dev3 = _deviation(price3, median);
        
        return _max(dev1, _max(dev2, dev3));
    }
    
    /**
     * @notice Calculate deviation percentage
     */
    function _deviation(uint256 price, uint256 median) internal pure returns (uint256) {
        if (price > median) {
            return ((price - median) * 100) / median;
        } else {
            return ((median - price) * 100) / median;
        }
    }
    
    /**
     * @notice Get maximum of two numbers
     */
    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }
    
    /**
     * @notice Update oracle addresses (governance only)
     */
    function updateOracles(address _oracle1, address _oracle2, address _oracle3) external {
        require(msg.sender == governance, "Only governance");
        require(_oracle1 != address(0) && _oracle2 != address(0) && _oracle3 != address(0), "Invalid oracles");
        
        oracle1 = IPriceOracle(_oracle1);
        oracle2 = IPriceOracle(_oracle2);
        oracle3 = IPriceOracle(_oracle3);
        
        emit OraclesUpdated(_oracle1, _oracle2, _oracle3);
    }
}
