require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 W3M Token Toplama ve BNB Dağıtım Scripti");
  console.log("=".repeat(80));

  // Contract ve deployment bilgileri
  const deploymentAddresses = require("../deployment-addresses-mainnet.json");
  const walletInfo = require("../deployment-wallets.json");
  
  const W3M_ADDRESS = deploymentAddresses.web3moon;
  const DEPLOYER_ADDRESS = deploymentAddresses.deployer;
  const MIN_BNB_BALANCE = ethers.parseEther("0.001"); // Minimum BNB balance
  const BNB_TRANSFER_AMOUNT = ethers.parseEther("0.003"); // BNB transfer miktarı
  
  console.log(`📍 W3M Contract: ${W3M_ADDRESS}`);
  console.log(`👤 Deployer: ${DEPLOYER_ADDRESS}`);
  console.log(`💰 Minimum BNB: ${ethers.formatEther(MIN_BNB_BALANCE)} BNB`);
  console.log(`💸 BNB Transfer Amount: ${ethers.formatEther(BNB_TRANSFER_AMOUNT)} BNB\n`);
  
  // Deployer signer (BNB gönderecek)
  const [deployerSigner] = await ethers.getSigners();
  
  // W3M contract instance
  const w3mContract = await ethers.getContractAt("Web3Moon", W3M_ADDRESS);
  
  let totalTokensCollected = ethers.parseEther("0");
  let bnbTransferCount = 0;
  let successfulTransfers = 0;
  let errors = [];
  
  console.log("🔍 Wallet'ları kontrol ediliyor...\n");
  
  // Tüm wallet'ları işle
  const allWallets = [
    ...walletInfo,
    ...deploymentAddresses.pools.map(pool => ({
      name: pool.name,
      address: pool.address,
      privateKey: null // Pool wallet'ları için private key yok, sadece kontrol amaçlı
    }))
  ];
  
  for (let i = 0; i < allWallets.length; i++) {
    const walletData = allWallets[i];
    const walletName = walletData.name;
    const walletAddress = walletData.address;
    
    console.log(`📝 ${i + 1}/${allWallets.length} - ${walletName} (${walletAddress})`);
    
    try {
      // BNB bakiyesini kontrol et
      const bnbBalance = await ethers.provider.getBalance(walletAddress);
      console.log(`   💎 BNB Balance: ${ethers.formatEther(bnbBalance)} BNB`);
      
      // W3M token bakiyesini kontrol et
      const w3mBalance = await w3mContract.balanceOf(walletAddress);
      console.log(`   🌙 W3M Balance: ${ethers.formatEther(w3mBalance)} W3M`);
      
      // Eğer private key yoksa (pool wallet'ları) sadece bilgi göster
      if (!walletData.privateKey) {
        console.log(`   ⚠️ No private key available for ${walletName} - skipping transfer`);
        console.log("");
        continue;
      }
      
      // BNB düşükse transfer et
      if (bnbBalance < MIN_BNB_BALANCE) {
        console.log(`   🔄 BNB düşük, ${ethers.formatEther(BNB_TRANSFER_AMOUNT)} BNB gönderiliyor...`);
        
        const bnbTx = await deployerSigner.sendTransaction({
          to: walletAddress,
          value: BNB_TRANSFER_AMOUNT,
          gasLimit: 21000
        });
        
        await bnbTx.wait();
        console.log(`   ✅ BNB transfer completed: ${bnbTx.hash}`);
        bnbTransferCount++;
        
        // Transfer sonrası yeni balance
        const newBnbBalance = await ethers.provider.getBalance(walletAddress);
        console.log(`   💎 New BNB Balance: ${ethers.formatEther(newBnbBalance)} BNB`);
      }
      
      // W3M token varsa deployer'a gönder
      if (w3mBalance > 0) {
        console.log(`   🚀 ${ethers.formatEther(w3mBalance)} W3M token deployer'a gönderiliyor...`);
        
        // Wallet signer'ını oluştur
        const walletSigner = new ethers.Wallet(walletData.privateKey, ethers.provider);
        const w3mWithSigner = w3mContract.connect(walletSigner);
        
        // Token transfer
        const transferTx = await w3mWithSigner.transfer(DEPLOYER_ADDRESS, w3mBalance);
        await transferTx.wait();
        
        console.log(`   ✅ W3M transfer completed: ${transferTx.hash}`);
        totalTokensCollected += w3mBalance;
        successfulTransfers++;
        
        // Transfer sonrası bakiye kontrolü
        const newW3mBalance = await w3mContract.balanceOf(walletAddress);
        console.log(`   🌙 New W3M Balance: ${ethers.formatEther(newW3mBalance)} W3M`);
      } else {
        console.log(`   ℹ️ No W3M tokens to transfer`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing ${walletName}: ${error.message}`);
      errors.push({ wallet: walletName, error: error.message });
    }
    
    console.log("");
  }
  
  // Final rapor
  console.log("=".repeat(80));
  console.log("📊 TOPLAMA RAPORU");
  console.log("=".repeat(80));
  
  // Deployer'ın final W3M balance'ı
  const deployerFinalBalance = await w3mContract.balanceOf(DEPLOYER_ADDRESS);
  console.log(`👤 Deployer Final W3M Balance: ${ethers.formatEther(deployerFinalBalance)} W3M`);
  console.log(`🎯 Toplanan W3M Token: ${ethers.formatEther(totalTokensCollected)} W3M`);
  console.log(`✅ Başarılı Token Transfer: ${successfulTransfers}/${walletInfo.length}`);
  console.log(`💸 BNB Transfer Sayısı: ${bnbTransferCount}`);
  console.log(`💰 Toplam BNB Gönderilen: ${ethers.formatEther(BNB_TRANSFER_AMOUNT * BigInt(bnbTransferCount))} BNB`);
  
  if (errors.length > 0) {
    console.log("\n❌ HATALAR:");
    errors.forEach(error => {
      console.log(`   - ${error.wallet}: ${error.error}`);
    });
  }
  
  // Deployer BNB balance kontrolü
  const deployerBnbBalance = await ethers.provider.getBalance(DEPLOYER_ADDRESS);
  console.log(`\n💎 Deployer BNB Balance: ${ethers.formatEther(deployerBnbBalance)} BNB`);
  
  console.log("\n🎉 Toplama işlemi tamamlandı!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
