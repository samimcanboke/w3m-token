const { expect } = require("chai");
const hre = require("hardhat");

describe("W3M Token Simulation", function () {
  let owner, user1, user2, w3m, usdc;
  const DECIMALS = 1e18;

  beforeEach(async () => {
    [owner, user1, user2] = await hre.ethers.getSigners();

    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    usdc = await MockUSDT.deploy(owner.address);
    await usdc.waitForDeployment();

    const W3MToken = await hre.ethers.getContractFactory("contracts/Web3Moon.sol:Web3Moon");
    w3m = await W3MToken.deploy(usdc.target);
    await w3m.waitForDeployment();

    // Set marketing wallet ve authorized signer
    await w3m.setReferralWallet(owner.address);
    
    // Pool ekle
    await w3m.addPool(owner.address, 100);

    await usdc.mint(user1.address, hre.ethers.parseUnits("1000", 18)); // USDC 18 decimals (MockUSDT)
    await usdc.connect(user1).approve(w3m.target, hre.ethers.parseUnits("10000", 18));
  });

  function format(bn) {
    return parseFloat(hre.ethers.formatUnits(bn, 18)).toFixed(6);
  }

  function formatUsdc(bn) {
    return parseFloat(hre.ethers.formatUnits(bn, 18)).toFixed(6);
  }

  async function logPrice(step) {
    const totalUSDC = await w3m.totalUSDC();
    const supply = await w3m.totalSupply();
    const price = await w3m.getCurrentPrice();
    console.log(`Step ${step}: Price: ${format(price)} USDC per W3M`);
  }

  it("runs 1 initial buy and 20 random buy/sell", async () => {
    console.log("🚀 Initial buy (100 USDC)");
    await w3m.connect(user1).buyWithUSDC(hre.ethers.parseUnits("100", 18), hre.ethers.ZeroAddress);
    await logPrice(0);

    for (let i = 1; i <= 20; i++) {
      const rand = Math.random();
      if (rand > 0.5) {
        const amount = Math.floor(Math.random() * 20) + 1;
        console.log(`🟢 Step ${i}: Buy ${amount} USDC`);
        await w3m.connect(user1).buyWithUSDC(hre.ethers.parseUnits(amount.toString(), 18), hre.ethers.ZeroAddress);
      } else {
        const balance = await w3m.balanceOf(user1.address);
        if (balance > 0n) {
          const percent = Math.random() * 0.1 + 0.01;
          const amountToSell = balance * BigInt(Math.floor(percent * 100)) / 100n;
          console.log(`🔴 Step ${i}: Sell ${format(amountToSell)} W3M`);
          await w3m.connect(user1).sellForUSDC(amountToSell);
        }
      }

      await logPrice(i);
    }
  });
});