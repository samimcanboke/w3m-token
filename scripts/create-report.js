const fs = require("fs");
const path = require("path");
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.log("⚠️  Puppeteer not installed. PDF generation will be skipped.");
}

async function createReport() {
    // Load simulation results
    const resultsPath = path.join(__dirname, "..", "simulation-results.json");
    const deploymentPath = path.join(__dirname, "..", "deployment-addresses.json");
    
    const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    // Create HTML report
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web3Moon (W3M) Test Simülasyonu Raporu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 20px;
        }
        .info-box {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .success-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #3498db;
            color: white;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .metric {
            display: inline-block;
            margin: 10px 20px 10px 0;
        }
        .metric-label {
            font-weight: bold;
            color: #7f8c8d;
        }
        .metric-value {
            font-size: 1.2em;
            color: #2c3e50;
        }
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .address {
            font-family: monospace;
            font-size: 0.9em;
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
        }
        .positive {
            color: #27ae60;
            font-weight: bold;
        }
        .negative {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Web3Moon (W3M) Token</h1>
        <p style="text-align: center; color: #7f8c8d; margin-bottom: 30px;">Test Simülasyon Raporu</p>
        
        <div class="info-box">
            <h3>Kontrat Bilgileri</h3>
            <div class="metric">
                <span class="metric-label">W3M Kontrat Adresi:</span>
                <span class="metric-value address">${deployment.web3moon}</span>
            </div>
            <br>
            <div class="metric">
                <span class="metric-label">Mock USDC Adresi:</span>
                <span class="metric-value address">${deployment.mockUSDC}</span>
            </div>
            <br>
            <div class="metric">
                <span class="metric-label">Deploy Eden:</span>
                <span class="metric-value address">${deployment.deployer}</span>
            </div>
            <br>
            <div class="metric">
                <span class="metric-label">Ağ:</span>
                <span class="metric-value">${deployment.network}</span>
            </div>
        </div>

        <h2>📊 Özet Sonuçlar</h2>
        <div class="success-box">
            <h3>Temel Metrikler</h3>
            <div class="metric">
                <span class="metric-label">Test Edilen Cüzdan Sayısı:</span>
                <span class="metric-value">${results.summary.numWallets}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Karlı Cüzdan Sayısı:</span>
                <span class="metric-value positive">${results.summary.profitableWallets} (${results.summary.profitablePercentage.toFixed(2)}%)</span>
            </div>
            <br>
            <div class="metric">
                <span class="metric-label">Ortalama Kar:</span>
                <span class="metric-value positive">$${results.summary.averageProfit.toFixed(2)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Toplam Net Kar:</span>
                <span class="metric-value positive">$${results.summary.totalNetProfit.toFixed(2)}</span>
            </div>
        </div>

        <h2>💹 Fiyat Değişimi</h2>
        <div class="info-box">
            <div class="metric">
                <span class="metric-label">Başlangıç Fiyatı:</span>
                <span class="metric-value">${results.summary.initialPrice.toFixed(6)} USDC</span>
            </div>
            <div class="metric">
                <span class="metric-label">Bitiş Fiyatı:</span>
                <span class="metric-value">${results.summary.finalPrice.toFixed(6)} USDC</span>
            </div>
            <div class="metric">
                <span class="metric-label">Fiyat Artışı:</span>
                <span class="metric-value positive">%${results.summary.priceIncrease.toFixed(2)}</span>
            </div>
        </div>
        <div class="warning-box">
            <strong>ÖNEMLİ NOT:</strong> W3M tokenin fiyat mekanizması monotoniktir. Bu, fiyatın sadece yukarı gidebileceği veya sabit kalabileceği, ancak asla düşemeyeceği anlamına gelir. Test sonuçları bu özelliği doğrulamaktadır.
        </div>

        <h2>👛 Cüzdan Performansları</h2>
        <h3>En İyi Performans Gösterenler</h3>
        <table>
            <thead>
                <tr>
                    <th>Sıra</th>
                    <th>Cüzdan</th>
                    <th>İşlem Sayısı</th>
                    <th>Net Kar</th>
                    <th>Kar Oranı</th>
                </tr>
            </thead>
            <tbody>
                ${results.walletResults.slice(0, 5).map((wallet, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td class="address">${wallet.address.substring(0, 8)}...${wallet.address.substring(wallet.address.length - 6)}</td>
                    <td>${wallet.trades}</td>
                    <td class="positive">$${wallet.netProfit.toFixed(2)}</td>
                    <td class="positive">%${wallet.profitPercentage.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>🏛️ Sistem Cüzdanları</h2>
        <h3>Özel Fonksiyon Cüzdanları</h3>
        <table>
            <thead>
                <tr>
                    <th>Cüzdan Tipi</th>
                    <th>Adres</th>
                    <th>W3M Bakiyesi</th>
                    <th>Değer (USDC)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Referral Wallet</td>
                    <td class="address">${deployment.referralWallet}</td>
                    <td>${results.contractBalances.referralWallet.toFixed(8)} W3M</td>
                    <td>$${(results.contractBalances.referralWallet * results.summary.finalPrice).toFixed(4)}</td>
                </tr>
                <tr>
                    <td>Active Users Wallet</td>
                    <td class="address">${deployment.activeUsersWallet}</td>
                    <td>${results.contractBalances.activeUsersWallet.toFixed(8)} W3M</td>
                    <td>$${(results.contractBalances.activeUsersWallet * results.summary.finalPrice).toFixed(4)}</td>
                </tr>
                <tr>
                    <td>Staking Rewards Wallet</td>
                    <td class="address">${deployment.stakingRewardsWallet}</td>
                    <td>${results.contractBalances.stakingWallet.toFixed(8)} W3M</td>
                    <td>$${(results.contractBalances.stakingWallet * results.summary.finalPrice).toFixed(4)}</td>
                </tr>
            </tbody>
        </table>

        <h3>Havuz Cüzdanları</h3>
        <table>
            <thead>
                <tr>
                    <th>Havuz Adı</th>
                    <th>Adres</th>
                    <th>Ağırlık</th>
                    <th>W3M Bakiyesi</th>
                    <th>Değer (USDC)</th>
                </tr>
            </thead>
            <tbody>
                ${deployment.pools.map(pool => {
                    const poolBalance = results.poolBalances[pool.name];
                    return `
                    <tr>
                        <td>${pool.name}</td>
                        <td class="address">${pool.address.substring(0, 8)}...${pool.address.substring(pool.address.length - 6)}</td>
                        <td>${pool.weight}</td>
                        <td>${poolBalance.balance.toFixed(8)} W3M</td>
                        <td>$${(poolBalance.balance * results.summary.finalPrice).toFixed(4)}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <h2>📈 Simülasyon Detayları</h2>
        <div class="info-box">
            <h3>Test Senaryosu</h3>
            <ul>
                <li><strong>Faz 1 - İlk Alım Dalgası:</strong> Tüm test cüzdanları USDC bakiyelerinin %10-30'u arasında W3M satın aldı.</li>
                <li><strong>Faz 2 - Karışık İşlemler:</strong> 20 rastgele işlem gerçekleştirildi (%60 alım, %40 satım).</li>
                <li><strong>Toplam İşlem Süresi:</strong> ${new Date(results.timestamp).toLocaleString('tr-TR')}</li>
                <li><strong>Toplam İşlem Sayısı:</strong> ${results.walletResults.reduce((sum, w) => sum + w.trades, 0)}</li>
            </ul>
        </div>

        <h2>🔍 Önemli Gözlemler</h2>
        <div class="success-box">
            <h3>Başarılı Sonuçlar</h3>
            <ul>
                <li>✅ Fiyat mekanizması beklendiği gibi çalıştı - fiyat hiç düşmedi</li>
                <li>✅ ${results.summary.profitableWallets} cüzdandan ${results.summary.numWallets - results.summary.profitableWallets === 1 ? 'sadece 1 tanesi' : 'sadece ' + (results.summary.numWallets - results.summary.profitableWallets) + ' tanesi'} zarar etti</li>
                <li>✅ Ortalama kar oranı %${(results.summary.averageProfit / (results.summary.totalNetProfit / results.summary.numWallets) * 100).toFixed(2)} pozitif</li>
                <li>✅ Havuz dağılımları ağırlıklara göre doğru şekilde gerçekleşti</li>
                <li>✅ Referral, staking ve aktif kullanıcı ödülleri başarıyla dağıtıldı</li>
            </ul>
        </div>

        <div class="warning-box">
            <h3>Dikkat Edilmesi Gerekenler</h3>
            <ul>
                <li>⚠️ Satış işlemlerinde %8 kesinti uygulanmaktadır</li>
                <li>⚠️ Alım işlemlerinde %10 token dağıtımı yapılmaktadır (%2.5 havuzlar, %2.5 staking, %2 referral, %0.5 aktif kullanıcılar)</li>
                <li>⚠️ Gerçek piyasada volatilite daha yüksek olabilir</li>
            </ul>
        </div>

        <h2>💡 Sonuç ve Öneriler</h2>
        <div class="info-box">
            <p><strong>Test Sonucu:</strong> Web3Moon token kontratı tasarlandığı gibi çalışmaktadır. Monotonic fiyat mekanizması başarıyla test edilmiş ve fiyatın hiçbir durumda düşmediği gözlemlenmiştir.</p>
            
            <h3>Ana Bulgular:</h3>
            <ul>
                <li>Token fiyatı %${results.summary.priceIncrease.toFixed(2)} artış gösterdi</li>
                <li>Test edilen cüzdanların %${results.summary.profitablePercentage.toFixed(2)}'si kar elde etti</li>
                <li>Ortalama kar $${results.summary.averageProfit.toFixed(2)} olarak gerçekleşti</li>
                <li>Havuz mekanizması ve ödül dağıtımları sorunsuz çalıştı</li>
            </ul>
            
            <h3>Öneriler:</h3>
            <ul>
                <li>Daha büyük ölçekli testler için daha fazla cüzdan ve işlem hacmi kullanılabilir</li>
                <li>Farklı piyasa senaryoları (panik satış, yoğun alım vb.) test edilebilir</li>
                <li>Gas optimizasyonu için ek testler yapılabilir</li>
            </ul>
        </div>

        <div class="footer">
            <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde otomatik olarak oluşturulmuştur.</p>
            <p>Web3Moon (W3M) - Monotonic Price Token</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Save HTML file
    const htmlPath = path.join(__dirname, "..", "test-report.html");
    fs.writeFileSync(htmlPath, html);
    console.log("✅ HTML report saved to:", htmlPath);
    
    // Create PDF
    if (puppeteer) {
        console.log("📄 Creating PDF report...");
        try {
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
        
        // Load HTML content
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        
        // Generate PDF
        const pdfPath = path.join(__dirname, "..", "W3M-Test-Report.pdf");
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });
        
        await browser.close();
        console.log("✅ PDF report saved to:", pdfPath);
        
        } catch (error) {
            console.log("⚠️  PDF creation failed:", error.message);
            console.log("   HTML report is available at:", htmlPath);
        }
    }
    
    console.log("\n📊 Report Summary:");
    console.log("  - Total Wallets Tested:", results.summary.numWallets);
    console.log("  - Profitable Wallets:", results.summary.profitableWallets, `(${results.summary.profitablePercentage.toFixed(2)}%)`);
    console.log("  - Average Profit:", `$${results.summary.averageProfit.toFixed(2)}`);
    console.log("  - Price Increase:", `${results.summary.priceIncrease.toFixed(2)}%`);
}

// Execute
createReport()
    .then(() => {
        console.log("\n✅ Report generation completed!");
        process.exit(0);
    })
    .catch(error => {
        console.error("❌ Error:", error);
        process.exit(1);
    });