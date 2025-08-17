require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying Web3Moon contract with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Load wallet information
  const walletsPath = path.join(__dirname, "..", "deployment-wallets.json");
  const walletInfo = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  // Extract addresses from wallet info
  const referralWallet = walletInfo.find(w => w.name === "referral").address;
  const activeUsersWallet = walletInfo.find(w => w.name === "activeUsers").address;
  const stakingRewardsWallet = walletInfo.find(w => w.name === "stakingRewards").address;
  
  // Prepare pool data
  const poolData = [
    { wallet: walletInfo.find(w => w.name === "sunPool"), weight: 83 },
    { wallet: walletInfo.find(w => w.name === "mercuryPool"), weight: 83 },
    { wallet: walletInfo.find(w => w.name === "marsPool"), weight: 110 },
    { wallet: walletInfo.find(w => w.name === "earthPool"), weight: 138 },
    { wallet: walletInfo.find(w => w.name === "neptunePool"), weight: 138 },
    { wallet: walletInfo.find(w => w.name === "saturnPool"), weight: 199 },
    { wallet: walletInfo.find(w => w.name === "jupiterPool"), weight: 249 }
  ];

  // Mock USDC address (given by user)
  const mockUsdcAddress = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
  
  console.log("\n📄 Using Mock USDC at:", mockUsdcAddress);
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
  console.log("\n📄 Deploying Web3Moon...");
  const Web3Moon = await ethers.getContractFactory("Web3Moon");
  
  // Prepare initial pools array for constructor
  const initialPools = poolData.map(p => ({
    wallet: p.wallet.address,
    weight: p.weight
  }));
  
  const w3m = await Web3Moon.deploy(
    mockUsdcAddress,
    referralWallet,
    stakingRewardsWallet,
    activeUsersWallet,
    initialPools
  );
  
  await w3m.waitForDeployment();
  const w3mAddress = await w3m.getAddress();
  console.log("✅ Web3Moon deployed to:", w3mAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  console.log("  Initial Price:", ethers.formatUnits(await w3m.getCurrentPrice(), 18), "USDC per W3M");
  console.log("  Total Supply:", ethers.formatUnits(await w3m.totalSupply(), 18), "W3M");
  console.log("  Total USDC:", ethers.formatUnits(await w3m.totalUSDC(), 6), "USDC");
  console.log("  Pool Count:", await w3m.getPoolsCount());
  
  // Check USDC connection
  console.log("\n💎 Checking USDC connection...");
  const usdcAddress = await w3m.usdcToken();
  console.log("  Connected USDC Address:", usdcAddress);
  console.log("  USDC Decimals:", await w3m.getUSDCDecimals());
  
  // Save deployment info
  const deploymentInfo = {
    web3moon: w3mAddress,
    mockUSDC: mockUsdcAddress,
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
    initialPrice: ethers.formatUnits(await w3m.getCurrentPrice(), 18),
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  const outputPath = path.join(__dirname, "..", "deployment-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", outputPath);
  
  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });