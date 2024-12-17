// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ulo.sol";

contract SnakeGame is Ownable {
    ULOToken public uloToken;

    struct Player {
        bool isPlaying;
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

    // Mapping untuk tracking player status
    mapping(address => Player) public players;

    // Leaderboard per level - menyimpan semua score
    mapping(uint8 => Score[]) public leaderboards;

    // Constants
    uint8 public constant MAX_LEVELS = 5;

    // Events
    event GameStarted(address indexed player, uint8 level, uint256 timestamp);
    event GameEnded(
        address indexed player,
        uint256 score,
        uint8 level,
        uint256 timestamp
    );
    event ScoreSubmitted(
        address indexed player,
        string playerName,
        uint256 score,
        uint8 level
    );
    event TokensMinted(address indexed player, uint256 amount);

    constructor(address _uloTokenAddress) Ownable(msg.sender) {
        uloToken = ULOToken(_uloTokenAddress);
    }

    function startGame(uint8 level) external {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");
        require(!players[msg.sender].isPlaying, "Player already in game");

        players[msg.sender] = Player({
            isPlaying: true,
            lastScore: 0,
            highestScore: players[msg.sender].highestScore,
            gamesPlayed: players[msg.sender].gamesPlayed + 1
        });

        emit GameStarted(msg.sender, level, block.timestamp);
    }

    function endGame(
        string memory playerName,
        uint256 score,
        uint8 level
    ) external {
        require(players[msg.sender].isPlaying, "No active game found");

        Player storage player = players[msg.sender];
        player.isPlaying = false;
        player.lastScore = score;

        if (score > player.highestScore) {
            player.highestScore = score;
        }

        // Add score to leaderboard
        _addScore(playerName, score, level);

        // Mint ULO tokens based on score
        uloToken.mint(msg.sender, score);

        emit GameEnded(msg.sender, score, level, block.timestamp);
        emit TokensMinted(msg.sender, score);
    }

    // Internal function untuk menambah score
    function _addScore(
        string memory playerName,
        uint256 score,
        uint8 level
    ) internal {
        Score memory newScore = Score({
            player: msg.sender,
            playerName: playerName,
            score: score,
            level: level,
            timestamp: block.timestamp
        });

        leaderboards[level].push(newScore);
        emit ScoreSubmitted(msg.sender, playerName, score, level);
    }

    // View functions dengan berbagai opsi pengambilan data

    // 1. Ambil N score tertinggi
    function getTopScores(
        uint8 level,
        uint256 limit
    ) external view returns (Score[] memory) {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");

        Score[] storage allScores = leaderboards[level];
        uint256 resultLength = limit < allScores.length
            ? limit
            : allScores.length;
        Score[] memory result = new Score[](resultLength);

        // Temporary array untuk sorting
        Score[] memory sortedScores = new Score[](allScores.length);
        for (uint i = 0; i < allScores.length; i++) {
            sortedScores[i] = allScores[i];
        }

        // Simple bubble sort (bisa dioptimasi jika diperlukan)
        for (uint i = 0; i < sortedScores.length; i++) {
            for (uint j = i + 1; j < sortedScores.length; j++) {
                if (sortedScores[i].score < sortedScores[j].score) {
                    Score memory temp = sortedScores[i];
                    sortedScores[i] = sortedScores[j];
                    sortedScores[j] = temp;
                }
            }
        }

        // Copy N scores tertinggi
        for (uint i = 0; i < resultLength; i++) {
            result[i] = sortedScores[i];
        }

        return result;
    }

    // 2. Ambil score terbaru dengan limit
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

        // Copy dari belakang (score terbaru)
        for (uint i = 0; i < resultLength; i++) {
            result[i] = allScores[allScores.length - 1 - i];
        }

        return result;
    }

    // 3. Ambil total jumlah score per level
    function getTotalScores(uint8 level) external view returns (uint256) {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");
        return leaderboards[level].length;
    }

    // 4. Ambil score berdasarkan range (untuk pagination)
    function getScoresByRange(
        uint8 level,
        uint256 start,
        uint256 end
    ) external view returns (Score[] memory) {
        require(level >= 1 && level <= MAX_LEVELS, "Invalid level");
        require(start <= end, "Invalid range");
        require(
            start < leaderboards[level].length,
            "Start index out of bounds"
        );

        uint256 endIndex = end < leaderboards[level].length
            ? end
            : leaderboards[level].length - 1;
        uint256 resultLength = endIndex - start + 1;
        Score[] memory result = new Score[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = leaderboards[level][start + i];
        }

        return result;
    }

    function getPlayerStatus(
        address playerAddress
    ) external view returns (Player memory) {
        return players[playerAddress];
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
