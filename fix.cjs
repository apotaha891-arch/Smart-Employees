const fs = require('fs');
const file = 'c:/Users/moza4/Smart Employees/src/components/BusinessSetup.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*};\s*export default BusinessSetup;/g, '</div>\n        </div>\n    );\n};\n\nexport default BusinessSetup;');
fs.writeFileSync(file, content);
