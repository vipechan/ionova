// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MerchantRegistry
 * @notice Registry and management system for IonoPay merchants
 * @dev Handles merchant profiles, verification, and analytics
 */
contract MerchantRegistry is Ownable, Pausable {
    
    // ============ Structs ============
    
    struct MerchantProfile {
        string businessName;
        string category;
        string website;
        string email;
        address owner;
        bool verified;
        bool kycCompleted;
        uint256 registeredAt;
        uint256 verifiedAt;
        FeeTier tier;
    }
    
    struct MerchantAnalytics {
        uint256 totalRevenue;
        uint256 totalPayments;
        uint256 totalRefunds;
        uint256 totalCustomers;
        uint256 averagePayment;
        uint256 lastPaymentAt;
    }
    
    struct CustomerReview {
        address customer;
        uint8 rating; // 1-5
        string comment;
        uint256 timestamp;
    }
    
    enum FeeTier {
        Free,      // 0% (adoption phase)
        Standard,  // 0.5% (future)
        Premium,   // 0.3% (future)
        Enterprise // 0.1% (future)
    }
    
    // ============ State Variables ============
    
    mapping(address => MerchantProfile) public merchants;
    mapping(address => MerchantAnalytics) public analytics;
    mapping(address => CustomerReview[]) public reviews;
    mapping(address => mapping(address => bool)) public hasReviewed;
    mapping(address => bool) public isMerchant;
    
    address[] public merchantList;
    mapping(string => address) public merchantByName;
    
    uint256 public totalMerchants;
    uint256 public verifiedMerchants;
    
    // ============ Events ============
    
    event MerchantRegistered(
        address indexed merchant,
        string businessName,
        string category
    );
    
    event MerchantVerified(
        address indexed merchant,
        uint256 verifiedAt
    );
    
    event MerchantUpdated(
        address indexed merchant,
        string businessName
    );
    
    event KYCCompleted(
        address indexed merchant
    );
    
    event ReviewAdded(
        address indexed merchant,
        address indexed customer,
        uint8 rating
    );
    
    event AnalyticsUpdated(
        address indexed merchant,
        uint256 totalRevenue,
        uint256 totalPayments
    );
    
    // ============ Constructor ============
    
    constructor() {}
    
    // ============ Merchant Functions ============
    
    /**
     * @notice Register as a merchant
     * @param businessName Business name
     * @param category Business category
     * @param website Business website
     * @param email Contact email
     */
    function registerMerchant(
        string calldata businessName,
        string calldata category,
        string calldata website,
        string calldata email
    ) external whenNotPaused {
        require(!isMerchant[msg.sender], "Already registered");
        require(bytes(businessName).length > 0, "Business name required");
        require(bytes(category).length > 0, "Category required");
        require(merchantByName[businessName] == address(0), "Business name taken");
        
        merchants[msg.sender] = MerchantProfile({
            businessName: businessName,
            category: category,
            website: website,
            email: email,
            owner: msg.sender,
            verified: false,
            kycCompleted: false,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            tier: FeeTier.Free
        });
        
        isMerchant[msg.sender] = true;
        merchantList.push(msg.sender);
        merchantByName[businessName] = msg.sender;
        totalMerchants++;
        
        emit MerchantRegistered(msg.sender, businessName, category);
    }
    
    /**
     * @notice Update merchant profile
     * @param businessName New business name
     * @param category New category
     * @param website New website
     * @param email New email
     */
    function updateMerchant(
        string calldata businessName,
        string calldata category,
        string calldata website,
        string calldata email
    ) external {
        require(isMerchant[msg.sender], "Not a merchant");
        
        MerchantProfile storage merchant = merchants[msg.sender];
        
        // Update name mapping if changed
        if (keccak256(bytes(businessName)) != keccak256(bytes(merchant.businessName))) {
            require(merchantByName[businessName] == address(0), "Business name taken");
            delete merchantByName[merchant.businessName];
            merchantByName[businessName] = msg.sender;
        }
        
        merchant.businessName = businessName;
        merchant.category = category;
        merchant.website = website;
        merchant.email = email;
        
        emit MerchantUpdated(msg.sender, businessName);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Verify a merchant (admin only)
     * @param merchant Merchant address
     */
    function verifyMerchant(address merchant) external onlyOwner {
        require(isMerchant[merchant], "Not a merchant");
        require(!merchants[merchant].verified, "Already verified");
        
        merchants[merchant].verified = true;
        merchants[merchant].verifiedAt = block.timestamp;
        verifiedMerchants++;
        
        emit MerchantVerified(merchant, block.timestamp);
    }
    
    /**
     * @notice Mark KYC as completed (admin only)
     * @param merchant Merchant address
     */
    function completeKYC(address merchant) external onlyOwner {
        require(isMerchant[merchant], "Not a merchant");
        require(!merchants[merchant].kycCompleted, "KYC already completed");
        
        merchants[merchant].kycCompleted = true;
        
        emit KYCCompleted(merchant);
    }
    
    /**
     * @notice Update merchant fee tier (admin only)
     * @param merchant Merchant address
     * @param tier New fee tier
     */
    function updateFeeTier(address merchant, FeeTier tier) external onlyOwner {
        require(isMerchant[merchant], "Not a merchant");
        merchants[merchant].tier = tier;
    }
    
    // ============ Analytics Functions ============
    
    /**
     * @notice Update merchant analytics (called by IonoPay contract)
     * @param merchant Merchant address
     * @param revenue Payment amount
     * @param isRefund Whether this is a refund
     */
    function updateAnalytics(
        address merchant,
        uint256 revenue,
        bool isRefund
    ) external {
        // In production, add access control to only allow IonoPay contract
        require(isMerchant[merchant], "Not a merchant");
        
        MerchantAnalytics storage stats = analytics[merchant];
        
        if (isRefund) {
            stats.totalRefunds += revenue;
            stats.totalRevenue -= revenue;
            stats.totalPayments--;
        } else {
            stats.totalRevenue += revenue;
            stats.totalPayments++;
            stats.lastPaymentAt = block.timestamp;
            
            // Update average
            stats.averagePayment = stats.totalRevenue / stats.totalPayments;
        }
        
        emit AnalyticsUpdated(merchant, stats.totalRevenue, stats.totalPayments);
    }
    
    /**
     * @notice Increment customer count
     * @param merchant Merchant address
     */
    function incrementCustomerCount(address merchant) external {
        require(isMerchant[merchant], "Not a merchant");
        analytics[merchant].totalCustomers++;
    }
    
    // ============ Review Functions ============
    
    /**
     * @notice Add a review for a merchant
     * @param merchant Merchant address
     * @param rating Rating (1-5)
     * @param comment Review comment
     */
    function addReview(
        address merchant,
        uint8 rating,
        string calldata comment
    ) external {
        require(isMerchant[merchant], "Not a merchant");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        require(!hasReviewed[merchant][msg.sender], "Already reviewed");
        
        reviews[merchant].push(CustomerReview({
            customer: msg.sender,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp
        }));
        
        hasReviewed[merchant][msg.sender] = true;
        
        emit ReviewAdded(merchant, msg.sender, rating);
    }
    
    // ============ View Functions ============
    
    function getMerchant(address merchant) external view returns (MerchantProfile memory) {
        return merchants[merchant];
    }
    
    function getAnalytics(address merchant) external view returns (MerchantAnalytics memory) {
        return analytics[merchant];
    }
    
    function getReviews(address merchant) external view returns (CustomerReview[] memory) {
        return reviews[merchant];
    }
    
    function getAverageRating(address merchant) external view returns (uint256) {
        CustomerReview[] memory merchantReviews = reviews[merchant];
        if (merchantReviews.length == 0) return 0;
        
        uint256 totalRating = 0;
        for (uint256 i = 0; i < merchantReviews.length; i++) {
            totalRating += merchantReviews[i].rating;
        }
        
        return (totalRating * 100) / merchantReviews.length; // Returns rating * 100 (e.g., 450 = 4.5 stars)
    }
    
    function getAllMerchants() external view returns (address[] memory) {
        return merchantList;
    }
    
    function getMerchantByName(string calldata businessName) external view returns (address) {
        return merchantByName[businessName];
    }
    
    function isVerifiedMerchant(address merchant) external view returns (bool) {
        return merchants[merchant].verified;
    }
    
    function isKYCCompleted(address merchant) external view returns (bool) {
        return merchants[merchant].kycCompleted;
    }
    
    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
