const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const mockUsdtAddress = process.env.USDT_ADDRESS;
  const w3mAddress = process.env.W3M_ADDRESS;

  console.log("w3m address", w3mAddress);
  console.log("mockUsdtAddress", mockUsdtAddress);
  console.log("deployer", deployer.address);

  const usdt = await ethers.getContractAt("IERC20", mockUsdtAddress);

  // Sadece initializePrice ve priceInitialized için minimal ABI
  const w3mAbi = [
    "function priceInitialized() public view returns (bool)",
    "function initializePrice(uint256 usdtAmount) external",
  ];
  const w3m = new ethers.Contract(w3mAddress, w3mAbi, deployer);

  console.log("👤 Deployer:", deployer.address);
  const balance = await usdt.balanceOf(deployer.address);
  console.log("💰 USDT Balance:", balance.toString());

  const amount = ethers.parseUnits("100", 18);

  const allowance = await usdt.allowance(deployer.address, w3mAddress);
  console.log("📑 Current Allowance:", allowance.toString());

  const isInitialized = await w3m.priceInitialized();
  console.log("🚦 Already Initialized?", isInitialized);

  if (isInitialized) {
    console.log("⛔ Price already initialized.");
    return;
  }

  if (allowance < amount) {
    console.log(`🔓 Approving ${amount.toString()} USDT...`);
    const tx1 = await usdt.approve(w3mAddress, amount);
    await tx1.wait();
  }

  console.log(`🚀 Initializing price with ${amount.toString()} USDT...`);
  const tx2 = await w3m.initializePrice(amount);
  await tx2.wait();

  console.log("✅ Price initialized!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});