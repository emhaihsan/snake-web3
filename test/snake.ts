import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SnakeGame, ULOToken } from "../typechain-types";

describe("SnakeGame", function () {
    let snakeGame: SnakeGame;
    let uloToken: ULOToken;
    let owner: SignerWithAddress;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;

    const LEVEL_ONE = 1;

    beforeEach(async function () {
        [owner, player1, player2] = await ethers.getSigners();

        // Deploy ULO Token
        const ULOToken = await ethers.getContractFactory("ULOToken");
        uloToken = await ULOToken.deploy();

        // Deploy Snake Game
        const SnakeGame = await ethers.getContractFactory("SnakeGame");
        snakeGame = await SnakeGame.deploy(await uloToken.getAddress());

        // Set SnakeGame as owner of ULOToken
        await uloToken.transferOwnership(await snakeGame.getAddress());
    });

    describe("Game Mechanics", function () {
        it("Should start game with valid level", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            const player = await snakeGame.players(player1.address);
            expect(player.gamesPlayed).to.equal(1);
        });

        it("Should not start game with invalid level", async function () {
            await expect(
                snakeGame.connect(player1).startGame(0)
            ).to.be.revertedWith("Invalid level");
        });

        it("Should allow multiple games", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            const player = await snakeGame.players(player1.address);
            expect(player.gamesPlayed).to.equal(2);
        });

        it("Should submit score and mint tokens", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("", BigInt(100), LEVEL_ONE);

            const player = await snakeGame.players(player1.address);
            expect(player.lastScore).to.equal(BigInt(100));
            // Token uses 18 decimals
            expect(await uloToken.balanceOf(player1.address)).to.equal(BigInt(100) * BigInt(10 ** 18));
        });

        it("Should update highest score when submitting higher score", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("", BigInt(100), LEVEL_ONE);

            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("", BigInt(150), LEVEL_ONE);

            const player = await snakeGame.players(player1.address);
            expect(player.highestScore).to.equal(BigInt(150));
        });

        it("Should not submit score with invalid level", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await expect(
                snakeGame.connect(player1).submitScore("", BigInt(100), 0)
            ).to.be.revertedWith("Invalid level");
        });

        it("Should format player name correctly", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);

            // Test with name
            const tx1 = await snakeGame.connect(player1).submitScore("John", BigInt(100), LEVEL_ONE);
            const receipt1 = await tx1.wait();

            // Filter for ScoreSubmitted events
            const scoreSubmittedFilter = snakeGame.filters.ScoreSubmitted(player1.address);
            const events1 = await snakeGame.queryFilter(scoreSubmittedFilter, receipt1?.blockNumber, receipt1?.blockNumber);

            // Get the event data
            const event1 = events1[0];
            const playerName1 = event1.args[1]; // playerName is the second argument

            // Convert addresses to lowercase for comparison
            const formattedAddr1 = player1.address.toLowerCase();
            expect(playerName1.toLowerCase()).to.contain(formattedAddr1);
            expect(playerName1).to.contain("(John)");

            // Test without name
            await snakeGame.connect(player2).startGame(LEVEL_ONE);
            const tx2 = await snakeGame.connect(player2).submitScore("", BigInt(100), LEVEL_ONE);
            const receipt2 = await tx2.wait();

            // Filter for ScoreSubmitted events for player2
            const scoreSubmittedFilter2 = snakeGame.filters.ScoreSubmitted(player2.address);
            const events2 = await snakeGame.queryFilter(scoreSubmittedFilter2, receipt2?.blockNumber, receipt2?.blockNumber);

            // Get the event data
            const event2 = events2[0];
            const playerName2 = event2.args[1]; // playerName is the second argument

            const formattedAddr2 = player2.address.toLowerCase();
            expect(playerName2.toLowerCase()).to.contain(formattedAddr2);
        });
    });

    describe("Leaderboard", function () {
        beforeEach(async function () {
            // Submit some scores
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("Player1", BigInt(100), LEVEL_ONE);

            await snakeGame.connect(player2).startGame(LEVEL_ONE);
            await snakeGame.connect(player2).submitScore("Player2", BigInt(150), LEVEL_ONE);
        });

        it("Should get recent scores correctly", async function () {
            const recentScores = await snakeGame.getRecentScores(LEVEL_ONE, 2);
            expect(recentScores.length).to.equal(2);
            expect(recentScores[0].score).to.equal(BigInt(150));
            expect(recentScores[1].score).to.equal(BigInt(100));

            // Check if player names are formatted correctly
            const addr2 = player2.address.toLowerCase();
            const addr1 = player1.address.toLowerCase();
            expect(recentScores[0].playerName.toLowerCase()).to.contain(addr2);
            expect(recentScores[0].playerName).to.contain("(Player2)");
            expect(recentScores[1].playerName.toLowerCase()).to.contain(addr1);
            expect(recentScores[1].playerName).to.contain("(Player1)");
        });
    });
});