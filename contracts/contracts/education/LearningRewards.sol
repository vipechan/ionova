// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LearningRewards
 * @dev Manages IONX rewards for learners and creators
 * @notice Distributes rewards based on learning activities
 */
contract LearningRewards is AccessControl, ReentrancyGuard {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    IERC20 public ionxToken;
    address public universityContract;

    struct RewardConfig {
        uint256 courseCompletionBase;
        uint256 quizBonusPercent;
        uint256 streakBonus7Days;
        uint256 streakBonus30Days;
        uint256 streakBonus90Days;
        uint256 streakBonus365Days;
        uint256 referralPercent;
    }

    RewardConfig public config;

    // Tracking
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public totalRewardsClaimed;
    mapping(address => uint256) public lastActivityDate;
    mapping(address => uint256) public currentStreak;
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralEarnings;

    // Events
    event RewardDistributed(address indexed student, uint256 amount, string reason);
    event StreakBonusClaimed(address indexed student, uint256 streak, uint256 bonus);
    event ReferralRewardPaid(address indexed referrer, address indexed referee, uint256 amount);

    constructor(address _ionxToken) {
        require(_ionxToken != address(0), "Invalid IONX token");
        
        ionxToken = IERC20(_ionxToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);

        // Initialize default config
        config = RewardConfig({
            courseCompletionBase: 100 * 10**18, // 100 IONX
            quizBonusPercent: 20,
            streakBonus7Days: 50 * 10**18,
            streakBonus30Days: 200 * 10**18,
            streakBonus90Days: 500 * 10**18,
            streakBonus365Days: 2000 * 10**18,
            referralPercent: 10
        });
    }

    /**
     * @dev Distribute course completion reward
     */
    function distributeCourseReward(
        address student,
        uint256 baseReward,
        uint256 score,
        bool perfectQuiz
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        uint256 reward = baseReward;

        // Quiz bonus
        if (perfectQuiz) {
            uint256 bonus = (reward * config.quizBonusPercent) / 100;
            reward += bonus;
        }

        totalRewardsEarned[student] += reward;

        // Update streak
        _updateStreak(student);

        // Handle referral
        address referrer = referredBy[student];
        if (referrer != address(0)) {
            uint256 referralReward = (reward * config.referralPercent) / 100;
            totalRewardsEarned[referrer] += referralReward;
            referralEarnings[referrer] += referralReward;
            
            emit ReferralRewardPaid(referrer, student, referralReward);
        }

        emit RewardDistributed(student, reward, "Course completion");
    }

    /**
     * @dev Claim streak bonus
     */
    function claimStreakBonus() external nonReentrant {
        uint256 streak = currentStreak[msg.sender];
        uint256 bonus = 0;

        if (streak >= 365) {
            bonus = config.streakBonus365Days;
        } else if (streak >= 90) {
            bonus = config.streakBonus90Days;
        } else if (streak >= 30) {
            bonus = config.streakBonus30Days;
        } else if (streak >= 7) {
            bonus = config.streakBonus7Days;
        }

        require(bonus > 0, "No streak bonus available");

        totalRewardsEarned[msg.sender] += bonus;

        emit StreakBonusClaimed(msg.sender, streak, bonus);
    }

    /**
     * @dev Claim all rewards
     */
    function claimRewards() external nonReentrant {
        uint256 available = totalRewardsEarned[msg.sender] - totalRewardsClaimed[msg.sender];
        require(available > 0, "No rewards to claim");

        totalRewardsClaimed[msg.sender] += available;

        require(ionxToken.transfer(msg.sender, available), "Transfer failed");
    }

    /**
     * @dev Set referrer
     */
    function setReferrer(address referrer) external {
        require(referredBy[msg.sender] == address(0), "Referrer already set");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrer != address(0), "Invalid referrer");

        referredBy[msg.sender] = referrer;
    }

    /**
     * @dev Update learning streak
     */
    function _updateStreak(address student) internal {
        uint256 lastActivity = lastActivityDate[student];
        uint256 today = block.timestamp / 1 days;

        if (lastActivity == 0) {
            // First activity
            currentStreak[student] = 1;
        } else {
            uint256 lastDay = lastActivity / 1 days;
            
            if (today == lastDay + 1) {
                // Consecutive day
                currentStreak[student]++;
            } else if (today > lastDay + 1) {
                // Streak broken
                currentStreak[student] = 1;
            }
            // Same day - no change
        }

        lastActivityDate[student] = block.timestamp;
    }

    /**
     * @dev Get available rewards
     */
    function getAvailableRewards(address student) external view returns (uint256) {
        return totalRewardsEarned[student] - totalRewardsClaimed[student];
    }

    /**
     * @dev Get student stats
     */
    function getStudentStats(address student)
        external
        view
        returns (
            uint256 earned,
            uint256 claimed,
            uint256 available,
            uint256 streak,
            uint256 referralTotal
        )
    {
        earned = totalRewardsEarned[student];
        claimed = totalRewardsClaimed[student];
        available = earned - claimed;
        streak = currentStreak[student];
        referralTotal = referralEarnings[student];
    }

    /**
     * @dev Update reward configuration
     */
    function updateConfig(RewardConfig memory newConfig) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        config = newConfig;
    }

    /**
     * @dev Set university contract
     */
    function setUniversityContract(address _university) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        universityContract = _university;
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(ionxToken.transfer(msg.sender, amount), "Transfer failed");
    }
}
