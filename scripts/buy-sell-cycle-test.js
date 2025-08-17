require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🔄 Starting Buy-Sell Cycle Test...");
    console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
    
    // Load deployment addresses
    const deploymentPath = path.join(__dirname, "..", "deployment-addresses.json");
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    // Connect to contracts
    const mockUSDC = await ethers.getContractAt("MockUSDT", deployment.mockUSDC);
    const w3m = await ethers.getContractAt("Web3Moon", deployment.web3moon);
    
    console.log("\n📊 Initial Contract State:");
    console.log("  W3M Address:", await w3m.getAddress());
    console.log("  USDC Address:", await mockUSDC.getAddress());
    
    // Get initial state
    const initialPrice = await w3m.getCurrentPrice();
    const initialSupply = await w3m.totalSupply();
    const initialUSDCPool = await w3m.totalUSDC();
    const initialOwnerW3M = await w3m.balanceOf(deployer.address);
    const initialOwnerUSDC = await mockUSDC.balanceOf(deployer.address);
    
    console.log("\n📈 Initial State:");
    console.log("  Price:", ethers.formatUnits(initialPrice, 18), "USDC per W3M");
    console.log("  Total Supply:", ethers.formatUnits(initialSupply, 18), "W3M");
    console.log("  USDC Pool:", ethers.formatUnits(initialUSDCPool, 6), "USDC");
    console.log("  Owner W3M:", ethers.formatUnits(initialOwnerW3M, 18), "W3M");
    console.log("  Owner USDC:", ethers.formatUnits(initialOwnerUSDC, 6), "USDC");
    
    // Check if we need to mint USDC
    const testAmount = "50000"; // Original test amount
    const requiredUSDC = ethers.parseUnits(testAmount, 6);
    if (initialOwnerUSDC < requiredUSDC) {
        console.log(`\n💵 Minting ${testAmount} USDC...`);
        const mintAmount = requiredUSDC - initialOwnerUSDC;
        await mockUSDC.mint(deployer.address, mintAmount);
        console.log("  ✅ Minted", ethers.formatUnits(mintAmount, 6), "USDC");
    }
    
    // Check and approve W3M contract if needed
    const currentAllowance = await mockUSDC.allowance(deployer.address, await w3m.getAddress());
    if (currentAllowance < requiredUSDC) {
        console.log("\n✅ Approving W3M contract...");
        const approveTx = await mockUSDC.approve(await w3m.getAddress(), ethers.MaxUint256);
        await approveTx.wait();
        console.log("  ✅ Approved!");
    } else {
        console.log("\n✅ W3M contract already approved!");
    }
    
    // STEP 1: Buy W3M with test amount USDC
    console.log(`\n💸 STEP 1: Buying W3M with ${testAmount} USDC...`);
    const buyAmount = ethers.parseUnits(testAmount, 6);
    
    const buyTx = await w3m.buyWithUSDC(buyAmount);
    const buyReceipt = await buyTx.wait();
    console.log("  ✅ Buy transaction confirmed!");
    console.log("  Gas used:", buyReceipt.gasUsed.toString());
    
    // Get state after buy
    const afterBuyPrice = await w3m.getCurrentPrice();
    const afterBuySupply = await w3m.totalSupply();
    const afterBuyUSDCPool = await w3m.totalUSDC();
    const afterBuyOwnerW3M = await w3m.balanceOf(deployer.address);
    const afterBuyOwnerUSDC = await mockUSDC.balanceOf(deployer.address);
    
    console.log("\n🔍 Debug Info:");
    console.log("  initialOwnerW3M:", ethers.formatUnits(initialOwnerW3M, 18));
    console.log("  afterBuyOwnerW3M:", ethers.formatUnits(afterBuyOwnerW3M, 18));
    console.log("  initialUSDCPool:", ethers.formatUnits(initialUSDCPool, 6));
    console.log("  afterBuyUSDCPool:", ethers.formatUnits(afterBuyUSDCPool, 6));
    console.log("  USDC Pool Increase:", ethers.formatUnits(afterBuyUSDCPool - initialUSDCPool, 6));
    
    // Calculate W3M received
    const w3mReceived = afterBuyOwnerW3M - initialOwnerW3M;
    
    console.log("\n📊 After Buy Results:");
    console.log("  New Price:", ethers.formatUnits(afterBuyPrice, 18), "USDC per W3M");
    console.log("  Price Increase:", ((Number(ethers.formatUnits(afterBuyPrice, 18)) / Number(ethers.formatUnits(initialPrice, 18)) - 1) * 100).toFixed(2), "%");
    console.log("  W3M Received by Owner:", ethers.formatUnits(w3mReceived, 18), "W3M");
    console.log("  Total W3M Minted:", ethers.formatUnits(afterBuySupply - initialSupply, 18), "W3M");
    console.log("  USDC Pool:", ethers.formatUnits(afterBuyUSDCPool, 6), "USDC");
    console.log("  Owner USDC Balance:", ethers.formatUnits(afterBuyOwnerUSDC, 6), "USDC");
    
    // Calculate value at current price
    const w3mValueAfterBuy = Number(ethers.formatUnits(w3mReceived, 18)) * Number(ethers.formatUnits(afterBuyPrice, 18));
    console.log("  W3M Value at Current Price:", w3mValueAfterBuy.toFixed(2), "USDC");
    
    // Wait a bit for clarity
    console.log("\n⏳ Waiting 3 seconds before selling...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // STEP 2: Sell all W3M
    console.log("\n💰 STEP 2: Selling all W3M tokens...");
    
    // If no new W3M was received, try to sell existing balance
    const w3mToSell = w3mReceived > 0 ? w3mReceived : afterBuyOwnerW3M;
    console.log("  W3M to sell:", ethers.formatUnits(w3mToSell, 18), "W3M");
    
    let sellReceipt;
    if (w3mToSell > 0) {
        const sellTx = await w3m.sellForUSDC(w3mToSell);
        sellReceipt = await sellTx.wait();
        console.log("  ✅ Sell transaction confirmed!");
        console.log("  Gas used:", sellReceipt.gasUsed.toString());
    } else {
        console.log("  ❌ No W3M tokens to sell!");
        return;
    }
    
    // Get final state
    const finalPrice = await w3m.getCurrentPrice();
    const finalSupply = await w3m.totalSupply();
    const finalUSDCPool = await w3m.totalUSDC();
    const finalOwnerW3M = await w3m.balanceOf(deployer.address);
    const finalOwnerUSDC = await mockUSDC.balanceOf(deployer.address);
    
    // Calculate USDC received from selling
    const usdcReceivedFromSell = finalOwnerUSDC - afterBuyOwnerUSDC;
    
    console.log("\n📊 After Sell Results:");
    console.log("  Final Price:", ethers.formatUnits(finalPrice, 18), "USDC per W3M");
    console.log("  Price Change from Buy:", ((Number(ethers.formatUnits(finalPrice, 18)) / Number(ethers.formatUnits(afterBuyPrice, 18)) - 1) * 100).toFixed(2), "%");
    console.log("  USDC Received from Sell:", ethers.formatUnits(usdcReceivedFromSell, 6), "USDC");
    console.log("  Final USDC Pool:", ethers.formatUnits(finalUSDCPool, 6), "USDC");
    console.log("  Final Owner W3M:", ethers.formatUnits(finalOwnerW3M, 18), "W3M");
    console.log("  Final Owner USDC:", ethers.formatUnits(finalOwnerUSDC, 6), "USDC");
    
    // Calculate net loss
    const investmentAmount = Number(testAmount);
    const netLoss = investmentAmount - Number(ethers.formatUnits(usdcReceivedFromSell, 6));
    const lossPercentage = (netLoss / investmentAmount) * 100;
    
    console.log("\n💸 BUY-SELL CYCLE SUMMARY:");
    console.log("=====================================");
    console.log("  Initial Investment:", `${testAmount} USDC`);
    console.log("  W3M Received:", ethers.formatUnits(w3mReceived, 18), "W3M");
    console.log("  USDC Received from Sell:", ethers.formatUnits(usdcReceivedFromSell, 6), "USDC");
    console.log("  Net Loss:", netLoss.toFixed(2), "USDC");
    console.log("  Loss Percentage:", lossPercentage.toFixed(2), "%");
    console.log("=====================================");
    
    // Check system wallets
    console.log("\n🏦 System Wallet Gains:");
    const referralGain = await w3m.balanceOf(deployment.referralWallet);
    const activeUsersGain = await w3m.balanceOf(deployment.activeUsersWallet);
    const stakingGain = await w3m.balanceOf(deployment.stakingRewardsWallet);
    
    console.log("  Referral Wallet:", ethers.formatUnits(referralGain, 18), "W3M");
    console.log("  Active Users Wallet:", ethers.formatUnits(activeUsersGain, 18), "W3M");
    console.log("  Staking Wallet:", ethers.formatUnits(stakingGain, 18), "W3M");
    
    console.log("\n🌊 Pool Gains:");
    let totalPoolGains = 0n;
    for (const pool of deployment.pools) {
        const balance = await w3m.balanceOf(pool.address);
        console.log(`  ${pool.name}:`, ethers.formatUnits(balance, 18), "W3M");
        totalPoolGains += balance;
    }
    console.log("  Total Pool Gains:", ethers.formatUnits(totalPoolGains, 18), "W3M");
    
    // Save results
    const results = {
        buyPhase: {
            investment: investmentAmount,
            w3mReceived: Number(ethers.formatUnits(w3mReceived, 18)),
            priceBeforeBuy: Number(ethers.formatUnits(initialPrice, 18)),
            priceAfterBuy: Number(ethers.formatUnits(afterBuyPrice, 18)),
            priceIncrease: ((Number(ethers.formatUnits(afterBuyPrice, 18)) / Number(ethers.formatUnits(initialPrice, 18)) - 1) * 100),
            usdcPoolAfterBuy: Number(ethers.formatUnits(afterBuyUSDCPool, 6))
        },
        sellPhase: {
            w3mSold: Number(ethers.formatUnits(w3mReceived, 18)),
            usdcReceived: Number(ethers.formatUnits(usdcReceivedFromSell, 6)),
            priceAfterSell: Number(ethers.formatUnits(finalPrice, 18)),
            priceChangeFromBuy: ((Number(ethers.formatUnits(finalPrice, 18)) / Number(ethers.formatUnits(afterBuyPrice, 18)) - 1) * 100),
            usdcPoolAfterSell: Number(ethers.formatUnits(finalUSDCPool, 6))
        },
        summary: {
            initialInvestment: investmentAmount,
            finalReturn: Number(ethers.formatUnits(usdcReceivedFromSell, 6)),
            netLoss: netLoss,
            lossPercentage: lossPercentage,
            totalGasUsed: (buyReceipt.gasUsed + sellReceipt.gasUsed).toString()
        },
        systemGains: {
            referral: Number(ethers.formatUnits(referralGain, 18)),
            activeUsers: Number(ethers.formatUnits(activeUsersGain, 18)),
            staking: Number(ethers.formatUnits(stakingGain, 18)),
            totalPools: Number(ethers.formatUnits(totalPoolGains, 18))
        },
        timestamp: new Date().toISOString()
    };
    
    const resultsPath = path.join(__dirname, "..", "buy-sell-cycle-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    console.log("\n✅ Buy-Sell cycle test completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });