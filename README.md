# 🌙 Web3Moon (W3M) Token

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-^0.8.20-green.svg)
![Network](https://img.shields.io/badge/network-BSC%20%7C%20ETH%20%7C%20Polygon-orange.svg)

**Web3Moon (W3M)** is a revolutionary ERC-20 token with a **monotonic price guarantee** - the price can only stay stable or increase, never decrease.

## 📍 Contract Address

**BSC Mainnet**: [`0xeee72fe36c7c1b818d5356020c777964dc0221a8`](https://bscscan.com/token/0xeee72fe36c7c1b818d5356020c777964dc0221a8)

⚠️ **Always verify the contract address before interacting with the token**

## 🎯 Core Features

### 💎 Unique Price Guarantee
- **Price Formula**: `price = totalUSDC / totalSupply`
- **Monotonic Price**: Price never decreases, only stays stable or increases
- **USDC Backed**: All transactions are conducted with USDC

### 🛡️ Security Features  
- **24-Hour Timelock**: 24-hour delay for critical operations
- **Emergency Limits**: Daily maximum 5% emergency withdrawal limit
- **Minimum Reserve**: 20% minimum reserve protection
- **Re-entrancy Protection**: Advanced security protections

### ⚡ Transaction Types
- **Buy**: Purchase W3M tokens with USDC
- **Sell**: Convert W3M tokens to USDC (92% return)
- **Pool Rewards**: Automatic pool distribution
- **Referral System**: Referral system support

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/samimcanboke/w3m-token.git
cd w3m-token

# Install dependencies  
npm install

# Create environment file
cp env.example .env
# Update .env file with your information
```

### Development Commands

```bash
# Compile smart contracts
npm run build

# Run tests
npm run test

# Test with gas reporting
npm run test:gas

# Coverage report
npm run test:coverage

# Fuzz testing
npm run test:fuzz
```

## 📋 Project Structure

```
w3m-token/
├── 📄 contracts/
│   ├── Web3Moon.sol          # Main W3M token contract
│   ├── MockUSDT.sol          # Mock USDC for testing
│   └── StakingPool.sol       # Staking pool contract
├── 🧪 test/
│   ├── Web3Moon.t.sol        # Foundry tests
│   └── echidna/              # Fuzz testing
├── 🚀 scripts/
│   ├── buy.js               # Token purchase
│   ├── sell.js              # Token selling
│   ├── deploy-w3m.js        # Contract deployment  
│   └── price-simulation.js   # Price simulation
├── 🎨 frontend/
│   └── components/
│       └── TimelockManager.tsx # Timelock management
├── 📚 docs/
│   └── GOVERNANCE.md         # Governance documentation
└── ⚙️ Configuration Files
```

## 💰 Token Economics

### Buy Transaction
```
Purchase with 100 USDC:
├── 90.0% → User (90 USDC worth of W3M)
├── 2.5% → Staking Rewards (2.5 USDC)
├── 2.5% → Pool Distribution (2.5 USDC)
├── 2.0% → Referral/Marketing (2 USDC)  
└── 3.0% → Active Users (3 USDC)
```

### Sell Transaction
```
W3M token sale:
├── 92% → User (in USDC)
└── 8% → Protocol (burned)
```

### Pool Distribution (2.5%)
```
Pool Distribution:
├── 40% → Liquidity Pool
├── 30% → Development Fund
└── 30% → Community Treasury
```

## 🔒 Security and Governance

### Timelock System
- **24-hour delay** for all critical operations
- **Transparent operations** - all scheduled operations are visible on-chain
- **Community protection** - major changes are announced in advance

### Emergency Protections
- **5% daily limit** - for emergency withdrawals
- **24-hour cooldown** - between consecutive emergency operations
- **20% minimum reserve** - never falls below this threshold

### Audit and Test Status
- ✅ **Comprehensive Testing** - Foundry + Echidna
- ✅ **Re-entrancy Protection** 
- ✅ **Integer Overflow Safe**
- ✅ **Price Manipulation Resistant**
- 🔄 **Professional Audit** - Planned

## 🛠️ Deployment

### Deploy to Test Networks

```bash
# Sepolia testnet deployment
npm run deploy:testnet

# Polygon Mumbai deployment  
NETWORK=mumbai npm run deploy:testnet
```

### Mainnet Deployment

```bash
# BSC Mainnet deployment
npm run deploy:mainnet

# Ethereum Mainnet deployment
NETWORK=mainnet npm run deploy:mainnet

# Polygon Mainnet deployment
NETWORK=polygon npm run deploy:mainnet
```

### Post-Deployment Operations

```bash
# Contract verification
npm run verify:mainnet

# First token purchase
node scripts/first-buy-mainnet.js

# Pool configuration check
node scripts/check-pools.js
```

## 📊 Scripts and Tools

### Token Operations
- `buy.js` - Token purchase
- `sell.js` - Token selling
- `buy-mainnet-10usd.js` - $10 purchase on mainnet
- `sell-mainnet-5usd.js` - $5 sale on mainnet

### Analysis and Simulation
- `price-simulation.js` - Price simulation
- `referral-simulation.js` - Referral system testing
- `test-simulation.js` - Comprehensive system testing
- `everyone-sells.js` - Mass selling simulation

### Management
- `create-wallets.js` - Create new wallets
- `fund-fresh-wallets.js` - Wallet funding
- `emergency-withdraw.js` - Emergency withdrawal operations

## 🎨 Frontend Integration

### TimelockManager Component

```typescript
import { TimelockManager } from './components/TimelockManager';

<TimelockManager 
  contract={w3mContract}
  account={userAddress}
  isOwner={isContractOwner}
/>
```

### Basic Integration

```javascript
// Contract Address (BSC Mainnet)
const W3M_CONTRACT_ADDRESS = "0xeee72fe36c7c1b818d5356020c777964dc0221a8";
const USDC_CONTRACT_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // BSC USDC

// Initialize contracts
const w3mContract = new ethers.Contract(W3M_CONTRACT_ADDRESS, w3mABI, signer);
const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, usdcABI, signer);

// Buy W3M Tokens
const buyW3M = async (usdcAmount) => {
  await usdcContract.approve(W3M_CONTRACT_ADDRESS, usdcAmount);
  await w3mContract.buyWithUSDC(usdcAmount, referrerAddress);
};

// Sell W3M Tokens
const sellW3M = async (w3mAmount) => {
  await w3mContract.sellForUSDC(w3mAmount);
};

// Get current price
const currentPrice = await w3mContract.getCurrentPrice();
```

## 📈 Monitoring and Analytics

### Key Metrics
- **Token Price**: Continuous price growth tracking
- **USDC Pool**: Reserve pool status  
- **Trading Volume**: Daily buy/sell volume
- **Holder Count**: Number of token holders

### Alert System
- 🚨 **Emergency Withdrawals** - Large withdrawals
- ⏰ **Timelock Operations** - Scheduled operations
- 📊 **Price Movements** - Abnormal price movements
- 🔒 **Security Events** - Security incidents

## 🤝 Contributing

### Development
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests and run them
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Security
- Report security vulnerabilities to **security@web3moon.org**
- Audit contributions and security reviews are welcome

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Warnings

```
⚠️ SECURITY DISCLAIMER ⚠️

1. Smart contracts are experimental technology
2. No system is 100% secure  
3. Only invest what you can afford to lose
4. This code is provided "as-is" without warranties
5. Users are responsible for their own due diligence
```

### Audit Status
- 🔍 **Internal Audit**: Completed ✅
- 🧪 **Fuzz Testing**: Comprehensive ✅  
- 👥 **Community Review**: Ongoing ✅
- 🏢 **Professional Audit**: Planned 📅

---

## 🔗 Links

### Official Links
- **Website**: https://moon.web3connect.ai/
- **Documentation**: https://moon-doc.web3connect.ai/docs/welcome
- **GitHub**: https://github.com/samimcanboke/w3m-token

### Community
- **Discord**: [Community Discord]
- **Twitter**: [@Web3Moon]

### Contract Information
- **BSC Contract**: https://bscscan.com/token/0xeee72fe36c7c1b818d5356020c777964dc0221a8
- **Contract Address**: `0xeee72fe36c7c1b818d5356020c777964dc0221a8`

---

**Web3Moon - The Token That Only Goes Up! 🌙🚀**

*For questions, support, or contributions, please reach out through our GitHub issues or community channels.*
