const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying MockUSDT with account:", deployer.address);

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUsdt = await MockUSDT.deploy(deployer.address);
  await mockUsdt.waitForDeployment();

  const address = await mockUsdt.getAddress();
  const balance = await mockUsdt.balanceOf(deployer.address);

  console.log("✅ MockUSDT deployed to:", address);
  console.log("💰 Initial balance of deployer:", ethers.formatUnits(balance, 18), "USDT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});