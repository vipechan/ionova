// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title AdminController
 * @notice Centralized admin control system for all Ionova contracts
 * @dev Flexible, scalable admin panel that controls all contract parameters
 */
contract AdminController is AccessControl, Pausable {
    
    // Roles
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Contract registry
    mapping(string => address) public contracts;
    string[] public contractNames;
    
    // Feature flags per contract
    mapping(address => mapping(string => bool)) public featureEnabled;
    
    // Configurable parameters (key-value store)
    mapping(address => mapping(string => uint256)) public uintParams;
    mapping(address => mapping(string => address)) public addressParams;
    mapping(address => mapping(string => bool)) public boolParams;
    mapping(address => mapping(string => string)) public stringParams;
    
    // Parameter metadata
    struct ParamMetadata {
        string paramType; // "uint256", "address", "bool", "string"
        string description;
        uint256 minValue;
        uint256 maxValue;
        bool exists;
    }
    mapping(address => mapping(string => ParamMetadata)) public paramMetadata;
    
    // Events
    event ContractRegistered(string indexed name, address indexed contractAddress);
    event ContractRemoved(string indexed name);
    event FeatureToggled(address indexed contractAddr, string feature, bool enabled);
    event ParameterUpdated(address indexed contractAddr, string paramName, string paramType);
    event AdminActionLogged(address indexed admin, string action, bytes data);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ============ CONTRACT MANAGEMENT ============
    
    /**
     * @notice Register a contract for admin control
     */
    function registerContract(
        string memory name, 
        address contractAddress
    ) external onlyRole(SUPER_ADMIN_ROLE) {
        require(contractAddress != address(0), "Invalid address");
        require(contracts[name] == address(0), "Contract already registered");
        
        contracts[name] = contractAddress;
        contractNames.push(name);
        
        emit ContractRegistered(name, contractAddress);
    }
    
    /**
     * @notice Remove contract from registry
     */
    function removeContract(string memory name) external onlyRole(SUPER_ADMIN_ROLE) {
        require(contracts[name] != address(0), "Contract not found");
        
        delete contracts[name];
        
        // Remove from array
        for (uint256 i = 0; i < contractNames.length; i++) {
            if (keccak256(bytes(contractNames[i])) == keccak256(bytes(name))) {
                contractNames[i] = contractNames[contractNames.length - 1];
                contractNames.pop();
                break;
            }
        }
        
        emit ContractRemoved(name);
    }
    
    /**
     * @notice Get all registered contracts
     */
    function getAllContracts() external view returns (string[] memory names, address[] memory addresses) {
        names = contractNames;
        addresses = new address[](contractNames.length);
        
        for (uint256 i = 0; i < contractNames.length; i++) {
            addresses[i] = contracts[contractNames[i]];
        }
    }
    
    // ============ FEATURE FLAGS ============
    
    /**
     * @notice Toggle feature for a contract
     */
    function toggleFeature(
        address contractAddr,
        string memory featureName,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        featureEnabled[contractAddr][featureName] = enabled;
        emit FeatureToggled(contractAddr, featureName, enabled);
    }
    
    /**
     * @notice Batch toggle features
     */
    function batchToggleFeatures(
        address contractAddr,
        string[] memory featureNames,
        bool[] memory enabled
    ) external onlyRole(ADMIN_ROLE) {
        require(featureNames.length == enabled.length, "Length mismatch");
        
        for (uint256 i = 0; i < featureNames.length; i++) {
            featureEnabled[contractAddr][featureNames[i]] = enabled[i];
            emit FeatureToggled(contractAddr, featureNames[i], enabled[i]);
        }
    }
    
    /**
     * @notice Check if feature is enabled
     */
    function isFeatureEnabled(
        address contractAddr,
        string memory featureName
    ) external view returns (bool) {
        return featureEnabled[contractAddr][featureName];
    }
    
    // ============ PARAMETER MANAGEMENT ============
    
    /**
     * @notice Set uint256 parameter with metadata
     */
    function setUintParam(
        address contractAddr,
        string memory paramName,
        uint256 value,
        string memory description,
        uint256 minValue,
        uint256 maxValue
    ) external onlyRole(ADMIN_ROLE) {
        require(value >= minValue && value <= maxValue, "Value out of range");
        
        uintParams[contractAddr][paramName] = value;
        
        if (!paramMetadata[contractAddr][paramName].exists) {
            paramMetadata[contractAddr][paramName] = ParamMetadata({
                paramType: "uint256",
                description: description,
                minValue: minValue,
                maxValue: maxValue,
                exists: true
            });
        }
        
        emit ParameterUpdated(contractAddr, paramName, "uint256");
    }
    
    /**
     * @notice Set address parameter
     */
    function setAddressParam(
        address contractAddr,
        string memory paramName,
        address value,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        require(value != address(0), "Invalid address");
        
        addressParams[contractAddr][paramName] = value;
        
        if (!paramMetadata[contractAddr][paramName].exists) {
            paramMetadata[contractAddr][paramName] = ParamMetadata({
                paramType: "address",
                description: description,
                minValue: 0,
                maxValue: 0,
                exists: true
            });
        }
        
        emit ParameterUpdated(contractAddr, paramName, "address");
    }
    
    /**
     * @notice Set bool parameter
     */
    function setBoolParam(
        address contractAddr,
        string memory paramName,
        bool value,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        boolParams[contractAddr][paramName] = value;
        
        if (!paramMetadata[contractAddr][paramName].exists) {
            paramMetadata[contractAddr][paramName] = ParamMetadata({
                paramType: "bool",
                description: description,
                minValue: 0,
                maxValue: 0,
                exists: true
            });
        }
        
        emit ParameterUpdated(contractAddr, paramName, "bool");
    }
    
    /**
     * @notice Set string parameter
     */
    function setStringParam(
        address contractAddr,
        string memory paramName,
        string memory value,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        stringParams[contractAddr][paramName] = value;
        
        if (!paramMetadata[contractAddr][paramName].exists) {
            paramMetadata[contractAddr][paramName] = ParamMetadata({
                paramType: "string",
                description: description,
                minValue: 0,
                maxValue: 0,
                exists: true
            });
        }
        
        emit ParameterUpdated(contractAddr, paramName, "string");
    }
    
    // ============ BATCH OPERATIONS ============
    
    /**
     * @notice Batch update multiple parameters
     */
    function batchUpdateParams(
        address contractAddr,
        string[] memory paramNames,
        uint256[] memory values
    ) external onlyRole(ADMIN_ROLE) {
        require(paramNames.length == values.length, "Length mismatch");
        
        for (uint256 i = 0; i < paramNames.length; i++) {
            uintParams[contractAddr][paramNames[i]] = values[i];
            emit ParameterUpdated(contractAddr, paramNames[i], "uint256");
        }
    }
    
    // ============ ROLE MANAGEMENT ============
    
    /**
     * @notice Grant admin role
     */
    function addAdmin(address admin) external onlyRole(SUPER_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, admin);
    }
    
    /**
     * @notice Revoke admin role
     */
    function removeAdmin(address admin) external onlyRole(SUPER_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, admin);
    }
    
    /**
     * @notice Grant operator role
     */
    function addOperator(address operator) external onlyRole(ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, operator);
    }
    
    // ============ EMERGENCY CONTROLS ============
    
    /**
     * @notice Emergency pause all operations
     */
    function emergencyPause() external onlyRole(SUPER_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause operations
     */
    function unpause() external onlyRole(SUPER_ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ AUDIT LOG ============
    
    /**
     * @notice Log admin action for audit trail
     */
    function logAdminAction(
        string memory action,
        bytes memory data
    ) external onlyRole(ADMIN_ROLE) {
        emit AdminActionLogged(msg.sender, action, data);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get all parameters for a contract
     */
    function getContractConfig(address contractAddr) 
        external 
        view 
        returns (
            string[] memory,
            string[] memory
        ) 
    {
        // This would return all params - simplified for example
        string[] memory empty1;
        string[] memory empty2;
        return (empty1, empty2);
    }
}
