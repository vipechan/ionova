// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DAOTreasury
 * @dev Manages DAO funds and allocations
 * @notice Controlled by governance for fund management
 */
contract DAOTreasury is AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    IERC20 public ionxToken;

    struct Allocation {
        address recipient;
        uint256 amount;
        string purpose;
        uint256 timestamp;
        bool executed;
    }

    struct Budget {
        string category;
        uint256 allocated;
        uint256 spent;
        uint256 period; // timestamp
    }

    mapping(uint256 => Allocation) public allocations;
    mapping(string => Budget) public budgets;
    uint256 public nextAllocationId;

    // Treasury statistics
    uint256 public totalAllocated;
    uint256 public totalSpent;

    event AllocationCreated(
        uint256 indexed allocationId,
        address indexed recipient,
        uint256 amount,
        string purpose
    );
    event AllocationExecuted(uint256 indexed allocationId);
    event BudgetSet(string indexed category, uint256 amount, uint256 period);
    event FundsReceived(address indexed from, uint256 amount);

    constructor(address _ionxToken) {
        ionxToken = IERC20(_ionxToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    /**
     * @dev Create fund allocation (governance only)
     */
    function createAllocation(
        address recipient,
        uint256 amount,
        string memory purpose
    ) external onlyRole(GOVERNOR_ROLE) returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 allocationId = nextAllocationId++;

        allocations[allocationId] = Allocation({
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            timestamp: block.timestamp,
            executed: false
        });

        totalAllocated += amount;

        emit AllocationCreated(allocationId, recipient, amount, purpose);

        return allocationId;
    }

    /**
     * @dev Execute allocation (treasurer or governor)
     */
    function executeAllocation(uint256 allocationId)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        Allocation storage allocation = allocations[allocationId];
        require(!allocation.executed, "Already executed");
        require(
            ionxToken.balanceOf(address(this)) >= allocation.amount,
            "Insufficient treasury balance"
        );

        allocation.executed = true;
        totalSpent += allocation.amount;

        require(
            ionxToken.transfer(allocation.recipient, allocation.amount),
            "Transfer failed"
        );

        emit AllocationExecuted(allocationId);
    }

    /**
     * @dev Set budget for category
     */
    function setBudget(
        string memory category,
        uint256 amount,
        uint256 period
    ) external onlyRole(GOVERNOR_ROLE) {
        budgets[category] = Budget({
            category: category,
            allocated: amount,
            spent: 0,
            period: period
        });

        emit BudgetSet(category, amount, period);
    }

    /**
     * @dev Record spending against budget
     */
    function recordSpending(string memory category, uint256 amount)
        external
        onlyRole(TREASURER_ROLE)
    {
        Budget storage budget = budgets[category];
        require(budget.allocated > 0, "Budget not set");
        require(budget.spent + amount <= budget.allocated, "Exceeds budget");

        budget.spent += amount;
    }

    /**
     * @dev Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return ionxToken.balanceOf(address(this));
    }

    /**
     * @dev Get allocation details
     */
    function getAllocation(uint256 allocationId)
        external
        view
        returns (Allocation memory)
    {
        return allocations[allocationId];
    }

    /**
     * @dev Get budget details
     */
    function getBudget(string memory category)
        external
        view
        returns (Budget memory)
    {
        return budgets[category];
    }

    /**
     * @dev Receive IONX tokens
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
