const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadLottie = (url, filePath) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                // Verify it's valid JSON before saving
                JSON.parse(data);
                fs.writeFileSync(filePath, data);
                console.log('✅ Successfully downloaded:', filePath);
            } catch (e) {
                console.error('❌ Failed to download or parse JSON for:', filePath, url);
            }
        });
    }).on('error', err => console.log('Error:', err.message));
};

const dir = path.join(__dirname, 'public', 'animations');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Open source, free-to-use Lottie animation URLs
const animations = {
    'support.json': 'https://assets3.lottiefiles.com/packages/lf20_tijmpky4.json',
    'growth.json': 'https://assets9.lottiefiles.com/packages/lf20_puciaact.json',
    'medical-calendar.json': 'https://assets8.lottiefiles.com/packages/lf20_5n8htw2r.json',
    'medical-heart.json': 'https://assets5.lottiefiles.com/packages/lf20_tutvdkg0.json',
    'realestate-building.json': 'https://assets2.lottiefiles.com/packages/lf20_cug2owg9.json',
    'realestate-client.json': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
    'beauty-scissors.json': 'https://assets5.lottiefiles.com/packages/lf20_s7rB1E.json',
    'beauty-sparkles.json': 'https://assets1.lottiefiles.com/packages/lf20_yvs1ixh9.json',
    'restaurant-table.json': 'https://assets7.lottiefiles.com/packages/lf20_GUxHlU.json',
    'restaurant-clock.json': 'https://assets8.lottiefiles.com/packages/lf20_s5e2c5wz.json',
    'fitness-dumbbell.json': 'https://assets5.lottiefiles.com/packages/lf20_f2dshps9.json',
    'fitness-trophy.json': 'https://assets7.lottiefiles.com/packages/lf20_touohxv0.json'
};

console.log('Starting Lottie animation downloads...');
for (const [name, url] of Object.entries(animations)) {
    downloadLottie(url, path.join(dir, name));
}
