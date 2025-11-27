// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./FraudDetection.sol";

/**
 * @title GameAssets
 * @dev ERC-1155 multi-token contract for in-game assets with fraud protection
 * @notice Integrates with FraudDetection contract to freeze fraudulent assets
 */
contract GameAssets is ERC1155, AccessControl, Pausable {
    bytes32 public constant GAME_ADMIN_ROLE = keccak256("GAME_ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    FraudDetection public fraudDetection;
    
    struct Asset {
        uint256 gameId;
        string name;
        string assetType; // weapon, skin, character, currency
        uint256 rarity; // 1-5 (common to legendary)
        string metadata;
        bool transferable;
        uint256 maxSupply;
        uint256 currentSupply;
    }
    
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => mapping(address => bool)) public frozenAssets; // assetId => owner => frozen
    uint256 public nextAssetId;
    
    event AssetCreated(uint256 indexed assetId, uint256 gameId, string name, string assetType);
    event AssetMinted(uint256 indexed assetId, address indexed to, uint256 amount);
    event AssetBurned(uint256 indexed assetId, address indexed from, uint256 amount);
    event AssetFrozen(uint256 indexed assetId, address indexed owner);
    event AssetUnfrozen(uint256 indexed assetId, address indexed owner);
    
    constructor(address _fraudDetection) ERC1155("https://api.ionova.network/assets/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        fraudDetection = FraudDetection(_fraudDetection);
    }
    
    /**
     * @dev Create new asset type
     */
    function createAsset(
        uint256 gameId,
        string memory name,
        string memory assetType,
        uint256 rarity,
        string memory metadata,
        bool transferable,
        uint256 maxSupply
    ) external onlyRole(GAME_ADMIN_ROLE) returns (uint256) {
        uint256 assetId = nextAssetId++;
        
        assets[assetId] = Asset({
            gameId: gameId,
            name: name,
            assetType: assetType,
            rarity: rarity,
            metadata: metadata,
            transferable: transferable,
            maxSupply: maxSupply,
            currentSupply: 0
        });
        
        emit AssetCreated(assetId, gameId, name, assetType);
        return assetId;
    }
    
    /**
     * @dev Mint assets with fraud detection
     */
    function mint(
        address to,
        uint256 assetId,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!fraudDetection.isAccountFrozen(to), "Recipient account is frozen");
        require(!fraudDetection.isAccountFrozen(msg.sender), "Sender account is frozen");
        
        Asset storage asset = assets[assetId];
        require(asset.currentSupply + amount <= asset.maxSupply, "Exceeds max supply");
        
        asset.currentSupply += amount;
        
        // Track minting activity for fraud detection
        fraudDetection.trackMinting(msg.sender);
        
        _mint(to, assetId, amount, data);
        
        emit AssetMinted(assetId, to, amount);
    }
    
    /**
     * @dev Batch mint with fraud detection
     */
    function mintBatch(
        address to,
        uint256[] memory assetIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!fraudDetection.isAccountFrozen(to), "Recipient account is frozen");
        require(!fraudDetection.isAccountFrozen(msg.sender), "Sender account is frozen");
        
        for (uint256 i = 0; i < assetIds.length; i++) {
            Asset storage asset = assets[assetIds[i]];
            require(asset.currentSupply + amounts[i] <= asset.maxSupply, "Exceeds max supply");
            asset.currentSupply += amounts[i];
        }
        
        // Track minting activity
        fraudDetection.trackMinting(msg.sender);
        
        _mintBatch(to, assetIds, amounts, data);
    }
    
    /**
     * @dev Burn assets
     */
    function burn(
        address from,
        uint256 assetId,
        uint256 amount
    ) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "Not authorized");
        
        assets[assetId].currentSupply -= amount;
        _burn(from, assetId, amount);
        
        emit AssetBurned(assetId, from, amount);
    }
    
    /**
     * @dev Freeze specific asset for an owner
     */
    function freezeAsset(
        uint256 assetId,
        address owner
    ) external onlyRole(GAME_ADMIN_ROLE) {
        frozenAssets[assetId][owner] = true;
        emit AssetFrozen(assetId, owner);
    }
    
    /**
     * @dev Unfreeze specific asset for an owner
     */
    function unfreezeAsset(
        uint256 assetId,
        address owner
    ) external onlyRole(GAME_ADMIN_ROLE) {
        frozenAssets[assetId][owner] = false;
        emit AssetUnfrozen(assetId, owner);
    }
    
    /**
     * @dev Override transfer to check for frozen accounts and assets
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(!fraudDetection.isAccountFrozen(from), "Sender account is frozen");
        require(!fraudDetection.isAccountFrozen(to), "Recipient account is frozen");
        require(!frozenAssets[id][from], "Asset is frozen for sender");
        require(assets[id].transferable, "Asset is not transferable");
        
        // Track transaction for fraud detection
        fraudDetection.trackTransaction(from, amount);
        
        super.safeTransferFrom(from, to, id, amount, data);
    }
    
    /**
     * @dev Override batch transfer with fraud checks
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(!fraudDetection.isAccountFrozen(from), "Sender account is frozen");
        require(!fraudDetection.isAccountFrozen(to), "Recipient account is frozen");
        
        for (uint256 i = 0; i < ids.length; i++) {
            require(!frozenAssets[ids[i]][from], "Asset is frozen");
            require(assets[ids[i]].transferable, "Asset is not transferable");
        }
        
        // Track transaction
        fraudDetection.trackTransaction(from, ids.length);
        
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
    
    /**
     * @dev Update fraud detection contract
     */
    function setFraudDetection(address _fraudDetection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fraudDetection = FraudDetection(_fraudDetection);
    }
    
    /**
     * @dev Check if asset is frozen for owner
     */
    function isAssetFrozen(uint256 assetId, address owner) external view returns (bool) {
        return frozenAssets[assetId][owner];
    }
    
    /**
     * @dev Get asset details
     */
    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Required override
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
