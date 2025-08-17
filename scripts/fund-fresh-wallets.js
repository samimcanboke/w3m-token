require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 FRESH WALLETLARA BNB GÖNDERİMİ");
  console.log("==================================");
  
  // Yeni walletları yükle
  const walletsPath = path.join(__dirname, "..", "new-deployment-wallets.json");
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  // Deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer:", deployer.address);
  
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer BNB Balance:", ethers.utils.formatEther(deployerBalance), "BNB");
  
  // Her wallet'a gönderilecek miktar
  const sendAmount = ethers.utils.parseEther("0.01"); // 0.01 BNB
  console.log("💸 Her wallet'a gönderilecek:", ethers.utils.formatEther(sendAmount), "BNB");
  
  // Total needed calculation
  const totalNeeded = sendAmount.mul(wallets.length);
  console.log("🧮 Toplam gerekli:", ethers.utils.formatEther(totalNeeded), "BNB");
  
  if (deployerBalance.lt(totalNeeded.add(ethers.utils.parseEther("0.01")))) { // +0.01 for gas
    console.log("❌ Yetersiz BNB bakiyesi!");
    return;
  }
  
  console.log(`\n🚀 ${wallets.length} WALLET'A BNB GÖNDERİMİ BAŞLIYOR...\n`);
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    
    try {
      // Mevcut bakiyeyi kontrol et
      const currentBalance = await ethers.provider.getBalance(wallet.address);
      console.log(`🔍 ${wallet.name}: Mevcut ${ethers.utils.formatEther(currentBalance)} BNB`);
      
      // Eğer zaten yeterli BNB varsa skip et
      if (currentBalance.gte(sendAmount)) {
        console.log(`✅ ${wallet.name}: Yeterli BNB var, skip edildi.`);
        continue;
      }
      
      // BNB gönder
      const tx = await deployer.sendTransaction({
        to: wallet.address,
        value: sendAmount,
        gasLimit: 21000
      });
      
      console.log(`🔄 ${wallet.name}: BNB gönderiliyor... TX: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ ${wallet.name}: 0.01 BNB gönderildi!`);
      
    } catch (error) {
      console.log(`❌ ${wallet.name}: Hata - ${error.message}`);
    }
  }
  
  console.log("\n🎉 BNB gönderme işlemi tamamlandı!");
  
  // Final balances
  console.log("\n📊 FINAL BNB BAKİYELERİ:");
  const finalDeployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`👑 Deployer: ${ethers.utils.formatEther(finalDeployerBalance)} BNB`);
  
  for (let wallet of wallets) {
    const balance = await ethers.provider.getBalance(wallet.address);
    console.log(`💰 ${wallet.name}: ${ethers.utils.formatEther(balance)} BNB`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });