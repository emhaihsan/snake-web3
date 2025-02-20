import { ethers } from 'hardhat';

async function main() {
    try {
        // Deploy ULO Token first
        console.log("Deploying ULO Token...");
        const ULOToken = await ethers.getContractFactory("ULOToken");
        const uloToken = await ULOToken.deploy();
        await uloToken.waitForDeployment();
        const uloTokenAddress = await uloToken.getAddress();
        console.log(`ULOToken deployed to: ${uloTokenAddress}`);

        // Deploy Snake Game
        console.log("\nDeploying Snake Game...");
        const SnakeGame = await ethers.getContractFactory("SnakeGame");
        const snakeGame = await SnakeGame.deploy(uloTokenAddress);
        await snakeGame.waitForDeployment();
        const snakeGameAddress = await snakeGame.getAddress();
        console.log(`SnakeGame deployed to: ${snakeGameAddress}`);

        // Transfer ULO Token ownership to Snake Game
        console.log("\nTransferring ULO Token ownership to Snake Game...");
        const transferTx = await uloToken.transferOwnership(snakeGameAddress);
        await transferTx.wait();
        console.log("Ownership transferred successfully!");

        console.log("\nDeployment Summary:");
        console.log("-------------------");
        console.log(`ULO Token: ${uloTokenAddress}`);
        console.log(`Snake Game: ${snakeGameAddress}`);
        console.log("\nVerify contracts on Lisk Sepolia:");
        console.log("--------------------------------");
        console.log(`npx hardhat verify --network lisk ${uloTokenAddress}`);
        console.log(`npx hardhat verify --network lisk ${snakeGameAddress} ${uloTokenAddress}`);
        console.log("\nView contracts on Lisk Sepolia Explorer:");
        console.log(`https://blockscout.lisk.com/address/${uloTokenAddress}`);
        console.log(`https://blockscout.lisk.com/address/${snakeGameAddress}`);
    } catch (error) {
        console.error("Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });