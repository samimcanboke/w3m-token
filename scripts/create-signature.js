const { ethers } = require("ethers");

// Backend'de imza oluşturma örneği
async function createSignature(userAddress, usdcAmount, marketingAllocationsLength, timestamp, privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  
  // Kontrat'ta kullanılan aynı hash
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "uint256"],
    [userAddress, usdcAmount, marketingAllocationsLength, timestamp]
  );
  
  // İmzala
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  
  return signature;
}

// Kullanım örneği
async function main() {
  // Backend private key - GÜVENLİ SAKLAYIN!
  const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || "0x...";
  
  // Örnek parametreler
  const userAddress = "0x1234567890123456789012345678901234567890";
  const usdcAmount = ethers.parseUnits("100", 6); // 100 USDC
  const marketingAllocations = [
    { wallet: "0xAAA...", amount: ethers.parseEther("50") },
    { wallet: "0xBBB...", amount: ethers.parseEther("25") }
  ];
  const timestamp = Math.floor(Date.now() / 1000); // Current timestamp
  
  const signature = await createSignature(
    userAddress,
    usdcAmount,
    marketingAllocations.length,
    timestamp,
    BACKEND_PRIVATE_KEY
  );
  
  console.log("📝 Generated signature:", signature);
  console.log("⏰ Timestamp:", timestamp);
  console.log("💡 Bu imzayı frontend'e gönderin");
  
  // Frontend'de kullanım:
  console.log("\n🔥 Frontend kullanımı:");
  console.log(`await contract.buyWithUSDC(${ethers.formatUnits(usdcAmount, 6)}, marketingAllocations, "${signature}")`);
}

main().catch(console.error); 