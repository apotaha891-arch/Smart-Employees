const fs = require('fs');
const path = require('path');

const sourcePath = 'C:\\Users\\moza4\\.gemini\\antigravity\\brain\\f57f4d70-e774-4184-be0b-14535c16d8d5\\media__1772518594999.png';
const destPath = path.join(__dirname, 'public', 'logo.png');

try {
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ New Logo copied successfully to public/logo.png!');
} catch (error) {
    console.error('❌ Error copying logo:', error.message);
}
