const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Create 10 wallets for Web3Moon deployment
async function createWallets() {
    console.log("Creating 10 wallets for Web3Moon deployment...\n");
    
    const wallets = [];
    const walletInfo = [];
    
    // Create wallets with their respective names
    const walletNames = [
        "referral",
        "activeUsers", 
        "stakingRewards",
        "sunPool",
        "mercuryPool",
        "marsPool",
        "earthPool",
        "neptunePool",
        "saturnPool",
        "jupiterPool"
    ];
    
    // Pool weights (only for pool wallets)
    const poolWeights = {
        sunPool: 83,
        mercuryPool: 83,
        marsPool: 110,
        earthPool: 138,
        neptunePool: 138,
        saturnPool: 199,
        jupiterPool: 249
    };
    
    // Create each wallet
    for (const name of walletNames) {
        const wallet = ethers.Wallet.createRandom();
        
        const info = {
            name: name,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
            weight: poolWeights[name] || null
        };
        
        wallets.push(wallet);
        walletInfo.push(info);
        
        console.log(`${name}:`);
        console.log(`  Address: ${wallet.address}`);
        console.log(`  Private Key: ${wallet.privateKey}`);
        if (poolWeights[name]) {
            console.log(`  Pool Weight: ${poolWeights[name]}`);
        }
        console.log("");
    }
    
    // Save wallet info to file
    const outputPath = path.join(__dirname, "..", "deployment-wallets.json");
    fs.writeFileSync(outputPath, JSON.stringify(walletInfo, null, 2));
    console.log(`\nWallet information saved to: ${outputPath}`);
    
    // Create .env content
    let envContent = "\n# Web3Moon Deployment Wallets\n";
    walletInfo.forEach(info => {
        const envKey = info.name.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
        envContent += `${envKey}_ADDRESS=${info.address}\n`;
        envContent += `${envKey}_PRIVATE_KEY=${info.privateKey}\n`;
    });
    
    console.log("\n=== Add these to your .env file ===");
    console.log(envContent);
    
    // Calculate total pool weight
    const totalWeight = Object.values(poolWeights).reduce((sum, weight) => sum + weight, 0);
    console.log(`\nTotal Pool Weight: ${totalWeight}`);
    
    return walletInfo;
}

// Execute if run directly
if (require.main === module) {
    createWallets()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { createWallets };