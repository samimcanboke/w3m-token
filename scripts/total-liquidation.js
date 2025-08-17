require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔥 TOTAL LIQUIDATION: Herkesin W3M tokenlarını sattırma ve ana cüzdana gönderme");
  
  // Contract ve wallet bilgilerini yükle
  const addressesPath = path.join(__dirname, "..", "deployment-addresses-mainnet.json");
  const walletsPath = path.join(__dirname, "..", "deployment-wallets.json");
  
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  const contractAddress = addresses.web3moon;
  const deployerAddress = addresses.deployer;
  
  console.log("📍 Contract Address:", contractAddress);
  console.log("📍 Deployer Address:", deployerAddress);
  
  // Ana deployer signer'ı oluştur
  const deployerSigner = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  
  // Contract instance
  const W3M = await ethers.getContractFactory("Web3Moon");
  const w3m = W3M.attach(contractAddress);
  
  console.log("\n🔍 W3M Token Bakiyelerini Kontrol Ediliyor...\n");
  
  const walletsWithTokens = [];
  
  // Tüm wallet'ları tara
  for (let wallet of wallets) {
    try {
      const balance = await w3m.balanceOf(wallet.address);
      const balanceFormatted = ethers.utils.formatEther(balance);
      
      if (balance.gt(0)) {
        console.log(`💰 ${wallet.name}: ${balanceFormatted} W3M`);
        walletsWithTokens.push({
          ...wallet,
          balance: balance,
          balanceFormatted: balanceFormatted
        });
      } else {
        console.log(`❌ ${wallet.name}: 0 W3M`);
      }
    } catch (error) {
      console.log(`⚠️  ${wallet.name}: Error - ${error.message}`);
    }
  }
  
  if (walletsWithTokens.length === 0) {
    console.log("\n🎉 Hiçbir wallet'ta W3M token yok! Temiz durum.");
    return;
  }
  
  console.log(`\n🎯 Toplamda ${walletsWithTokens.length} wallet'ta W3M token var.`);
  console.log("\n🔥 LIQUIDATION İşlemleri Başlıyor...\n");
  
  // Her wallet için satış yap
  for (let walletInfo of walletsWithTokens) {
    try {
      console.log(`\n🔄 ${walletInfo.name} (${walletInfo.balanceFormatted} W3M) işleniyor...`);
      
      // Wallet signer oluştur
      const walletSigner = new ethers.Wallet(walletInfo.privateKey, ethers.provider);
      const w3mWithSigner = w3m.connect(walletSigner);
      
      // Önce current price'ı al
      const currentPrice = await w3m.getCurrentPrice();
      console.log(`📊 Current Price: ${ethers.utils.formatUnits(currentPrice, 6)} USDC per W3M`);
      
      // Sell işlemi yap
      const sellTx = await w3mWithSigner.sellForUSDC(walletInfo.balance);
      console.log(`🔄 Sell TX gönderildi: ${sellTx.hash}`);
      
      const receipt = await sellTx.wait();
      console.log(`✅ ${walletInfo.name}: ${walletInfo.balanceFormatted} W3M satıldı!`);
      
      // Event'leri parse et
      for (let log of receipt.logs) {
        try {
          const parsedLog = w3m.interface.parseLog(log);
          if (parsedLog.name === 'TokensSold') {
            const usdcReceived = ethers.utils.formatUnits(parsedLog.args.usdcReceived, 6);
            console.log(`💵 Alınan USDC: ${usdcReceived}`);
          }
        } catch (e) {
          // Log parse edilemezse geç
        }
      }
      
    } catch (error) {
      console.log(`❌ ${walletInfo.name} için satış hatası: ${error.message}`);
      
      // Eğer satış başarısızsa, tokenları deployer'a transfer et
      try {
        console.log(`🔄 ${walletInfo.name}: Transfer yöntemi deneniyor...`);
        const walletSigner = new ethers.Wallet(walletInfo.privateKey, ethers.provider);
        const w3mWithSigner = w3m.connect(walletSigner);
        
        const transferTx = await w3mWithSigner.transfer(deployerAddress, walletInfo.balance);
        console.log(`🔄 Transfer TX: ${transferTx.hash}`);
        
        await transferTx.wait();
        console.log(`✅ ${walletInfo.name}: ${walletInfo.balanceFormatted} W3M deployer'a transfer edildi!`);
        
      } catch (transferError) {
        console.log(`❌ ${walletInfo.name} için transfer de başarısız: ${transferError.message}`);
      }
    }
    
    // İşlemler arası kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n🎉 TOTAL LIQUIDATION TAMAMLANDI!");
  
  // Final durum kontrolü
  console.log("\n📊 FINAL DURUM KONTROLÜ:\n");
  
  for (let wallet of wallets) {
    try {
      const balance = await w3m.balanceOf(wallet.address);
      const balanceFormatted = ethers.utils.formatEther(balance);
      
      if (balance.gt(0)) {
        console.log(`⚠️  ${wallet.name}: ${balanceFormatted} W3M (hala var!)`);
      } else {
        console.log(`✅ ${wallet.name}: 0 W3M`);
      }
    } catch (error) {
      console.log(`⚠️  ${wallet.name}: Error - ${error.message}`);
    }
  }
  
  // Deployer'ın final durumu
  const deployerBalance = await w3m.balanceOf(deployerAddress);
  const deployerBalanceFormatted = ethers.utils.formatEther(deployerBalance);
  console.log(`\n👑 DEPLOYER FINAL: ${deployerBalanceFormatted} W3M`);
  
  // Contract bilgileri
  const totalSupply = await w3m.totalSupply();
  const totalUSDC = await w3m.totalUSDC();
  console.log(`\n📈 CONTRACT DURUMU:`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} W3M`);
  console.log(`   Total USDC: ${ethers.utils.formatUnits(totalUSDC, 6)} USDC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });