// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract FileTimestamp {

    mapping(uint256 => uint256) public hashToTimestamp;

    constructor() {
        console.log("Deploying a  contract");
    }

    function setTimestamp(uint256 hash, uint256 timestamp) public {
        require(hashToTimestamp[hash] == 0, "Timestamp already set");
        hashToTimestamp[hash] = timestamp;
    }

    function getTimestamp(uint256 hash) public view returns (uint256) {
        require(hashToTimestamp[hash] != 0, "Timestamp not set");
        return hashToTimestamp[hash];
    }
}
