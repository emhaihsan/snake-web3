import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ULOToken } from "../typechain-types";

describe("ULOToken", function () {
    let uloToken: ULOToken;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const ULOToken = await ethers.getContractFactory("ULOToken");
        uloToken = await ULOToken.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await uloToken.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await uloToken.name()).to.equal("Ultimate Snake ULO");
            expect(await uloToken.symbol()).to.equal("ULO");
        });

        it("Should start with zero total supply", async function () {
            expect(await uloToken.totalSupply()).to.equal(0);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = BigInt(100);
            await uloToken.mint(addr1.address, mintAmount);
            expect(await uloToken.balanceOf(addr1.address)).to.equal(mintAmount * BigInt(1e18));
        });

        it("Should not allow non-owner to mint tokens", async function () {
            await expect(
                uloToken.connect(addr1).mint(addr2.address, BigInt(100))
            ).to.be.revertedWith("Only game contract can mint");
        });
    });

    describe("Token Transfers", function () {
        const mintAmount = BigInt(1000);

        beforeEach(async function () {
            await uloToken.mint(addr1.address, mintAmount);
        });

        it("Should transfer tokens between accounts", async function () {
            await uloToken.connect(addr1).transfer(addr2.address, BigInt(50) * BigInt(1e18));
            expect(await uloToken.balanceOf(addr2.address)).to.equal(BigInt(50) * BigInt(1e18));
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            await expect(
                uloToken.connect(addr1).transfer(addr2.address, (mintAmount + BigInt(1)) * BigInt(1e18))
            ).to.be.reverted;
        });
    });
});