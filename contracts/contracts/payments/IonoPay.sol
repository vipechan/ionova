// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title IonoPay
 * @notice Zero-fee payment processing system for Ionova
 * @dev Payments are subsidized by protocol treasury for mass adoption
 */
contract IonoPay is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Structs ============
    
    struct Payment {
        address from;
        address to;
        uint256 amount;
        bytes32 invoiceId;
        string memo;
        uint256 timestamp;
        PaymentStatus status;
        bool refunded;
    }
    
    struct Merchant {
        string name;
        string category;
        bool verified;
        uint256 totalReceived;
        uint256 paymentCount;
        uint256 registeredAt;
    }
    
    enum PaymentStatus {
        Pending,
        Completed,
        Failed,
        Refunded
    }
    
    // ============ State Variables ============
    
    mapping(bytes32 => Payment) public payments;
    mapping(address => Merchant) public merchants;
    mapping(address => bytes32[]) public userPayments;
    mapping(address => bytes32[]) public merchantPayments;
    mapping(address => uint256) public dailyPaymentCount;
    mapping(address => uint256) public lastPaymentReset;
    
    uint256 public totalPayments;
    uint256 public totalVolume;
    uint256 public constant MAX_DAILY_PAYMENTS_UNVERIFIED = 100;
    uint256 public constant MAX_DAILY_PAYMENTS_VERIFIED = 1000;
    uint256 public constant MAX_PAYMENT_AMOUNT_UNVERIFIED = 10000 ether;
    
    // ============ Events ============
    
    event PaymentSent(
        bytes32 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 invoiceId,
        string memo
    );
    
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    event MerchantRegistered(
        address indexed merchant,
        string name,
        string category
    );
    
    event MerchantVerified(
        address indexed merchant
    );
    
    // ============ Modifiers ============
    
    modifier rateLimited() {
        _checkRateLimit(msg.sender);
        _;
        _incrementPaymentCount(msg.sender);
    }
    
    // ============ Constructor ============
    
    constructor() {}
    
    // ============ Payment Functions ============
    
    /**
     * @notice Send a payment with zero fees
     * @param to Recipient address
     * @param invoiceId Optional invoice identifier
     * @param memo Payment description or note
     */
    function sendPayment(
        address to,
        bytes32 invoiceId,
        string calldata memo
    ) external payable nonReentrant whenNotPaused rateLimited {
        require(to != address(0), "Invalid recipient");
        require(msg.value > 0, "Amount must be greater than 0");
        require(to != msg.sender, "Cannot send to self");
        
        // Check amount limits for unverified users
        if (!merchants[msg.sender].verified) {
            require(msg.value <= MAX_PAYMENT_AMOUNT_UNVERIFIED, "Amount exceeds limit");
        }
        
        // Generate unique payment ID
        bytes32 paymentId = keccak256(abi.encodePacked(
            msg.sender,
            to,
            msg.value,
            invoiceId,
            block.timestamp,
            totalPayments
        ));
        
        // Create payment record
        payments[paymentId] = Payment({
            from: msg.sender,
            to: to,
            amount: msg.value,
            invoiceId: invoiceId,
            memo: memo,
            timestamp: block.timestamp,
            status: PaymentStatus.Completed,
            refunded: false
        });
        
        // Update tracking
        userPayments[msg.sender].push(paymentId);
        merchantPayments[to].push(paymentId);
        totalPayments++;
        totalVolume += msg.value;
        
        // Update merchant stats if recipient is registered
        if (merchants[to].registeredAt > 0) {
            merchants[to].totalReceived += msg.value;
            merchants[to].paymentCount++;
        }
        
        // Transfer funds (zero fee to user, fee covered by treasury)
        (bool success, ) = to.call{value: msg.value}("");
        require(success, "Payment transfer failed");
        
        emit PaymentSent(paymentId, msg.sender, to, msg.value, invoiceId, memo);
    }
    
    /**
     * @notice Request a refund for a payment (merchant only)
     * @param paymentId The payment to refund
     */
    function refundPayment(bytes32 paymentId) external nonReentrant whenNotPaused {
        Payment storage payment = payments[paymentId];
        
        require(payment.amount > 0, "Payment does not exist");
        require(payment.to == msg.sender, "Only recipient can refund");
        require(!payment.refunded, "Already refunded");
        require(payment.status == PaymentStatus.Completed, "Payment not completed");
        
        // Mark as refunded
        payment.refunded = true;
        payment.status = PaymentStatus.Refunded;
        
        // Update merchant stats
        if (merchants[msg.sender].registeredAt > 0) {
            merchants[msg.sender].totalReceived -= payment.amount;
            merchants[msg.sender].paymentCount--;
        }
        
        // Transfer refund
        (bool success, ) = payment.from.call{value: payment.amount}("");
        require(success, "Refund transfer failed");
        
        emit PaymentRefunded(paymentId, payment.from, payment.to, payment.amount);
    }
    
    // ============ Merchant Functions ============
    
    /**
     * @notice Register as a merchant
     * @param name Business name
     * @param category Business category
     */
    function registerMerchant(
        string calldata name,
        string calldata category
    ) external {
        require(merchants[msg.sender].registeredAt == 0, "Already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(category).length > 0, "Category required");
        
        merchants[msg.sender] = Merchant({
            name: name,
            category: category,
            verified: false,
            totalReceived: 0,
            paymentCount: 0,
            registeredAt: block.timestamp
        });
        
        emit MerchantRegistered(msg.sender, name, category);
    }
    
    /**
     * @notice Verify a merchant (admin only)
     * @param merchant Merchant address to verify
     */
    function verifyMerchant(address merchant) external onlyOwner {
        require(merchants[merchant].registeredAt > 0, "Merchant not registered");
        require(!merchants[merchant].verified, "Already verified");
        
        merchants[merchant].verified = true;
        
        emit MerchantVerified(merchant);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get payment details
     * @param paymentId Payment identifier
     */
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
    
    /**
     * @notice Get user's payment history
     * @param user User address
     */
    function getUserPayments(address user) external view returns (bytes32[] memory) {
        return userPayments[user];
    }
    
    /**
     * @notice Get merchant's received payments
     * @param merchant Merchant address
     */
    function getMerchantPayments(address merchant) external view returns (bytes32[] memory) {
        return merchantPayments[merchant];
    }
    
    /**
     * @notice Get merchant profile
     * @param merchant Merchant address
     */
    function getMerchant(address merchant) external view returns (Merchant memory) {
        return merchants[merchant];
    }
    
    /**
     * @notice Check if address is a verified merchant
     * @param merchant Address to check
     */
    function isVerifiedMerchant(address merchant) external view returns (bool) {
        return merchants[merchant].verified;
    }
    
    /**
     * @notice Get daily payment count for user
     * @param user User address
     */
    function getDailyPaymentCount(address user) external view returns (uint256) {
        if (block.timestamp - lastPaymentReset[user] >= 1 days) {
            return 0;
        }
        return dailyPaymentCount[user];
    }
    
    // ============ Internal Functions ============
    
    function _checkRateLimit(address user) internal view {
        uint256 count = dailyPaymentCount[user];
        
        // Reset if 24 hours passed
        if (block.timestamp - lastPaymentReset[user] >= 1 days) {
            return;
        }
        
        // Check limits
        if (merchants[user].verified) {
            require(count < MAX_DAILY_PAYMENTS_VERIFIED, "Daily limit reached");
        } else {
            require(count < MAX_DAILY_PAYMENTS_UNVERIFIED, "Daily limit reached");
        }
    }
    
    function _incrementPaymentCount(address user) internal {
        // Reset counter if 24 hours passed
        if (block.timestamp - lastPaymentReset[user] >= 1 days) {
            dailyPaymentCount[user] = 1;
            lastPaymentReset[user] = block.timestamp;
        } else {
            dailyPaymentCount[user]++;
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw (only if paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ Receive Function ============
    
    receive() external payable {}
}
