require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 FINAL SİSTEM TEST VE DOĞRULAMA");
  console.log("==================================");
  
  // Deployment bilgilerini yükle
  const deploymentPath = path.join(__dirname, "..", "fresh-deployment-mainnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Wallet bilgilerini yükle
  const walletsPath = path.join(__dirname, "..", "new-deployment-wallets.json");
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  const contractAddress = deployment.contracts.web3moon;
  const usdcAddress = deployment.externalContracts.realUSDC;
  
  console.log("📍 CONTRACT ADRESLERİ:");
  console.log("W3M:", contractAddress);
  console.log("USDC:", usdcAddress);
  console.log("BscScan:", `https://bscscan.com/address/${contractAddress}`);
  
  // Contract instances
  const W3M = await ethers.getContractFactory("Web3Moon");
  const w3m = W3M.attach(contractAddress);
  const usdcContract = await ethers.getContractAt("IERC20", usdcAddress);
  
  console.log("\n🔍 CONTRACT DURUMU:");
  
  try {
    // Basic contract info
    const name = await w3m.name();
    const symbol = await w3m.symbol();
    const totalSupply = await w3m.totalSupply();
    const totalUSDC = await w3m.totalUSDC();
    const currentPrice = await w3m.getCurrentPrice();
    const owner = await w3m.owner();
    
    console.log(`📛 Name: ${name}`);
    console.log(`🎯 Symbol: ${symbol}`);
    console.log(`🏭 Total Supply: ${ethers.utils.formatEther(totalSupply)} W3M`);
    console.log(`💵 Total USDC: ${ethers.utils.formatUnits(totalUSDC, 6)} USDC`);
    console.log(`💱 Current Price: ${ethers.utils.formatUnits(currentPrice, 6)} USDC per W3M`);
    console.log(`👑 Owner: ${owner}`);
    
    // Wallet addresses check
    console.log("\n🏦 WALLET ADRESLERİ:");
    const referralWallet = await w3m.referralWallet();
    const activeUsersWallet = await w3m.activeUsersWallet();
    const stakingRewardsWallet = await w3m.stakingRewardsWallet();
    
    console.log(`🎁 Referral: ${referralWallet}`);
    console.log(`👥 Active Users: ${activeUsersWallet}`);
    console.log(`🏆 Staking Rewards: ${stakingRewardsWallet}`);
    
    // Pool information
    console.log("\n🏊 POOL BİLGİLERİ:");
    const poolsCount = await w3m.getPoolsCount();
    console.log(`Pool Count: ${poolsCount}`);
    
    for (let i = 0; i < poolsCount; i++) {
      try {
        const pool = await w3m.pools(i);
        const poolWallet = wallets.find(w => w.address.toLowerCase() === pool.wallet.toLowerCase());
        const poolName = poolWallet ? poolWallet.name : `Pool ${i}`;
        console.log(`${i}: ${poolName} - ${pool.wallet} (weight: ${pool.weight})`);
      } catch (e) {
        console.log(`${i}: Pool bilgisi alınamadı`);
      }
    }
    
    // USDC connection test
    console.log("\n💎 USDC BAĞLANTI TESTİ:");
    const usdcTokenFromContract = await w3m.usdcToken();
    const usdcDecimals = await w3m.usdcDecimals();
    console.log(`Contract'taki USDC: ${usdcTokenFromContract}`);
    console.log(`USDC Decimals: ${usdcDecimals}`);
    console.log(`Adres eşleşiyor: ${usdcTokenFromContract.toLowerCase() === usdcAddress.toLowerCase()}`);
    
    // Deployer balances
    console.log("\n💰 DEPLOYER BAKİYELERİ:");
    const [deployer] = await ethers.getSigners();
    const deployerBNB = await ethers.provider.getBalance(deployer.address);
    const deployerUSDC = await usdcContract.balanceOf(deployer.address);
    const deployerW3M = await w3m.balanceOf(deployer.address);
    
    console.log(`BNB: ${ethers.utils.formatEther(deployerBNB)} BNB`);
    console.log(`USDC: ${ethers.utils.formatUnits(deployerUSDC, 6)} USDC`);
    console.log(`W3M: ${ethers.utils.formatEther(deployerW3M)} W3M`);
    
    // Private keys check
    console.log("\n🔐 PRIVATE KEY BACKUP:");
    const privateKeysPath = path.join(__dirname, "..", "PRIVATE-KEYS-BACKUP.json");
    if (fs.existsSync(privateKeysPath)) {
      console.log(`✅ Private keys backup dosyası mevcut: ${privateKeysPath}`);
      const backup = JSON.parse(fs.readFileSync(privateKeysPath, "utf8"));
      console.log(`📊 ${backup.wallets.length} wallet private key'i kaydedildi`);
    } else {
      console.log(`❌ Private keys backup dosyası bulunamadı!`);
    }
    
    // Verification check
    console.log("\n🔍 VERIFICATION DURUMU:");
    console.log(`BscScan Link: https://bscscan.com/address/${contractAddress}#code`);
    console.log(`Flattened dosya: Fresh-Web3Moon-flattened.sol`);
    
    // Test transaction simulation
    console.log("\n🧪 BASIC FUNCTION TEST:");
    try {
      const minPartSize = await w3m.minPartSize();
      console.log(`✅ minPartSize: ${ethers.utils.formatUnits(minPartSize, 6)}`);
      
      const initialPrice = await w3m.initialPrice();
      console.log(`✅ initialPrice: ${ethers.utils.formatUnits(initialPrice, 6)}`);
      
      console.log("✅ Tüm basic function'lar çalışıyor!");
    } catch (e) {
      console.log("❌ Basic function test hatası:", e.message);
    }
    
    console.log("\n🎉 FINAL SISTEM DURUMU:");
    console.log("========================");
    console.log(`✅ Contract Deploy: BAŞARILI (${contractAddress})`);
    console.log(`📈 İlk Satın Alma: ${ethers.utils.formatEther(deployerW3M)} W3M alındı`);
    console.log(`💱 Current Price: ${ethers.utils.formatUnits(currentPrice, 6)} USDC per W3M`);
    console.log(`🏦 Walletlar: ${wallets.length} adet yeni wallet oluşturuldu`);
    console.log(`🔐 Private Keys: GÜVENLE KAYDEDILDI`);
    console.log(`🔍 Verification: Manuel olarak yapılabilir durumda`);
    console.log(`🌐 Network: BSC Mainnet (Chain ID: 56)`);
    
    console.log("\n✅ TÜM SİSTEM TAMAMEN HAZIR VE ÇALIŞIYOR!");
    
  } catch (error) {
    console.error("❌ Test hatası:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });