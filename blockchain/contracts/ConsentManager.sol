// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ConsentManager {
    struct ConsentRequest {
        address user;
        address requester;
        string purpose;
        bool approved;
        uint256 timestamp;
    }

    mapping(uint256 => ConsentRequest) public consents;
    uint256 public consentCount;

    event ConsentRequested(uint256 id, address user, address requester, string purpose);
    event ConsentApproved(uint256 id);

    function requestConsent(address user, string memory purpose) public {
        consentCount++;
        consents[consentCount] = ConsentRequest({
            user: user,
            requester: msg.sender,
            purpose: purpose,
            approved: false,
            timestamp: block.timestamp
        });

        emit ConsentRequested(consentCount, user, msg.sender, purpose);
    }

    function approveConsent(uint256 consentId) public {
        ConsentRequest storage request = consents[consentId];
        require(msg.sender == request.user, "Only user can approve");
        require(!request.approved, "Already approved");
        request.approved = true;

        emit ConsentApproved(consentId);
    }

    function checkConsent(address user, address requester) public view returns (bool) {
        for (uint256 i = 1; i <= consentCount; i++) {
            if (consents[i].user == user && consents[i].requester == requester && consents[i].approved) {
                return true;
            }
        }
        return false;
    }
}
