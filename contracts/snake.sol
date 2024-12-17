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

        // Add score to leaderboard
        Score memory newScore = Score({
            player: msg.sender,
            playerName: playerName,
            score: score,
            level: level,
            timestamp: block.timestamp
        });
        leaderboards[level].push(newScore);

        // Mint ULO tokens based on score
        uloToken.mint(msg.sender, score);

        emit ScoreSubmitted(
            msg.sender,
            playerName,
            score,
            level,
            block.timestamp
        );
        emit TokensMinted(msg.sender, score);
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
