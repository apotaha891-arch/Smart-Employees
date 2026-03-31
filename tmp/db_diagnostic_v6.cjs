
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEntityServicesColumns() {
    console.log('--- ENTITY_SERVICES COLUMN CHECK ---');
    
    // Check columns by attempting to select them
    const { error: entityIdError } = await supabase.from('entity_services').select('entity_id').limit(0);
    console.log('ENTITY_SERVICES has entity_id:', !entityIdError ? 'YES ✅' : 'NO ❌ (' + entityIdError.message + ')');

    const { error: salonIdError } = await supabase.from('entity_services').select('salon_config_id').limit(0);
    console.log('ENTITY_SERVICES has salon_config_id:', !salonIdError ? 'YES ✅' : 'NO ❌ (' + salonIdError.message + ')');
    
    console.log('------------------------------------');
}

checkEntityServicesColumns();
