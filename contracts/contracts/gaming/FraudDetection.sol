// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FraudDetection
 * @dev Advanced fraud detection and asset freezing system for gaming platform
 * @notice Monitors suspicious activities and freezes assets when fraud is detected
 */
contract FraudDetection is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant FRAUD_INVESTIGATOR_ROLE = keccak256("FRAUD_INVESTIGATOR_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    
    // Fraud detection parameters
    struct FraudRule {
        string name;
        uint256 threshold;
        uint256 timeWindow;
        bool enabled;
        uint256 severity; // 1-10, 10 being most severe
    }
    
    // Suspicious activity tracking
    struct SuspiciousActivity {
        address account;
        string activityType;
        uint256 timestamp;
        uint256 severity;
        string evidence;
        bool investigated;
        bool confirmed;
    }
    
    // Frozen account details
    struct FrozenAccount {
        address account;
        uint256 frozenAt;
        string reason;
        uint256 severity;
        bool disputed;
        bool resolved;
        address investigator;
    }
    
    // Activity counters for pattern detection
    struct ActivityCounter {
        uint256 transactionCount;
        uint256 mintCount;
        uint256 tradeCount;
        uint256 lastReset;
        uint256 totalValue;
    }
    
    // State variables
    mapping(uint256 => FraudRule) public fraudRules;
    mapping(address => bool) public frozenAccounts;
    mapping(address => FrozenAccount) public frozenAccountDetails;
    mapping(uint256 => SuspiciousActivity) public suspiciousActivities;
    mapping(address => ActivityCounter) public activityCounters;
    mapping(address => uint256) public riskScores; // 0-100
    
    uint256 public nextRuleId;
    uint256 public nextActivityId;
    uint256 public autoFreezeThreshold = 80; // Risk score threshold for auto-freeze
    
    // Events
    event AccountFrozen(address indexed account, string reason, uint256 severity);
    event AccountUnfrozen(address indexed account, string reason);
    event SuspiciousActivityDetected(address indexed account, string activityType, uint256 severity);
    event FraudRuleCreated(uint256 indexed ruleId, string name);
    event FraudRuleUpdated(uint256 indexed ruleId);
    event DisputeFiled(address indexed account, uint256 timestamp);
    event DisputeResolved(address indexed account, bool inFavorOfUser);
    event RiskScoreUpdated(address indexed account, uint256 oldScore, uint256 newScore);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FRAUD_INVESTIGATOR_ROLE, msg.sender);
        _grantRole(DISPUTE_RESOLVER_ROLE, msg.sender);
        
        // Initialize default fraud rules
        _createDefaultRules();
    }
    
    /**
     * @dev Create default fraud detection rules
     */
    function _createDefaultRules() private {
        // Rule 1: Excessive transactions
        fraudRules[nextRuleId++] = FraudRule({
            name: "Excessive Transactions",
            threshold: 100, // 100 transactions
            timeWindow: 1 hours,
            enabled: true,
            severity: 7
        });
        
        // Rule 2: Rapid asset minting
        fraudRules[nextRuleId++] = FraudRule({
            name: "Rapid Asset Minting",
            threshold: 50, // 50 mints
            timeWindow: 1 hours,
            enabled: true,
            severity: 9
        });
        
        // Rule 3: Suspicious trading pattern
        fraudRules[nextRuleId++] = FraudRule({
            name: "Suspicious Trading",
            threshold: 20, // 20 trades
            timeWindow: 10 minutes,
            enabled: true,
            severity: 8
        });
        
        // Rule 4: High value transactions
        fraudRules[nextRuleId++] = FraudRule({
            name: "High Value Activity",
            threshold: 1000000, // 1M IONX equivalent
            timeWindow: 1 days,
            enabled: true,
            severity: 6
        });
    }
    
    /**
     * @dev Check if account is frozen
     */
    function isAccountFrozen(address account) public view returns (bool) {
        return frozenAccounts[account];
    }
    
    /**
     * @dev Freeze account (manual)
     */
    function freezeAccount(
        address account,
        string memory reason,
        uint256 severity
    ) external onlyRole(FRAUD_INVESTIGATOR_ROLE) {
        require(!frozenAccounts[account], "Account already frozen");
        require(severity >= 1 && severity <= 10, "Invalid severity");
        
        frozenAccounts[account] = true;
        frozenAccountDetails[account] = FrozenAccount({
            account: account,
            frozenAt: block.timestamp,
            reason: reason,
            severity: severity,
            disputed: false,
            resolved: false,
            investigator: msg.sender
        });
        
        emit AccountFrozen(account, reason, severity);
    }
    
    /**
     * @dev Auto-freeze account based on risk score
     */
    function _autoFreezeAccount(address account, string memory reason) private {
        if (!frozenAccounts[account]) {
            frozenAccounts[account] = true;
            frozenAccountDetails[account] = FrozenAccount({
                account: account,
                frozenAt: block.timestamp,
                reason: reason,
                severity: 10,
                disputed: false,
                resolved: false,
                investigator: address(0) // Auto-frozen
            });
            
            emit AccountFrozen(account, reason, 10);
        }
    }
    
    /**
     * @dev Unfreeze account
     */
    function unfreezeAccount(
        address account,
        string memory reason
    ) external onlyRole(FRAUD_INVESTIGATOR_ROLE) {
        require(frozenAccounts[account], "Account not frozen");
        
        frozenAccounts[account] = false;
        frozenAccountDetails[account].resolved = true;
        
        // Reset risk score
        riskScores[account] = 0;
        
        emit AccountUnfrozen(account, reason);
    }
    
    /**
     * @dev Record suspicious activity
     */
    function recordSuspiciousActivity(
        address account,
        string memory activityType,
        uint256 severity,
        string memory evidence
    ) external onlyRole(FRAUD_INVESTIGATOR_ROLE) {
        suspiciousActivities[nextActivityId++] = SuspiciousActivity({
            account: account,
            activityType: activityType,
            timestamp: block.timestamp,
            severity: severity,
            evidence: evidence,
            investigated: false,
            confirmed: false
        });
        
        // Update risk score
        _updateRiskScore(account, severity);
        
        emit SuspiciousActivityDetected(account, activityType, severity);
    }
    
    /**
     * @dev Track transaction activity
     */
    function trackTransaction(address account, uint256 value) external {
        ActivityCounter storage counter = activityCounters[account];
        
        // Reset counter if time window passed
        if (block.timestamp - counter.lastReset > 1 hours) {
            counter.transactionCount = 0;
            counter.totalValue = 0;
            counter.lastReset = block.timestamp;
        }
        
        counter.transactionCount++;
        counter.totalValue += value;
        
        // Check fraud rules
        _checkFraudRules(account, "transaction");
    }
    
    /**
     * @dev Track minting activity
     */
    function trackMinting(address account) external {
        ActivityCounter storage counter = activityCounters[account];
        
        if (block.timestamp - counter.lastReset > 1 hours) {
            counter.mintCount = 0;
            counter.lastReset = block.timestamp;
        }
        
        counter.mintCount++;
        
        _checkFraudRules(account, "minting");
    }
    
    /**
     * @dev Track trading activity
     */
    function trackTrade(address account) external {
        ActivityCounter storage counter = activityCounters[account];
        
        if (block.timestamp - counter.lastReset > 10 minutes) {
            counter.tradeCount = 0;
            counter.lastReset = block.timestamp;
        }
        
        counter.tradeCount++;
        
        _checkFraudRules(account, "trading");
    }
    
    /**
     * @dev Check fraud rules and auto-freeze if needed
     */
    function _checkFraudRules(address account, string memory activityType) private {
        ActivityCounter memory counter = activityCounters[account];
        
        // Check excessive transactions
        if (keccak256(bytes(activityType)) == keccak256(bytes("transaction"))) {
            FraudRule memory rule = fraudRules[0];
            if (rule.enabled && counter.transactionCount > rule.threshold) {
                _updateRiskScore(account, rule.severity);
            }
        }
        
        // Check rapid minting
        if (keccak256(bytes(activityType)) == keccak256(bytes("minting"))) {
            FraudRule memory rule = fraudRules[1];
            if (rule.enabled && counter.mintCount > rule.threshold) {
                _updateRiskScore(account, rule.severity);
            }
        }
        
        // Check suspicious trading
        if (keccak256(bytes(activityType)) == keccak256(bytes("trading"))) {
            FraudRule memory rule = fraudRules[2];
            if (rule.enabled && counter.tradeCount > rule.threshold) {
                _updateRiskScore(account, rule.severity);
            }
        }
        
        // Check high value activity
        FraudRule memory highValueRule = fraudRules[3];
        if (highValueRule.enabled && counter.totalValue > highValueRule.threshold) {
            _updateRiskScore(account, highValueRule.severity);
        }
    }
    
    /**
     * @dev Update risk score
     */
    function _updateRiskScore(address account, uint256 severityIncrease) private {
        uint256 oldScore = riskScores[account];
        uint256 newScore = oldScore + severityIncrease;
        
        if (newScore > 100) newScore = 100;
        
        riskScores[account] = newScore;
        
        emit RiskScoreUpdated(account, oldScore, newScore);
        
        // Auto-freeze if threshold exceeded
        if (newScore >= autoFreezeThreshold && !frozenAccounts[account]) {
            _autoFreezeAccount(account, "Auto-frozen: Risk score exceeded threshold");
        }
    }
    
    /**
     * @dev File dispute for frozen account
     */
    function fileDispute(string memory explanation) external {
        require(frozenAccounts[msg.sender], "Account not frozen");
        require(!frozenAccountDetails[msg.sender].disputed, "Dispute already filed");
        
        frozenAccountDetails[msg.sender].disputed = true;
        
        emit DisputeFiled(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Resolve dispute
     */
    function resolveDispute(
        address account,
        bool inFavorOfUser,
        string memory resolution
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) {
        require(frozenAccounts[account], "Account not frozen");
        require(frozenAccountDetails[account].disputed, "No dispute filed");
        
        if (inFavorOfUser) {
            frozenAccounts[account] = false;
            frozenAccountDetails[account].resolved = true;
            riskScores[account] = 0;
            emit AccountUnfrozen(account, resolution);
        }
        
        frozenAccountDetails[account].resolved = true;
        
        emit DisputeResolved(account, inFavorOfUser);
    }
    
    /**
     * @dev Create new fraud rule
     */
    function createFraudRule(
        string memory name,
        uint256 threshold,
        uint256 timeWindow,
        uint256 severity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(severity >= 1 && severity <= 10, "Invalid severity");
        
        fraudRules[nextRuleId] = FraudRule({
            name: name,
            threshold: threshold,
            timeWindow: timeWindow,
            enabled: true,
            severity: severity
        });
        
        emit FraudRuleCreated(nextRuleId, name);
        nextRuleId++;
    }
    
    /**
     * @dev Update fraud rule
     */
    function updateFraudRule(
        uint256 ruleId,
        uint256 threshold,
        uint256 timeWindow,
        bool enabled,
        uint256 severity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(fraudRules[ruleId].name).length > 0, "Rule does not exist");
        
        fraudRules[ruleId].threshold = threshold;
        fraudRules[ruleId].timeWindow = timeWindow;
        fraudRules[ruleId].enabled = enabled;
        fraudRules[ruleId].severity = severity;
        
        emit FraudRuleUpdated(ruleId);
    }
    
    /**
     * @dev Set auto-freeze threshold
     */
    function setAutoFreezeThreshold(uint256 threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(threshold <= 100, "Threshold must be <= 100");
        autoFreezeThreshold = threshold;
    }
    
    /**
     * @dev Manually adjust risk score
     */
    function adjustRiskScore(
        address account,
        uint256 newScore
    ) external onlyRole(FRAUD_INVESTIGATOR_ROLE) {
        require(newScore <= 100, "Score must be <= 100");
        
        uint256 oldScore = riskScores[account];
        riskScores[account] = newScore;
        
        emit RiskScoreUpdated(account, oldScore, newScore);
    }
    
    /**
     * @dev Get account risk details
     */
    function getAccountRiskDetails(address account) external view returns (
        uint256 riskScore,
        bool isFrozen,
        uint256 transactionCount,
        uint256 mintCount,
        uint256 tradeCount,
        uint256 totalValue
    ) {
        ActivityCounter memory counter = activityCounters[account];
        
        return (
            riskScores[account],
            frozenAccounts[account],
            counter.transactionCount,
            counter.mintCount,
            counter.tradeCount,
            counter.totalValue
        );
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
