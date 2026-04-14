import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'components'));

let totalChanges = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace hardcoded light border colors with var(--color-border-subtle)
    // Matches: border: '1px solid rgba(255,255,255,0.05)' or borderColor: '#374151'
    content = content.replace(/(border(?:Top|Bottom|Left|Right)?|borderColor)\s*:\s*(['"`])([^'"`]*?)(rgba\(255,\s*255,\s*255,\s*0\.\d+\)|#374151|#4B5563|#27272A)(.*?)(['"`])/gi, "$1: $2$3var(--color-border-subtle)$5$6");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalChanges++;
        console.log(`Updated borders in ${path.basename(file)}`);
    }
});

console.log(`Finished updating borders in ${totalChanges} files.`);
