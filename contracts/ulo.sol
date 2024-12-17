// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ULOToken is ERC20, Ownable {
    constructor() ERC20("Ultimate Snake ULO", "ULO") Ownable(msg.sender) {}

    // Hanya SnakeGame contract yang bisa minting token
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner(), "Only game contract can mint");
        _mint(to, amount * 1e18); // Convert to 18 decimals
    }
}
