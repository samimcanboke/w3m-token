require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 CONTRACT FACTORY TEST");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("✅ Deployer:", deployer.address);
    
    const Web3Moon = await ethers.getContractFactory("Web3Moon");
    console.log("✅ Web3Moon factory alındı");
    
    console.log("✅ Test başarılı!");
  } catch (error) {
    console.error("❌ Factory test hatası:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test hatası:", error);
    process.exit(1);
  });