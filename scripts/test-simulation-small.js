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
    
    console.log("🚀 Starting W3M Trading Simulation (Small Scale)...");
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
    
    // Create fewer test wallets for smaller test
    const numWallets = 10; // Reduced from 50-100 to 10
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
    
    // Fund wallets with BNB for gas - reduced amount
    console.log("\n💸 Funding wallets with BNB for gas...");
    const gasAmount = ethers.parseEther("0.0001"); // Reduced from 0.005 to 0.0001 BNB per wallet
    
    for (let i = 0; i < testWallets.length; i++) {
        try {
            const tx = await deployer.sendTransaction({
                to: testWallets[i].address,
                value: gasAmount
            });
            await tx.wait();
            console.log(`  Funded wallet ${i + 1}/${numWallets}`);
        } catch (error) {
            console.log(`  ❌ Failed to fund wallet ${i + 1}:`, error.message);
        }
    }
    
    // First check deployer's USDC balance
    const deployerUsdcBalance = await mockUSDC.balanceOf(deployer.address);
    console.log("\n💵 Deployer USDC Balance:", ethers.formatUnits(deployerUsdcBalance, 6), "USDC");
    
    if (deployerUsdcBalance === 0n) {
        // Mint USDC to deployer first
        console.log("  Minting USDC to deployer...");
        const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
        await mockUSDC.mint(deployer.address, mintAmount);
        console.log("  ✅ Minted 1,000,000 USDC to deployer");
    }
    
    // Distribute USDC to test wallets
    console.log("\n💵 Distributing USDC to test wallets...");
    
    for (let i = 0; i < testWallets.length; i++) {
        try {
            // Random USDC amount between 1000 and 10000 USDC (reduced from 50000)
            const usdcAmount = ethers.parseUnits(Math.floor(randomBetween(1000, 10000)).toString(), 6);
            await mockUSDC.transfer(testWallets[i].address, usdcAmount);
            testWallets[i].usdcBalance = Number(ethers.formatUnits(usdcAmount, 6));
            console.log(`  Distributed ${testWallets[i].usdcBalance} USDC to wallet ${i + 1}`);
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
            await usdcWithWallet.approve(await w3m.getAddress(), ethers.MaxUint256);
            console.log(`  Approved for wallet ${i + 1}`);
        } catch (error) {
            console.log(`  ❌ Failed to approve for wallet ${i + 1}:`, error.message);
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
        
        // Buy between 10% to 30% of their USDC balance
        const buyPercentage = randomBetween(0.1, 0.3);
        const buyAmount = ethers.parseUnits(
            Math.floor(walletData.usdcBalance * buyPercentage).toString(), 
            6
        );
        
        try {
            console.log(`  Wallet ${i + 1} buying ${ethers.formatUnits(buyAmount, 6)} USDC worth of W3M...`);
            const tx = await w3mWithWallet.buyWithUSDC(buyAmount);
            await tx.wait();
            
            // Update wallet data
            const w3mBalance = await w3m.balanceOf(walletData.address);
            walletData.w3mBalance = Number(ethers.formatUnits(w3mBalance, 18));
            walletData.totalUsdcSpent += Number(ethers.formatUnits(buyAmount, 6));
            walletData.usdcBalance -= Number(ethers.formatUnits(buyAmount, 6));
            
            const currentPrice = Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18));
            walletData.trades.push({
                type: 'BUY',
                usdcAmount: Number(ethers.formatUnits(buyAmount, 6)),
                w3mAmount: walletData.w3mBalance,
                price: currentPrice,
                timestamp: Date.now()
            });
            
            console.log(`    ✅ Bought ${walletData.w3mBalance.toFixed(2)} W3M at price ${currentPrice.toFixed(6)}`);
            
            // Record price history
            priceHistory.push({
                timestamp: Date.now(),
                price: currentPrice,
                totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
                totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
            });
        } catch (error) {
            console.log(`  ❌ Wallet ${i + 1} buy failed:`, error.message);
        }
    }
    
    // Phase 2: Mixed trading (some buy more, some sell)
    console.log("\n🔄 Phase 2: Mixed trading phase...");
    const numTrades = 20; // 20 random trades
    
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
                // Buy between 5% to 20% of remaining USDC
                const buyPercentage = randomBetween(0.05, 0.2);
                const buyAmount = ethers.parseUnits(
                    Math.floor(walletData.usdcBalance * buyPercentage).toString(), 
                    6
                );
                
                console.log(`  Trade ${i + 1}: Wallet ${walletIndex + 1} buying ${ethers.formatUnits(buyAmount, 6)} USDC worth...`);
                const tx = await w3mWithWallet.buyWithUSDC(buyAmount);
                await tx.wait();
                
                // Update balances
                const newBalance = await w3m.balanceOf(walletData.address);
                const w3mReceived = Number(ethers.formatUnits(newBalance, 18)) - walletData.w3mBalance;
                walletData.w3mBalance = Number(ethers.formatUnits(newBalance, 18));
                walletData.totalUsdcSpent += Number(ethers.formatUnits(buyAmount, 6));
                walletData.usdcBalance -= Number(ethers.formatUnits(buyAmount, 6));
                
                const currentPrice = Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18));
                walletData.trades.push({
                    type: 'BUY',
                    usdcAmount: Number(ethers.formatUnits(buyAmount, 6)),
                    w3mAmount: w3mReceived,
                    price: currentPrice,
                    timestamp: Date.now()
                });
                
                console.log(`    ✅ Bought ${w3mReceived.toFixed(2)} W3M at price ${currentPrice.toFixed(6)}`);
                
            } else if (action === 'SELL' && walletData.w3mBalance > 0) {
                // Sell between 10% to 30% of W3M holdings
                const sellPercentage = randomBetween(0.1, 0.3);
                const sellAmount = ethers.parseUnits(
                    (walletData.w3mBalance * sellPercentage).toFixed(18), 
                    18
                );
                
                console.log(`  Trade ${i + 1}: Wallet ${walletIndex + 1} selling ${ethers.formatUnits(sellAmount, 18)} W3M...`);
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
                
                const currentPrice = Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18));
                walletData.trades.push({
                    type: 'SELL',
                    usdcAmount: usdcReceived,
                    w3mAmount: w3mSold,
                    price: currentPrice,
                    timestamp: Date.now()
                });
                
                console.log(`    ✅ Sold ${w3mSold.toFixed(2)} W3M for ${usdcReceived.toFixed(2)} USDC at price ${currentPrice.toFixed(6)}`);
            }
            
            // Record price history
            priceHistory.push({
                timestamp: Date.now(),
                price: Number(ethers.formatUnits(await w3m.getCurrentPrice(), 18)),
                totalSupply: Number(ethers.formatUnits(await w3m.totalSupply(), 18)),
                totalUSDC: Number(ethers.formatUnits(await w3m.totalUSDC(), 6))
            });
        } catch (error) {
            console.log(`  ❌ Trade ${i + 1} failed:`, error.message);
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
    
    for (let i = 0; i < testWallets.length; i++) {
        const walletData = testWallets[i];
        
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
            walletNumber: i + 1,
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
        
        console.log(`\n  Wallet ${i + 1}:`);
        console.log(`    Trades: ${walletData.trades.length}`);
        console.log(`    Final USDC: ${walletData.usdcBalance.toFixed(2)}`);
        console.log(`    Final W3M: ${walletData.w3mBalance.toFixed(2)} (worth ${w3mValueInUsdc.toFixed(2)} USDC)`);
        console.log(`    Net Profit: $${profit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`);
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
    const priceIncrease = priceHistory.length > 1 ? ((priceHistory[priceHistory.length - 1].price / priceHistory[0].price - 1) * 100) : 0;
    console.log(`  Price Increase: ${priceIncrease.toFixed(2)}%`);
    
    // Check contract balances
    console.log("\n🏦 Special Wallet Balances:");
    console.log("  Referral Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.referralWallet), 18));
    console.log("  Active Users Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.activeUsersWallet), 18));
    console.log("  Staking Wallet W3M:", ethers.formatUnits(await w3m.balanceOf(deployment.stakingRewardsWallet), 18));
    
    console.log("\n🌊 Pool Balances:");
    let totalPoolBalance = 0;
    for (const pool of deployment.pools) {
        const balance = await w3m.balanceOf(pool.address);
        const balanceNum = Number(ethers.formatUnits(balance, 18));
        totalPoolBalance += balanceNum;
        console.log(`  ${pool.name}: ${balanceNum.toFixed(2)} W3M (weight: ${pool.weight})`);
    }
    console.log(`  Total Pool Balance: ${totalPoolBalance.toFixed(2)} W3M`);
    
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
            priceIncrease: priceIncrease
        },
        priceHistory: priceHistory,
        walletResults: walletResults,
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
        results.poolBalances[pool.name] = {
            balance: Number(ethers.formatUnits(balance, 18)),
            weight: pool.weight
        };
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