const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreamingVerification", function () {
    let StreamingVerification, streamContract, owner, user1, user2;

    beforeEach(async function () {
        StreamingVerification = await ethers.getContractFactory("StreamingVerification");
        [owner, user1, user2] = await ethers.getSigners();
        streamContract = await StreamingVerification.deploy();
        await streamContract.waitForDeployment();
    });

    it("Should record unique listener streams", async function () {
        await streamContract.connect(user1).recordStream(1);
        await streamContract.connect(user2).recordStream(1);
        const count = await streamContract.streamCount(1);
        expect(count).to.equal(2);
    });

    it("Should prevent self-streaming", async function () {
        await streamContract.connect(owner).recordStream(1);
        await expect(streamContract.connect(owner).recordStream(1))
            .to.be.revertedWith("Self-streaming or duplicate listener detected.");
    });

    it("Should prevent duplicate listeners from counting twice", async function () {
        await streamContract.connect(user1).recordStream(1);
        await expect(streamContract.connect(user1).recordStream(1))
            .to.be.revertedWith("Self-streaming or duplicate listener detected.");
    });
});
