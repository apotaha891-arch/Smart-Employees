
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrationsTable() {
    console.log('--- INTEGRATIONS TABLE SCHEMA CHECK ---');
    
    const { data, error } = await supabase.from('integrations').select('*').limit(1);
    if (!error && data.length > 0) {
        console.log('INTEGRATIONS columns:', Object.keys(data[0]).join(', '));
        console.log('Has entity_id:', Object.keys(data[0]).includes('entity_id'));
        console.log('Has salon_config_id:', Object.keys(data[0]).includes('salon_config_id'));
    } else if (error) {
        console.log('Error checking INTEGRATIONS:', error.message);
    } else {
        // Table empty, try selecting column
        const { error: colError } = await supabase.from('integrations').select('entity_id').limit(0);
        console.log('INTEGRATIONS has entity_id (empty table check):', !colError ? 'YES ✅' : 'NO ❌ (' + colError.message + ')');
    }
    
    console.log('--------------------------------------');
}

checkIntegrationsTable();
