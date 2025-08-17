require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const W3M_ADDRESS = "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d";
  const ACTIVE_USERS_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  const w3mContract = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", W3M_ADDRESS);
  
  console.log("🔧 Setting active users wallet...");
  const tx = await w3mContract.setActiveUsersWallet(ACTIVE_USERS_WALLET);
  await tx.wait();
  
  console.log("✅ Active users wallet set to:", ACTIVE_USERS_WALLET);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 