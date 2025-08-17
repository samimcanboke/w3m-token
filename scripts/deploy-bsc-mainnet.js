require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying Web3Moon contract on BSC MAINNET with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");

  // BSC Mainnet USDC Token Address (same as testnet for now)
  const realUsdcAddress = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"; // Same as deployment-addresses.json
  
  // Load wallet information
  const walletsPath = path.join(__dirname, "..", "deployment-wallets.json");
  const walletInfo = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  // Extract addresses from wallet info
  const referralWallet = walletInfo.find(w => w.name === "referral").address;
  const activeUsersWallet = walletInfo.find(w => w.name === "activeUsers").address;
  const stakingRewardsWallet = walletInfo.find(w => w.name === "stakingRewards").address;
  
  // Prepare pool data with same weights as testnet deployment
  const poolData = [
    { wallet: walletInfo.find(w => w.name === "sunPool"), weight: 83 },
    { wallet: walletInfo.find(w => w.name === "mercuryPool"), weight: 83 },
    { wallet: walletInfo.find(w => w.name === "marsPool"), weight: 110 },
    { wallet: walletInfo.find(w => w.name === "earthPool"), weight: 138 },
    { wallet: walletInfo.find(w => w.name === "neptunePool"), weight: 138 },
    { wallet: walletInfo.find(w => w.name === "saturnPool"), weight: 199 },
    { wallet: walletInfo.find(w => w.name === "jupiterPool"), weight: 249 }
  ];

  console.log("\n💎 Using REAL USDC on BSC Mainnet:", realUsdcAddress);
  console.log("\n📋 Wallet Configuration:");
  console.log("  Referral Wallet:", referralWallet);
  console.log("  Active Users Wallet:", activeUsersWallet);
  console.log("  Staking Rewards Wallet:", stakingRewardsWallet);
  
  console.log("\n🌊 Pool Configuration:");
  poolData.forEach((pool, index) => {
    console.log(`  ${pool.wallet.name}: ${pool.wallet.address} (weight: ${pool.weight})`);
  });
  
  const totalWeight = poolData.reduce((sum, pool) => sum + pool.weight, 0);
  console.log(`  Total Pool Weight: ${totalWeight}`);

  // Deploy Web3Moon
  console.log("\n📄 Deploying Web3Moon on BSC MAINNET...");
  const Web3Moon = await ethers.getContractFactory("Web3Moon");
  
  // Prepare initial pools array for constructor
  const initialPools = poolData.map(p => ({
    wallet: p.wallet.address,
    weight: p.weight
  }));
  
  console.log("\n⚠️  DEPLOYING TO BSC MAINNET - THIS WILL USE REAL BNB!");
  console.log("⚠️  Make sure you have enough BNB for gas fees!");
  
  const w3m = await Web3Moon.deploy(
    realUsdcAddress,
    referralWallet,
    stakingRewardsWallet,
    activeUsersWallet,
    initialPools,
    {
      gasLimit: 5000000, // Set a reasonable gas limit
    }
  );
  
  console.log("⏳ Waiting for deployment confirmation...");
  await w3m.deployed();
  const w3mAddress = w3m.address;
  console.log("✅ Web3Moon deployed to BSC MAINNET at:", w3mAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  console.log("  Contract Address:", w3mAddress);
  console.log("  Initial Price:", ethers.utils.formatUnits(await w3m.getCurrentPrice(), 18), "USDC per W3M");
  console.log("  Total Supply:", ethers.utils.formatUnits(await w3m.totalSupply(), 18), "W3M");
  console.log("  Total USDC:", ethers.utils.formatUnits(await w3m.totalUSDC(), 6), "USDC");
  console.log("  Pool Count:", await w3m.getPoolsCount());
  
  // Check USDC connection
  console.log("\n💎 Checking USDC connection...");
  const usdcAddress = await w3m.usdcToken();
  console.log("  Connected USDC Address:", usdcAddress);
  console.log("  USDC Decimals:", await w3m.getUSDCDecimals());
  
  // Save deployment info
  const deploymentInfo = {
    web3moon: w3mAddress,
    realUSDC: realUsdcAddress,
    deployer: deployer.address,
    referralWallet: referralWallet,
    activeUsersWallet: activeUsersWallet,
    stakingRewardsWallet: stakingRewardsWallet,
    pools: poolData.map(p => ({
      name: p.wallet.name,
      address: p.wallet.address,
      weight: p.weight
    })),
    totalPoolWeight: totalWeight,
    initialPrice: ethers.utils.formatUnits(await w3m.getCurrentPrice(), 18),
    network: "bscmainnet",
    chainId: 56,
    timestamp: new Date().toISOString(),
    gasUsed: "Estimated 3-5M gas units",
    bscScanUrl: `https://bscscan.com/address/${w3mAddress}`
  };
  
  const outputPath = path.join(__dirname, "..", "deployment-addresses-mainnet.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 BSC Mainnet deployment info saved to:", outputPath);
  
  console.log("\n🎉 BSC MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("🔗 Contract Address:", w3mAddress);
  console.log("🔍 BscScan URL: https://bscscan.com/address/" + w3mAddress);
  console.log("\n⚠️  IMPORTANT: Save the contract address and verify on BscScan!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });