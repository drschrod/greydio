const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UploadVerification", function () {
    let UploadVerification, uploadContract, owner, user1, user2;

    beforeEach(async function () {
        UploadVerification = await ethers.getContractFactory("UploadVerification");
        [owner, user1, user2] = await ethers.getSigners();
        uploadContract = await UploadVerification.deploy();
        await uploadContract.waitForDeployment();
    });

    it("Should allow high-reputation users to upload without staking", async function () {
        await uploadContract.uploadSong(1, { value: ethers.parseEther("5") });
        const song = await uploadContract.songs(1);
        expect(song.uploader).to.equal(owner.address);
    });

    it("Should reject low-reputation users without stake", async function () {
        await expect(uploadContract.connect(user1).uploadSong(2, { value: 0 }))
            .to.be.revertedWith("Low reputation or insufficient stake.");
    });

    it("Should allow staking as an alternative to reputation", async function () {
        await uploadContract.connect(user1).uploadSong(3, { value: ethers.parseEther("5") });
        const song = await uploadContract.songs(3);
        expect(song.uploader).to.equal(user1.address);
    });
});
