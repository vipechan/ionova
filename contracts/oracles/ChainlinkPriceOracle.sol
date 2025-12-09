// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IPriceOracle.sol";

/**
 * @title ChainlinkPriceOracle
 * @notice Chainlink-based price oracle for IONX/USD
 * @dev Uses Chainlink price feeds with fallback mechanism
 */
contract ChainlinkPriceOracle is IPriceOracle {
    // Chainlink price feed
    AggregatorV3Interface public immutable priceFeed;
    
    // Fallback price and governance
    uint256 public fallbackPrice;
    uint256 public lastFallbackUpdate;
    address public governance;
    
    // Oracle parameters
    uint256 public constant ORACLE_TIMEOUT = 1 hours;
    uint256 public constant MIN_PRICE = 1e15;  // $0.001
    uint256 public constant MAX_PRICE = 1e22;  // $10,000
    
    // Events
    event PriceUpdated(uint256 price, uint256 timestamp);
    event FallbackPriceSet(uint256 price, uint256 timestamp);
    event OracleHealthCheck(bool healthy, string reason);
    
    /**
     * @notice Constructor
     * @param _priceFeed Chainlink price feed address
     * @param _governance Governance contract address
     * @param _initialFallback Initial fallback price
     */
    constructor(
        address _priceFeed,
        address _governance,
        uint256 _initialFallback
    ) {
        require(_priceFeed != address(0), "Invalid price feed");
        require(_governance != address(0), "Invalid governance");
        require(_initialFallback >= MIN_PRICE && _initialFallback <= MAX_PRICE, "Invalid fallback");
        
        priceFeed = AggregatorV3Interface(_priceFeed);
        governance = _governance;
        fallbackPrice = _initialFallback;
        lastFallbackUpdate = block.timestamp;
    }
    
    /**
     * @notice Get IONX/USD price
     * @return price Current price with 18 decimals
     * @return updatedAt Timestamp of price update
     */
    function getIONXPrice() external view override returns (uint256 price, uint256 updatedAt) {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 _updatedAt,
            uint80
        ) {
            // Check if price is stale
            if (block.timestamp - _updatedAt > ORACLE_TIMEOUT) {
                return (fallbackPrice, lastFallbackUpdate);
            }
            
            // Validate price bounds
            require(answer > 0, "Invalid price");
            uint256 oraclePrice = uint256(answer) * 1e10; // Convert 8 decimals to 18
            
            if (oraclePrice < MIN_PRICE || oraclePrice > MAX_PRICE) {
                return (fallbackPrice, lastFallbackUpdate);
            }
            
            return (oraclePrice, _updatedAt);
            
        } catch {
            // Oracle failed, use fallback
            return (fallbackPrice, lastFallbackUpdate);
        }
    }
    
    /**
     * @notice Check oracle health
     * @return healthy True if functioning correctly
     */
    function isHealthy() external view override returns (bool healthy) {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check freshness
            if (block.timestamp - updatedAt > ORACLE_TIMEOUT) {
                return false;
            }
            
            // Check validity
            if (answer <= 0) {
                return false;
            }
            
            uint256 oraclePrice = uint256(answer) * 1e10;
            if (oraclePrice < MIN_PRICE || oraclePrice > MAX_PRICE) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Update fallback price (governance only)
     * @param newPrice New fallback price
     */
    function updateFallbackPrice(uint256 newPrice) external {
        require(msg.sender == governance, "Only governance");
        require(newPrice >= MIN_PRICE && newPrice <= MAX_PRICE, "Invalid price");
        
        fallbackPrice = newPrice;
        lastFallbackUpdate = block.timestamp;
        
        emit FallbackPriceSet(newPrice, block.timestamp);
    }
    
    /**
     * @notice Get current price for display
     * @return Current IONX price in USD
     */
    function getCurrentPrice() external view returns (uint256) {
        (uint256 price,) = this.getIONXPrice();
        return price;
    }
}
