require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const W3M_ADDRESS = "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d";
  const USDT_ADDRESS = "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5";
  
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", W3M_ADDRESS);
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  const buyAmount = ethers.parseUnits("100", 6); // 100 USDC
  
  console.log("🔄 Approving USDC...");
  const approveTx = await usdt.approve(W3M_ADDRESS, buyAmount);
  await approveTx.wait();
  console.log("✅ USDC approved");
  
  console.log("\n💰 Balances before buy:");
  const usdcBefore = await usdt.balanceOf(deployer.address);
  const w3mBefore = await w3m.balanceOf(deployer.address);
  console.log(`   USDC: ${ethers.formatUnits(usdcBefore, 6)}`);
  console.log(`   W3M: ${ethers.formatUnits(w3mBefore, 18)}`);
  
  console.log("\n🛒 Buying W3M tokens...");
  console.log(`   Amount: ${ethers.formatUnits(buyAmount, 6)} USDC`);
  
  // Referrer adresi - 0x0 = referansız alım
  const referrer = ethers.ZeroAddress;
  
  const buyTx = await w3m.buyWithUSDC(buyAmount, referrer);
  await buyTx.wait();
  console.log("✅ Buy transaction completed");
  
  console.log("\n�� Balances after buy:");
  const usdcAfter = await usdt.balanceOf(deployer.address);
  const w3mAfter = await w3m.balanceOf(deployer.address);
  console.log(`   USDC: ${ethers.formatUnits(usdcAfter, 6)}`);
  console.log(`   W3M: ${ethers.formatUnits(w3mAfter, 18)}`);
  console.log(`   W3M received: ${ethers.formatUnits(w3mAfter - w3mBefore, 18)}`);
  
  // Contract bilgileri
  const totalSupply = await w3m.totalSupply();
  const currentPrice = await w3m.getCurrentPrice();
  const totalUSDC = await w3m.totalUSDC();
  
  console.log("\n📊 Contract stats:");
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 18)} W3M`);
  console.log(`   Current Price: ${ethers.formatUnits(currentPrice, 18)} USDC/W3M`);
  console.log(`   Total USDC in pool: ${ethers.formatUnits(totalUSDC, 6)} USDC`);
  
  // Diğer wallet'ların balanslarını kontrol et
  console.log("\n👥 Other wallets:");
  const marketingWallet = await w3m.marketingWallet();
  const activeUsersWallet = await w3m.activeUsersWallet();
  
  const marketingBalance = await w3m.balanceOf(marketingWallet);
  const activeUsersBalance = await w3m.balanceOf(activeUsersWallet);
  
  console.log(`   Marketing: ${ethers.formatUnits(marketingBalance, 18)} W3M`);
  console.log(`   Active Users: ${ethers.formatUnits(activeUsersBalance, 18)} W3M`);
  
  // Pool balansları
  console.log("\n🏊 Pool balances:");
  const poolCount = await w3m.getPoolsCount();
  for (let i = 0; i < poolCount; i++) {
    const pool = await w3m.pools(i);
    const balance = await w3m.balanceOf(pool.wallet);
    console.log(`   Pool ${i}: ${ethers.formatUnits(balance, 18)} W3M (weight: ${pool.weight})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});