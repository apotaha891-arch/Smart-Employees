const fs = require('fs');
const path = 'C:\\Users\\moza4\\Smart Employees\\src\\translations.js';
const content = fs.readFileSync(path, 'utf8');
let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    else if (content[i] === '}') close++;
}
console.log(`Open: ${open}, Close: ${close}`);
if (open !== close) {
    console.log('Balance issue detected!');
} else {
    console.log('Braces are balanced.');
}
