require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🛒 İlk alım yapılıyor - BSC MAINNET");
  console.log("💰 Buyer account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployment-addresses-mainnet.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const w3mAddress = deploymentInfo.web3moon;
  const usdcAddress = deploymentInfo.realUSDC;
  
  console.log("\n📄 Kontrat Bilgileri:");
  console.log("  W3M Contract:", w3mAddress);
  console.log("  USDC Contract:", usdcAddress);

  // Get contract instances
  const W3M = await ethers.getContractFactory("Web3Moon");
  const w3m = W3M.attach(w3mAddress);
  
  // USDC contract ABI (minimal)
  const usdcAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function symbol() view returns (string)"
  ];
  
  const usdc = new ethers.Contract(usdcAddress, usdcAbi, deployer);

  // Check USDC balance
  try {
    const usdcBalance = await usdc.balanceOf(deployer.address);
    const usdcDecimals = await usdc.decimals();
    const usdcSymbol = await usdc.symbol();
    
    console.log("\n💎 USDC Bilgileri:");
    console.log("  USDC Symbol:", usdcSymbol);
    console.log("  USDC Decimals:", usdcDecimals.toString());
    console.log("  Your USDC Balance:", ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
    
    // Purchase amount (50 USDC)
    const purchaseAmount = ethers.utils.parseUnits("50", usdcDecimals);
    console.log("  Purchase Amount:", ethers.utils.formatUnits(purchaseAmount, usdcDecimals), usdcSymbol);
    
    if (usdcBalance.lt(purchaseAmount)) {
      console.log("❌ Insufficient USDC balance!");
      console.log("   Required:", ethers.utils.formatUnits(purchaseAmount, usdcDecimals), usdcSymbol);
      console.log("   Available:", ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
      return;
    }
    
    // Check current W3M price and info
    console.log("\n📊 W3M Kontrat Durumu:");
    const currentPrice = await w3m.getCurrentPrice();
    const totalSupply = await w3m.totalSupply();
    const totalUSDC = await w3m.totalUSDC();
    
    console.log("  Current Price:", ethers.utils.formatUnits(currentPrice, 18), "USDC per W3M");
    console.log("  Total Supply:", ethers.utils.formatUnits(totalSupply, 18), "W3M");
    console.log("  Total USDC in Pool:", ethers.utils.formatUnits(totalUSDC, usdcDecimals), usdcSymbol);
    
    // Calculate expected tokens (approximate)
    const expectedTokens = purchaseAmount.mul(ethers.utils.parseUnits("0.9", 18)).div(currentPrice);
    console.log("  Expected W3M Tokens (~90%):", ethers.utils.formatUnits(expectedTokens, 18), "W3M");
    
    // Check allowance
    const allowance = await usdc.allowance(deployer.address, w3mAddress);
    console.log("\n🔒 Approval Status:");
    console.log("  Current Allowance:", ethers.utils.formatUnits(allowance, usdcDecimals), usdcSymbol);
    
    if (allowance.lt(purchaseAmount)) {
      console.log("  ⚠️  Insufficient allowance, approving USDC...");
      const approveTx = await usdc.approve(w3mAddress, purchaseAmount, {
        gasLimit: 100000
      });
      console.log("  📝 Approve TX Hash:", approveTx.hash);
      await approveTx.wait();
      console.log("  ✅ USDC approval confirmed!");
    } else {
      console.log("  ✅ Sufficient allowance available");
    }
    
    // Get W3M balance before purchase
    const w3mBalanceBefore = await w3m.balanceOf(deployer.address);
    console.log("\n🛒 Purchasing W3M tokens...");
    console.log("  W3M Balance Before:", ethers.utils.formatUnits(w3mBalanceBefore, 18), "W3M");
    
    // Execute purchase
    const buyTx = await w3m.buyWithUSDC(purchaseAmount, {
      gasLimit: 2000000 // Higher gas limit for complex function
    });
    
    console.log("  📝 Buy TX Hash:", buyTx.hash);
    console.log("  ⏳ Waiting for confirmation...");
    
    const receipt = await buyTx.wait();
    console.log("  ✅ Purchase confirmed!");
    console.log("  ⛽ Gas used:", receipt.gasUsed.toString());
    
    // Check results
    const w3mBalanceAfter = await w3m.balanceOf(deployer.address);
    const tokensReceived = w3mBalanceAfter.sub(w3mBalanceBefore);
    
    console.log("\n🎉 Purchase Results:");
    console.log("  USDC Spent:", ethers.utils.formatUnits(purchaseAmount, usdcDecimals), usdcSymbol);
    console.log("  W3M Received:", ethers.utils.formatUnits(tokensReceived, 18), "W3M");
    console.log("  New W3M Balance:", ethers.utils.formatUnits(w3mBalanceAfter, 18), "W3M");
    
    // Check new contract state
    const newPrice = await w3m.getCurrentPrice();
    const newTotalSupply = await w3m.totalSupply();
    const newTotalUSDC = await w3m.totalUSDC();
    
    console.log("\n📊 Updated Contract State:");
    console.log("  New Price:", ethers.utils.formatUnits(newPrice, 18), "USDC per W3M");
    console.log("  New Total Supply:", ethers.utils.formatUnits(newTotalSupply, 18), "W3M");
    console.log("  New Total USDC:", ethers.utils.formatUnits(newTotalUSDC, usdcDecimals), usdcSymbol);
    
    // Price change
    const priceChange = newPrice.sub(currentPrice);
    const priceChangePercent = priceChange.mul(10000).div(currentPrice);
    console.log("  Price Change:", ethers.utils.formatUnits(priceChange, 18), "USDC");
    console.log("  Price Change %:", ethers.utils.formatUnits(priceChangePercent, 2), "%");
    
    console.log("\n🔍 BscScan TX: https://bscscan.com/tx/" + buyTx.hash);
    console.log("🎯 İlk alım başarıyla tamamlandı!");
    
  } catch (error) {
    if (error.message.includes("USDC address cannot be zero") || 
        error.message.includes("call revert exception")) {
      console.log("❌ USDC contract hatası. Kontrat adresi doğru mu kontrol edin.");
      console.log("   USDC Address:", usdcAddress);
    } else {
      console.log("❌ Hata:", error.message);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ İlk alım başarısız:", error);
    process.exit(1);
  });