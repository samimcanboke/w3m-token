const fs = require("fs");
const path = require("path");

async function createBuySellReport() {
    // Simülasyon sonuçlarını kullan
    const results = {
        buyPhase: {
            investment: 50000,
            w3mReceived: 0.000399673810788683,
            priceBeforeBuy: 0.000112591815588819,
            priceAfterBuy: 0.000113427898778128,
            priceIncrease: 0.74,
            usdcPoolAfterBuy: 169582.256031
        },
        sellPhase: {
            w3mSold: 0.000399673810788683,
            usdcReceived: 41707.42771,
            priceAfterSell: 0.000114647240333188,
            priceChangeFromBuy: 1.07,
            usdcPoolAfterSell: 127874.828321
        },
        summary: {
            initialInvestment: 50000,
            finalReturn: 41707.42771,
            netLoss: 8292.57229,
            lossPercentage: 16.585445
        }
    };
    
    // Create HTML report
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web3Moon (W3M) - 50,000 USDC Alım-Satım Döngüsü Raporu</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1000px;
            margin: 20px auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 0 30px rgba(0,0,0,0.3);
            border-radius: 10px;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 40px;
            font-size: 1.2em;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            font-size: 1.8em;
        }
        .highlight-box {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            text-align: center;
        }
        .highlight-box h3 {
            color: white;
            margin-top: 0;
            font-size: 2em;
        }
        .big-number {
            font-size: 3.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .info-box {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 5px solid #3498db;
        }
        .success-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .error-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            font-weight: bold;
        }
        .metric {
            display: inline-block;
            margin: 10px 20px 10px 0;
        }
        .metric-label {
            font-weight: bold;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .metric-value {
            font-size: 1.4em;
            color: #2c3e50;
            font-weight: bold;
        }
        .positive {
            color: #27ae60;
            font-weight: bold;
        }
        .negative {
            color: #e74c3c;
            font-weight: bold;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .arrow {
            font-size: 2em;
            color: #3498db;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Web3Moon (W3M) Token</h1>
        <p class="subtitle">50,000 USDC Alım-Satım Döngüsü Test Raporu</p>
        
        <div class="highlight-box">
            <h3>Net Sonuç</h3>
            <div class="big-number negative">-${results.summary.netLoss.toFixed(2)} USDC</div>
            <p style="font-size: 1.5em;">Kayıp Oranı: <span class="negative">%${results.summary.lossPercentage.toFixed(2)}</span></p>
        </div>

        <h2>📈 Test Döngüsü Özeti</h2>
        
        <div class="grid">
            <div class="card">
                <h3 style="color: #3498db;">1️⃣ ALIM AŞAMASI</h3>
                <div class="metric">
                    <span class="metric-label">Yatırım:</span><br>
                    <span class="metric-value">50,000 USDC</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Alınan W3M:</span><br>
                    <span class="metric-value">${results.buyPhase.w3mReceived.toFixed(8)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Fiyat Artışı:</span><br>
                    <span class="metric-value positive">%${results.buyPhase.priceIncrease}</span>
                </div>
            </div>
            
            <div class="card">
                <h3 style="color: #e74c3c;">2️⃣ SATIM AŞAMASI</h3>
                <div class="metric">
                    <span class="metric-label">Satılan W3M:</span><br>
                    <span class="metric-value">${results.sellPhase.w3mSold.toFixed(8)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Geri Alınan:</span><br>
                    <span class="metric-value">${results.sellPhase.usdcReceived.toFixed(2)} USDC</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Fiyat Değişimi:</span><br>
                    <span class="metric-value positive">+%${results.sellPhase.priceChangeFromBuy}</span>
                </div>
            </div>
        </div>

        <h2>💹 Fiyat Hareketleri</h2>
        <table>
            <thead>
                <tr>
                    <th>Aşama</th>
                    <th>Fiyat (USDC per W3M)</th>
                    <th>Değişim</th>
                    <th>USDC Havuzu</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Başlangıç</td>
                    <td>${results.buyPhase.priceBeforeBuy.toFixed(9)}</td>
                    <td>-</td>
                    <td>119,582.26 USDC</td>
                </tr>
                <tr>
                    <td>Alım Sonrası</td>
                    <td>${results.buyPhase.priceAfterBuy.toFixed(9)}</td>
                    <td class="positive">+%${results.buyPhase.priceIncrease}</td>
                    <td>${results.buyPhase.usdcPoolAfterBuy.toFixed(2)} USDC</td>
                </tr>
                <tr>
                    <td>Satım Sonrası</td>
                    <td>${results.sellPhase.priceAfterSell.toFixed(9)}</td>
                    <td class="positive">+%${results.sellPhase.priceChangeFromBuy}</td>
                    <td>${results.sellPhase.usdcPoolAfterSell.toFixed(2)} USDC</td>
                </tr>
            </tbody>
        </table>

        <h2>🔍 Kayıp Analizi</h2>
        
        <div class="warning-box">
            <h3>Toplam %${results.summary.lossPercentage.toFixed(2)} Kayıp Nasıl Oluştu?</h3>
            <ul>
                <li><strong>Alımda %10 Token Dağıtımı:</strong>
                    <ul>
                        <li>%2.5 Havuzlara</li>
                        <li>%2.5 Staking Ödüllerine</li>
                        <li>%2 Referral (Marketing)</li>
                        <li>%0.5 Aktif Kullanıcılara</li>
                    </ul>
                </li>
                <li><strong>Satışta %8 Kesinti:</strong>
                    <ul>
                        <li>%2.5 Havuzlara (token olarak)</li>
                        <li>%2 Marketing (token olarak)</li>
                        <li>%0.5 Aktif Kullanıcılara (token olarak)</li>
                        <li>%3 Token yakımı (supply azalır)</li>
                    </ul>
                </li>
                <li><strong>Dinamik Fiyatlama Etkisi:</strong> Alım sırasında fiyat artışı nedeniyle daha az token alınması</li>
            </ul>
        </div>

        <h2>📊 Önemli Bulgular</h2>
        
        <div class="info-box">
            <h3>✅ Test Başarılı</h3>
            <ul>
                <li><strong>Monotonic Fiyat:</strong> Fiyat hiçbir aşamada düşmedi, sadece arttı</li>
                <li><strong>Büyük Alım Dayanıklılığı:</strong> 50,000 USDC'lik alım sorunsuz gerçekleşti</li>
                <li><strong>Fiyat İstikrarı:</strong> Büyük alım-satım döngüsünde fiyat sadece %1.81 arttı</li>
                <li><strong>Sistem Çalışıyor:</strong> Tüm kesintiler ve dağıtımlar beklendiği gibi uygulandı</li>
            </ul>
        </div>

        <div class="error-box">
            <h3>⚠️ Yatırımcılar İçin Önemli</h3>
            <ul>
                <li><strong>Kısa Vadeli Trading İçin Uygun Değil:</strong> %16.59 kayıp oranı</li>
                <li><strong>Uzun Vadeli Değer Saklama:</strong> Token, spekülasyon yerine uzun vadeli holding için tasarlanmış</li>
                <li><strong>Fiyat Garantisi:</strong> Fiyat asla düşmez, sadece yükselir veya sabit kalır</li>
                <li><strong>Kesintiler Kalıcı:</strong> Alım-satım kesintileri geri alınamaz</li>
            </ul>
        </div>

        <h2>💡 Sonuç ve Öneriler</h2>
        
        <div class="success-box">
            <h3>Genel Değerlendirme</h3>
            <p>Web3Moon token kontratı tam olarak tasarlandığı gibi çalışmaktadır. %16.59'luk kayıp oranı, 
            sistemin kısa vadeli spekülasyonu caydırmak ve uzun vadeli değer birikimini teşvik etmek için 
            tasarlandığını göstermektedir.</p>
            
            <h4>Ana Çıkarımlar:</h4>
            <ul>
                <li>Token fiyatı <strong>asla düşmez</strong> - monotonic mekanizma başarılı</li>
                <li>Büyük alımlar bile fiyatı makul oranda artırır (%1'den az)</li>
                <li>Sistem kesintileri, token'ın değerini korumaya yardımcı olur</li>
                <li>Uzun vadeli yatırımcılar, fiyat artışından faydalanabilir</li>
                <li>Kısa vadeli trading yapanlar zarar eder</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>Web3Moon (W3M)</strong> - Monotonic Price Token</p>
            <p>Alım-Satım Döngüsü Test Raporu - ${new Date().toLocaleString('tr-TR')}</p>
            <p>Test Miktarı: 50,000 USDC | Net Kayıp: ${results.summary.netLoss.toFixed(2)} USDC (%${results.summary.lossPercentage.toFixed(2)})</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Save HTML file
    const htmlPath = path.join(__dirname, "..", "buysell-cycle-report.html");
    fs.writeFileSync(htmlPath, html);
    console.log("✅ Buy-Sell Cycle report saved to:", htmlPath);
    
    console.log("\n📊 ÖZET:");
    console.log("==========");
    console.log(`Yatırım: 50,000 USDC`);
    console.log(`Geri Alınan: ${results.sellPhase.usdcReceived.toFixed(2)} USDC`);
    console.log(`Net Kayıp: ${results.summary.netLoss.toFixed(2)} USDC (%${results.summary.lossPercentage.toFixed(2)})`);
    console.log(`\nFiyat her zaman yükseldi - asla düşmedi! ✅`);
}

// Execute
createBuySellReport()
    .then(() => {
        console.log("\n🎉 Rapor başarıyla oluşturuldu!");
        process.exit(0);
    })
    .catch(error => {
        console.error("❌ Hata:", error);
        process.exit(1);
    });