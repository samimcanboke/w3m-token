require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 BSCSCAN MANUEL VERIFICATION BİLGİLERİ");
  console.log("=========================================");
  
  // Deployment bilgilerini yükle
  const deploymentPath = path.join(__dirname, "..", "fresh-deployment-mainnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log("📍 CONTRACT ADRESİ:");
  console.log(deployment.contracts.web3moon);
  
  console.log("\n🔗 BSCSCAN LINK:");
  console.log(`https://bscscan.com/address/${deployment.contracts.web3moon}#code`);
  
  console.log("\n📋 VERIFICATION AYARLARI:");
  console.log("- Compiler Type: Solidity (Single file)");
  console.log("- Compiler Version: v0.8.28+commit.7893614a");
  console.log("- Open Source License Type: MIT");
  
  console.log("\n📄 KAYNAK KOD DOSYASI:");
  console.log("Fresh-Web3Moon-flattened.sol");
  
  console.log("\n⚙️  COMPILER AYARLARI:");
  console.log("- Optimization: Yes");
  console.log("- Runs: 200");
  console.log("- EVM Version: default (paris)");
  
  console.log("\n🔧 CONSTRUCTOR ARGUMENTS (ABI-encoded):");
  
  // Constructor arguments
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
  
  console.log("\n📝 CONSTRUCTOR PARAMETRELER (readable):");
  console.log(`_usdc: ${constructorArgs[0]}`);
  console.log(`_referralWallet: ${constructorArgs[1]}`);
  console.log(`_stakingRewardsWallet: ${constructorArgs[2]}`);
  console.log(`_activeUsersWallet: ${constructorArgs[3]}`);
  console.log(`_initialPools:`);
  constructorArgs[4].forEach((pool, index) => {
    console.log(`  [${index}] wallet: ${pool.wallet}, weight: ${pool.weight}`);
  });
  
  console.log("\n📋 ADIM ADIM VERIFICATION:");
  console.log("1. BscScan sayfasını aç:");
  console.log(`   https://bscscan.com/address/${deployment.contracts.web3moon}#code`);
  console.log("2. 'Verify and Publish' butonuna tıkla");
  console.log("3. Yukarıdaki ayarları gir");
  console.log("4. Fresh-Web3Moon-flattened.sol dosyasının içeriğini kopyala");
  console.log("5. Constructor Arguments kısmını boş bırak (manuel encode)");
  console.log("6. Verify butonuna bas");
  
  console.log("\n🎯 VERIFICATION BAŞARILI OLACAK!");
  console.log("Contract adresi:", deployment.contracts.web3moon);
  
  // Flattened file path
  const flattenedPath = path.join(__dirname, "..", "Fresh-Web3Moon-flattened.sol");
  if (fs.existsSync(flattenedPath)) {
    console.log("\n✅ Flattened file hazır:", flattenedPath);
  } else {
    console.log("\n❌ Flattened file bulunamadı! Önce flatten yapın.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error);
    process.exit(1);
  });