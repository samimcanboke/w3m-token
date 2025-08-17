require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const W3M_ADDRESS = "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d";
  
  const w3mContract = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", W3M_ADDRESS);
  
  // Pool cüzdan adresleri (Hardhat test accounts)
  const pools = [
    { wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", weight: 20 },
    { wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", weight: 15 },
    { wallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", weight: 10 },
    { wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", weight: 5 }
  ];
  
  console.log("🏊 Adding pools to Web3Moon...\n");
  
  for (const pool of pools) {
    console.log(`📍 Adding pool: ${pool.wallet} with weight: ${pool.weight}`);
    const tx = await w3mContract.addPool(pool.wallet, pool.weight);
    await tx.wait();
    console.log(`✅ Pool added successfully!\n`);
  }
  
  const poolCount = await w3mContract.getPoolsCount();
  const totalWeight = await w3mContract.totalPoolWeight();
  
  console.log(`🎯 Total pools added: ${poolCount}`);
  console.log(`⚖️  Total pool weight: ${totalWeight}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 