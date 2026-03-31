
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables...');
    
    // Check salon_configs
    const { error: salonError } = await supabase.from('salon_configs').select('id').limit(1);
    console.log('salon_configs exists:', !salonError);
    if (salonError) console.log('salon_configs error:', salonError.message);

    // Check entities
    const { error: entityError } = await supabase.from('entities').select('id').limit(1);
    console.log('entities exists:', !entityError);
    if (entityError) console.log('entities error:', entityError.message);

    // Check salon_services
    const { error: serviceError } = await supabase.from('salon_services').select('id').limit(1);
    console.log('salon_services exists:', !serviceError);

    // Check entity_services
    const { error: entityServiceError } = await supabase.from('entity_services').select('id').limit(1);
    console.log('entity_services exists:', !entityServiceError);
}

checkTables();
