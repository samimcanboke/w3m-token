const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const usdcAddress = process.env.USDT_ADDRESS;
  const w3mAddress = process.env.W3M_ADDRESS;

  const usdc = await ethers.getContractAt("IERC20", usdcAddress);
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  // Kontrat bilgilerini kontrol et
  console.log("🔍 Checking contract state...");
  const totalSupply = await w3m.totalSupply();
  console.log("Total Supply:", ethers.formatEther(totalSupply));
  
  const totalUSDC = await w3m.totalUSDC();
  console.log("Total USDC:", ethers.formatEther(totalUSDC));
  
  const currentPrice = await w3m.getCurrentPrice();
  console.log("Current Price:", ethers.formatEther(currentPrice));
  
  const marketingWallet = await w3m.marketingWallet();
  console.log("Marketing Wallet:", marketingWallet);
  
  const authorizedSigner = await w3m.authorizedSigner();
  console.log("Authorized Signer:", authorizedSigner);
  
  const poolCount = await w3m.getPoolsCount();
  console.log("Pool Count:", poolCount.toString());

  // USDC balance kontrol
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log("\n💰 USDC Balance:", ethers.formatEther(usdcBalance));

  // Basit bir buy deneyelim
  const buyAmount = ethers.parseUnits("10", 18); // 10 USDC
  
  console.log("\n🔓 Approving USDC...");
  const approveTx = await usdc.approve(w3mAddress, buyAmount);
  await approveTx.wait();
  console.log("✅ Approved");

  try {
    console.log("\n🛒 Attempting to buy W3M...");
    const emptyAllocations = [];
    const emptySignature = "0x";
    const timestamp = Math.floor(Date.now() / 1000);
    
    const buyTx = await w3m.buyWithUSDC(buyAmount, emptyAllocations, emptySignature, timestamp);
    await buyTx.wait();
    console.log("✅ Buy successful!");
    
    // Yeni balance'ları kontrol et
    const newW3MBalance = await w3m.balanceOf(deployer.address);
    console.log("New W3M Balance:", ethers.formatEther(newW3MBalance));
    
  } catch (error) {
    console.error("❌ Buy failed:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 