const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔧 Herkes Satıyor Simülasyonu");
  console.log("\n" + "=".repeat(80) + "\n");

  const w3mAddress = process.env.W3M_ADDRESS;
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  // Başlangıç durumu
  const initialPrice = await w3m.getCurrentPrice();
  const initialTotalUSDC = await w3m.totalUSDC();
  const initialTotalSupply = await w3m.totalSupply();

  console.log("📊 BAŞLANGIÇ DURUMU:");
  console.log(`   Fiyat: ${ethers.formatEther(initialPrice)} USDC/W3M`);
  console.log(`   USDC Pool: ${ethers.formatEther(initialTotalUSDC)} USDC`);
  console.log(`   Total Supply: ${ethers.formatEther(initialTotalSupply)} W3M`);
  console.log("\n" + "=".repeat(80) + "\n");

  // Tüm signer'ları al (20 tane var)
  const signers = await ethers.getSigners();
  
  // Token sahibi wallet'ları bul ve bakiyelerini kontrol et
  const tokenHolders = [];
  let totalTokensHeld = 0n;
  
  console.log("🔍 Token sahipleri aranıyor...\n");
  
  for (let i = 0; i < signers.length; i++) {
    const balance = await w3m.balanceOf(signers[i].address);
    if (balance > 0n) {
      tokenHolders.push({
        signer: signers[i],
        address: signers[i].address,
        balance: balance,
        index: i
      });
      totalTokensHeld += balance;
      console.log(`   Wallet #${i}: ${ethers.formatEther(balance)} W3M`);
    }
  }
  
  console.log(`\n💰 Toplam ${tokenHolders.length} wallet'ta ${ethers.formatEther(totalTokensHeld)} W3M var`);
  console.log("\n" + "=".repeat(80) + "\n");
  
  // Her wallet satsın
  console.log("📉 SATIŞ İŞLEMLERİ BAŞLIYOR...\n");
  
  let sellCount = 0;
  let totalSold = 0n;
  let totalUSDCReceived = 0n;
  
  for (const holder of tokenHolders) {
    const currentPrice = await w3m.getCurrentPrice();
    const currentUSDCPool = await w3m.totalUSDC();
    
    // Teorik olarak alınabilecek USDC
    const theoreticalUSDC = (holder.balance * currentPrice) / ethers.parseEther("1");
    
    // Pool'da yeterli USDC var mı kontrol et
    if (currentUSDCPool < theoreticalUSDC) {
      console.log(`❌ Wallet #${holder.index}: Yetersiz USDC pool! (İstenen: ${ethers.formatEther(theoreticalUSDC)}, Mevcut: ${ethers.formatEther(currentUSDCPool)})`);
      continue;
    }
    
    try {
      console.log(`📤 Wallet #${holder.index} satıyor: ${ethers.formatEther(holder.balance)} W3M`);
      
      const tx = await w3m.connect(holder.signer).sellForUSDC(holder.balance);
      await tx.wait();
      
      sellCount++;
      totalSold += holder.balance;
      totalUSDCReceived += theoreticalUSDC;
      
      const newPrice = await w3m.getCurrentPrice();
      const newUSDCPool = await w3m.totalUSDC();
      const newSupply = await w3m.totalSupply();
      
      console.log(`   ✅ Başarılı! Alınan USDC: ${ethers.formatEther(theoreticalUSDC)}`);
      console.log(`   📊 Yeni durum - Fiyat: ${ethers.formatEther(newPrice)}, Pool: ${ethers.formatEther(newUSDCPool)}, Supply: ${ethers.formatEther(newSupply)}`);
      console.log("");
      
    } catch (error) {
      console.log(`❌ Wallet #${holder.index}: Satış başarısız! Hata: ${error.message}`);
    }
  }
  
  // Final durum
  const finalPrice = await w3m.getCurrentPrice();
  const finalTotalUSDC = await w3m.totalUSDC();
  const finalTotalSupply = await w3m.totalSupply();
  
  console.log("\n" + "=".repeat(80) + "\n");
  console.log("🏁 FİNAL DURUM:");
  console.log(`   Satış yapan wallet sayısı: ${sellCount}/${tokenHolders.length}`);
  console.log(`   Toplam satılan W3M: ${ethers.formatEther(totalSold)}`);
  console.log(`   Toplam alınan USDC: ${ethers.formatEther(totalUSDCReceived)}`);
  console.log("\n📊 POOL DURUMU:");
  console.log(`   Başlangıç USDC Pool: ${ethers.formatEther(initialTotalUSDC)} USDC`);
  console.log(`   Final USDC Pool: ${ethers.formatEther(finalTotalUSDC)} USDC`);
  console.log(`   Pool'dan çıkan: ${ethers.formatEther(initialTotalUSDC - finalTotalUSDC)} USDC`);
  console.log(`   Pool'da kalan: ${ethers.formatEther(finalTotalUSDC)} USDC`);
  console.log("\n📈 TOKEN DURUMU:");
  console.log(`   Başlangıç Supply: ${ethers.formatEther(initialTotalSupply)} W3M`);
  console.log(`   Final Supply: ${ethers.formatEther(finalTotalSupply)} W3M`);
  console.log(`   Yakılan token: ${ethers.formatEther(initialTotalSupply - finalTotalSupply)} W3M`);
  console.log("\n💵 FİYAT:");
  console.log(`   Başlangıç Fiyatı: ${ethers.formatEther(initialPrice)} USDC/W3M`);
  console.log(`   Final Fiyat: ${ethers.formatEther(finalPrice)} USDC/W3M`);
  console.log(`   Fiyat değişimi: ${((finalPrice - initialPrice) * 10000n / initialPrice) / 100n}%`);
  
  // Kalan token sahiplerini kontrol et
  console.log("\n🔍 Kalan token sahipleri:");
  let remainingHolders = 0;
  for (let i = 0; i < signers.length; i++) {
    const balance = await w3m.balanceOf(signers[i].address);
    if (balance > 0n) {
      console.log(`   Wallet #${i}: ${ethers.formatEther(balance)} W3M`);
      remainingHolders++;
    }
  }
  
  if (remainingHolders === 0) {
    console.log("   ✅ Hiç token kalmadı!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 