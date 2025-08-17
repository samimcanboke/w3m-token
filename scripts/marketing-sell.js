const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners(); // Marketing wallet deployer ile aynı
  
  console.log("🔧 Marketing Wallet Satış İşlemi");
  console.log("💰 Marketing Wallet:", deployer.address);
  console.log("\n" + "=".repeat(80) + "\n");

  const w3mAddress = process.env.W3M_ADDRESS;
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  // Marketing wallet bakiyesi
  const marketingBalance = await w3m.balanceOf(deployer.address);
  console.log(`📊 Marketing Wallet W3M Bakiyesi: ${ethers.formatEther(marketingBalance)}`);
  
  if (marketingBalance == 0n) {
    console.log("❌ Marketing wallet'ta W3M token yok!");
    return;
  }

  // Mevcut fiyat ve pool durumu
  const currentPrice = await w3m.getCurrentPrice();
  const totalUSDC = await w3m.totalUSDC();
  const totalSupply = await w3m.totalSupply();
  
  console.log(`💵 Mevcut Fiyat: ${ethers.formatEther(currentPrice)} USDC/W3M`);
  console.log(`🏊 USDC Pool: ${ethers.formatEther(totalUSDC)} USDC`);
  console.log(`📈 Total Supply: ${ethers.formatEther(totalSupply)} W3M`);
  
  // Marketing wallet'ın %50'sini sat
  const sellPercentage = 0.5; // %50
  const sellAmount = (marketingBalance * BigInt(Math.floor(sellPercentage * 1000))) / 1000n;
  
  console.log(`\n📉 Satılacak Miktar: ${ethers.formatEther(sellAmount)} W3M (%${sellPercentage * 100})`);
  
  // Tahmini USDC miktarı
  const estimatedUSDC = (sellAmount * currentPrice) / ethers.parseEther("1");
  console.log(`💰 Tahmini USDC Geliri: ${ethers.formatEther(estimatedUSDC)} USDC`);
  
  console.log("\n🔄 Satış işlemi başlatılıyor...");
  
  try {
    const tx = await w3m.connect(deployer).sellForUSDC(sellAmount);
    await tx.wait();
    console.log("✅ Satış başarılı!");
    
    // Yeni durumu göster
    const newPrice = await w3m.getCurrentPrice();
    const newTotalUSDC = await w3m.totalUSDC();
    const newTotalSupply = await w3m.totalSupply();
    const newMarketingBalance = await w3m.balanceOf(deployer.address);
    
    console.log("\n📊 YENİ DURUM:");
    console.log(`   Yeni Fiyat: ${ethers.formatEther(newPrice)} USDC/W3M`);
    console.log(`   Yeni USDC Pool: ${ethers.formatEther(newTotalUSDC)} USDC`);
    console.log(`   Yeni Total Supply: ${ethers.formatEther(newTotalSupply)} W3M`);
    console.log(`   Marketing Kalan W3M: ${ethers.formatEther(newMarketingBalance)}`);
    
    // USDC bakiyesi
    const usdcAddress = process.env.USDT_ADDRESS;
    const usdc = await ethers.getContractAt("IERC20", usdcAddress);
    const usdcBalance = await usdc.balanceOf(deployer.address);
    console.log(`   Marketing USDC Bakiyesi: ${ethers.formatEther(usdcBalance)} USDC`);
    
    // Fiyat değişimi
    const priceChange = ((newPrice - currentPrice) * 10000n / currentPrice) / 100n;
    console.log(`\n📊 Fiyat Değişimi: ${priceChange > 0 ? "+" : ""}${priceChange}%`);
    
  } catch (error) {
    console.error("❌ Satış hatası:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 