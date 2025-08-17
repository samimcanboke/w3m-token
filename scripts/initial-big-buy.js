require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Starting Initial Big Buy Simulation...");
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
    const initialOwnerBalance = await w3m.balanceOf(deployer.address);
    
    console.log("\n📈 Initial Metrics:");
    console.log("  Initial Price:", ethers.formatUnits(initialPrice, 18), "USDC per W3M");
    console.log("  Initial Supply:", ethers.formatUnits(initialSupply, 18), "W3M");
    console.log("  Initial USDC Pool:", ethers.formatUnits(initialUSDCPool, 6), "USDC");
    console.log("  Owner W3M Balance:", ethers.formatUnits(initialOwnerBalance, 18), "W3M");
    
    // Check deployer's USDC balance
    let deployerUsdcBalance = await mockUSDC.balanceOf(deployer.address);
    console.log("\n💵 Deployer USDC Balance:", ethers.formatUnits(deployerUsdcBalance, 6), "USDC");
    
    // If not enough USDC, mint more
    const requiredUSDC = ethers.parseUnits("50000", 6); // 50,000 USDC
    if (deployerUsdcBalance < requiredUSDC) {
        console.log("  Minting additional USDC...");
        const mintAmount = requiredUSDC - deployerUsdcBalance;
        await mockUSDC.mint(deployer.address, mintAmount);
        deployerUsdcBalance = await mockUSDC.balanceOf(deployer.address);
        console.log("  ✅ New USDC Balance:", ethers.formatUnits(deployerUsdcBalance, 6), "USDC");
    }
    
    // Approve W3M contract
    console.log("\n✅ Approving W3M contract to spend USDC...");
    const approveTx = await mockUSDC.approve(await w3m.getAddress(), ethers.MaxUint256);
    await approveTx.wait();
    console.log("  ✅ Approved!");
    
    // Make the big buy
    console.log("\n💸 Making 50,000 USDC purchase...");
    const buyAmount = ethers.parseUnits("50000", 6);
    
    const tx = await w3m.buyWithUSDC(buyAmount);
    const receipt = await tx.wait();
    console.log("  ✅ Transaction confirmed!");
    console.log("  Gas used:", receipt.gasUsed.toString());
    
    // Get final state
    const finalPrice = await w3m.getCurrentPrice();
    const finalSupply = await w3m.totalSupply();
    const finalUSDCPool = await w3m.totalUSDC();
    const finalOwnerBalance = await w3m.balanceOf(deployer.address);
    
    // Calculate tokens received
    const tokensReceived = finalOwnerBalance - initialOwnerBalance;
    const totalTokensMinted = finalSupply - initialSupply;
    
    console.log("\n📊 Transaction Results:");
    console.log("  USDC Spent:", ethers.formatUnits(buyAmount, 6), "USDC");
    console.log("  W3M Received by Owner:", ethers.formatUnits(tokensReceived, 18), "W3M");
    console.log("  Total W3M Minted:", ethers.formatUnits(totalTokensMinted, 18), "W3M");
    
    console.log("\n💹 Price Impact:");
    console.log("  Initial Price:", ethers.formatUnits(initialPrice, 18), "USDC");
    console.log("  Final Price:", ethers.formatUnits(finalPrice, 18), "USDC");
    const priceIncrease = Number(ethers.formatUnits(finalPrice, 18)) / Number(ethers.formatUnits(initialPrice, 18)) - 1;
    console.log("  Price Increase:", (priceIncrease * 100).toFixed(2), "%");
    
    console.log("\n🏦 Token Distribution:");
    // Calculate distribution percentages
    const userPercentage = 90; // User gets 90%
    const poolPercentage = 2.5;
    const stakingPercentage = 2.5;
    const marketingPercentage = 2;
    const activeUsersPercentage = 0.5;
    
    const expectedUserTokens = (totalTokensMinted * 900n) / 975n;
    const expectedPoolTokens = (totalTokensMinted * 25n) / 975n;
    const expectedStakingTokens = (totalTokensMinted * 25n) / 975n;
    const expectedMarketingTokens = (totalTokensMinted * 20n) / 975n;
    const expectedActiveUsersTokens = (totalTokensMinted * 5n) / 975n;
    
    console.log("  Expected Distribution:");
    console.log("    - User (90%):", ethers.formatUnits(expectedUserTokens, 18), "W3M");
    console.log("    - Pools (2.5%):", ethers.formatUnits(expectedPoolTokens, 18), "W3M");
    console.log("    - Staking (2.5%):", ethers.formatUnits(expectedStakingTokens, 18), "W3M");
    console.log("    - Marketing (2%):", ethers.formatUnits(expectedMarketingTokens, 18), "W3M");
    console.log("    - Active Users (0.5%):", ethers.formatUnits(expectedActiveUsersTokens, 18), "W3M");
    
    // Check actual balances
    console.log("\n🔍 Checking Actual Balances:");
    const referralBalance = await w3m.balanceOf(deployment.referralWallet);
    const activeUsersBalance = await w3m.balanceOf(deployment.activeUsersWallet);
    const stakingBalance = await w3m.balanceOf(deployment.stakingRewardsWallet);
    
    console.log("  Referral Wallet:", ethers.formatUnits(referralBalance, 18), "W3M");
    console.log("  Active Users Wallet:", ethers.formatUnits(activeUsersBalance, 18), "W3M");
    console.log("  Staking Wallet:", ethers.formatUnits(stakingBalance, 18), "W3M");
    
    console.log("\n🌊 Pool Balances:");
    let totalPoolBalance = 0n;
    for (const pool of deployment.pools) {
        const balance = await w3m.balanceOf(pool.address);
        console.log(`  ${pool.name}:`, ethers.formatUnits(balance, 18), `W3M (weight: ${pool.weight})`);
        totalPoolBalance += balance;
    }
    console.log("  Total Pool Balance:", ethers.formatUnits(totalPoolBalance, 18), "W3M");
    
    // Calculate value at current price
    console.log("\n💰 Current Values (at", ethers.formatUnits(finalPrice, 18), "USDC per W3M):");
    const ownerW3MValue = Number(ethers.formatUnits(tokensReceived, 18)) * Number(ethers.formatUnits(finalPrice, 18));
    console.log("  Owner's W3M Value:", ownerW3MValue.toFixed(2), "USDC");
    console.log("  Instant Profit/Loss:", (ownerW3MValue - 50000).toFixed(2), "USDC");
    console.log("  ROI:", ((ownerW3MValue / 50000 - 1) * 100).toFixed(2), "%");
    
    // Save results
    const results = {
        initialState: {
            price: Number(ethers.formatUnits(initialPrice, 18)),
            supply: Number(ethers.formatUnits(initialSupply, 18)),
            usdcPool: Number(ethers.formatUnits(initialUSDCPool, 6))
        },
        transaction: {
            usdcSpent: 50000,
            gasUsed: receipt.gasUsed.toString()
        },
        finalState: {
            price: Number(ethers.formatUnits(finalPrice, 18)),
            supply: Number(ethers.formatUnits(finalSupply, 18)),
            usdcPool: Number(ethers.formatUnits(finalUSDCPool, 6))
        },
        tokensReceived: {
            owner: Number(ethers.formatUnits(tokensReceived, 18)),
            totalMinted: Number(ethers.formatUnits(totalTokensMinted, 18))
        },
        priceImpact: {
            initialPrice: Number(ethers.formatUnits(initialPrice, 18)),
            finalPrice: Number(ethers.formatUnits(finalPrice, 18)),
            increasePercentage: priceIncrease * 100
        },
        walletBalances: {
            referral: Number(ethers.formatUnits(referralBalance, 18)),
            activeUsers: Number(ethers.formatUnits(activeUsersBalance, 18)),
            staking: Number(ethers.formatUnits(stakingBalance, 18)),
            totalPools: Number(ethers.formatUnits(totalPoolBalance, 18))
        },
        roi: {
            w3mValue: ownerW3MValue,
            profit: ownerW3MValue - 50000,
            percentage: (ownerW3MValue / 50000 - 1) * 100
        },
        timestamp: new Date().toISOString()
    };
    
    const resultsPath = path.join(__dirname, "..", "big-buy-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    console.log("\n✅ Initial big buy completed! Ready for 200-trade simulation.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });