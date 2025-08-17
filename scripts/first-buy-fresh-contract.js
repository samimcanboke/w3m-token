require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 FRESH CONTRACT İLK SATIN ALMA - 50 USDC");
  console.log("============================================");
  
  // Deployment bilgilerini yükle
  const deploymentPath = path.join(__dirname, "..", "fresh-deployment-mainnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const contractAddress = deployment.contracts.web3moon;
  const usdcAddress = deployment.externalContracts.realUSDC;
  
  console.log("📍 W3M Contract:", contractAddress);
  console.log("📍 USDC Contract:", usdcAddress);
  
  // Deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Buyer:", deployer.address);
  console.log("💰 Buyer BNB Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
  
  // Contract instances
  const W3M = await ethers.getContractFactory("Web3Moon");
  const w3m = W3M.attach(contractAddress);
  
  const usdcContract = await ethers.getContractAt("IERC20", usdcAddress);
  
  // Balances before
  console.log("\n💰 BAŞLANGIÇ BAKİYELERİ:");
  const deployerUSDCBefore = await usdcContract.balanceOf(deployer.address);
  const deployerW3MBefore = await w3m.balanceOf(deployer.address);
  const contractTotalSupplyBefore = await w3m.totalSupply();
  const contractTotalUSDCBefore = await w3m.totalUSDC();
  
  console.log("Deployer USDC:", ethers.utils.formatUnits(deployerUSDCBefore, 6), "USDC");
  console.log("Deployer W3M:", ethers.utils.formatEther(deployerW3MBefore), "W3M");
  console.log("Contract Total Supply:", ethers.utils.formatEther(contractTotalSupplyBefore), "W3M");
  console.log("Contract Total USDC:", ethers.utils.formatUnits(contractTotalUSDCBefore, 6), "USDC");
  
  // Current price
  const currentPrice = await w3m.getCurrentPrice();
  console.log("💱 Current Price:", ethers.utils.formatUnits(currentPrice, 6), "USDC per W3M");
  
  // 50 USDC satın alma
  const usdcAmount = ethers.utils.parseUnits("50", 6); // 50 USDC
  console.log(`\n🛒 ${ethers.utils.formatUnits(usdcAmount, 6)} USDC ile W3M SATIN ALINIYOR...`);
  
  // USDC bakiyesi kontrolü
  if (deployerUSDCBefore.lt(usdcAmount)) {
    console.log("❌ Yetersiz USDC bakiyesi!");
    console.log(`Gereken: ${ethers.utils.formatUnits(usdcAmount, 6)} USDC`);
    console.log(`Mevcut: ${ethers.utils.formatUnits(deployerUSDCBefore, 6)} USDC`);
    return;
  }
  
  try {
    // USDC approval
    console.log("🔓 USDC approval işlemi...");
    const approveTx = await usdcContract.approve(contractAddress, usdcAmount);
    await approveTx.wait();
    console.log("✅ USDC approval başarılı!");
    
    // Buy transaction
    console.log("🛒 Satın alma işlemi başlatılıyor...");
    const buyTx = await w3m.buyWithUSDC(usdcAmount);
    console.log("⏳ Buy TX gönderildi:", buyTx.hash);
    
    const receipt = await buyTx.wait();
    console.log("✅ Satın alma başarılı!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Parse events to get received tokens
    let tokensReceived = "0";
    for (let log of receipt.logs) {
      try {
        const parsedLog = w3m.interface.parseLog(log);
        if (parsedLog.name === 'TokensPurchased') {
          tokensReceived = ethers.utils.formatEther(parsedLog.args.tokensReceived);
          console.log("🎯 Alınan W3M:", tokensReceived, "W3M");
        }
      } catch (e) {
        // Log parse edilemezse geç
      }
    }
    
    // Final balances
    console.log("\n💰 FINAL BAKİYELER:");
    const deployerUSDCAfter = await usdcContract.balanceOf(deployer.address);
    const deployerW3MAfter = await w3m.balanceOf(deployer.address);
    const contractTotalSupplyAfter = await w3m.totalSupply();
    const contractTotalUSDCAfter = await w3m.totalUSDC();
    const newPrice = await w3m.getCurrentPrice();
    
    console.log("Deployer USDC:", ethers.utils.formatUnits(deployerUSDCAfter, 6), "USDC");
    console.log("Deployer W3M:", ethers.utils.formatEther(deployerW3MAfter), "W3M");
    console.log("Contract Total Supply:", ethers.utils.formatEther(contractTotalSupplyAfter), "W3M");
    console.log("Contract Total USDC:", ethers.utils.formatUnits(contractTotalUSDCAfter, 6), "USDC");
    console.log("New Price:", ethers.utils.formatUnits(newPrice, 6), "USDC per W3M");
    
    // Changes
    console.log("\n📊 DEĞİŞİMLER:");
    const usdcSpent = deployerUSDCBefore.sub(deployerUSDCAfter);
    const w3mGained = deployerW3MAfter.sub(deployerW3MBefore);
    const totalSupplyIncrease = contractTotalSupplyAfter.sub(contractTotalSupplyBefore);
    const totalUSDCIncrease = contractTotalUSDCAfter.sub(contractTotalUSDCBefore);
    
    console.log("USDC Harcanan:", ethers.utils.formatUnits(usdcSpent, 6), "USDC");
    console.log("W3M Kazanılan:", ethers.utils.formatEther(w3mGained), "W3M");
    console.log("Total Supply Artışı:", ethers.utils.formatEther(totalSupplyIncrease), "W3M");
    console.log("Contract USDC Artışı:", ethers.utils.formatUnits(totalUSDCIncrease, 6), "USDC");
    
    console.log("\n🎉 İLK SATIN ALMA BAŞARILI!");
    console.log(`💎 ${ethers.utils.formatUnits(usdcSpent, 6)} USDC ile ${ethers.utils.formatEther(w3mGained)} W3M alındı!`);
    console.log(`📈 Fiyat: ${ethers.utils.formatUnits(currentPrice, 6)} → ${ethers.utils.formatUnits(newPrice, 6)} USDC per W3M`);
    
  } catch (error) {
    console.error("❌ Satın alma hatası:", error);
    
    if (error.reason) {
      console.log("📝 Hata nedeni:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script hatası:", error);
    process.exit(1);
  });