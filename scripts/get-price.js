const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const w3mAddress = process.env.W3M_ADDRESS;

  if (!w3mAddress) {
    throw new Error("W3M_ADDRESS .env dosyasında tanımlı değil.");
  }

  const w3mAbi = [
    "function getCurrentPrice() public view returns (uint256)",
  ];

  const w3m = new ethers.Contract(w3mAddress, w3mAbi, deployer);

  const price = await w3m.getCurrentPrice();
  console.log("📈 Current W3M Price:", ethers.formatUnits(price, 18), "USDT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});