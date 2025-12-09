// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IValidatorFractionNFT {
    function kycVerified(address user) external view returns (bool);
}

/**
 * @title KYC Airdrop for Ionova
 * @notice Users who complete KYC get 100 IONX airdrop
 * @dev One-time claim per address, requires KYC verification
 */
contract IonovaKYCAirdrop is Ownable, ReentrancyGuard {
    
    IERC20 public ionxToken;
    IValidatorFractionNFT public validatorContract;
    
    uint256 public constant AIRDROP_AMOUNT = 100 * 10**18; // 100 IONX
    
    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;
    uint256 public totalClaimers;
    
    bool public airdropActive = true;
    uint256 public airdropEndTime;
    
    event AirdropClaimed(address indexed user, uint256 amount);
    event AirdropStatusChanged(bool active);
    
    constructor(
        address _ionxToken,
        address _validatorContract,
        uint256 _airdropEndTime
    ) {
        ionxToken = IERC20(_ionxToken);
        validatorContract = IValidatorFractionNFT(_validatorContract);
        airdropEndTime = _airdropEndTime;
    }
    
    /**
     * @notice Claim 100 IONX airdrop (requires KYC)
     * @dev User must be KYC verified in ValidatorFractionNFT contract
     */
    function claimAirdrop() external nonReentrant {
        require(airdropActive, "Airdrop not active");
        require(block.timestamp < airdropEndTime, "Airdrop ended");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(validatorContract.kycVerified(msg.sender), "KYC verification required");
        
        // Mark as claimed
        hasClaimed[msg.sender] = true;
        totalClaimed += AIRDROP_AMOUNT;
        totalClaimers++;
        
        // Transfer IONX
        require(ionxToken.transfer(msg.sender, AIRDROP_AMOUNT), "Transfer failed");
        
        emit AirdropClaimed(msg.sender, AIRDROP_AMOUNT);
    }
    
    /**
     * @notice Check if user has claimed
     */
    function hasUserClaimed(address user) external view returns (bool) {
        return hasClaimed[user];
    }
    
    /**
     * @notice Check if user is eligible (KYC verified and hasn't claimed)
     */
    function isEligible(address user) external view returns (bool) {
        return !hasClaimed[user] && validatorContract.kycVerified(user);
    }
    
    /**
     * @notice Get remaining IONX in contract
     */
    function remainingIONX() external view returns (uint256) {
        return ionxToken.balanceOf(address(this));
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Toggle airdrop active status
     */
    function setAirdropActive(bool active) external onlyOwner {
        airdropActive = active;
        emit AirdropStatusChanged(active);
    }
    
    /**
     * @notice Extend airdrop end time
     */
    function extendAirdrop(uint256 newEndTime) external onlyOwner {
        require(newEndTime > airdropEndTime, "Must extend, not reduce");
        airdropEndTime = newEndTime;
    }
    
    /**
     * @notice Emergency withdraw remaining IONX
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = ionxToken.balanceOf(address(this));
        require(ionxToken.transfer(owner(), balance), "Transfer failed");
    }
    
    /**
     * @notice Get airdrop statistics
     */
    function getAirdropStats() external view returns (
        uint256 _totalClaimed,
        uint256 _totalClaimers,
        uint256 _remaining,
        bool _active,
        uint256 _endTime
    ) {
        return (
            totalClaimed,
            totalClaimers,
            ionxToken.balanceOf(address(this)),
            airdropActive,
            airdropEndTime
        );
    }
}
