require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.17",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: ["0db59430a43f4ac3eeedd46aadca0bf1668866a2ce229ac038d9f082895caaa2"]
    }
  }
};
