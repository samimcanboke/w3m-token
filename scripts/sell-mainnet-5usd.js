require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Yeni Web3Moon kontrat adresi
  const W3M_ADDRESS = "0xEee72Fe36c7c1b818D5356020c777964dC0221A8";
  
  // BSC Mainnet USDC adresi
  const USDC_ADDRESS = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
  
  console.log("🚀 BSC Mainnet'te W3M Token Satışı");
  console.log("💳 Satış yapan adres:", deployer.address);
  console.log("📍 W3M Kontrat:", W3M_ADDRESS);
  console.log("💵 USDC Kontrat:", USDC_ADDRESS);
  
  // Kontratları bağla
  const w3m = await ethers.getContractAt("Web3Moon", W3M_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  // Mevcut bakiyeler
  console.log("\n📊 Satış öncesi bakiyeler:");
  const usdcBefore = await usdc.balanceOf(deployer.address);
  const w3mBefore = await w3m.balanceOf(deployer.address);
  console.log("   USDC:", ethers.utils.formatUnits(usdcBefore, 18));
  console.log("   W3M:", ethers.utils.formatUnits(w3mBefore, 18));
  
  // Mevcut fiyat
  const currentPrice = await w3m.getCurrentPrice();
  console.log("\n💹 Mevcut fiyat:", ethers.utils.formatUnits(currentPrice, 18), "USDC/W3M");
  
  // 5 USD değerinde kaç W3M satmamız gerektiğini hesapla
  // Satışta %92 geri alacağız, bu yüzden 5 USD almak için daha fazla satmalıyız
  // Gerçek değer = 5 / 0.92 = ~5.43 USD değerinde token satmalıyız
  const targetUsdcAmount = ethers.utils.parseUnits("5", 18); // 5 USDC almak istiyoruz
  const requiredValue = targetUsdcAmount.mul(100).div(92); // %92 geri alacağımız için
  
  // Kaç W3M token satmamız gerektiğini hesapla
  const tokensToSell = requiredValue.mul(ethers.utils.parseUnits("1", 18)).div(currentPrice);
  
  console.log("\n💰 Satış detayları:");
  console.log("   Hedef USDC:", ethers.utils.formatUnits(targetUsdcAmount, 18), "USDC");
  console.log("   Satılacak W3M:", ethers.utils.formatUnits(tokensToSell, 18), "W3M");
  console.log("   Token değeri:", ethers.utils.formatUnits(requiredValue, 18), "USDC");
  console.log("   Alınacak USDC (92%):", ethers.utils.formatUnits(targetUsdcAmount, 18), "USDC");
  
  // Yeterli W3M var mı kontrol et
  if (w3mBefore.lt(tokensToSell)) {
    console.error("\n❌ Yetersiz W3M bakiyesi!");
    console.log("   Gerekli:", ethers.utils.formatUnits(tokensToSell, 18), "W3M");
    console.log("   Mevcut:", ethers.utils.formatUnits(w3mBefore, 18), "W3M");
    return;
  }
  
  // Satış yap
  console.log("\n🏪 W3M satışı yapılıyor...");
  try {
    const sellTx = await w3m.sellForUSDC(tokensToSell);
    console.log("   Tx hash:", sellTx.hash);
    console.log("⏳ İşlem onaylanıyor...");
    const receipt = await sellTx.wait();
    console.log("✅ Satış başarılı! Gas kullanımı:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Satış hatası:", error.message);
    return;
  }
  
  // Satış sonrası bakiyeler
  console.log("\n📊 Satış sonrası bakiyeler:");
  const usdcAfter = await usdc.balanceOf(deployer.address);
  const w3mAfter = await w3m.balanceOf(deployer.address);
  const priceAfter = await w3m.getCurrentPrice();
  
  console.log("   USDC:", ethers.utils.formatUnits(usdcAfter, 18));
  console.log("   W3M:", ethers.utils.formatUnits(w3mAfter, 18));
  console.log("   Yeni fiyat:", ethers.utils.formatUnits(priceAfter, 18), "USDC/W3M");
  
  const usdcReceived = usdcAfter.sub(usdcBefore);
  const w3mSold = w3mBefore.sub(w3mAfter);
  
  console.log("\n💎 İşlem özeti:");
  console.log("   Satılan W3M:", ethers.utils.formatUnits(w3mSold, 18));
  console.log("   Alınan USDC:", ethers.utils.formatUnits(usdcReceived, 18));
  console.log("   Fiyat değişimi:", priceAfter.eq(currentPrice) ? "Değişmedi ✅" : "Değişti ❌");
  
  // Kontrat durumu
  const totalSupply = await w3m.totalSupply();
  const totalUSDC = await w3m.totalUSDC();
  
  console.log("\n📊 Kontrat durumu:");
  console.log("   Toplam arz:", ethers.utils.formatUnits(totalSupply, 18), "W3M");
  console.log("   USDC havuzu:", ethers.utils.formatUnits(totalUSDC, 18), "USDC");
  
  // Token dağılımları
  console.log("\n👥 Satıştan token dağılımları:");
  console.log("   Marketing: ~%2 (referral wallet)");
  console.log("   Active Users: ~%0.5");
  console.log("   Pools: ~%2.5");
  console.log("   Yakılan: ~%95 (USDC için %92 + likidite için %3)");
  
  console.log("\n🎉 İşlem tamamlandı!");
  console.log("🔗 BscScan:", `https://bscscan.com/tx/${sellTx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });