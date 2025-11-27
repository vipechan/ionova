// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with voting capabilities for Ionova DAO
 * @notice IONX token holders can participate in governance
 */
contract GovernanceToken is ERC20, ERC20Burnable, ERC20Votes, ERC20Permit, Ownable {
    // Maximum supply: 10 billion IONX
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;

    // Delegation tracking
    mapping(address => address) public delegations;

    event DelegationChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    constructor() ERC20("Ionova", "IONX") ERC20Permit("Ionova") {
        // Initial mint can be done by owner
        // Actual distribution happens through emission schedule
    }

    /**
     * @dev Mint new tokens (only owner - emission contract)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Delegate voting power
     */
    function delegateVotes(address delegatee) external {
        address delegator = msg.sender;
        address currentDelegate = delegates(delegator);
        
        _delegate(delegator, delegatee);
        
        emit DelegationChanged(delegator, currentDelegate, delegatee);
    }

    /**
     * @dev Get voting power at specific block
     */
    function getVotingPower(address account, uint256 blockNumber)
        external
        view
        returns (uint256)
    {
        return getPastVotes(account, blockNumber);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
