require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔥 DEPLOYER W3M TOKEN SATIŞ İŞLEMİ");
  
  // Contract bilgilerini yükle
  const addressesPath = path.join(__dirname, "..", "deployment-addresses-mainnet.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const contractAddress = addresses.web3moon;
  const deployerAddress = addresses.deployer;
  
  console.log("📍 Contract Address:", contractAddress);
  console.log("📍 Deployer Address:", deployerAddress);
  
  // Ana deployer signer'ı oluştur
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  
  console.log("💰 Deployer BNB Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
  
  // Contract instance
  const W3M = await ethers.getContractFactory("Web3Moon");
  const w3m = W3M.attach(contractAddress);
  const w3mWithSigner = w3m.connect(deployer);
  
  // Deployer'ın W3M bakiyesini kontrol et
  const deployerBalance = await w3m.balanceOf(deployerAddress);
  const deployerBalanceFormatted = ethers.utils.formatEther(deployerBalance);
  
  console.log(`\n💰 Deployer W3M Balance: ${deployerBalanceFormatted} W3M`);
  
  if (deployerBalance.eq(0)) {
    console.log("❌ Deployer'da satılacak W3M token yok!");
    return;
  }
  
  // Current price'ı al
  const currentPrice = await w3m.getCurrentPrice();
  console.log(`📊 Current Price: ${ethers.utils.formatUnits(currentPrice, 6)} USDC per W3M`);
  
  // Contract durumunu göster
  const totalSupply = await w3m.totalSupply();
  const totalUSDC = await w3m.totalUSDC();
  console.log(`\n📈 CURRENT CONTRACT DURUMU:`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} W3M`);
  console.log(`   Total USDC: ${ethers.utils.formatUnits(totalUSDC, 6)} USDC`);
  
  // Tahmini alınacak USDC hesapla
  const estimatedUSDC = deployerBalance.mul(currentPrice).div(ethers.utils.parseEther("1"));
  console.log(`\n💵 Tahmini Alınacak USDC: ${ethers.utils.formatUnits(estimatedUSDC, 6)} USDC`);
  
  console.log(`\n🔥 ${deployerBalanceFormatted} W3M SATIŞ İŞLEMİ BAŞLIYOR...\n`);
  
  try {
    // Sell işlemi yap
    const sellTx = await w3mWithSigner.sellForUSDC(deployerBalance);
    console.log(`🔄 Sell TX gönderildi: ${sellTx.hash}`);
    
    const receipt = await sellTx.wait();
    console.log(`✅ DEPLOYER: ${deployerBalanceFormatted} W3M başarıyla satıldı!`);
    
    // Event'leri parse et
    let usdcReceived = "0";
    for (let log of receipt.logs) {
      try {
        const parsedLog = w3m.interface.parseLog(log);
        if (parsedLog.name === 'TokensSold') {
          usdcReceived = ethers.utils.formatUnits(parsedLog.args.usdcReceived, 6);
          console.log(`💰 Gerçek Alınan USDC: ${usdcReceived} USDC`);
        }
      } catch (e) {
        // Log parse edilemezse geç
      }
    }
    
    // Final durum
    console.log(`\n🎉 SATIŞ TAMAMLANDI!`);
    
    // Final bakiyeleri kontrol et
    const finalW3MBalance = await w3m.balanceOf(deployerAddress);
    const finalTotalSupply = await w3m.totalSupply();
    const finalTotalUSDC = await w3m.totalUSDC();
    
    console.log(`\n📊 FINAL DURUM:`);
    console.log(`👑 Deployer W3M Balance: ${ethers.utils.formatEther(finalW3MBalance)} W3M`);
    console.log(`📈 Contract Total Supply: ${ethers.utils.formatEther(finalTotalSupply)} W3M`);
    console.log(`💵 Contract Total USDC: ${ethers.utils.formatUnits(finalTotalUSDC, 6)} USDC`);
    
    // USDC bakiyesini kontrol et
    const usdcToken = await ethers.getContractAt("IERC20", addresses.realUSDC);
    const deployerUSDCBalance = await usdcToken.balanceOf(deployerAddress);
    console.log(`💰 Deployer USDC Balance: ${ethers.utils.formatUnits(deployerUSDCBalance, 6)} USDC`);
    
  } catch (error) {
    console.log(`❌ Satış hatası: ${error.message}`);
    
    // Eğer satış hatası varsa, detayları yazdır
    if (error.reason) {
      console.log(`📝 Hata nedeni: ${error.reason}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });