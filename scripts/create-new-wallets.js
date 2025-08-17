require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎯 YENİ WALLETLAR OLUŞTURULUYOR...");
  
  // Mevcut deployer bilgisini al
  const deployerAddress = process.env.DEPLOYER_ADDRESS || "0x337557ACD5680B2ECD6B3fBbFE0A2E231CD8598A";
  
  // Yeni oluşturulacak walletlar ve weightleri
  const walletsToCreate = [
    { name: "referral", weight: null },
    { name: "activeUsers", weight: null },
    { name: "stakingRewards", weight: null },
    { name: "sunPool", weight: 83 },
    { name: "mercuryPool", weight: 83 },
    { name: "marsPool", weight: 110 },
    { name: "earthPool", weight: 138 },
    { name: "neptunePool", weight: 138 },
    { name: "saturnPool", weight: 199 },
    { name: "jupiterPool", weight: 249 }
  ];
  
  const newWallets = [];
  
  console.log(`\n🔐 ${walletsToCreate.length} ADET YENİ WALLET OLUŞTURULUYOR:\n`);
  
  for (let i = 0; i < walletsToCreate.length; i++) {
    const walletInfo = walletsToCreate[i];
    
    // Yeni wallet oluştur
    const wallet = ethers.Wallet.createRandom();
    
    const newWallet = {
      name: walletInfo.name,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
      weight: walletInfo.weight
    };
    
    newWallets.push(newWallet);
    
    console.log(`✅ ${walletInfo.name}:`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    console.log(`   Mnemonic: ${wallet.mnemonic.phrase}`);
    if (walletInfo.weight) {
      console.log(`   Weight: ${walletInfo.weight}`);
    }
    console.log("");
  }
  
  // Walletları dosyaya kaydet
  const walletsPath = path.join(__dirname, "..", "new-deployment-wallets.json");
  fs.writeFileSync(walletsPath, JSON.stringify(newWallets, null, 2));
  console.log(`📁 Walletlar kaydedildi: ${walletsPath}`);
  
  // Private keyleri ayrı bir güvenli dosyaya da kaydet
  const privateKeysPath = path.join(__dirname, "..", "PRIVATE-KEYS-BACKUP.json");
  const privateKeysBackup = {
    created_at: new Date().toISOString(),
    deployer: {
      address: deployerAddress,
      privateKey: process.env.PRIVATE_KEY,
      note: "Ana deployer wallet - .env dosyasından"
    },
    wallets: newWallets.map(w => ({
      name: w.name,
      address: w.address,
      privateKey: w.privateKey,
      mnemonic: w.mnemonic
    }))
  };
  
  fs.writeFileSync(privateKeysPath, JSON.stringify(privateKeysBackup, null, 2));
  console.log(`🔐 Private key backup kaydedildi: ${privateKeysPath}`);
  
  console.log("\n🎉 WALLET OLUŞTURMA TAMAMLANDI!");
  console.log("\n⚠️  GÜVENLİK UYARISI:");
  console.log("- PRIVATE-KEYS-BACKUP.json dosyasını güvenli bir yerde sakla!");
  console.log("- Bu dosyayı asla git'e commit etme!");
  console.log("- Bu keylere sadece sen erişebilmelisin!");
  
  // Özet bilgi
  console.log("\n📊 ÖZET:");
  console.log(`✅ ${newWallets.length} yeni wallet oluşturuldu`);
  console.log(`✅ Deployer wallet korundu: ${deployerAddress}`);
  console.log(`✅ Tüm private keyler backup'landı`);
  
  return newWallets;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error);
    process.exit(1);
  });