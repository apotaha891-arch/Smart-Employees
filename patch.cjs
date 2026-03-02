const fs = require('fs');
const file = 'c:/Users/moza4/Smart Employees/src/components/BusinessSetup.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexManualPanel = /(\s*\{\/\* Left Column: Manual Setup Panel \*\/\}\s*<div className="card">[\s\S]*?<\/form>\s*<\/div>\s*)/;
const match = content.match(regexManualPanel);
if (match) {
    content = content.replace(regexManualPanel, '\n');

    // Find the end of the tips panel which is followed by </div></div></div>
    const endMatch = content.match(/(\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*};\s*export default BusinessSetup;\s*)/);
    if (endMatch) {
        content = content.replace(endMatch[1], `\n            </div>\n\n            {/* Left Column: Manual Setup Panel */}\n            <div className="card">\n${match[1].split('/* Left Column: Manual Setup Panel */')[1]}\n${endMatch[1]}`);
        fs.writeFileSync(file, content);
        console.log("Success");
    } else {
        console.log("Not found ending");
    }
} else {
    console.log("Not found manual panel");
}
