// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ulo.sol";

contract SnakeGame is Ownable {
    ULOToken public uloToken;

    struct Player {
        uint256 lastScore;
        uint256 highestScore;
        uint256 gamesPlayed;
    }

    struct Score {
        address player;
        string playerName;
        uint256 score;
        uint8 level;
        uint256 timestamp;
    }

    // Mapping untuk tracking player stats
    mapping(address => Player) public players;

    // Leaderboard per level
    mapping(uint8 => Score[]) public leaderboards;

    // Constants
    uint8 public constant MAX_LEVELS = 5;

    // Events
    event GameStarted(address indexed player, uint8 level, uint256 timestamp);
    event ScoreSubmitted(
        address indexed player,
        string playerName,
        uint256 score,
        uint8 level,
        uint256 timestamp
    );
    event TokensMinted(address indexed player, uint256 amount);

    constructor(address _uloTokenAddress) Ownable(msg.sender) {
        uloToken = ULOToken(_uloTokenAddress);
    }

    function startGame(uint8 level) external {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");

        // Increment games played
        players[msg.sender].gamesPlayed++;

        emit GameStarted(msg.sender, level, block.timestamp);
    }

    function submitScore(
        string memory playerName,
        uint256 score,
        uint8 level
    ) external {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");

        Player storage player = players[msg.sender];
        player.lastScore = score;

        if (score > player.highestScore) {
            player.highestScore = score;
        }

        // Format player name: "address (name)" if name provided, else just address
        string memory formattedName;
        if (bytes(playerName).length > 0) {
            formattedName = string(
                abi.encodePacked(
                    addressToString(msg.sender),
                    " (",
                    playerName,
                    ")"
                )
            );
        } else {
            formattedName = addressToString(msg.sender);
        }

        // Add score to leaderboard
        Score memory newScore = Score({
            player: msg.sender,
            playerName: formattedName,
            score: score,
            level: level,
            timestamp: block.timestamp
        });
        leaderboards[level].push(newScore);

        // Mint ULO tokens based on score
        uloToken.mint(msg.sender, score);

        emit ScoreSubmitted(
            msg.sender,
            formattedName,
            score,
            level,
            block.timestamp
        );
        emit TokensMinted(msg.sender, score);
    }

    // Helper function to convert address to string
    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    // Get recent scores with limit
    function getRecentScores(
        uint8 level,
        uint256 limit
    ) external view returns (Score[] memory) {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");

        Score[] storage allScores = leaderboards[level];
        uint256 resultLength = limit < allScores.length
            ? limit
            : allScores.length;
        Score[] memory result = new Score[](resultLength);

        // Copy from end (most recent scores)
        for (uint i = 0; i < resultLength; i++) {
            result[i] = allScores[allScores.length - 1 - i];
        }

        return result;
    }

    // Get player stats
    function getPlayerStats(
        address playerAddress
    ) external view returns (Player memory) {
        return players[playerAddress];
    }
}
