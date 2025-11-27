// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateNFT
 * @dev Soulbound NFT certificates for course completion
 * @notice Non-transferable certificates stored on-chain
 */
contract CertificateNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    Counters.Counter private _tokenIds;

    enum CertificateLevel {
        Beginner,
        Intermediate,
        Advanced,
        Expert,
        Specialized
    }

    struct Certificate {
        uint256 tokenId;
        address student;
        uint256 courseId;
        string courseName;
        CertificateLevel level;
        uint256 score;
        uint256 issuedAt;
        string metadataURI;
        string[] skills;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public studentCertificates;
    mapping(uint256 => bool) public courseCertificateIssued; // courseId => student => issued

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed student,
        uint256 indexed courseId,
        CertificateLevel level
    );

    constructor() ERC721("Ionova Certificate", "IONOVA-CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    /**
     * @dev Issue certificate to student
     */
    function issueCertificate(
        address student,
        uint256 courseId,
        string memory courseName,
        CertificateLevel level,
        uint256 score,
        string memory metadataURI,
        string[] memory skills
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(student != address(0), "Invalid student");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(student, tokenId);

        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            student: student,
            courseId: courseId,
            courseName: courseName,
            level: level,
            score: score,
            issuedAt: block.timestamp,
            metadataURI: metadataURI,
            skills: skills
        });

        studentCertificates[student].push(tokenId);

        emit CertificateIssued(tokenId, student, courseId, level);

        return tokenId;
    }

    /**
     * @dev Override transfer to make soulbound (non-transferable)
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(from == address(0), "Certificate is soulbound and cannot be transferred");
        super._transfer(from, to, tokenId);
    }

    /**
     * @dev Get certificate details
     */
    function getCertificate(uint256 tokenId) 
        external 
        view 
        returns (Certificate memory) 
    {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    /**
     * @dev Get all certificates for a student
     */
    function getStudentCertificates(address student) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return studentCertificates[student];
    }

    /**
     * @dev Verify certificate ownership
     */
    function verifyCertificate(address student, uint256 tokenId) 
        external 
        view 
        returns (bool) 
    {
        return ownerOf(tokenId) == student;
    }

    /**
     * @dev Get certificate metadata URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId].metadataURI;
    }

    /**
     * @dev Required override
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
