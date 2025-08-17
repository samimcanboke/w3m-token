require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Yeni Web3Moon kontrat adresi
  const W3M_ADDRESS = "0xEee72Fe36c7c1b818D5356020c777964dC0221A8";
  
  // BSC Mainnet USDC adresi
  const USDC_ADDRESS = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
  
  console.log("🚀 BSC Mainnet'te W3M Token Alımı");
  console.log("💳 Alım yapan adres:", deployer.address);
  console.log("📍 W3M Kontrat:", W3M_ADDRESS);
  console.log("💵 USDC Kontrat:", USDC_ADDRESS);
  
  // Kontratları bağla
  const w3m = await ethers.getContractAt("Web3Moon", W3M_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  // 10 USDC (USDC 18 decimals on BSC)
  const buyAmount = ethers.utils.parseUnits("10", 18);
  
  // Mevcut USDC bakiyesini kontrol et
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log("\n💰 Mevcut USDC bakiyesi:", ethers.utils.formatUnits(usdcBalance, 18), "USDC");
  
  if (usdcBalance < buyAmount) {
    console.error("❌ Yetersiz USDC bakiyesi!");
    console.log("   Gerekli:", ethers.utils.formatUnits(buyAmount, 18), "USDC");
    console.log("   Mevcut:", ethers.utils.formatUnits(usdcBalance, 18), "USDC");
    return;
  }
  
  // Allowance kontrol et
  const currentAllowance = await usdc.allowance(deployer.address, W3M_ADDRESS);
  console.log("🔍 Mevcut allowance:", ethers.utils.formatUnits(currentAllowance, 18), "USDC");
  
  if (currentAllowance < buyAmount) {
    console.log("\n🔄 USDC approve işlemi yapılıyor...");
    const approveTx = await usdc.approve(W3M_ADDRESS, buyAmount);
    console.log("   Tx hash:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ USDC approved!");
  }
  
  // Alım öncesi bakiyeler
  console.log("\n📊 Alım öncesi bakiyeler:");
  const usdcBefore = await usdc.balanceOf(deployer.address);
  const w3mBefore = await w3m.balanceOf(deployer.address);
  console.log("   USDC:", ethers.utils.formatUnits(usdcBefore, 18));
  console.log("   W3M:", ethers.utils.formatUnits(w3mBefore, 18));
  
  // Mevcut fiyat
  const priceBefore = await w3m.getCurrentPrice();
  console.log("   Fiyat:", ethers.utils.formatUnits(priceBefore, 18), "USDC/W3M");
  
  // Alım yap
  console.log("\n🛒 10 USDC ile W3M satın alınıyor...");
  try {
    const buyTx = await w3m.buyWithUSDC(buyAmount);
    console.log("   Tx hash:", buyTx.hash);
    console.log("⏳ İşlem onaylanıyor...");
    const receipt = await buyTx.wait();
    console.log("✅ Alım başarılı! Gas kullanımı:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Alım hatası:", error.message);
    return;
  }
  
  // Alım sonrası bakiyeler
  console.log("\n📊 Alım sonrası bakiyeler:");
  const usdcAfter = await usdc.balanceOf(deployer.address);
  const w3mAfter = await w3m.balanceOf(deployer.address);
  const priceAfter = await w3m.getCurrentPrice();
  
  console.log("   USDC:", ethers.utils.formatUnits(usdcAfter, 18));
  console.log("   W3M:", ethers.utils.formatUnits(w3mAfter, 18));
  console.log("   Yeni fiyat:", ethers.utils.formatUnits(priceAfter, 18), "USDC/W3M");
  
  const w3mReceived = w3mAfter.sub(w3mBefore);
  console.log("\n💎 Alınan W3M miktarı:", ethers.utils.formatUnits(w3mReceived, 18));
  console.log("📈 Fiyat değişimi: %", ((Number(priceAfter) - Number(priceBefore)) / Number(priceBefore) * 100).toFixed(6));
  
  // Kontrat durumu
  const totalSupply = await w3m.totalSupply();
  const totalUSDC = await w3m.totalUSDC();
  
  console.log("\n📊 Kontrat durumu:");
  console.log("   Toplam arz:", ethers.utils.formatUnits(totalSupply, 18), "W3M");
  console.log("   USDC havuzu:", ethers.utils.formatUnits(totalUSDC, 18), "USDC");
  
  // Diğer cüzdanların bakiyeleri
  console.log("\n👥 Sistem cüzdanları:");
  const referralBalance = await w3m.balanceOf(await w3m.referralWallet());
  const stakingBalance = await w3m.balanceOf(await w3m.stakingRewardsWallet());
  const activeUsersBalance = await w3m.balanceOf(await w3m.activeUsersWallet());
  
  console.log("   Referral:", ethers.utils.formatUnits(referralBalance, 18), "W3M");
  console.log("   Staking:", ethers.utils.formatUnits(stakingBalance, 18), "W3M");
  console.log("   Active Users:", ethers.utils.formatUnits(activeUsersBalance, 18), "W3M");
  
  console.log("\n🎉 İşlem tamamlandı!");
  console.log("🔗 BscScan:", `https://bscscan.com/address/${W3M_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });