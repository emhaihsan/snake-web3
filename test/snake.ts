import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SnakeGame, ULOToken } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SnakeGame", function () {
    let snakeGame: SnakeGame;
    let uloToken: ULOToken;
    let owner: SignerWithAddress;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;

    const GAME_COST = ethers.parseEther("0.001");
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
        it("Should end game and mint tokens", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE, { value: GAME_COST });
            await snakeGame.connect(player1).endGame("Player1", BigInt(100), LEVEL_ONE);

            const playerStatus = await snakeGame.getPlayerStatus(player1.address);
            expect(playerStatus.isPlaying).to.be.false;
            expect(playerStatus.lastScore).to.equal(BigInt(100));
            expect(await uloToken.balanceOf(player1.address)).to.equal(BigInt(100) * BigInt(1e18));
        });

        it("Should not end game after timeout", async function () {
            await snakeGame.connect(player1).startGame(LEVEL_ONE, { value: GAME_COST });

            // Increase time by 11 minutes
            await time.increase(11 * 60);

            await expect(
                snakeGame.connect(player1).endGame("Player1", BigInt(100), LEVEL_ONE)
            ).to.be.revertedWith("Game timeout exceeded");
        });
    });

    describe("Leaderboard", function () {
        beforeEach(async function () {
            // Submit some scores
            await snakeGame.connect(player1).startGame(LEVEL_ONE, { value: GAME_COST });
            await snakeGame.connect(player1).endGame("Player1", BigInt(100), LEVEL_ONE);

            await snakeGame.connect(player2).startGame(LEVEL_ONE, { value: GAME_COST });
            await snakeGame.connect(player2).endGame("Player2", BigInt(150), LEVEL_ONE);
        });

        it("Should get top scores correctly", async function () {
            const topScores = await snakeGame.getTopScores(LEVEL_ONE, 2);
            expect(topScores.length).to.equal(2);
            expect(topScores[0].score).to.equal(BigInt(150));
            expect(topScores[1].score).to.equal(BigInt(100));
        });

        it("Should get recent scores correctly", async function () {
            const recentScores = await snakeGame.getRecentScores(LEVEL_ONE, 2);
            expect(recentScores.length).to.equal(2);
            expect(recentScores[0].score).to.equal(BigInt(150));
            expect(recentScores[1].score).to.equal(BigInt(100));
        });

        it("Should get player scores correctly", async function () {
            const player1Scores = await snakeGame.getPlayerScores(LEVEL_ONE, player1.address);
            expect(player1Scores.length).to.equal(1);
            expect(player1Scores[0].score).to.equal(BigInt(100));
        });
    });
    describe("Admin Functions", function () {
        it("Should allow owner to withdraw funds", async function () {
            // Play game to add funds
            await snakeGame.connect(player1).startGame(LEVEL_ONE, { value: GAME_COST });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            await snakeGame.connect(owner).withdrawFunds();
            const finalBalance = await ethers.provider.getBalance(owner.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });


        it("Should not allow non-owner to withdraw funds", async function () {
            await expect(
                snakeGame.connect(player1).withdrawFunds()
            ).to.be.revertedWithCustomError(snakeGame, "OwnableUnauthorizedAccount")
                .withArgs(player1.address);
        });
    });
});