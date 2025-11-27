// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IonovaDAO {
    struct Proposal {
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    uint256 public constant VOTING_PERIOD = 50400; // ~7 days at 12s blocks
    uint256 public constant EXECUTION_DELAY = 17280; // ~2 days
    
    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    
    function propose(string memory description) external returns (uint256) {
        uint256 proposalId = proposalCount++;
        Proposal storage p = proposals[proposalId];
        p.description = description;
        p.startBlock = block.number;
        p.endBlock = block.number + VOTING_PERIOD;
        
        emit ProposalCreated(proposalId, description);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.number >= p.startBlock && block.number <= p.endBlock, "VOTING_CLOSED");
        require(!p.hasVoted[msg.sender], "ALREADY_VOTED");
        
        uint256 votes = msg.sender.balance; // 1 IONX = 1 vote
        p.hasVoted[msg.sender] = true;
        
        if (support) {
            p.forVotes += votes;
        } else {
            p.againstVotes += votes;
        }
        
        emit Voted(proposalId, msg.sender, support, votes);
    }
    
    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.number > p.endBlock + EXECUTION_DELAY, "TIMELOCK");
        require(!p.executed, "ALREADY_EXECUTED");
        require(p.forVotes > p.againstVotes, "PROPOSAL_DEFEATED");
        
        p.executed = true;
        emit ProposalExecuted(proposalId);
    }
}
