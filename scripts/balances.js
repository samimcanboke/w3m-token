const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const usdtAddress = process.env.USDT_ADDRESS;
  const w3mAddress = process.env.W3M_ADDRESS;

  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress);
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  const usdtBalance = await usdt.balanceOf(deployer.address);
  const w3mBalance = await w3m.balanceOf(deployer.address);

  console.log(`💵 USDT Balance: ${ethers.formatUnits(usdtBalance, 18)}`);
  console.log(`🌙 W3M Balance: ${ethers.formatEther(w3mBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});