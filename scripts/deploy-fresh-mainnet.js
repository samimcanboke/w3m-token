require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 YENİ FRESH DEPLOY - BSC MAINNET");
  console.log("==================================");
  
  // Yeni walletları yükle
  const walletsPath = path.join(__dirname, "..", "new-deployment-wallets.json");
  const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  
  // Deployer bilgisi
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB");
  
  // Wallet adreslerini çıkar
  const referralWallet = wallets.find(w => w.name === "referral").address;
  const activeUsersWallet = wallets.find(w => w.name === "activeUsers").address;
  const stakingRewardsWallet = wallets.find(w => w.name === "stakingRewards").address;
  
  // Pool walletlarını hazırla
  const poolWallets = wallets.filter(w => w.weight !== null).sort((a, b) => a.weight - b.weight);
  
  console.log("\n📋 WALLET ADRESLERI:");
  console.log("Deployer:", deployer.address);
  console.log("Referral:", referralWallet);
  console.log("Active Users:", activeUsersWallet);  
  console.log("Staking Rewards:", stakingRewardsWallet);
  console.log("\n🏊 POOL WALLETLARI:");
  poolWallets.forEach(pool => {
    console.log(`${pool.name}: ${pool.address} (weight: ${pool.weight})`);
  });
  
  // USDC adresi (BSC Mainnet)
  const realUSDC = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"; // BSC USDC
  console.log("\n💵 USDC Contract:", realUSDC);
  
  // Initial pools array'ini hazırla  
  const initialPools = poolWallets.map(pool => ({
    wallet: pool.address,
    weight: pool.weight
  }));
  
  console.log("\n📊 INITIAL POOLS CONFIGURATION:");
  initialPools.forEach((pool, index) => {
    console.log(`${index + 1}. ${poolWallets[index].name}: ${pool.wallet} (weight: ${pool.weight})`);
  });
  
  console.log("\n🔨 DEPLOY BAŞLANIYOR...");
  
  // Debug: Değerleri kontrol et
  console.log("DEBUG VALUES:");
  console.log("realUSDC:", realUSDC);
  console.log("referralWallet:", referralWallet);
  console.log("stakingRewardsWallet:", stakingRewardsWallet);
  console.log("activeUsersWallet:", activeUsersWallet);
  console.log("initialPools length:", initialPools.length);
  console.log("initialPools:", JSON.stringify(initialPools, null, 2));
  
  try {
    // Web3Moon contract'ını deploy et
    const Web3Moon = await ethers.getContractFactory("Web3Moon");
    console.log("📦 Web3Moon factory alındı...");
    
    const deployTx = await Web3Moon.deploy(
      realUSDC,                    // _usdc
      referralWallet,              // _referralWallet  
      stakingRewardsWallet,        // _stakingRewardsWallet
      activeUsersWallet,           // _activeUsersWallet
      initialPools,                // _initialPools
      {
        gasLimit: 5000000, // 5M gas limit
        gasPrice: ethers.utils.parseUnits("5", "gwei") // 5 gwei
      }
    );
    
    console.log("⏳ Deploy transaction gönderildi:", deployTx.deployTransaction.hash);
    console.log("⏳ Contract deploy ediliyor...");
    
    const w3m = await deployTx.deployed();
    const deployReceipt = await deployTx.deployTransaction.wait();
    
    console.log("✅ Web3Moon deployed to:", w3m.address);
    console.log("⛽ Gas used:", deployReceipt.gasUsed.toString());
    console.log("💰 Deploy cost:", ethers.utils.formatEther(deployReceipt.gasUsed.mul(deployReceipt.effectiveGasPrice)), "BNB");
    
    // Contract bilgilerini doğrula
    console.log("\n🔍 CONTRACT DOĞRULAMA:");
    const name = await w3m.name();
    const symbol = await w3m.symbol();
    const totalSupply = await w3m.totalSupply();
    const owner = await w3m.owner();
    
    console.log("Token Name:", name);
    console.log("Token Symbol:", symbol);
    console.log("Total Supply:", ethers.utils.formatEther(totalSupply));
    console.log("Contract Owner:", owner);
    
    // Wallet bakiyelerini kontrol et
    console.log("\n💰 TOKEN DAĞITIM KONTROLÜ:");
    const deployerBalance = await w3m.balanceOf(deployer.address);
    console.log("Deployer Balance:", ethers.utils.formatEther(deployerBalance), "W3M");
    
    for (let wallet of wallets) {
      const balance = await w3m.balanceOf(wallet.address);
      const formattedBalance = ethers.utils.formatEther(balance);
      if (parseFloat(formattedBalance) > 0) {
        console.log(`${wallet.name} Balance:`, formattedBalance, "W3M");
      }
    }
    
    // Pool bilgilerini kontrol et
    console.log("\n🏊 POOL KONTROLÜ:");
    for (let i = 0; i < poolWallets.length; i++) {
      try {
        const poolInfo = await w3m.pools(i);
        console.log(`Pool ${i}: ${poolWallets[i].name} - ${poolInfo.poolAddress} (weight: ${poolInfo.weight})`);
      } catch (e) {
        console.log(`Pool ${i}: Bilgi alınamadı`);
      }
    }
    
    // Deployment bilgilerini kaydet  
    const deploymentInfo = {
      network: "bsc-mainnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        web3moon: w3m.address
      },
      wallets: {
        deployer: deployer.address,
        referral: referralWallet,
        activeUsers: activeUsersWallet,
        stakingRewards: stakingRewardsWallet,
        pools: poolWallets.reduce((acc, pool) => {
          acc[pool.name] = pool.address;
          return acc;
        }, {})
      },
      externalContracts: {
        realUSDC: realUSDC
      },
      deploymentDetails: {
        gasUsed: deployReceipt.gasUsed.toString(),
        gasPrice: deployReceipt.effectiveGasPrice.toString(),
        transactionHash: deployReceipt.transactionHash,
        blockNumber: deployReceipt.blockNumber
      },
      contractInfo: {
        name: name,
        symbol: symbol,
        totalSupply: totalSupply.toString(),
        owner: owner
      }
    };
    
    // Deployment bilgilerini kaydet
    const deploymentPath = path.join(__dirname, "..", "fresh-deployment-mainnet.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 Deployment bilgileri kaydedildi: ${deploymentPath}`);
    
    console.log("\n🎉 DEPLOY BAŞARILI!");
    console.log("==============================");
    console.log("Contract Address:", w3m.address);
    console.log("Transaction:", deployReceipt.transactionHash);
    console.log("Block:", deployReceipt.blockNumber);
    console.log("==============================");
    
    return {
      contractAddress: w3m.address,
      deploymentInfo: deploymentInfo
    };
    
  } catch (error) {
    console.error("❌ Deploy hatası:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });