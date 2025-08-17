const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const signers = await ethers.getSigners();
  
  // 11 wallet kullanacağız - ilk 10'u referans, 11. alım satım yapacak
  const referralWallets = signers.slice(0, 10);
  const traderWallet = signers[10];
  
  console.log("🔧 Setting up simulation...");
  console.log("📊 Referral Wallets (10):", referralWallets.map(w => w.address));
  console.log("💰 Trader Wallet:", traderWallet.address);
  console.log("\n" + "=".repeat(80) + "\n");

  const usdcAddress = process.env.USDT_ADDRESS;
  const w3mAddress = process.env.W3M_ADDRESS;

  const usdc = await ethers.getContractAt("IERC20", usdcAddress);
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  // Trader'a USDC ver
  const mockUsdc = await ethers.getContractAt("MockUSDT", usdcAddress);
  await mockUsdc.mint(traderWallet.address, ethers.parseUnits("10000", 18));
  
  // Approve USDC
  await usdc.connect(traderWallet).approve(w3mAddress, ethers.parseUnits("10000", 18));

  // Fiyat formatı
  const formatPrice = (price) => {
    return parseFloat(ethers.formatEther(price)).toFixed(8);
  };

  // İşlem sayacı
  let buyCount = 0;
  let sellCount = 0;
  let transactionCount = 0;

  // İlk fiyat
  const initialPrice = await w3m.getCurrentPrice();
  console.log(`🏁 INITIAL PRICE: ${formatPrice(initialPrice)} USDC/W3M`);
  console.log("\n" + "=".repeat(80) + "\n");

  // 40 işlem yap (20 alım + 20 satış)
  while (buyCount < 20 || sellCount < 20) {
    transactionCount++;
    
    // W3M bakiyesini kontrol et
    const w3mBalance = await w3m.balanceOf(traderWallet.address);
    
    // Rastgele alım veya satış kararı
    let shouldBuy;
    
    if (buyCount >= 20) {
      shouldBuy = false; // 20 alım yapıldıysa sadece sat
    } else if (sellCount >= 20) {
      shouldBuy = true; // 20 satış yapıldıysa sadece al
    } else if (w3mBalance == 0n) {
      shouldBuy = true; // Token yoksa al
    } else {
      shouldBuy = Math.random() > 0.5; // Rastgele
    }

    if (shouldBuy) {
      // ALIM İŞLEMİ
      buyCount++;
      const buyAmount = ethers.parseUnits((Math.random() * 50 + 10).toFixed(2), 18); // 10-60 USDC arası
      
      // 10 wallet'a eşit dağıtım için marketing allocations hazırla
      const totalMarketingAmount = (buyAmount * 25n) / 1000n; // %2.5
      const perWalletAmount = totalMarketingAmount / 10n;
      
      const marketingAllocations = referralWallets.map(wallet => ({
        wallet: wallet.address,
        amount: perWalletAmount
      }));
      
      // İmzasız işlem - marketing developer wallet'a gider
      const timestamp = Math.floor(Date.now() / 1000);
      
      console.log(`📈 TRANSACTION #${transactionCount} - BUY #${buyCount}`);
      console.log(`   Amount: ${ethers.formatUnits(buyAmount, 18)} USDC`);
      
      const tx = await w3m.connect(traderWallet).buyWithUSDC(
        buyAmount, 
        [], // Boş marketing allocations - developer wallet'a gider
        "0x", // Boş imza
        timestamp
      );
      await tx.wait();
      
    } else {
      // SATIŞ İŞLEMİ
      sellCount++;
      const sellPercentage = Math.random() * 0.2 + 0.05; // %5-%25 arası sat
      const sellAmount = (w3mBalance * BigInt(Math.floor(sellPercentage * 1000))) / 1000n;
      
      if (sellAmount > 0n) {
        console.log(`📉 TRANSACTION #${transactionCount} - SELL #${sellCount}`);
        console.log(`   Amount: ${ethers.formatEther(sellAmount)} W3M`);
        
        const tx = await w3m.connect(traderWallet).sellForUSDC(sellAmount);
        await tx.wait();
      }
    }
    
    // Yeni fiyat
    const currentPrice = await w3m.getCurrentPrice();
    const totalSupply = await w3m.totalSupply();
    const totalUSDC = await w3m.totalUSDC();
    
    console.log(`   New Price: ${formatPrice(currentPrice)} USDC/W3M`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} W3M`);
    console.log(`   Total USDC Pool: ${ethers.formatEther(totalUSDC)} USDC`);
    console.log("   " + "-".repeat(60));
  }

  // Final durum
  console.log("\n" + "=".repeat(80) + "\n");
  console.log("🏁 SIMULATION COMPLETE");
  console.log(`   Total Transactions: ${transactionCount}`);
  console.log(`   Total Buys: ${buyCount}`);
  console.log(`   Total Sells: ${sellCount}`);
  
  const finalPrice = await w3m.getCurrentPrice();
  const priceIncrease = ((finalPrice - initialPrice) * 10000n / initialPrice) / 100n;
  
  console.log(`\n   Initial Price: ${formatPrice(initialPrice)} USDC/W3M`);
  console.log(`   Final Price: ${formatPrice(finalPrice)} USDC/W3M`);
  console.log(`   Price Increase: ${priceIncrease}%`);

  // Wallet bakiyeleri
  console.log("\n📊 FINAL BALANCES:");
  const traderW3M = await w3m.balanceOf(traderWallet.address);
  const traderUSDC = await usdc.balanceOf(traderWallet.address);
  console.log(`   Trader W3M: ${ethers.formatEther(traderW3M)}`);
  console.log(`   Trader USDC: ${ethers.formatEther(traderUSDC)}`);
  
  // Marketing wallet (developer) bakiyesi
  const marketingWallet = await w3m.marketingWallet();
  const marketingBalance = await w3m.balanceOf(marketingWallet);
  console.log(`   Marketing Wallet W3M: ${ethers.formatEther(marketingBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 