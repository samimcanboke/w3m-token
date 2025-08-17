# 🌙 Web3Moon (W3M) Token

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-^0.8.20-green.svg)
![Network](https://img.shields.io/badge/network-BSC%20%7C%20ETH%20%7C%20Polygon-orange.svg)

**Web3Moon (W3M)** is a revolutionary ERC-20 token with a **monotonic price guarantee** - the price can only stay stable or increase, never decrease.

## 🎯 Temel Özellikler

### 💎 Benzersiz Fiyat Garantisi
- **Fiyat Formülü**: `price = totalUSDC / totalSupply`
- **Monotonic Fiyat**: Fiyat asla düşmez, sadece sabit kalır veya yükselir
- **USDC Destekli**: Tüm işlemler USDC ile yapılır

### 🛡️ Güvenlik Özellikleri  
- **24 Saatlik Timelock**: Kritik işlemler için 24 saat gecikme
- **Emergency Limits**: Günlük max %5 acil çekim limiti
- **Minimum Reserve**: %20 minimum rezerv koruması
- **Re-entrancy Protection**: Gelişmiş güvenlik korumaları

### ⚡ İşlem Türleri
- **Buy**: USDC ile W3M token satın alma
- **Sell**: W3M token'ları USDC'ye çevirme (%92 geri dönüş)
- **Pool Rewards**: Otomatik pool dağıtımı
- **Referral System**: Referans sistemi desteği

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/samimcanboke/w3m-token.git
cd w3m-token

# Dependencies yükleyin  
npm install

# Environment dosyasını oluşturun
cp env.example .env
# .env dosyasını kendi bilgilerinizle güncelleyin
```

### Geliştirme Komutları

```bash
# Smart contract'ları derle
npm run build

# Testleri çalıştır
npm run test

# Gas raporlu test
npm run test:gas

# Coverage raporu
npm run test:coverage

# Fuzz testing
npm run test:fuzz
```

## 📋 Proje Yapısı

```
w3m-token/
├── 📄 contracts/
│   ├── Web3Moon.sol          # Ana W3M token contract'ı
│   ├── MockUSDT.sol          # Test için mock USDC
│   └── StakingPool.sol       # Staking pool contract'ı
├── 🧪 test/
│   ├── Web3Moon.t.sol        # Foundry testleri
│   └── echidna/              # Fuzz testing
├── 🚀 scripts/
│   ├── buy.js               # Token satın alma
│   ├── sell.js              # Token satış
│   ├── deploy-w3m.js        # Contract deployment  
│   └── price-simulation.js   # Fiyat simülasyonu
├── 🎨 frontend/
│   └── components/
│       └── TimelockManager.tsx # Timelock yönetimi
├── 📚 docs/
│   └── GOVERNANCE.md         # Governance dokümantasyonu
└── ⚙️ Configuration Files
```

## 💰 Token Ekonomisi

### Alış İşlemi (Buy)
```
100 USDC ile alım:
├── 90.0% → User (90 USDC değerinde W3M)
├── 2.5% → Staking Rewards (2.5 USDC)
├── 2.5% → Pool Distribution (2.5 USDC)
├── 2.0% → Referral/Marketing (2 USDC)  
└── 3.0% → Active Users (3 USDC)
```

### Satış İşlemi (Sell)
```
W3M token satışında:
├── 92% → User (USDC olarak)
└── 8% → Protocol (yakılır)
```

### Pool Dağıtımı (2.5%)
```
Pool Distribution:
├── 40% → Liquidity Pool
├── 30% → Development Fund
└── 30% → Community Treasury
```

## 🔒 Güvenlik ve Governance

### Timelock Sistemi
- **24 saatlik gecikme** tüm kritik işlemlerde
- **Şeffaf işlemler** - tüm scheduled işlemler on-chain görünür
- **Community koruması** - büyük değişiklikler önceden duyurulur

### Acil Durum Korumaları
- **%5 günlük limit** - acil çekimler için
- **24 saat cooldown** - ardışık acil işlemler arasında
- **%20 minimum rezerv** - asla altına düşmez

### Audit ve Test Durumu
- ✅ **Comprehensive Testing** - Foundry + Echidna
- ✅ **Re-entrancy Protection** 
- ✅ **Integer Overflow Safe**
- ✅ **Price Manipulation Resistant**
- 🔄 **Professional Audit** - Planlanmış

## 🛠️ Deployment

### Test Network'e Deploy

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

### Deployment Sonrası İşlemler

```bash
# Contract verification
npm run verify:mainnet

# İlk token alımı
node scripts/first-buy-mainnet.js

# Pool konfigürasyonu kontrolü
node scripts/check-pools.js
```

## 📊 Script'ler ve Araçlar

### Token İşlemleri
- `buy.js` - Token satın alma
- `sell.js` - Token satma
- `buy-mainnet-10usd.js` - Mainnet'te $10 alım
- `sell-mainnet-5usd.js` - Mainnet'te $5 satış

### Analiz ve Simülasyon
- `price-simulation.js` - Fiyat simülasyonu
- `referral-simulation.js` - Referral sistemi testi
- `test-simulation.js` - Kapsamlı sistem testi
- `everyone-sells.js` - Toplu satış simülasyonu

### Yönetim
- `create-wallets.js` - Yeni wallet oluşturma
- `fund-fresh-wallets.js` - Wallet funding
- `emergency-withdraw.js` - Acil çekim işlemi

## 🎨 Frontend Entegrasyonu

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
// W3M Token satın alma
const buyW3M = async (usdcAmount) => {
  await usdcContract.approve(w3mAddress, usdcAmount);
  await w3mContract.buyWithUSDC(usdcAmount, referrerAddress);
};

// W3M Token satma
const sellW3M = async (w3mAmount) => {
  await w3mContract.sellForUSDC(w3mAmount);
};

// Güncel fiyat alma
const currentPrice = await w3mContract.getCurrentPrice();
```

## 📈 Monitoring ve Analytics

### Key Metrics
- **Token Price**: Sürekli artan fiyat takibi
- **USDC Pool**: Reserve pool durumu  
- **Trading Volume**: Günlük alım-satım hacmi
- **Holder Count**: Token sahip sayısı

### Alert Sistemi
- 🚨 **Emergency Withdrawals** - Büyük çekimler
- ⏰ **Timelock Operations** - Scheduled işlemler
- 📊 **Price Movements** - Anormal fiyat hareketleri
- 🔒 **Security Events** - Güvenlik olayları

## 🤝 Katkıda Bulunma

### Development
1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Test ekleyin ve çalıştırın
4. Commit'leyin (`git commit -m 'Add amazing feature'`)
5. Push'layın (`git push origin feature/amazing-feature`)
6. Pull Request açın

### Güvenlik
- Güvenlik açıklarını **security@web3moon.org** adresine bildirin
- Audit katkıları ve güvenlik incelemeleri memnuniyetle karşılanır

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Önemli Uyarılar

```
⚠️ GÜVENLİK UYARISI ⚠️

1. Smart contract'lar deneysel teknolojidir
2. Hiçbir sistem %100 güvenli değildir  
3. Sadece kaybetmeyi göze aldığınız miktarları yatırın
4. Bu kod "olduğu gibi" garanti olmaksızın sağlanmıştır
5. Kullanıcılar kendi due diligence'larını yapmalıdır
```

### Audit Durumu
- 🔍 **Internal Audit**: Tamamlandı ✅
- 🧪 **Fuzz Testing**: Kapsamlı ✅  
- 👥 **Community Review**: Devam ediyor ✅
- 🏢 **Professional Audit**: Planlanmış 📅

---

## 🔗 Bağlantılar

- **Website**: https://web3moon.org
- **Documentation**: https://docs.web3moon.org
- **Discord**: [Community Discord]
- **Twitter**: [@Web3Moon]
- **GitHub**: https://github.com/samimcanboke/w3m-token

---

**Web3Moon - The price only goes up! 🌙🚀**

*Sorular, destek veya katkılar için GitHub issues veya community kanallarımız üzerinden iletişime geçin.*
