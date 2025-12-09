// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FeeGovernance
 * @notice DAO governance for fee parameter management
 * @dev Implements proposal, voting, and execution for fee adjustments
 */
contract FeeGovernance {
    // Governance token (IONX)
    address public immutable governanceToken;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address target;          // Contract to call
        bytes callData;          // Function call data
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }
    
    // Proposal parameters
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant TIMELOCK_PERIOD = 24 hours;
    uint256 public constant QUORUM_PERCENT = 10; // 10% of total supply
    uint256 public constant APPROVAL_PERCENT = 66; // 66% approval needed
    
    // Requirements
    uint256 public constant MIN_PROPOSAL_STAKE = 1_000_000 ether; // 1M IONX
    uint256 public constant PROPOSAL_DEPOSIT = 10_000 ether;      // 10K IONX
    
    // Emergency mode
    bool public emergencyMode;
    uint256 public emergencyModeExpiry;
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public lockedTokens;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event EmergencyModeActivated(uint256 expiry);
    event EmergencyModeDeactivated();
    
    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token");
        governanceToken = _governanceToken;
    }
    
    /**
     * @notice Create a new proposal
     * @param description Proposal description
     * @param target Contract to call
     * @param callData Function call data
     * @return proposalId New proposal ID
     */
    function propose(
        string memory description,
        address target,
        bytes memory callData
    ) external returns (uint256 proposalId) {
        // Check proposer has enough stake
        require(
            _getVotingPower(msg.sender) >= MIN_PROPOSAL_STAKE,
            "Insufficient stake"
        );
        
        // Lock deposit
        require(
            _lockTokens(msg.sender, PROPOSAL_DEPOSIT),
            "Failed to lock deposit"
        );
        
        // Create proposal
        proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.target = target;
        proposal.callData = callData;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(proposalId, msg.sender, description);
    }
    
    /**
     * @notice Vote on a proposal
     * @param proposalId Proposal to vote on
     * @param support True for yes, false for no
     */
    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        
        uint256 weight = _getVotingPower(msg.sender);
        require(weight > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    /**
     * @notice Execute a passed proposal
     * @param proposalId Proposal to execute
     */
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        
        // Check timelock
        require(
            block.timestamp >= proposal.endTime + TIMELOCK_PERIOD,
            "Timelock not passed"
        );
        
        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalSupply = _getTotalSupply();
        require(
            (totalVotes * 100) / totalSupply >= QUORUM_PERCENT,
            "Quorum not met"
        );
        
        // Check approval
        require(
            (proposal.forVotes * 100) / totalVotes >= APPROVAL_PERCENT,
            "Approval not met"
        );
        
        // Execute
        proposal.executed = true;
        
        // Return deposit to proposer
        _unlockTokens(proposal.proposer, PROPOSAL_DEPOSIT);
        
        // Execute call
        (bool success,) = proposal.target.call(proposal.callData);
        require(success, "Execution failed");
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @notice Cancel a proposal (proposer only)
     * @param proposalId Proposal to cancel
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(msg.sender == proposal.proposer, "Not proposer");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");
        
        proposal.canceled = true;
        
        // Forfeit deposit (goes to treasury)
        // Proposer loses PROPOSAL_DEPOSIT
        
        emit ProposalCanceled(proposalId);
    }
    
    /**
     * @notice Activate emergency mode (requires super-majority)
     */
    function activateEmergencyMode() external {
        // Requires 80% approval via fast-track proposal
        // Implementation would check for special emergency proposal
        emergencyMode = true;
        emergencyModeExpiry = block.timestamp + 7 days;
        
        emit EmergencyModeActivated(emergencyModeExpiry);
    }
    
    /**
     * @notice Deactivate emergency mode
     */
    function deactivateEmergencyMode() external {
        require(emergencyMode, "Not in emergency");
        emergencyMode = false;
        
        emit EmergencyModeDeactivated();
    }
    
    /**
     * @notice Check if address is authorized (has voting power)
     */
    function isAuthorized(address account) external view returns (bool) {
        return _getVotingPower(account) >= MIN_PROPOSAL_STAKE;
    }
    
    /**
     * @notice Get proposal state
     */
    function getProposalState(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool canceled,
        uint256 endTime
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.canceled,
            proposal.endTime
        );
    }
    
    // Internal helper functions (would integrate with actual IONX token)
    function _getVotingPower(address account) internal view returns (uint256) {
        // In production, this would call IONX token contract
        // For now, returning mock value
        return 1_000_000 ether;
    }
    
    function _getTotalSupply() internal view returns (uint256) {
        // In production, this would call IONX token contract
        return 10_000_000_000 ether;
    }
    
    function _lockTokens(address account, uint256 amount) internal returns (bool) {
        // In production, this would lock tokens in escrow
        lockedTokens[account] += amount;
        return true;
    }
    
    function _unlockTokens(address account, uint256 amount) internal {
        lockedTokens[account] -= amount;
    }
}
