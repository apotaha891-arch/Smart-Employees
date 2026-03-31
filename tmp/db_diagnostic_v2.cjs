
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Try both VITE_ and standard env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- DATABASE DIAGNOSTIC ---');
    console.log('Connecting to:', supabaseUrl);
    
    // Check salon_configs
    const { error: salonError } = await supabase.from('salon_configs').select('id').limit(1);
    console.log('TABLE [salon_configs]:', !salonError ? 'EXISTS ✅' : 'MISSING ❌ (' + salonError.message + ')');

    // Check entities
    const { error: entityError } = await supabase.from('entities').select('id').limit(1);
    console.log('TABLE [entities]:', !entityError ? 'EXISTS ✅' : 'MISSING ❌ (' + entityError.message + ')');

    // Check salon_services
    const { error: serviceError } = await supabase.from('salon_services').select('id').limit(1);
    console.log('TABLE [salon_services]:', !serviceError ? 'EXISTS ✅' : 'MISSING ❌');

    // Check entity_services
    const { error: entityServiceError } = await supabase.from('entity_services').select('id').limit(1);
    console.log('TABLE [entity_services]:', !entityServiceError ? 'EXISTS ✅' : 'MISSING ❌');
    
    console.log('---------------------------');
}

checkTables();
