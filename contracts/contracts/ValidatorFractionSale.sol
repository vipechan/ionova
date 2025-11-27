// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Ionova Validator Fraction Sale
 * @dev Bonding curve sale for fractional validator ownership
 */
contract ValidatorFractionSale {
    // Constants
    uint256 public constant TOTAL_FRACTIONS = 1_800_000;
    uint256 public constant FRACTIONS_PER_VALIDATOR = 100_000;
    uint256 public constant VALIDATORS_FOR_SALE = 18;
    
    // Pricing (in wei, so $10 = 10 * 10^6 for 6 decimals)
    uint256 public constant START_PRICE = 10 * 10**6; // $10 in USDC (6 decimals)
    uint256 public constant END_PRICE = 50 * 10**6;   // $50 in USDC
    uint256 public constant PRICE_RANGE = END_PRICE - START_PRICE; // $40
    
    // State
    uint256 public fractionsSold;
    mapping(address => uint256) public fractionBalances;
    mapping(uint256 => address) public fractionOwners; // fraction # => owner
    
    // Payment token (USDC or similar)
    address public paymentToken;
    address public owner;
    
    // Events
    event FractionPurchased(
        address indexed buyer,
        uint256 fractionNumber,
        uint256 price,
        uint256 amount
    );
    
    constructor(address _paymentToken) {
        paymentToken = _paymentToken;
        owner = msg.sender;
    }
    
    /**
     * @dev Calculate price for a specific fraction number
     * Formula: price = START_PRICE + (N / TOTAL_FRACTIONS) * PRICE_RANGE
     */
    function getFractionPrice(uint256 fractionNumber) public pure returns (uint256) {
        require(fractionNumber > 0 && fractionNumber <= TOTAL_FRACTIONS, "Invalid fraction");
        
        // Price increases linearly from $10 to $50
        uint256 priceIncrease = (fractionNumber * PRICE_RANGE) / TOTAL_FRACTIONS;
        return START_PRICE + priceIncrease;
    }
    
    /**
     * @dev Calculate total cost for buying multiple fractions
     */
    function getTotalCost(uint256 quantity) public view returns (uint256) {
        require(fractionsSold + quantity <= TOTAL_FRACTIONS, "Exceeds available fractions");
        
        uint256 totalCost = 0;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 fractionNumber = fractionsSold + i + 1;
            totalCost += getFractionPrice(fractionNumber);
        }
        return totalCost;
    }
    
    /**
     * @dev Buy fractions (bonding curve pricing)
     */
    function buyFractions(uint256 quantity) external {
        require(quantity > 0, "Must buy at least 1 fraction");
        require(fractionsSold + quantity <= TOTAL_FRACTIONS, "Exceeds available fractions");
        
        uint256 totalCost = getTotalCost(quantity);
        
        // Transfer payment (USDC or similar)
        IERC20(paymentToken).transferFrom(msg.sender, address(this), totalCost);
        
        // Assign fractions
        for (uint256 i = 0; i < quantity; i++) {
            uint256 fractionNumber = fractionsSold + i + 1;
            fractionOwners[fractionNumber] = msg.sender;
            
            emit FractionPurchased(
                msg.sender,
                fractionNumber,
                getFractionPrice(fractionNumber),
                1
            );
        }
        
        fractionBalances[msg.sender] += quantity;
        fractionsSold += quantity;
    }
    
    /**
     * @dev Get current price for next fraction
     */
    function getCurrentPrice() external view returns (uint256) {
        if (fractionsSold >= TOTAL_FRACTIONS) {
            return 0; // Sold out
        }
        return getFractionPrice(fractionsSold + 1);
    }
    
    /**
     * @dev Calculate which validator a fraction belongs to
     */
    function getValidatorForFraction(uint256 fractionNumber) public pure returns (uint256) {
        require(fractionNumber > 0 && fractionNumber <= TOTAL_FRACTIONS, "Invalid fraction");
        return ((fractionNumber - 1) / FRACTIONS_PER_VALIDATOR);
    }
    
    /**
     * @dev Get user's ownership percentage
     */
    function getOwnershipPercentage(address user) external view returns (uint256) {
        // Returns percentage with 4 decimals (e.g., 1.5% = 15000)
        return (fractionBalances[user] * 1000000) / TOTAL_FRACTIONS;
    }
    
    /**
     * @dev Withdraw funds (owner only)
     */
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = IERC20(paymentToken).balanceOf(address(this));
        IERC20(paymentToken).transfer(owner, balance);
    }
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
