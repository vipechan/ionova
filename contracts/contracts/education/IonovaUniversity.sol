// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IonovaUniversity
 * @dev Main contract for course management, enrollment, and certification
 * @notice Manages the entire learning platform on-chain
 */
contract IonovaUniversity is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public ionxToken;
    address public certificateNFT;
    address public rewardsContract;
    address public treasury;

    enum CourseLevel { Beginner, Intermediate, Advanced, Expert }
    enum ModuleType { Video, Quiz, Assignment, Project }

    struct Course {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 price; // in IONX
        uint256 rewardAmount; // IONX reward for completion
        CourseLevel level;
        uint256 totalModules;
        uint256 enrollmentCount;
        uint256 completionCount;
        bool isActive;
        uint256 createdAt;
    }

    struct Module {
        uint256 courseId;
        uint256 moduleId;
        string title;
        ModuleType moduleType;
        string contentURI; // IPFS hash
        uint256 passingScore; // for quizzes (out of 100)
        bool isRequired;
    }

    struct Enrollment {
        uint256 courseId;
        address student;
        uint256 enrolledAt;
        uint256 completedAt;
        bool isCompleted;
        uint256 score; // average score
        uint256 modulesCompleted;
    }

    struct ModuleProgress {
        uint256 courseId;
        uint256 moduleId;
        address student;
        bool isCompleted;
        uint256 score;
        uint256 completedAt;
        string submissionURI; // for assignments
    }

    // State variables
    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(uint256 => Module)) public modules;
    mapping(address => mapping(uint256 => Enrollment)) public enrollments;
    mapping(address => mapping(uint256 => mapping(uint256 => ModuleProgress))) public progress;
    
    uint256 public nextCourseId;
    uint256 public totalEnrollments;
    uint256 public totalCompletions;
    
    // Creator revenue tracking
    mapping(address => uint256) public creatorEarnings;
    mapping(address => uint256) public creatorWithdrawn;
    
    // Platform fees
    uint256 public platformFeePercent = 30; // 30%
    uint256 public constant FEE_DENOMINATOR = 100;

    // Events
    event CourseCreated(uint256 indexed courseId, address indexed creator, string title);
    event ModuleAdded(uint256 indexed courseId, uint256 indexed moduleId, string title);
    event StudentEnrolled(uint256 indexed courseId, address indexed student);
    event ModuleCompleted(uint256 indexed courseId, uint256 indexed moduleId, address indexed student, uint256 score);
    event CourseCompleted(uint256 indexed courseId, address indexed student, uint256 score);
    event RewardClaimed(address indexed student, uint256 amount);
    event CreatorPaid(address indexed creator, uint256 amount);

    constructor(
        address _ionxToken,
        address _treasury
    ) {
        require(_ionxToken != address(0), "Invalid IONX token");
        require(_treasury != address(0), "Invalid treasury");
        
        ionxToken = IERC20(_ionxToken);
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new course
     */
    function createCourse(
        string memory title,
        string memory description,
        uint256 price,
        uint256 rewardAmount,
        CourseLevel level
    ) external returns (uint256) {
        uint256 courseId = nextCourseId++;

        courses[courseId] = Course({
            id: courseId,
            title: title,
            description: description,
            creator: msg.sender,
            price: price,
            rewardAmount: rewardAmount,
            level: level,
            totalModules: 0,
            enrollmentCount: 0,
            completionCount: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        // Grant instructor role to creator
        _grantRole(INSTRUCTOR_ROLE, msg.sender);

        emit CourseCreated(courseId, msg.sender, title);
        return courseId;
    }

    /**
     * @dev Add module to course
     */
    function addModule(
        uint256 courseId,
        string memory title,
        ModuleType moduleType,
        string memory contentURI,
        uint256 passingScore,
        bool isRequired
    ) external {
        Course storage course = courses[courseId];
        require(course.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");

        uint256 moduleId = course.totalModules++;

        modules[courseId][moduleId] = Module({
            courseId: courseId,
            moduleId: moduleId,
            title: title,
            moduleType: moduleType,
            contentURI: contentURI,
            passingScore: passingScore,
            isRequired: isRequired
        });

        emit ModuleAdded(courseId, moduleId, title);
    }

    /**
     * @dev Enroll in a course
     */
    function enrollInCourse(uint256 courseId) external nonReentrant whenNotPaused {
        Course storage course = courses[courseId];
        require(course.isActive, "Course not active");
        require(enrollments[msg.sender][courseId].enrolledAt == 0, "Already enrolled");

        // Handle payment
        if (course.price > 0) {
            require(
                ionxToken.transferFrom(msg.sender, address(this), course.price),
                "Payment failed"
            );

            // Split revenue
            uint256 platformFee = (course.price * platformFeePercent) / FEE_DENOMINATOR;
            uint256 creatorAmount = course.price - platformFee;

            creatorEarnings[course.creator] += creatorAmount;
            
            // Transfer platform fee to treasury
            ionxToken.transfer(treasury, platformFee);
        }

        enrollments[msg.sender][courseId] = Enrollment({
            courseId: courseId,
            student: msg.sender,
            enrolledAt: block.timestamp,
            completedAt: 0,
            isCompleted: false,
            score: 0,
            modulesCompleted: 0
        });

        course.enrollmentCount++;
        totalEnrollments++;

        emit StudentEnrolled(courseId, msg.sender);
    }

    /**
     * @dev Submit module completion
     */
    function completeModule(
        uint256 courseId,
        uint256 moduleId,
        uint256 score,
        string memory submissionURI
    ) external nonReentrant {
        require(enrollments[msg.sender][courseId].enrolledAt > 0, "Not enrolled");
        require(!progress[msg.sender][courseId][moduleId].isCompleted, "Already completed");

        Module storage module = modules[courseId][moduleId];
        require(score <= 100, "Invalid score");
        
        if (module.moduleType == ModuleType.Quiz) {
            require(score >= module.passingScore, "Score below passing threshold");
        }

        progress[msg.sender][courseId][moduleId] = ModuleProgress({
            courseId: courseId,
            moduleId: moduleId,
            student: msg.sender,
            isCompleted: true,
            score: score,
            completedAt: block.timestamp,
            submissionURI: submissionURI
        });

        Enrollment storage enrollment = enrollments[msg.sender][courseId];
        enrollment.modulesCompleted++;

        emit ModuleCompleted(courseId, moduleId, msg.sender, score);

        // Check if course is completed
        if (enrollment.modulesCompleted >= courses[courseId].totalModules) {
            _completeCourse(courseId);
        }
    }

    /**
     * @dev Internal function to complete course
     */
    function _completeCourse(uint256 courseId) internal {
        Enrollment storage enrollment = enrollments[msg.sender][courseId];
        require(!enrollment.isCompleted, "Already completed");

        // Calculate average score
        uint256 totalScore = 0;
        uint256 moduleCount = 0;

        for (uint256 i = 0; i < courses[courseId].totalModules; i++) {
            if (progress[msg.sender][courseId][i].isCompleted) {
                totalScore += progress[msg.sender][courseId][i].score;
                moduleCount++;
            }
        }

        enrollment.score = moduleCount > 0 ? totalScore / moduleCount : 0;
        enrollment.isCompleted = true;
        enrollment.completedAt = block.timestamp;

        courses[courseId].completionCount++;
        totalCompletions++;

        emit CourseCompleted(courseId, msg.sender, enrollment.score);
    }

    /**
     * @dev Claim course completion reward
     */
    function claimReward(uint256 courseId) external nonReentrant {
        Enrollment storage enrollment = enrollments[msg.sender][courseId];
        require(enrollment.isCompleted, "Course not completed");

        uint256 rewardAmount = courses[courseId].rewardAmount;
        require(rewardAmount > 0, "No reward for this course");

        // Transfer reward from rewards contract
        // This would interact with LearningRewards contract
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }

    /**
     * @dev Creator withdraws earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 available = creatorEarnings[msg.sender] - creatorWithdrawn[msg.sender];
        require(available > 0, "No earnings to withdraw");

        creatorWithdrawn[msg.sender] += available;
        
        require(ionxToken.transfer(msg.sender, available), "Transfer failed");

        emit CreatorPaid(msg.sender, available);
    }

    /**
     * @dev Get course details
     */
    function getCourse(uint256 courseId) external view returns (Course memory) {
        return courses[courseId];
    }

    /**
     * @dev Get enrollment details
     */
    function getEnrollment(address student, uint256 courseId) 
        external 
        view 
        returns (Enrollment memory) 
    {
        return enrollments[student][courseId];
    }

    /**
     * @dev Get module progress
     */
    function getModuleProgress(address student, uint256 courseId, uint256 moduleId)
        external
        view
        returns (ModuleProgress memory)
    {
        return progress[student][courseId][moduleId];
    }

    /**
     * @dev Check if student completed course
     */
    function hasCompletedCourse(address student, uint256 courseId) 
        external 
        view 
        returns (bool) 
    {
        return enrollments[student][courseId].isCompleted;
    }

    /**
     * @dev Get creator statistics
     */
    function getCreatorStats(address creator) 
        external 
        view 
        returns (
            uint256 totalEarnings,
            uint256 withdrawn,
            uint256 available
        ) 
    {
        totalEarnings = creatorEarnings[creator];
        withdrawn = creatorWithdrawn[creator];
        available = totalEarnings - withdrawn;
    }

    /**
     * @dev Set certificate NFT contract
     */
    function setCertificateNFT(address _certificateNFT) external onlyRole(ADMIN_ROLE) {
        certificateNFT = _certificateNFT;
    }

    /**
     * @dev Set rewards contract
     */
    function setRewardsContract(address _rewardsContract) external onlyRole(ADMIN_ROLE) {
        rewardsContract = _rewardsContract;
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _feePercent) external onlyRole(ADMIN_ROLE) {
        require(_feePercent <= 50, "Fee too high");
        platformFeePercent = _feePercent;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
