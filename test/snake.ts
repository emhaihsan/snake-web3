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
            await snakeGame.connect(player1).submitScore("Player1", BigInt(100), LEVEL_ONE);

            const player = await snakeGame.players(player1.address);
            expect(player.lastScore).to.equal(BigInt(100));
            expect(await uloToken.balanceOf(player1.address)).to.equal(BigInt(100));
        });

        it("Should update highest score when submitting higher score", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("Player1", BigInt(100), LEVEL_ONE);

            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await snakeGame.connect(player1).submitScore("Player1", BigInt(150), LEVEL_ONE);

            const player = await snakeGame.players(player1.address);
            expect(player.highestScore).to.equal(BigInt(150));
        });

        it("Should not submit score with invalid level", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE);
            await expect(
                snakeGame.connect(player1).submitScore("Player1", BigInt(100), 0)
            ).to.be.revertedWith("Invalid level");
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
        });
    });
});