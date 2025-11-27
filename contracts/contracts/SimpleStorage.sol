// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleStorage
 * @dev Store and retrieve a value on Ionova
 */
contract SimpleStorage {
    uint256 private storedValue;
    address public owner;

    event ValueChanged(uint256 newValue, address changedBy);

    constructor() {
        owner = msg.sender;
        storedValue = 0;
    }

    /**
     * @dev Store a new value
     * @param newValue The value to store
     */
    function setValue(uint256 newValue) public {
        storedValue = newValue;
        emit ValueChanged(newValue, msg.sender);
    }

    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function getValue() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Increment the stored value by 1
     */
    function increment() public {
        storedValue += 1;
        emit ValueChanged(storedValue, msg.sender);
    }
}
