// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title IonovaGovernor
 * @dev Main governance contract for Ionova DAO
 * @notice Allows IONX token holders to create and vote on proposals
 */
contract IonovaGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Proposal types
    enum ProposalType {
        Standard,           // General proposals
        Treasury,           // Treasury fund allocation
        Parameter,          // Protocol parameter changes
        Emergency,          // Emergency actions
        Upgrade             // Contract upgrades
    }

    // Proposal metadata
    struct ProposalMetadata {
        ProposalType proposalType;
        string category;
        string discussionUrl;
        uint256 createdAt;
        address proposer;
    }

    mapping(uint256 => ProposalMetadata) public proposalMetadata;

    event ProposalCreatedWithMetadata(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string category
    );

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("Ionova Governor")
        GovernorSettings(
            1,      // 1 block voting delay
            50400,  // ~1 week voting period (assuming 12s blocks)
            100e18  // 100 IONX proposal threshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @dev Create proposal with metadata
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        string memory category,
        string memory discussionUrl
    ) public returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);

        proposalMetadata[proposalId] = ProposalMetadata({
            proposalType: proposalType,
            category: category,
            discussionUrl: discussionUrl,
            createdAt: block.timestamp,
            proposer: msg.sender
        });

        emit ProposalCreatedWithMetadata(
            proposalId,
            msg.sender,
            proposalType,
            category
        );

        return proposalId;
    }

    /**
     * @dev Get proposal metadata
     */
    function getProposalMetadata(uint256 proposalId)
        external
        view
        returns (ProposalMetadata memory)
    {
        return proposalMetadata[proposalId];
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
