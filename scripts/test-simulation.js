require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Generate random number between min and max
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Starting W3M Trading Simulation...");
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
    console.log("  Initial Price:", ethers.formatUnits(await w3m.getCurrentPrice(), 18), "USDC per W3M");
    
    // Create test wallets (between 50-100 wallets)
    const numWallets = Math.floor(randomBetween(50, 100));
    console.log(`\n👥 Creating ${numWallets} test wallets...`);
    
    const testWallets = [];
    for (let i = 0; i < numWallets; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        testWallets.push({
            wallet: wallet,
            address: wallet.address,
            usdcBalance: 0,
            w3mBalance: 0,
            totalUsdcSpent: 0,
            totalUsdcReceived: 0,
            trades: []
        });
    }
    
    // Fund wallets with BNB for gas
    console.log("\n💸 Funding wallets with BNB for gas...");
    const gasAmount = ethers.parseEther("0.005"); // 0.005 BNB per wallet
    
    for (let i = 0; i < testWallets.length; i++) {
        const tx = await deployer.sendTransaction({
            to: testWallets[i].address,
            value: gasAmount
        });
        await tx.wait();
        
        if (i % 10 === 0) {
            console.log(`  Funded ${i + 1}/${numWallets} wallets...`);
        }
    }
    
    // Mint and distribute USDC to test wallets
    console.log("\n💵 Minting and distributing USDC to test wallets...");
    const totalUsdcToMint = ethers.parseUnits("10000000", 6); // 10M USDC total
    await mockUSDC.mint(deployer.address, totalUsdcToMint);
    
    for (let i = 0; i < testWallets.length; i++) {
        // Random USDC amount between 1000 and 50000 USDC
        const usdcAmount = ethers.parseUnits(Math.floor(randomBetween(1000, 50000)).toString(), 6);
        await mockUSDC.transfer(testWallets[i].address, usdcAmount);
        testWallets[i].usdcBalance = Number(ethers.formatUnits(usdcAmount, 6));
        
        if (i % 10 === 0) {
            console.log(`  Distributed USDC to ${i + 1}/${numWallets} wallets...`);
        }
    }
    
    // Approve W3M contract to spend USDC for all wallets
    console.log("\n✅ Approving W3M contract to spend USDC...");
    for (let i = 0; i < testWallets.length; i++) {
        const wallet = testWallets[i].wallet;
        const usdcWithWallet = mockUSDC.connect(wallet);
        await usdcWithWallet.approve(await w3m.getAddress(), ethers.MaxUint256);
        
        if (i % 10 === 0) {
            console.log(`  Approved for ${i + 1}/${numWallets} wallets...`);
        }
    }
    
    // Trading simulation
    console.log("\n📈 Starting trading simulation...");
    const priceHistory = [{
        timestamp: Date.now(),
        price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
        totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
        totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
    }];
    
    // Phase 1: Initial buying wave (everyone buys)
    console.log("\n🌊 Phase 1: Initial buying wave...");
    for (let i = 0; i < testWallets.length; i++) {
        const walletData = testWallets[i];
        const wallet = walletData.wallet;
        const w3mWithWallet = w3m.connect(wallet);
        
        // Buy between 10% to 50% of their USDC balance
        const buyPercentage = randomBetween(0.1, 0.5);
        const buyAmount = ethers.parseUnits(
            Math.floor(walletData.usdcBalance * buyPercentage).toString(), 
            6
        );
        
        try {
            const tx = await w3mWithWallet.buyWithUSDC(buyAmount);
            await tx.wait();
            
            // Update wallet data
            const w3mBalance = await w3m.balanceOf(walletData.address);
            walletData.w3mBalance = Number(ethers.formatUnits(w3mBalance, 18));
            walletData.totalUsdcSpent += Number(ethers.formatUnits(buyAmount, 6));
            walletData.usdcBalance -= Number(ethers.formatUnits(buyAmount, 6));
            
            walletData.trades.push({
                type: 'BUY',
                usdcAmount: Number(ethers.formatUnits(buyAmount, 6)),
                w3mAmount: walletData.w3mBalance,
                price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                timestamp: Date.now()
            });
            
            if (i % 5 === 0) {
                console.log(`  ${i + 1}/${numWallets} wallets have bought...`);
                
                // Record price history
                priceHistory.push({
                    timestamp: Date.now(),
                    price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                    totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
                    totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
                });
            }
        } catch (error) {
            console.log(`  ❌ Wallet ${i} buy failed:`, error.message);
        }
    }
    
    // Phase 2: Mixed trading (some buy more, some sell)
    console.log("\n🔄 Phase 2: Mixed trading phase...");
    const numTrades = Math.floor(testWallets.length * 2); // 2x trades as number of wallets
    
    for (let i = 0; i < numTrades; i++) {
        // Pick random wallet
        const walletIndex = Math.floor(Math.random() * testWallets.length);
        const walletData = testWallets[walletIndex];
        const wallet = walletData.wallet;
        const w3mWithWallet = w3m.connect(wallet);
        
        // Decide action: 60% buy, 40% sell
        const action = Math.random() < 0.6 ? 'BUY' : 'SELL';
        
        try {
            if (action === 'BUY' && walletData.usdcBalance > 100) {
                // Buy between 5% to 30% of remaining USDC
                const buyPercentage = randomBetween(0.05, 0.3);
                const buyAmount = ethers.parseUnits(
                    Math.floor(walletData.usdcBalance * buyPercentage).toString(), 
                    6
                );
                
                const tx = await w3mWithWallet.buyWithUSDC(buyAmount);
                await tx.wait();
                
                // Update balances
                const newBalance = await w3m.balanceOf(walletData.address);
                const w3mReceived = Number(ethers.formatUnits(newBalance, 18)) - walletData.w3mBalance;
                walletData.w3mBalance = Number(ethers.formatUnits(newBalance, 18));
                walletData.totalUsdcSpent += Number(ethers.formatUnits(buyAmount, 6));
                walletData.usdcBalance -= Number(ethers.formatUnits(buyAmount, 6));
                
                walletData.trades.push({
                    type: 'BUY',
                    usdcAmount: Number(ethers.formatUnits(buyAmount, 6)),
                    w3mAmount: w3mReceived,
                    price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                    timestamp: Date.now()
                });
                
            } else if (action === 'SELL' && walletData.w3mBalance > 0) {
                // Sell between 10% to 50% of W3M holdings
                const sellPercentage = randomBetween(0.1, 0.5);
                const sellAmount = ethers.parseUnits(
                    (walletData.w3mBalance * sellPercentage).toFixed(18), 
                    18
                );
                
                const tx = await w3mWithWallet.sellForUSDC(sellAmount);
                await tx.wait();
                
                // Update balances
                const w3mSold = Number(ethers.formatUnits(sellAmount, 18));
                walletData.w3mBalance -= w3mSold;
                
                // Calculate USDC received
                const newUsdcBalance = await mockUSDC.balanceOf(walletData.address);
                const usdcReceived = Number(ethers.formatUnits(newUsdcBalance, 6)) - walletData.usdcBalance;
                walletData.usdcBalance = Number(ethers.formatUnits(newUsdcBalance, 6));
                walletData.totalUsdcReceived += usdcReceived;
                
                walletData.trades.push({
                    type: 'SELL',
                    usdcAmount: usdcReceived,
                    w3mAmount: w3mSold,
                    price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                    timestamp: Date.now()
                });
            }
            
            if (i % 10 === 0) {
                console.log(`  Completed ${i + 1}/${numTrades} trades...`);
                
                // Record price history
                priceHistory.push({
                    timestamp: Date.now(),
                    price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                    totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
                    totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
                });
            }
        } catch (error) {
            console.log(`  ❌ Trade ${i} failed:`, error.message);
        }
    }
    
    // Final state
    console.log("\n📊 Final State:");
    const finalPrice = await w3m.getCurrentPrice();
    console.log("  Final Price:", ethers.formatUnits(finalPrice, 18), "USDC per W3M");
    console.log("  Total Supply:", ethers.formatUnits(await w3m.totalSupply(), 18), "W3M");
    console.log("  Total USDC in Pool:", ethers.formatUnits(await w3m.totalUSDC(), 6), "USDC");
    
    // Calculate wallet profits/losses
    console.log("\n💰 Calculating wallet profits/losses...");
    const walletResults = [];
    
    for (const walletData of testWallets) {
        // Get final balances
        const finalW3mBalance = await w3m.balanceOf(walletData.address);
        const finalUsdcBalance = await mockUSDC.balanceOf(walletData.address);
        
        walletData.w3mBalance = Number(ethers.formatUnits(finalW3mBalance, 18));
        walletData.usdcBalance = Number(ethers.formatUnits(finalUsdcBalance, 6));
        
        // Calculate current W3M value in USDC
        const w3mValueInUsdc = walletData.w3mBalance * Number(ethers.formatUnits(finalPrice, 18));
        
        // Calculate net profit/loss
        const totalValue = walletData.usdcBalance + w3mValueInUsdc;
        const netSpent = walletData.totalUsdcSpent - walletData.totalUsdcReceived;
        const profit = totalValue - netSpent;
        const profitPercentage = (profit / netSpent) * 100;
        
        walletResults.push({
            address: walletData.address,
            trades: walletData.trades.length,
            totalUsdcSpent: walletData.totalUsdcSpent,
            totalUsdcReceived: walletData.totalUsdcReceived,
            finalUsdcBalance: walletData.usdcBalance,
            finalW3mBalance: walletData.w3mBalance,
            w3mValueInUsdc: w3mValueInUsdc,
            totalValue: totalValue,
            netProfit: profit,
            profitPercentage: profitPercentage
        });
    }
    
    // Sort by profit
    walletResults.sort((a, b) => b.netProfit - a.netProfit);
    
    // Show top performers
    console.log("\n🏆 Top 10 Performers:");
    for (let i = 0; i < Math.min(10, walletResults.length); i++) {
        const result = walletResults[i];
        console.log(`  ${i + 1}. Wallet ${result.address.substring(0, 8)}...`);
        console.log(`     Profit: $${result.netProfit.toFixed(2)} (${result.profitPercentage.toFixed(2)}%)`);
        console.log(`     Trades: ${result.trades}`);
    }
    
    // Show bottom performers
    console.log("\n📉 Bottom 10 Performers:");
    for (let i = Math.max(0, walletResults.length - 10); i < walletResults.length; i++) {
        const result = walletResults[i];
        console.log(`  ${i + 1}. Wallet ${result.address.substring(0, 8)}...`);
        console.log(`     Profit: $${result.netProfit.toFixed(2)} (${result.profitPercentage.toFixed(2)}%)`);
        console.log(`     Trades: ${result.trades}`);
    }
    
    // Overall statistics
    const totalProfit = walletResults.reduce((sum, r) => sum + r.netProfit, 0);
    const avgProfit = totalProfit / walletResults.length;
    const profitableWallets = walletResults.filter(r => r.netProfit > 0).length;
    
    console.log("\n📈 Overall Statistics:");
    console.log(`  Total Wallets: ${walletResults.length}`);
    console.log(`  Profitable Wallets: ${profitableWallets} (${(profitableWallets / walletResults.length * 100).toFixed(2)}%)`);
    console.log(`  Average Profit: $${avgProfit.toFixed(2)}`);
    console.log(`  Total Net Profit: $${totalProfit.toFixed(2)}`);
    
    // Price progression
    console.log("\n📊 Price Progression:");
    console.log(`  Initial Price: ${priceHistory[0].price.toFixed(6)} USDC`);
    console.log(`  Final Price: ${priceHistory[priceHistory.length - 1].price.toFixed(6)} USDC`);
    console.log(`  Price Increase: ${((priceHistory[priceHistory.length - 1].price / priceHistory[0].price - 1) * 100).toFixed(2)}%`);
    
    // Check contract balances
    console.log("\n🏦 Contract Balances:");
    console.log("  Referral Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.referralWallet), 18));
    console.log("  Active Users Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.activeUsersWallet), 18));
    console.log("  Staking Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.stakingRewardsWallet), 18));
    
    console.log("\n🌊 Pool Balances:");
    for (const pool of deployment.pools) {
        const balance = await w3m.balanceOf(pool.address);
        console.log(`  ${pool.name}: ${ethers.formatUnits(balance, 18)} W3M`);
    }
    
    // Save results
    const results = {
        summary: {
            numWallets: walletResults.length,
            profitableWallets: profitableWallets,
            profitablePercentage: (profitableWallets / walletResults.length * 100),
            averageProfit: avgProfit,
            totalNetProfit: totalProfit,
            initialPrice: priceHistory[0].price,
            finalPrice: priceHistory[priceHistory.length - 1].price,
            priceIncrease: ((priceHistory[priceHistory.length - 1].price / priceHistory[0].price - 1) * 100)
        },
        priceHistory: priceHistory,
        topPerformers: walletResults.slice(0, 10),
        bottomPerformers: walletResults.slice(-10),
        contractBalances: {
            referralWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.referralWallet), 18)),
            activeUsersWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.activeUsersWallet), 18)),
            stakingWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.stakingRewardsWallet), 18))
        },
        poolBalances: {},
        timestamp: new Date().toISOString()
    };
    
    for (const pool of deployment.pools) {
        const balance = await w3m.balanceOf(pool.address);
        results.poolBalances[pool.name] = Number(ethers.formatUnits(balance, 18));
    }
    
    const resultsPath = path.join(__dirname, "..", "simulation-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    console.log("\n✅ Simulation completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });