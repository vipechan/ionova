// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title IonovaLend
 * @dev Lending and borrowing protocol with dynamic interest rates
 */
contract IonovaLend {
    struct Market {
        address asset;
        uint256 totalSupply;
        uint256 totalBorrow;
        uint256 supplyIndex;
        uint256 borrowIndex;
        uint256 lastUpdateTime;
        uint256 collateralFactor; // 75% = 7500 (basis points)
        bool isListed;
    }
    
    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 supplyIndex;
        uint256 borrowIndex;
    }
    
    mapping(address => Market) public markets;
    mapping(address => mapping(address => UserPosition)) public positions; // user => asset => position
    
    address[] public allMarkets;
    address public admin;
    
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    uint256 public constant LIQUIDATION_PENALTY = 500; // 5%
    uint256 public constant SCALE = 1e18;
    
    event Supply(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Liquidate(address indexed liquidator, address indexed borrower, address indexed collateralAsset, uint256 amount);
    
    constructor() {
        admin = msg.sender;
    }
    
    function addMarket(address asset, uint256 collateralFactor) external {
        require(msg.sender == admin, "NOT_ADMIN");
        require(!markets[asset].isListed, "ALREADY_LISTED");
        
        markets[asset] = Market({
            asset: asset,
            totalSupply: 0,
            totalBorrow: 0,
            supplyIndex: SCALE,
            borrowIndex: SCALE,
            lastUpdateTime: block.timestamp,
            collateralFactor: collateralFactor,
            isListed: true
        });
        
        allMarkets.push(asset);
    }
    
    /// @notice Supply assets to earn interest
    function supply(address asset, uint256 amount) external {
        Market storage market = markets[asset];
        require(market.isListed, "MARKET_NOT_LISTED");
        
        _accrueInterest(asset);
        
        UserPosition storage pos = positions[msg.sender][asset];
        
        // Update user's supply
        if (pos.supplied > 0) {
            uint256 accruedInterest = (pos.supplied * market.supplyIndex / pos.supplyIndex) - pos.supplied;
            pos.supplied += accruedInterest;
        }
        
        pos.supplied += amount;
        pos.supplyIndex = market.supplyIndex;
        market.totalSupply += amount;
        
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        emit Supply(msg.sender, asset, amount);
    }
    
    /// @notice Withdraw supplied assets
    function withdraw(address asset, uint256 amount) external {
        Market storage market = markets[asset];
        require(market.isListed, "MARKET_NOT_LISTED");
        
        _accrueInterest(asset);
        
        UserPosition storage pos = positions[msg.sender][asset];
        require(pos.supplied >= amount, "INSUFFICIENT_BALANCE");
        
        pos.supplied -= amount;
        market.totalSupply -= amount;
        
        // Check health factor after withdrawal
        require(_getHealthFactor(msg.sender) >= SCALE, "UNDERCOLLATERALIZED");
        
        IERC20(asset).transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, asset, amount);
    }
    
    /// @notice Borrow assets against collateral
    function borrow(address asset, uint256 amount) external {
        Market storage market = markets[asset];
        require(market.isListed, "MARKET_NOT_LISTED");
        require(market.totalSupply - market.totalBorrow >= amount, "INSUFFICIENT_LIQUIDITY");
        
        _accrueInterest(asset);
        
        UserPosition storage pos = positions[msg.sender][asset];
        pos.borrowed += amount;
        pos.borrowIndex = market.borrowIndex;
        market.totalBorrow += amount;
        
        // Check health factor
        require(_getHealthFactor(msg.sender) >= SCALE, "UNDERCOLLATERALIZED");
        
        IERC20(asset).transfer(msg.sender, amount);
        
        emit Borrow(msg.sender, asset, amount);
    }
    
    /// @notice Repay borrowed assets
    function repay(address asset, uint256 amount) external {
        Market storage market = markets[asset];
        require(market.isListed, "MARKET_NOT_LISTED");
        
        _accrueInterest(asset);
        
        UserPosition storage pos = positions[msg.sender][asset];
        
        // Calculate actual debt with accrued interest
        uint256 actualDebt = pos.borrowed * market.borrowIndex / pos.borrowIndex;
        uint256 repayAmount = amount > actualDebt ? actualDebt : amount;
        
        pos.borrowed -= repayAmount;
        market.totalBorrow -= repayAmount;
        
        IERC20(asset).transferFrom(msg.sender, address(this), repayAmount);
        
        emit Repay(msg.sender, asset, repayAmount);
    }
    
    /// @notice Liquidate undercollateralized position
    function liquidate(address borrower, address collateralAsset, address borrowAsset, uint256 amount) external {
        require(_getHealthFactor(borrower) < LIQUIDATION_THRESHOLD * SCALE / 10000, "HEALTHY_POSITION");
        
        _accrueInterest(collateralAsset);
        _accrueInterest(borrowAsset);
        
        // Transfer borrowed asset from liquidator
        IERC20(borrowAsset).transferFrom(msg.sender, address(this), amount);
        
        // Calculate collateral to seize (with penalty)
        uint256 collateralAmount = amount * (10000 + LIQUIDATION_PENALTY) / 10000;
        
        // Transfer collateral to liquidator
        UserPosition storage pos = positions[borrower][collateralAsset];
        require(pos.supplied >= collateralAmount, "INSUFFICIENT_COLLATERAL");
        
        pos.supplied -= collateralAmount;
        positions[borrower][borrowAsset].borrowed -= amount;
        
        IERC20(collateralAsset).transfer(msg.sender, collateralAmount);
        
        emit Liquidate(msg.sender, borrower, collateralAsset, collateralAmount);
    }
    
    /// @notice Calculate health factor (collateral value / borrow value)
    function _getHealthFactor(address user) internal view returns (uint256) {
        uint256 totalCollateral = 0;
        uint256 totalBorrow = 0;
        
        for (uint i = 0; i < allMarkets.length; i++) {
            address asset = allMarkets[i];
            Market storage market = markets[asset];
            UserPosition storage pos = positions[user][asset];
            
            if (pos.supplied > 0) {
                totalCollateral += pos.supplied * market.collateralFactor / 10000;
            }
            
            if (pos.borrowed > 0) {
                totalBorrow += pos.borrowed * market.borrowIndex / pos.borrowIndex;
            }
        }
        
        if (totalBorrow == 0) return type(uint256).max;
        return totalCollateral * SCALE / totalBorrow;
    }
    
    /// @notice Accrue interest for a market
    function _accrueInterest(address asset) internal {
        Market storage market = markets[asset];
        
        uint256 timeElapsed = block.timestamp - market.lastUpdateTime;
        if (timeElapsed == 0) return;
        
        uint256 utilizationRate = market.totalBorrow * SCALE / market.totalSupply;
        uint256 borrowRate = _getBorrowRate(utilizationRate);
        uint256 supplyRate = borrowRate * utilizationRate / SCALE * 95 / 100; // 95% to suppliers
        
        market.borrowIndex += market.borrowIndex * borrowRate * timeElapsed / SCALE / 365 days;
        market.supplyIndex += market.supplyIndex * supplyRate * timeElapsed / SCALE / 365 days;
        market.lastUpdateTime = block.timestamp;
    }
    
    /// @notice Calculate borrow interest rate based on utilization
    function _getBorrowRate(uint256 utilizationRate) internal pure returns (uint256) {
        uint256 optimalUtilization = 80 * SCALE / 100;
        uint256 baseRate = 2 * SCALE / 100; // 2% APR base
        
        if (utilizationRate <= optimalUtilization) {
            // 2% to 10% as utilization increases to 80%
            return baseRate + (8 * SCALE / 100) * utilizationRate / optimalUtilization;
        } else {
            // 10% to 100% as utilization increases to 100%
            uint256 excessUtilization = utilizationRate - optimalUtilization;
            return 10 * SCALE / 100 + (90 * SCALE / 100) * excessUtilization / (SCALE - optimalUtilization);
        }
    }
    
    /// @notice Get user's total supplied and borrowed value
    function getUserPosition(address user) external view returns (uint256 totalSupplied, uint256 totalBorrowed) {
        for (uint i = 0; i < allMarkets.length; i++) {
            address asset = allMarkets[i];
            Market storage market = markets[asset];
            UserPosition storage pos = positions[user][asset];
            
            if (pos.supplied > 0) {
                totalSupplied += pos.supplied * market.supplyIndex / pos.supplyIndex;
            }
            
            if (pos.borrowed > 0) {
                totalBorrowed += pos.borrowed * market.borrowIndex / pos.borrowIndex;
            }
        }
    }
    
    /// @notice Get current APY for supplying/borrowing
    function getAPY(address asset) external view returns (uint256 supplyAPY, uint256 borrowAPY) {
        Market storage market = markets[asset];
        
        if (market.totalSupply == 0) return (0, 0);
        
        uint256 utilizationRate = market.totalBorrow * SCALE / market.totalSupply;
        borrowAPY = _getBorrowRate(utilizationRate);
        supplyAPY = borrowAPY * utilizationRate / SCALE * 95 / 100;
    }
}
