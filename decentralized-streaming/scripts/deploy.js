const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy UploadVerification contract
    const UploadVerification = await hre.ethers.deployContract("UploadVerification");
    await UploadVerification.waitForDeployment(); // ✅ Replaces `.deployed()`
    console.log("UploadVerification deployed to:", await UploadVerification.getAddress());

    // Deploy StreamingVerification contract
    const StreamingVerification = await hre.ethers.deployContract("StreamingVerification");
    await StreamingVerification.waitForDeployment();
    console.log("StreamingVerification deployed to:", await StreamingVerification.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
