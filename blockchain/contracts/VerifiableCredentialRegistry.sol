// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerifiableCredentialRegistry is Ownable {
    constructor() Ownable() {} 

    struct Credential {
        address issuer;
        address holder;
        string cid;
        bool revoked;
        uint256 issuedAt;
    }

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bool) public authorizedIssuers;

    event CredentialIssued(bytes32 indexed credHash, address indexed issuer, address indexed holder, string cid);
    event CredentialRevoked(bytes32 indexed credHash);

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized");
        _;
    }

    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
    }

    function issueCredential(address holder, string memory cid) public onlyIssuer {
        bytes32 credHash = keccak256(abi.encodePacked(cid, holder));
        require(credentials[credHash].issuedAt == 0, "Already exists");

        credentials[credHash] = Credential({
            issuer: msg.sender,
            holder: holder,
            cid: cid,
            revoked: false,
            issuedAt: block.timestamp
        });

        emit CredentialIssued(credHash, msg.sender, holder, cid);
    }

    function revokeCredential(address holder, string memory cid) public onlyIssuer {
        bytes32 credHash = keccak256(abi.encodePacked(cid, holder));
        require(credentials[credHash].issuedAt != 0, "Not found");
        credentials[credHash].revoked = true;

        emit CredentialRevoked(credHash);
    }

    function verifyCredential(address holder, string memory cid) external view returns (bool) {
        bytes32 credHash = keccak256(abi.encodePacked(cid, holder));
        Credential memory cred = credentials[credHash];
        return (cred.issuedAt != 0 && !cred.revoked);
    }
}
