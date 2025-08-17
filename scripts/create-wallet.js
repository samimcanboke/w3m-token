const { ethers } = require("hardhat");

async function main() {
  // Generate new wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("🔐 New Test Wallet Created!");
  console.log("==========================");
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
  console.log("Add the private key (without 0x prefix) to your .env file");
  
  // Get testnet faucet links
  console.log("\n💰 Get Test Tokens:");
  console.log("BSC Testnet: https://testnet.binance.org/faucet-smart");
  console.log("Sepolia: https://sepoliafaucet.com/");
  console.log("Mumbai: https://faucet.polygon.technology/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 