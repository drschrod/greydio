// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StreamingVerification {
    struct StreamEvent {
        uint256 songId;
        address listener;
    }

    mapping(uint256 => mapping(address => bool)) public uniqueListeners;
    mapping(uint256 => uint256) public streamCount;

    event StreamRecorded(uint256 songId, address listener);

    function recordStream(uint256 _songId) public {
        require(!uniqueListeners[_songId][msg.sender], "Self-streaming or duplicate listener detected.");
        uniqueListeners[_songId][msg.sender] = true;
        streamCount[_songId]++;
        emit StreamRecorded(_songId, msg.sender);
    }
}
