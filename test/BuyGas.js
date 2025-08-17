const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * Basit gaz testi: 1.000 USDC ile parça‐alış işlemi
 */
describe("Buy gas", function () {
  let usdc, w3m, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdc = await MockUSDT.deploy(owner.address);
    await usdc.waitForDeployment();

    const Web3Moon = await ethers.getContractFactory("Web3Moon");
    w3m = await Web3Moon.deploy(usdc.target);
    await w3m.waitForDeployment();

    // En az bir pool ekle (aksi takdirde bölme sırasında division by zero olur)
    await w3m.addPool(owner.address, 1);

    // Owner'a yeterli USDC onayı
    await usdc.approve(w3m.target, ethers.parseUnits("1000000", 6));
  });

  it("chunks buy with 1000 USDC", async function () {
    const tx = await w3m.buyWithUSDC(ethers.parseUnits("1000", 6), ethers.ZeroAddress);
    await tx.wait();
    // Basit beklenti: Fiyat sıfırdan büyük, supply > 0
    expect(await w3m.totalSupply()).to.be.gt(0);
    expect(await w3m.getCurrentPrice()).to.be.gt(0);
  });
});
