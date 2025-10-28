// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Sample {
    string public message = "Hello, Hardhat!";
    function setMessage(string calldata newMessage) external {
        message = newMessage;
    }
}
