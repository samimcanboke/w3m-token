require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const W3M_ADDRESS = "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d";
  const USDT_ADDRESS = "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5";
  
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", W3M_ADDRESS);
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  console.log("\n💰 Balances before sell:");
  const usdcBefore = await usdt.balanceOf(deployer.address);
  const w3mBefore = await w3m.balanceOf(deployer.address);
  console.log(`   USDC: ${ethers.formatUnits(usdcBefore, 6)}`);
  console.log(`   W3M: ${ethers.formatUnits(w3mBefore, 18)}`);
  
  // Sahip olduğumuz W3M miktarının %50'sini satalım
  const sellAmount = w3mBefore / 2n;
  
  if (sellAmount === 0n) {
    console.log("❌ No W3M tokens to sell!");
    return;
  }
  
  console.log("\n🏪 Selling W3M tokens...");
  console.log(`   Amount: ${ethers.formatUnits(sellAmount, 18)} W3M (50% of balance)`);
  
  const currentPrice = await w3m.getCurrentPrice();
  console.log(`   Current Price: ${ethers.formatUnits(currentPrice, 18)} USDC/W3M`);
  
  // Satıştan beklenen USDC miktarı (%92'sini alacağız)
  const expectedUSDC = (sellAmount * currentPrice * 92n) / (100n * 10n**18n);
  console.log(`   Expected USDC: ${ethers.formatUnits(expectedUSDC, 6)} USDC (92% of value)`);
  
  const sellTx = await w3m.sellForUSDC(sellAmount);
  await sellTx.wait();
  console.log("✅ Sell transaction completed");
  
  console.log("\n💰 Balances after sell:");
  const usdcAfter = await usdt.balanceOf(deployer.address);
  const w3mAfter = await w3m.balanceOf(deployer.address);
  console.log(`   USDC: ${ethers.formatUnits(usdcAfter, 6)}`);
  console.log(`   W3M: ${ethers.formatUnits(w3mAfter, 18)}`);
  
  const usdcReceived = usdcAfter - usdcBefore;
  console.log(`   USDC received: ${ethers.formatUnits(usdcReceived, 6)}`);
  console.log(`   W3M sold: ${ethers.formatUnits(w3mBefore - w3mAfter, 18)}`);
  
  // Contract bilgileri
  const totalSupply = await w3m.totalSupply();
  const newPrice = await w3m.getCurrentPrice();
  const totalUSDC = await w3m.totalUSDC();
  
  console.log("\n📊 Contract stats after sell:");
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 18)} W3M`);
  console.log(`   Current Price: ${ethers.formatUnits(newPrice, 18)} USDC/W3M`);
  console.log(`   Price change: ${newPrice === currentPrice ? "No change ✅" : "Changed ❌"}`);
  console.log(`   Total USDC in pool: ${ethers.formatUnits(totalUSDC, 6)} USDC`);
  
  // Diğer wallet'ların yeni balansları
  console.log("\n👥 Token distributions from sell:");
  const marketingWallet = await w3m.marketingWallet();
  const activeUsersWallet = await w3m.activeUsersWallet();
  
  console.log("   Marketing received: ~2% of sold amount");
  console.log("   Active Users received: ~0.5% of sold amount");
  console.log("   Pools received: ~2.5% of sold amount");
  console.log("   Burned: ~95% (92% for USDC + 3% liquidity)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});