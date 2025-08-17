require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 FRESH CONTRACT VERIFICATION");
  console.log("==============================");
  
  // Deployment bilgilerini yükle
  const deploymentPath = path.join(__dirname, "..", "fresh-deployment-mainnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const contractAddress = deployment.contracts.web3moon;
  console.log("📍 Contract Address:", contractAddress);
  console.log("📍 Transaction:", deployment.deploymentDetails.transactionHash);
  console.log("📍 Block:", deployment.deploymentDetails.blockNumber);
  
  // Constructor arguments'ları hazırla
  const constructorArgs = [
    deployment.externalContracts.realUSDC,           // _usdc
    deployment.wallets.referral,                     // _referralWallet
    deployment.wallets.stakingRewards,               // _stakingRewardsWallet  
    deployment.wallets.activeUsers,                  // _activeUsersWallet
    [
      { wallet: deployment.wallets.pools.sunPool, weight: 83 },
      { wallet: deployment.wallets.pools.mercuryPool, weight: 83 },
      { wallet: deployment.wallets.pools.marsPool, weight: 110 },
      { wallet: deployment.wallets.pools.earthPool, weight: 138 },
      { wallet: deployment.wallets.pools.neptunePool, weight: 138 },
      { wallet: deployment.wallets.pools.saturnPool, weight: 199 },
      { wallet: deployment.wallets.pools.jupiterPool, weight: 249 }
    ]                                                // _initialPools
  ];
  
  console.log("\n📋 CONSTRUCTOR ARGUMENTS:");
  console.log("USDC:", constructorArgs[0]);
  console.log("Referral:", constructorArgs[1]);
  console.log("Staking Rewards:", constructorArgs[2]);
  console.log("Active Users:", constructorArgs[3]);
  console.log("Initial Pools:", JSON.stringify(constructorArgs[4], null, 2));
  
  // Hardhat verify komutunu oluştur
  const verifyCommand = [
    "npx hardhat verify",
    `--network bscmainnet`,
    `"${contractAddress}"`,
    `"${constructorArgs[0]}"`,
    `"${constructorArgs[1]}"`,
    `"${constructorArgs[2]}"`,
    `"${constructorArgs[3]}"`,
    `'${JSON.stringify(constructorArgs[4])}'`
  ].join(" ");
  
  console.log("\n🔨 HARDHAT VERIFY KOMUTU:");
  console.log(verifyCommand);
  
  // Verification bilgilerini kaydet
  const verifyInfo = {
    contractAddress: contractAddress,
    network: "bscmainnet",
    constructorArgs: constructorArgs,
    verifyCommand: verifyCommand,
    timestamp: new Date().toISOString()
  };
  
  const verifyPath = path.join(__dirname, "..", "fresh-verification-info.json");
  fs.writeFileSync(verifyPath, JSON.stringify(verifyInfo, null, 2));
  console.log(`\n📁 Verification bilgileri kaydedildi: ${verifyPath}`);
  
  console.log("\n✅ VERIFICATION HAZIR!");
  console.log("Şimdi yukarıdaki komutu çalıştırabilirsin.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error);
    process.exit(1);
  });