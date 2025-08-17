require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 BNB Wallet'lara Gönderiliyor...");
  
  // Wallet bilgilerini yükle
  const walletsPath = path.join(__dirname, "..", "deployment-wallets.json");
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  // Ana deployer signer'ı oluştur
  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Deployer Address:", deployer.address);
  console.log("💰 Deployer Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
  
  const bnbAmount = ethers.utils.parseEther("0.01"); // Her wallet'a 0.01 BNB
  
  console.log(`\n🔄 Her wallet'a ${ethers.utils.formatEther(bnbAmount)} BNB gönderiliyor...\n`);
  
  for (let wallet of wallets) {
    try {
      // Wallet'ın mevcut BNB bakiyesini kontrol et
      const currentBalance = await ethers.provider.getBalance(wallet.address);
      const currentBalanceFormatted = ethers.utils.formatEther(currentBalance);
      
      console.log(`🔍 ${wallet.name}: Mevcut ${currentBalanceFormatted} BNB`);
      
      if (currentBalance.lt(ethers.utils.parseEther("0.005"))) {
        // Eğer 0.005 BNB'den azsa, BNB gönder
        const tx = await deployer.sendTransaction({
          to: wallet.address,
          value: bnbAmount
        });
        
        console.log(`🔄 ${wallet.name}: BNB gönderiliyor... TX: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ ${wallet.name}: ${ethers.utils.formatEther(bnbAmount)} BNB gönderildi!`);
      } else {
        console.log(`✅ ${wallet.name}: Yeterli BNB var, atlanıyor.`);
      }
      
    } catch (error) {
      console.log(`❌ ${wallet.name}: BNB gönderme hatası - ${error.message}`);
    }
    
    // İşlemler arası kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n🎉 BNB gönderme işlemi tamamlandı!");
  
  // Final bakiye kontrolü
  console.log("\n📊 FINAL BNB BAKİYELERİ:\n");
  
  for (let wallet of wallets) {
    try {
      const balance = await ethers.provider.getBalance(wallet.address);
      const balanceFormatted = ethers.utils.formatEther(balance);
      console.log(`💰 ${wallet.name}: ${balanceFormatted} BNB`);
    } catch (error) {
      console.log(`⚠️  ${wallet.name}: Error - ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });