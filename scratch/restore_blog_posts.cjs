const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const migrationFiles = [
    'supabase/migrations/17_seed_blog_posts.sql',
    'supabase/migrations/18_deep_dive_blog_posts.sql',
    'supabase/migrations/20_general_business_posts.sql',
    'supabase/migrations/22_sector_specific_posts.sql'
];

async function restore() {
    console.log('Starting Knowledge Hub restoration...');

    for (const fileName of migrationFiles) {
        console.log(`Processing ${fileName}...`);
        const filePath = path.join(process.cwd(), fileName);
        const content = fs.readFileSync(filePath, 'utf8');

        // Better parsing
        const insertMatch = content.match(/INSERT\s+INTO\s+.*?\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*?);/i);
        if (!insertMatch) {
            console.log(`Could not parse ${fileName}`);
            continue;
        }

        const columnStr = insertMatch[1];
        const columns = columnStr.split(',').map(c => c.trim().replace(/^public\./, '').replace(/[\r\n]/g, ''));
        const valuesRaw = insertMatch[2].trim();

        // Extract rows by looking for ( ... ) patterns, handling nested quotes
        const rows = [];
        let currentRow = '';
        let depth = 0;
        let inStr = false;
        
        for (let i = 0; i < valuesRaw.length; i++) {
            const char = valuesRaw[i];
            if (char === "'" && valuesRaw[i-1] !== "\\") {
                if (!inStr) inStr = true;
                else if (valuesRaw[i+1] === "'") i++; // escaped quote ''
                else inStr = false;
                currentRow += char;
            } else if (!inStr && char === '(') {
                depth++;
                if (depth === 1) currentRow = '';
                else currentRow += char;
            } else if (!inStr && char === ')') {
                depth--;
                if (depth === 0) {
                    rows.push(currentRow);
                } else {
                    currentRow += char;
                }
            } else {
                currentRow += char;
            }
        }

        console.log(`Found ${rows.length} rows in ${fileName}`);

        for (const row of rows) {
            const values = [];
            let currentVal = '';
            let inS = false;
            let bracketDepth = 0;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === "'" && row[i-1] !== "\\") {
                    if (!inS) inS = true;
                    else if (row[i+1] === "'") { currentVal += "'"; i++; }
                    else inS = false;
                    currentVal += char;
                } else if (!inS && (char === '[' || char === '{')) {
                    bracketDepth++;
                    currentVal += char;
                } else if (!inS && (char === ']' || char === '}')) {
                    bracketDepth--;
                    currentVal += char;
                } else if (!inS && char === ',' && bracketDepth === 0) {
                    values.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());

            const obj = {};
            columns.forEach((col, idx) => {
                let val = values[idx];
                if (val === undefined) return;
                
                // Clean up value
                if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
                if (val === 'NULL') val = null;
                if (val.toLowerCase() === 'true') val = true;
                if (val.toLowerCase() === 'false') val = false;
                
                // Handle ARRAY[...]
                if (val.startsWith('ARRAY[')) {
                    val = val.substring(6, val.length - 1).split(',').map(s => s.trim().replace(/^'|'$/g, ''));
                }
                
                // Handle published_at expressions
                if (val.includes('::timestamp')) {
                    val = new Date().toISOString();
                }

                // Handle JSON ad_slots
                if (col === 'ad_slots') {
                    try {
                        let jsonStr = val;
                        if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) jsonStr = jsonStr.substring(1, jsonStr.length - 1);
                        val = JSON.parse(jsonStr.replace(/''/g, "'"));
                    } catch(e) {
                        val = { top: true, sidebar: true, content: true };
                    }
                }

                obj[col] = val;
            });

            if (!obj.slug) continue;

            const { error } = await supabase.from('blog_posts').upsert(obj, { onConflict: 'slug' });
            if (error) console.error(`Error upserting ${obj.slug}:`, error.message);
            else console.log(`✓ Restored: ${obj.slug}`);
        }
    }

    console.log('Restoration complete.');
}

restore();
