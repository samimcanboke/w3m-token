require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // BSC Mainnet USDC adresi
  const USDC_ADDRESS = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
  
  console.log("🔍 BSC Mainnet USDC Bakiye Kontrolü");
  console.log("👤 Adres:", deployer.address);
  console.log("💵 USDC Kontrat:", USDC_ADDRESS);
  
  // USDC kontratını bağla
  const usdc = await ethers.getContractAt("IERC20Metadata", USDC_ADDRESS);
  
  // Decimal kontrolü
  const decimals = await usdc.decimals();
  console.log("\n📊 USDC Decimals:", decimals);
  
  // Bakiye kontrolü
  const balance = await usdc.balanceOf(deployer.address);
  console.log("💰 USDC Bakiyesi:", ethers.utils.formatUnits(balance, decimals), "USDC");
  
  // BNB bakiyesi
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log("⛽ BNB Bakiyesi:", ethers.utils.formatEther(bnbBalance), "BNB");
  
  // Token bilgileri
  const name = await usdc.name();
  const symbol = await usdc.symbol();
  console.log("\n📋 Token Bilgileri:");
  console.log("   İsim:", name);
  console.log("   Sembol:", symbol);
  
  // W3M kontrat bakiyesi
  const W3M_ADDRESS = "0xEee72Fe36c7c1b818D5356020c777964dC0221A8";
  const w3mUsdcBalance = await usdc.balanceOf(W3M_ADDRESS);
  console.log("\n🏦 W3M Kontratındaki USDC:", ethers.utils.formatUnits(w3mUsdcBalance, decimals), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error);
    process.exit(1);
  });