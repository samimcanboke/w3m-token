require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // 1. Deploy MockUSDT (USDC for testing)
  console.log("\n📄 Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdc = await MockUSDT.deploy(deployer.address);
  await usdc.waitForDeployment();
  console.log("✅ MockUSDT deployed to:", await usdc.getAddress());

  // 2. Deploy Web3Moon
  console.log("\n📄 Deploying Web3Moon...");
  const Web3Moon = await ethers.getContractFactory("Web3Moon");
  const w3m = await Web3Moon.deploy(await usdc.getAddress());
  await w3m.waitForDeployment();
  console.log("✅ Web3Moon deployed to:", await w3m.getAddress());

  // 3. Initial Configuration
  console.log("\n⚙️  Setting up initial configuration...");
  
  // Set wallets
  await w3m.setReferralWallet(deployer.address);
  console.log("✅ Referral wallet set to:", deployer.address);
  
  await w3m.setActiveUsersWallet(deployer.address);
  console.log("✅ Active users wallet set to:", deployer.address);
  
  await w3m.setStakingRewardsWallet(deployer.address);
  console.log("✅ Staking rewards wallet set to:", deployer.address);

  // Add initial pool
  await w3m.addPool(deployer.address, 100);
  console.log("✅ Added initial pool with weight 100");

  // 4. Mint some USDC for testing
  console.log("\n💵 Minting test USDC...");
  const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
  await usdc.mint(deployer.address, mintAmount);
  console.log("✅ Minted 1,000,000 USDC to deployer");

  // 5. Summary
  console.log("\n📊 Deployment Summary:");
  console.log("=======================");
  console.log("MockUSDT (USDC):", await usdc.getAddress());
  console.log("Web3Moon (W3M):", await w3m.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("Initial Price:", ethers.formatUnits(await w3m.getCurrentPrice(), 18), "USDC per W3M");
  
  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    MockUSDT: await usdc.getAddress(),
    Web3Moon: await w3m.getAddress(),
    deployer: deployer.address,
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Addresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });