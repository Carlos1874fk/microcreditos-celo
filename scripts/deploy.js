const hre = require("hardhat");

async function main() {
  const Microcredito = await hre.ethers.deployContract("Microcredito");
  await Microcredito.waitForDeployment();
  console.log("Contrato desplegado en:", await Microcredito.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
