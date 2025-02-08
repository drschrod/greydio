// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UploadVerification {
    struct Song {
        uint256 songId;
        address uploader;
        uint256 stakeAmount;
        bool verified;
        uint256 reportCount;
        uint256 uniqueListeners;
    }

    mapping(uint256 => Song) public songs;  
    mapping(address => uint256) public reputation;  
    uint256 public minStake = 5 ether;
    uint256 public minReputation = 10;

    event SongUploaded(uint256 songId, address uploader);
    event SongVerified(uint256 songId);
    event SongRejected(uint256 songId, address uploader, uint256 penalty);

    function uploadSong(uint256 _songId) public payable {
        require(reputation[msg.sender] >= minReputation || msg.value >= minStake, "Low reputation or insufficient stake.");
        songs[_songId] = Song(_songId, msg.sender, msg.value, false, 0, 0);
        emit SongUploaded(_songId, msg.sender);
    }
}
