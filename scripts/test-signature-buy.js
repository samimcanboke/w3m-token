const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer, account1, account2] = await ethers.getSigners();

  const usdcAddress = process.env.USDT_ADDRESS;
  const w3mAddress = process.env.W3M_ADDRESS;

  const usdc = await ethers.getContractAt("IERC20", usdcAddress);
  const w3m = await ethers.getContractAt("contracts/Web3Moon.sol:Web3Moon", w3mAddress);

  const buyAmount = ethers.parseUnits("100", 18); // 100 USDC
  
  // Marketing allocations
  const marketingAllocations = [
    { wallet: account1.address, amount: ethers.parseEther("1000") }, // 1000 W3M
    { wallet: account2.address, amount: ethers.parseEther("1500") }  // 1500 W3M
  ];
  
  // Create signature
  const timestamp = Math.floor(Date.now() / 1000);
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "uint256"],
    [deployer.address, buyAmount, marketingAllocations.length, timestamp]
  );
  
  // Sign with deployer (ki authorized signer olarak set edildi)
  const signature = await deployer.signMessage(ethers.getBytes(messageHash));
  
  console.log("📝 Signature created:");
  console.log("   Timestamp:", timestamp);
  console.log("   Message Hash:", messageHash);
  console.log("   Signature:", signature);

  console.log("\n🔓 Approving USDC...");
  const approveTx = await usdc.approve(w3mAddress, buyAmount);
  await approveTx.wait();

  console.log("🛒 Buying W3M with signature...");
  const buyTx = await w3m.buyWithUSDC(buyAmount, marketingAllocations, signature, timestamp);
  await buyTx.wait();
  
  console.log("✅ Buy successful with marketing allocations!");
  
  // Check balances
  console.log("\n📊 Final balances:");
  const deployerBalance = await w3m.balanceOf(deployer.address);
  const account1Balance = await w3m.balanceOf(account1.address);
  const account2Balance = await w3m.balanceOf(account2.address);
  
  console.log("Deployer W3M:", ethers.formatEther(deployerBalance));
  console.log("Account1 W3M (marketing):", ethers.formatEther(account1Balance));
  console.log("Account2 W3M (marketing):", ethers.formatEther(account2Balance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 