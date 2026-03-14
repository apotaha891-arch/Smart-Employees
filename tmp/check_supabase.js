
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\moza4\\Smart Employees\\src\\components\\SalonSetup.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes('supabase') && !line.includes('import')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
});
