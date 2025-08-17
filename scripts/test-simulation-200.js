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
    
    console.log("🚀 Starting W3M Trading Simulation (200 Trades)...");
    console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
    
    // Load deployment addresses and big buy results
    const deploymentPath = path.join(__dirname, "..", "deployment-addresses.json");
    const bigBuyPath = path.join(__dirname, "..", "big-buy-results.json");
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const bigBuyResults = JSON.parse(fs.readFileSync(bigBuyPath, "utf8"));
    
    // Connect to contracts
    const mockUSDC = await ethers.getContractAt("MockUSDT", deployment.mockUSDC);
    const w3m = await ethers.getContractAt("Web3Moon", deployment.web3moon);
    
    console.log("\n📊 Contract State After Big Buy:");
    console.log("  W3M Address:", await w3m.getAddress());
    console.log("  USDC Address:", await mockUSDC.getAddress());
    console.log("  Current Price:", ethers.formatUnits(await w3m.getCurrentPrice(), 18), "USDC per W3M");
    console.log("  Owner's W3M Balance:", bigBuyResults.tokensReceived.owner, "W3M");
    console.log("  Price increase from big buy:", bigBuyResults.priceImpact.increasePercentage.toFixed(2), "%");
    
    // Create test wallets (20-30 wallets for 200 trades)
    const numWallets = Math.floor(randomBetween(20, 30));
    console.log(`\n👥 Creating ${numWallets} test wallets for 200 trades...`);
    
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
    const gasAmount = ethers.parseEther("0.0002"); // 0.0002 BNB per wallet for more trades
    
    for (let i = 0; i < testWallets.length; i++) {
        try {
            const tx = await deployer.sendTransaction({
                to: testWallets[i].address,
                value: gasAmount
            });
            await tx.wait();
            if (i % 5 === 0) {
                console.log(`  Funded ${i + 1}/${numWallets} wallets...`);
            }
        } catch (error) {
            console.log(`  ❌ Failed to fund wallet ${i + 1}:`, error.message);
        }
    }
    
    // Distribute USDC to test wallets
    console.log("\n💵 Distributing USDC to test wallets...");
    
    for (let i = 0; i < testWallets.length; i++) {
        try {
            // Random USDC amount between 2000 and 15000 USDC
            const usdcAmount = ethers.parseUnits(Math.floor(randomBetween(2000, 15000)).toString(), 6);
            await mockUSDC.transfer(testWallets[i].address, usdcAmount);
            testWallets[i].usdcBalance = Number(ethers.formatUnits(usdcAmount, 6));
            
            if (i % 5 === 0) {
                console.log(`  Distributed USDC to ${i + 1}/${numWallets} wallets...`);
            }
        } catch (error) {
            console.log(`  ❌ Failed to distribute USDC to wallet ${i + 1}:`, error.message);
        }
    }
    
    // Approve W3M contract to spend USDC for all wallets
    console.log("\n✅ Approving W3M contract to spend USDC...");
    for (let i = 0; i < testWallets.length; i++) {
        try {
            const wallet = testWallets[i].wallet;
            const usdcWithWallet = mockUSDC.connect(wallet);
            const approveTx = await usdcWithWallet.approve(await w3m.getAddress(), ethers.MaxUint256);
            await approveTx.wait();
            
            if (i % 5 === 0) {
                console.log(`  Approved for ${i + 1}/${numWallets} wallets...`);
            }
        } catch (error) {
            console.log(`  ❌ Failed to approve for wallet ${i + 1}:`, error.message);
        }
    }
    
    // Trading simulation
    console.log("\n📈 Starting trading simulation with 200 trades...");
    const priceHistory = [{
        timestamp: Date.now(),
        price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
        totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
        totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
    }];
    
    // Track owner's initial state
    const ownerInitialW3M = await w3m.balanceOf(deployer.address);
    const ownerInitialUSDC = await mockUSDC.balanceOf(deployer.address);
    console.log("\n💼 Owner's Initial Balances:");
    console.log("  W3M:", ethers.formatUnits(ownerInitialW3M, 18));
    console.log("  USDC:", ethers.formatUnits(ownerInitialUSDC, 6));
    
    // Phase 1: Initial buying wave (everyone buys small amounts)
    console.log("\n🌊 Phase 1: Initial buying wave...");
    for (let i = 0; i < testWallets.length; i++) {
        const walletData = testWallets[i];
        const wallet = walletData.wallet;
        const w3mWithWallet = w3m.connect(wallet);
        
        // Buy between 5% to 15% of their USDC balance
        const buyPercentage = randomBetween(0.05, 0.15);
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
    
    // Phase 2: 200 mixed trades
    console.log("\n🔄 Phase 2: 200 mixed trades...");
    let successfulTrades = 0;
    let buyTrades = 0;
    let sellTrades = 0;
    
    for (let i = 0; i < 200; i++) {
        // Pick random wallet
        const walletIndex = Math.floor(Math.random() * testWallets.length);
        const walletData = testWallets[walletIndex];
        const wallet = walletData.wallet;
        const w3mWithWallet = w3m.connect(wallet);
        
        // Decide action: 55% buy, 45% sell (slightly more buying pressure)
        const action = Math.random() < 0.55 ? 'BUY' : 'SELL';
        
        try {
            if (action === 'BUY' && walletData.usdcBalance > 100) {
                // Buy between 3% to 15% of remaining USDC
                const buyPercentage = randomBetween(0.03, 0.15);
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
                
                buyTrades++;
                successfulTrades++;
                
            } else if (action === 'SELL' && walletData.w3mBalance > 0) {
                // Sell between 10% to 40% of W3M holdings
                const sellPercentage = randomBetween(0.1, 0.4);
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
                
                sellTrades++;
                successfulTrades++;
            }
            
            if (successfulTrades % 10 === 0) {
                console.log(`  Completed ${successfulTrades}/200 trades (${buyTrades} buys, ${sellTrades} sells)...`);
                
                // Record price history
                priceHistory.push({
                    timestamp: Date.now(),
                    price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                    totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
                    totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
                });
            }
        } catch (error) {
            console.log(`  ❌ Trade ${i + 1} failed:`, error.message);
        }
    }
    
    console.log(`\n✅ Completed ${successfulTrades} successful trades (${buyTrades} buys, ${sellTrades} sells)`);
    
    // Final state
    console.log("\n📊 Final State:");
    const finalPrice = await w3m.getCurrentPrice();
    console.log("  Final Price:", ethers.formatUnits(finalPrice, 18), "USDC per W3M");
    console.log("  Total Supply:", ethers.formatUnits(await w3m.totalSupply(), 18), "W3M");
    console.log("  Total USDC in Pool:", ethers.formatUnits(await w3m.totalUSDC(), 6), "USDC");
    
    // Check owner's final state
    const ownerFinalW3M = await w3m.balanceOf(deployer.address);
    const ownerFinalUSDC = await mockUSDC.balanceOf(deployer.address);
    console.log("\n💼 Owner's Final Balances:");
    console.log("  W3M:", ethers.formatUnits(ownerFinalW3M, 18));
    console.log("  USDC:", ethers.formatUnits(ownerFinalUSDC, 6));
    
    // Calculate owner's profit/loss
    const ownerW3MValue = Number(ethers.formatUnits(ownerFinalW3M, 18)) * Number(ethers.formatUnits(finalPrice, 18));
    const ownerInitialInvestment = 50000; // From big buy
    const ownerNetProfit = ownerW3MValue - ownerInitialInvestment;
    const ownerROI = (ownerW3MValue / ownerInitialInvestment - 1) * 100;
    
    console.log("\n💰 Owner's Investment Analysis:");
    console.log("  Initial Investment:", ownerInitialInvestment, "USDC");
    console.log("  Current W3M Value:", ownerW3MValue.toFixed(2), "USDC");
    console.log("  Net Profit/Loss:", ownerNetProfit.toFixed(2), "USDC");
    console.log("  ROI:", ownerROI.toFixed(2), "%");
    
    // Calculate wallet profits/losses
    console.log("\n💰 Calculating all wallet profits/losses...");
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
        const profitPercentage = netSpent > 0 ? (profit / netSpent) * 100 : 0;
        
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
    console.log("\n🏆 Top 5 Performers:");
    for (let i = 0; i < Math.min(5, walletResults.length); i++) {
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
    console.log(`  Total Test Wallets: ${walletResults.length}`);
    console.log(`  Profitable Wallets: ${profitableWallets} (${(profitableWallets / walletResults.length * 100).toFixed(2)}%)`);
    console.log(`  Average Profit: $${avgProfit.toFixed(2)}`);
    console.log(`  Total Net Profit: $${totalProfit.toFixed(2)}`);
    
    // Price progression
    console.log("\n📊 Price Progression:");
    console.log(`  Price After Big Buy: ${bigBuyResults.finalState.price.toFixed(6)} USDC`);
    console.log(`  Final Price: ${priceHistory[priceHistory.length - 1].price.toFixed(6)} USDC`);
    const totalPriceIncrease = ((priceHistory[priceHistory.length - 1].price / bigBuyResults.initialState.price - 1) * 100);
    console.log(`  Total Price Increase: ${totalPriceIncrease.toFixed(2)}%`);
    
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
        bigBuyInfo: {
            initialInvestment: 50000,
            tokensReceived: bigBuyResults.tokensReceived.owner,
            priceAfterBigBuy: bigBuyResults.finalState.price
        },
        ownerAnalysis: {
            initialW3M: Number(ethers.formatUnits(ownerInitialW3M, 18)),
            finalW3M: Number(ethers.formatUnits(ownerFinalW3M, 18)),
            w3mValue: ownerW3MValue,
            netProfit: ownerNetProfit,
            roi: ownerROI
        },
        tradingSummary: {
            totalTrades: successfulTrades,
            buyTrades: buyTrades,
            sellTrades: sellTrades,
            numWallets: walletResults.length,
            profitableWallets: profitableWallets,
            profitablePercentage: (profitableWallets / walletResults.length * 100),
            averageProfit: avgProfit,
            totalNetProfit: totalProfit
        },
        priceProgression: {
            initialPrice: bigBuyResults.initialState.price,
            priceAfterBigBuy: bigBuyResults.finalState.price,
            finalPrice: priceHistory[priceHistory.length - 1].price,
            totalIncrease: totalPriceIncrease,
            priceHistory: priceHistory
        },
        topPerformers: walletResults.slice(0, 5),
        contractBalances: {
            referralWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.referralWallet), 18)),
            activeUsersWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.activeUsersWallet), 18)),
            stakingWallet: Number(ethers.formatUnits(await w3m.balanceOf(deployment.stakingRewardsWallet), 18))
        },
        timestamp: new Date().toISOString()
    };
    
    const resultsPath = path.join(__dirname, "..", "simulation-200-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    console.log("\n✅ 200-trade simulation completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });