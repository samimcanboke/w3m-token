require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer, ...accounts] = await ethers.getSigners();
  const W3M_ADDRESS = "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d";
  const USDT_ADDRESS = "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5";
  
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", W3M_ADDRESS);
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  // İstatistikler
  let priceHistory = [];
  let poolHistory = [];
  let firstBuyerBalances = { initial: 0, final: 0 };
  
  console.log("\n🚀 100 İşlem Simülasyonu Başlıyor!");
  console.log("================================================\n");
  
  // Başlangıç durumu
  const initialPrice = await w3m.getCurrentPrice();
  const initialPool = await w3m.totalUSDC();
  const initialSupply = await w3m.totalSupply();
  
  console.log("📊 Başlangıç Durumu:");
  console.log(`   Fiyat: ${ethers.formatUnits(initialPrice, 18)} USDC/W3M`);
  console.log(`   Pool: ${ethers.formatUnits(initialPool, 6)} USDC`);
  console.log(`   Supply: ${ethers.formatUnits(initialSupply, 18)} W3M`);
  
  // Test cüzdanlarına USDT dağıt
  console.log("\n💰 Cüzdanlara USDT dağıtılıyor...");
  for (let i = 0; i < Math.min(10, accounts.length); i++) {
    await usdt.mint(accounts[i].address, ethers.parseUnits("10000", 6));
  }
  
  // İlk alıcı için özel takip
  const firstBuyer = accounts[0];
  const firstBuyerInitialUSDT = await usdt.balanceOf(firstBuyer.address);
  
  console.log("\n🎯 İlk Alıcı:", firstBuyer.address);
  console.log(`   Başlangıç USDT: ${ethers.formatUnits(firstBuyerInitialUSDT, 6)}`);
  
  // 100 işlem simülasyonu
  console.log("\n📈 İşlemler Başlıyor...\n");
  
  for (let i = 0; i < 100; i++) {
    const trader = accounts[i % 10]; // 10 farklı cüzdan döngüsel kullan
    const isBuy = i % 2 === 0; // Alım-satım sırayla
    
    if (isBuy) {
      // ALIM İŞLEMİ
      const buyAmount = ethers.parseUnits((50 + Math.random() * 150).toFixed(2), 6); // 50-200 USDC arası
      
      // Approve
      await usdt.connect(trader).approve(W3M_ADDRESS, buyAmount);
      
      // Buy
      const tx = await w3m.connect(trader).buyWithUSDC(buyAmount, [], "0x", Math.floor(Date.now() / 1000));
      await tx.wait();
      
      const newPrice = await w3m.getCurrentPrice();
      const newPool = await w3m.totalUSDC();
      
      console.log(`✅ İşlem ${i + 1} - ALIM:`);
      console.log(`   Alıcı: ${trader.address.slice(0, 8)}...`);
      console.log(`   Miktar: ${ethers.formatUnits(buyAmount, 6)} USDC`);
      console.log(`   Yeni Fiyat: ${ethers.formatUnits(newPrice, 18)} USDC/W3M`);
      console.log(`   Pool: ${ethers.formatUnits(newPool, 6)} USDC\n`);
      
      priceHistory.push(Number(ethers.formatUnits(newPrice, 18)));
      poolHistory.push(Number(ethers.formatUnits(newPool, 6)));
      
    } else {
      // SATIŞ İŞLEMİ
      const balance = await w3m.balanceOf(trader.address);
      if (balance > 0) {
        const sellAmount = balance / 2n; // Bakiyenin yarısını sat
        
        const tx = await w3m.connect(trader).sellForUSDC(sellAmount);
        await tx.wait();
        
        const newPrice = await w3m.getCurrentPrice();
        const newPool = await w3m.totalUSDC();
        
        console.log(`💸 İşlem ${i + 1} - SATIŞ:`);
        console.log(`   Satıcı: ${trader.address.slice(0, 8)}...`);
        console.log(`   Miktar: ${ethers.formatUnits(sellAmount, 18)} W3M`);
        console.log(`   Yeni Fiyat: ${ethers.formatUnits(newPrice, 18)} USDC/W3M`);
        console.log(`   Pool: ${ethers.formatUnits(newPool, 6)} USDC\n`);
        
        priceHistory.push(Number(ethers.formatUnits(newPrice, 18)));
        poolHistory.push(Number(ethers.formatUnits(newPool, 6)));
      }
    }
  }
  
  // Final durum
  const finalPrice = await w3m.getCurrentPrice();
  const finalPool = await w3m.totalUSDC();
  const finalSupply = await w3m.totalSupply();
  
  // İlk alıcının final durumu
  const firstBuyerFinalUSDT = await usdt.balanceOf(firstBuyer.address);
  const firstBuyerW3M = await w3m.balanceOf(firstBuyer.address);
  const firstBuyerW3MValue = (firstBuyerW3M * finalPrice) / ethers.parseUnits("1", 18);
  const firstBuyerTotalValue = firstBuyerFinalUSDT + firstBuyerW3MValue;
  
  console.log("\n================================================");
  console.log("📊 ÖZET RAPOR");
  console.log("================================================\n");
  
  console.log("🎯 İLK ALICI DURUMU:");
  console.log(`   Başlangıç USDT: ${ethers.formatUnits(firstBuyerInitialUSDT, 6)}`);
  console.log(`   Final USDT: ${ethers.formatUnits(firstBuyerFinalUSDT, 6)}`);
  console.log(`   W3M Bakiyesi: ${ethers.formatUnits(firstBuyerW3M, 18)}`);
  console.log(`   W3M Değeri: ${ethers.formatUnits(firstBuyerW3MValue, 6)} USDT`);
  console.log(`   Toplam Değer: ${ethers.formatUnits(firstBuyerTotalValue, 6)} USDT`);
  const profit = firstBuyerTotalValue - firstBuyerInitialUSDT;
  const profitPercent = (Number(ethers.formatUnits(profit, 6)) / Number(ethers.formatUnits(firstBuyerInitialUSDT, 6))) * 100;
  console.log(`   Kar/Zarar: ${ethers.formatUnits(profit, 6)} USDT (${profitPercent.toFixed(2)}%)`);
  
  console.log("\n📈 FİYAT DEĞİŞİMİ:");
  console.log(`   Başlangıç: ${ethers.formatUnits(initialPrice, 18)} USDC/W3M`);
  console.log(`   Final: ${ethers.formatUnits(finalPrice, 18)} USDC/W3M`);
  const priceIncrease = ((Number(ethers.formatUnits(finalPrice, 18)) / Number(ethers.formatUnits(initialPrice, 18))) - 1) * 100;
  console.log(`   Artış: ${priceIncrease.toFixed(2)}%`);
  console.log(`   Min Fiyat: ${Math.min(...priceHistory).toFixed(8)} USDC/W3M`);
  console.log(`   Max Fiyat: ${Math.max(...priceHistory).toFixed(8)} USDC/W3M`);
  
  console.log("\n💰 POOL DURUMU:");
  console.log(`   Başlangıç: ${ethers.formatUnits(initialPool, 6)} USDC`);
  console.log(`   Final: ${ethers.formatUnits(finalPool, 6)} USDC`);
  console.log(`   Min Pool: ${Math.min(...poolHistory).toFixed(2)} USDC`);
  console.log(`   Max Pool: ${Math.max(...poolHistory).toFixed(2)} USDC`);
  
  console.log("\n🪙 SUPPLY DEĞİŞİMİ:");
  console.log(`   Başlangıç: ${ethers.formatUnits(initialSupply, 18)} W3M`);
  console.log(`   Final: ${ethers.formatUnits(finalSupply, 18)} W3M`);
  const supplyChange = ((Number(ethers.formatUnits(finalSupply, 18)) / Number(ethers.formatUnits(initialSupply, 18))) - 1) * 100;
  console.log(`   Değişim: ${supplyChange.toFixed(2)}%`);
  
  // Diğer wallet'ların durumu
  const marketingBalance = await w3m.balanceOf(await w3m.marketingWallet());
  const activeUsersBalance = await w3m.balanceOf(await w3m.activeUsersWallet());
  
  console.log("\n🎁 DİĞER WALLET'LAR:");
  console.log(`   Marketing: ${ethers.formatUnits(marketingBalance, 18)} W3M`);
  console.log(`   Aktif Kullanıcılar: ${ethers.formatUnits(activeUsersBalance, 18)} W3M`);
  
  // Pool wallet'ları toplamı
  let totalPoolBalance = 0n;
  const poolCount = await w3m.getPoolsCount();
  for (let i = 0; i < poolCount; i++) {
    const pool = await w3m.pools(i);
    const balance = await w3m.balanceOf(pool.wallet);
    totalPoolBalance += balance;
  }
  console.log(`   Pool Wallet'ları Toplamı: ${ethers.formatUnits(totalPoolBalance, 18)} W3M`);
  
  console.log("\n✅ Simülasyon Tamamlandı!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 