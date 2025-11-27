// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Ionova KYC Airdrop
 * @dev Automated airdrop system with KYC verification
 * 
 * WORKFLOW:
 * 1. User connects wallet and submits for KYC
 * 2. User completes KYC verification (off-chain)
 * 3. Admin approves KYC on-chain
 * 4. Contract automatically transfers 100 IONX to user
 * 
 * ALLOCATION: 10,000,000 IONX for 100,000 users
 */
contract IonovaKYCAirdrop is ReentrancyGuard, Pausable, Ownable {
    // Constants
    uint256 public constant AIRDROP_AMOUNT = 100 * 10**18; // 100 IONX
    uint256 public constant MAX_USERS = 100000; // 100k users max
    uint256 public constant TOTAL_ALLOCATION = 10000000 * 10**18; // 10M IONX
    
    // KYC Status Enum
    enum KYCStatus {
        NOT_SUBMITTED,
        PENDING,
        APPROVED,
        REJECTED
    }
    
    // User Data Structure
    struct UserData {
        KYCStatus status;
        uint256 submittedAt;
        uint256 approvedAt;
        bool airdropClaimed;
        string rejectionReason;
    }
    
    // State Variables
    address public ionxToken;
    mapping(address => UserData) public users;
    
    // Statistics
    uint256 public totalSubmissions;
    uint256 public totalApproved;
    uint256 public totalRejected;
    uint256 public totalAirdropsClaimed;
    uint256 public totalTokensDistributed;
    
    // Admin addresses allowed to approve KYC
    mapping(address => bool) public kycAdmins;
    
    // Events
    event WalletRegistered(address indexed user, uint256 timestamp);
    event KYCApproved(address indexed user, address indexed admin, uint256 timestamp);
    event KYCRejected(address indexed user, address indexed admin, string reason, uint256 timestamp);
    event AirdropClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    // Modifiers
    modifier onlyKYCAdmin() {
        require(kycAdmins[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(address _ionxToken) {
        require(_ionxToken != address(0), "Invalid token address");
        ionxToken = _ionxToken;
        kycAdmins[msg.sender] = true; // Owner is default admin
    }
    
    /**
     * @dev User registers wallet for KYC verification
     * Can be called by anyone to submit their wallet
     */
    function registerWallet() external whenNotPaused {
        require(users[msg.sender].status == KYCStatus.NOT_SUBMITTED, "Already registered");
        require(totalSubmissions < MAX_USERS, "Maximum users reached");
        
        users[msg.sender] = UserData({
            status: KYCStatus.PENDING,
            submittedAt: block.timestamp,
            approvedAt: 0,
            airdropClaimed: false,
            rejectionReason: ""
        });
        
        totalSubmissions++;
        
        emit WalletRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Admin approves KYC and automatically sends airdrop
     * @param user Address to approve
     */
    function approveKYC(address user) external onlyKYCAdmin whenNotPaused nonReentrant {
        require(user != address(0), "Invalid address");
        require(users[user].status == KYCStatus.PENDING, "Not pending approval");
        require(!users[user].airdropClaimed, "Already claimed");
        require(getContractBalance() >= AIRDROP_AMOUNT, "Insufficient contract balance");
        
        // Update user status
        users[user].status = KYCStatus.APPROVED;
        users[user].approvedAt = block.timestamp;
        users[user].airdropClaimed = true;
        
        // Update statistics
        totalApproved++;
        totalAirdropsClaimed++;
        totalTokensDistributed += AIRDROP_AMOUNT;
        
        // Transfer IONX tokens
        require(
            IERC20(ionxToken).transfer(user, AIRDROP_AMOUNT),
            "Token transfer failed"
        );
        
        emit KYCApproved(user, msg.sender, block.timestamp);
        emit AirdropClaimed(user, AIRDROP_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Admin rejects KYC with reason
     * @param user Address to reject
     * @param reason Reason for rejection
     */
    function rejectKYC(address user, string calldata reason) external onlyKYCAdmin whenNotPaused {
        require(user != address(0), "Invalid address");
        require(users[user].status == KYCStatus.PENDING, "Not pending approval");
        require(bytes(reason).length > 0, "Reason required");
        
        users[user].status = KYCStatus.REJECTED;
        users[user].rejectionReason = reason;
        
        totalRejected++;
        
        emit KYCRejected(user, msg.sender, reason, block.timestamp);
    }
    
    /**
     * @dev Allow rejected users to resubmit
     * @param user Address to reset
     */
    function resetKYC(address user) external onlyKYCAdmin {
        require(user != address(0), "Invalid address");
        require(users[user].status == KYCStatus.REJECTED, "Not rejected");
        
        users[user].status = KYCStatus.PENDING;
        users[user].rejectionReason = "";
        totalRejected--;
        
        emit WalletRegistered(user, block.timestamp);
    }
    
    /**
     * @dev Batch approve multiple users (gas optimization)
     * @param usersToApprove Array of addresses to approve
     */
    function batchApproveKYC(address[] calldata usersToApprove) external onlyKYCAdmin whenNotPaused nonReentrant {
        uint256 requiredBalance = AIRDROP_AMOUNT * usersToApprove.length;
        require(getContractBalance() >= requiredBalance, "Insufficient balance for batch");
        
        for (uint256 i = 0; i < usersToApprove.length; i++) {
            address user = usersToApprove[i];
            
            if (users[user].status == KYCStatus.PENDING && !users[user].airdropClaimed) {
                users[user].status = KYCStatus.APPROVED;
                users[user].approvedAt = block.timestamp;
                users[user].airdropClaimed = true;
                
                totalApproved++;
                totalAirdropsClaimed++;
                totalTokensDistributed += AIRDROP_AMOUNT;
                
                require(
                    IERC20(ionxToken).transfer(user, AIRDROP_AMOUNT),
                    "Token transfer failed"
                );
                
                emit KYCApproved(user, msg.sender, block.timestamp);
                emit AirdropClaimed(user, AIRDROP_AMOUNT, block.timestamp);
            }
        }
    }
    
    /**
     * @dev Get user KYC status and details
     * @param user Address to query
     */
    function getUserData(address user) external view returns (
        KYCStatus status,
        uint256 submittedAt,
        uint256 approvedAt,
        bool airdropClaimed,
        string memory rejectionReason
    ) {
        UserData memory userData = users[user];
        return (
            userData.status,
            userData.submittedAt,
            userData.approvedAt,
            userData.airdropClaimed,
            userData.rejectionReason
        );
    }
    
    /**
     * @dev Get comprehensive statistics
     */
    function getStatistics() external view returns (
        uint256 _totalSubmissions,
        uint256 _totalApproved,
        uint256 _totalRejected,
        uint256 _totalAirdropsClaimed,
        uint256 _totalTokensDistributed,
        uint256 _remainingAirdrops,
        uint256 _contractBalance
    ) {
        uint256 balance = getContractBalance();
        return (
            totalSubmissions,
            totalApproved,
            totalRejected,
            totalAirdropsClaimed,
            totalTokensDistributed,
            balance / AIRDROP_AMOUNT,
            balance
        );
    }
    
    /**
     * @dev Get contract token balance
     */
    function getContractBalance() public view returns (uint256) {
        return IERC20(ionxToken).balanceOf(address(this));
    }
    
    /**
     * @dev Check if user is eligible for airdrop
     */
    function isEligible(address user) external view returns (bool) {
        return users[user].status == KYCStatus.APPROVED && !users[user].airdropClaimed;
    }
    
    /**
     * @dev Add KYC admin
     */
    function addKYCAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid address");
        require(!kycAdmins[admin], "Already admin");
        
        kycAdmins[admin] = true;
        emit AdminAdded(admin);
    }
    
    /**
     * @dev Remove KYC admin
     */
    function removeKYCAdmin(address admin) external onlyOwner {
        require(kycAdmins[admin], "Not an admin");
        
        kycAdmins[admin] = false;
        emit AdminRemoved(admin);
    }
    
    /**
     * @dev Fund contract with IONX tokens
     */
    function fundContract(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(
            IERC20(ionxToken).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }
    
    /**
     * @dev Withdraw unclaimed tokens (emergency only)
     */
    function withdrawUnclaimed(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount <= getContractBalance(), "Insufficient balance");
        
        require(
            IERC20(ionxToken).transfer(to, amount),
            "Transfer failed"
        );
        
        emit FundsWithdrawn(to, amount);
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

// Minimal ERC20 interface
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
