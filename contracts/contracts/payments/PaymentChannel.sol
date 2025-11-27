// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PaymentChannel
 * @notice State channel implementation for instant off-chain payments
 * @dev Enables high-frequency micropayments without on-chain transactions
 */
contract PaymentChannel is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Structs ============
    
    struct Channel {
        address participant1;
        address participant2;
        uint256 balance1;
        uint256 balance2;
        uint256 nonce;
        uint256 openedAt;
        uint256 closingAt;
        ChannelStatus status;
        bytes32 finalStateHash;
    }
    
    enum ChannelStatus {
        Open,
        Closing,
        Closed,
        Disputed
    }
    
    // ============ State Variables ============
    
    mapping(bytes32 => Channel) public channels;
    mapping(address => bytes32[]) public userChannels;
    
    uint256 public constant CHALLENGE_PERIOD = 1 days;
    uint256 public totalChannels;
    
    // ============ Events ============
    
    event ChannelOpened(
        bytes32 indexed channelId,
        address indexed participant1,
        address indexed participant2,
        uint256 balance1,
        uint256 balance2
    );
    
    event ChannelUpdated(
        bytes32 indexed channelId,
        uint256 nonce,
        bytes32 stateHash
    );
    
    event ChannelClosing(
        bytes32 indexed channelId,
        uint256 closingAt
    );
    
    event ChannelClosed(
        bytes32 indexed channelId,
        uint256 finalBalance1,
        uint256 finalBalance2
    );
    
    event ChannelDisputed(
        bytes32 indexed channelId,
        address disputer
    );
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ Channel Functions ============
    
    /**
     * @notice Open a new payment channel
     * @param participant2 The other participant
     */
    function openChannel(address participant2) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(participant2 != address(0), "Invalid participant");
        require(participant2 != msg.sender, "Cannot open channel with self");
        require(msg.value > 0, "Must deposit funds");
        
        bytes32 channelId = keccak256(abi.encodePacked(
            msg.sender,
            participant2,
            block.timestamp,
            totalChannels
        ));
        
        channels[channelId] = Channel({
            participant1: msg.sender,
            participant2: participant2,
            balance1: msg.value,
            balance2: 0,
            nonce: 0,
            openedAt: block.timestamp,
            closingAt: 0,
            status: ChannelStatus.Open,
            finalStateHash: bytes32(0)
        });
        
        userChannels[msg.sender].push(channelId);
        userChannels[participant2].push(channelId);
        totalChannels++;
        
        emit ChannelOpened(channelId, msg.sender, participant2, msg.value, 0);
    }
    
    /**
     * @notice Deposit additional funds to channel
     * @param channelId Channel identifier
     */
    function depositToChannel(bytes32 channelId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.Open, "Channel not open");
        require(
            msg.sender == channel.participant1 || msg.sender == channel.participant2,
            "Not a participant"
        );
        require(msg.value > 0, "Must deposit funds");
        
        if (msg.sender == channel.participant1) {
            channel.balance1 += msg.value;
        } else {
            channel.balance2 += msg.value;
        }
    }
    
    /**
     * @notice Update channel state (off-chain signed state)
     * @param channelId Channel identifier
     * @param nonce State nonce (must be higher than current)
     * @param balance1 New balance for participant1
     * @param balance2 New balance for participant2
     * @param signature1 Signature from participant1
     * @param signature2 Signature from participant2
     */
    function updateChannelState(
        bytes32 channelId,
        uint256 nonce,
        uint256 balance1,
        uint256 balance2,
        bytes memory signature1,
        bytes memory signature2
    ) external nonReentrant whenNotPaused {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.Open, "Channel not open");
        require(nonce > channel.nonce, "Nonce must increase");
        require(
            balance1 + balance2 == channel.balance1 + channel.balance2,
            "Balances must match total"
        );
        
        // Verify signatures
        bytes32 stateHash = keccak256(abi.encodePacked(
            channelId,
            nonce,
            balance1,
            balance2
        ));
        
        require(
            _verifySignature(stateHash, signature1, channel.participant1),
            "Invalid signature from participant1"
        );
        require(
            _verifySignature(stateHash, signature2, channel.participant2),
            "Invalid signature from participant2"
        );
        
        // Update state
        channel.nonce = nonce;
        channel.balance1 = balance1;
        channel.balance2 = balance2;
        channel.finalStateHash = stateHash;
        
        emit ChannelUpdated(channelId, nonce, stateHash);
    }
    
    /**
     * @notice Initiate channel closing
     * @param channelId Channel identifier
     */
    function initiateClose(bytes32 channelId) external nonReentrant {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.Open, "Channel not open");
        require(
            msg.sender == channel.participant1 || msg.sender == channel.participant2,
            "Not a participant"
        );
        
        channel.status = ChannelStatus.Closing;
        channel.closingAt = block.timestamp + CHALLENGE_PERIOD;
        
        emit ChannelClosing(channelId, channel.closingAt);
    }
    
    /**
     * @notice Finalize channel closing after challenge period
     * @param channelId Channel identifier
     */
    function finalizeClose(bytes32 channelId) external nonReentrant {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.Closing, "Channel not closing");
        require(block.timestamp >= channel.closingAt, "Challenge period not over");
        
        channel.status = ChannelStatus.Closed;
        
        // Transfer final balances
        if (channel.balance1 > 0) {
            (bool success1, ) = channel.participant1.call{value: channel.balance1}("");
            require(success1, "Transfer to participant1 failed");
        }
        
        if (channel.balance2 > 0) {
            (bool success2, ) = channel.participant2.call{value: channel.balance2}("");
            require(success2, "Transfer to participant2 failed");
        }
        
        emit ChannelClosed(channelId, channel.balance1, channel.balance2);
    }
    
    /**
     * @notice Dispute a closing channel with newer state
     * @param channelId Channel identifier
     * @param nonce Newer nonce
     * @param balance1 New balance for participant1
     * @param balance2 New balance for participant2
     * @param signature1 Signature from participant1
     * @param signature2 Signature from participant2
     */
    function disputeClose(
        bytes32 channelId,
        uint256 nonce,
        uint256 balance1,
        uint256 balance2,
        bytes memory signature1,
        bytes memory signature2
    ) external nonReentrant {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.Closing, "Channel not closing");
        require(block.timestamp < channel.closingAt, "Challenge period over");
        require(nonce > channel.nonce, "Nonce not newer");
        
        // Verify signatures
        bytes32 stateHash = keccak256(abi.encodePacked(
            channelId,
            nonce,
            balance1,
            balance2
        ));
        
        require(
            _verifySignature(stateHash, signature1, channel.participant1),
            "Invalid signature from participant1"
        );
        require(
            _verifySignature(stateHash, signature2, channel.participant2),
            "Invalid signature from participant2"
        );
        
        // Update to disputed state
        channel.status = ChannelStatus.Disputed;
        channel.nonce = nonce;
        channel.balance1 = balance1;
        channel.balance2 = balance2;
        channel.finalStateHash = stateHash;
        
        // Reset closing timer
        channel.closingAt = block.timestamp + CHALLENGE_PERIOD;
        
        emit ChannelDisputed(channelId, msg.sender);
    }
    
    // ============ View Functions ============
    
    function getChannel(bytes32 channelId) external view returns (Channel memory) {
        return channels[channelId];
    }
    
    function getUserChannels(address user) external view returns (bytes32[] memory) {
        return userChannels[user];
    }
    
    // ============ Internal Functions ============
    
    function _verifySignature(
        bytes32 messageHash,
        bytes memory signature,
        address signer
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
        
        return recoveredSigner == signer;
    }
    
    function _splitSignature(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    receive() external payable {}
}
