require("@nomicfoundation/hardhat-toolbox");
require("hardhat-tracer");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      mining: {
        auto: true,  // Ensure auto-mining is enabled
        interval: 5000  // Mine a block every 5 seconds
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
