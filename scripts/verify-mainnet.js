require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployment-addresses-mainnet.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const w3mAddress = deploymentInfo.web3moon;
  const usdcAddress = deploymentInfo.realUSDC;
  const referralWallet = deploymentInfo.referralWallet;
  const stakingRewardsWallet = deploymentInfo.stakingRewardsWallet;
  const activeUsersWallet = deploymentInfo.activeUsersWallet;
  const pools = deploymentInfo.pools;
  
  console.log("🔍 BSC Mainnet Kontrat Verification");
  console.log("📄 Contract Address:", w3mAddress);
  
  // Prepare constructor arguments
  const initialPools = pools.map(p => ({
    wallet: p.address,
    weight: p.weight
  }));
  
  console.log("\n📋 Constructor Arguments:");
  console.log("  USDC Address:", usdcAddress);
  console.log("  Referral Wallet:", referralWallet);
  console.log("  Staking Rewards Wallet:", stakingRewardsWallet);
  console.log("  Active Users Wallet:", activeUsersWallet);
  console.log("  Initial Pools Count:", initialPools.length);
  
  console.log("  Initial Pools:");
  initialPools.forEach((pool, index) => {
    console.log(`    ${index + 1}. ${pool.wallet} (weight: ${pool.weight})`);
  });
  
  console.log("\n⚠️  BscScan verify komutunu manuel olarak çalıştırın:");
  console.log("npx hardhat verify --network bscmainnet \\");
  console.log(`  ${w3mAddress} \\`);
  console.log(`  "${usdcAddress}" \\`);
  console.log(`  "${referralWallet}" \\`);
  console.log(`  "${stakingRewardsWallet}" \\`);
  console.log(`  "${activeUsersWallet}" \\`);
  console.log(`  '[${initialPools.map(p => `{"wallet":"${p.wallet}","weight":${p.weight}}`).join(",")}]'`);
  
  console.log("\n📝 Constructor arguments string for manual verification:");
  const constructorArgs = [
    usdcAddress,
    referralWallet,
    stakingRewardsWallet,
    activeUsersWallet,
    initialPools
  ];
  
  console.log("Constructor arguments array:");
  console.log(JSON.stringify(constructorArgs, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });