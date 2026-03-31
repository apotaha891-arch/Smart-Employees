
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('--- COLUMN DIAGNOSTIC ---');
    
    // Check agents table columns
    const { data: agents, error: agentsError } = await supabase.from('agents').select('*').limit(1);
    if (!agentsError && agents.length > 0) {
        console.log('AGENTS columns:', Object.keys(agents[0]).join(', '));
        console.log('Has entity_id:', Object.keys(agents[0]).includes('entity_id'));
        console.log('Has salon_config_id:', Object.keys(agents[0]).includes('salon_config_id'));
    } else {
        console.log('Could not check AGENTS columns:', agentsError?.message || 'Table empty');
    }

    // Check bookings table columns
    const { data: bookings, error: bookingsError } = await supabase.from('bookings').select('*').limit(1);
    if (!bookingsError && bookings.length > 0) {
        console.log('BOOKINGS columns:', Object.keys(bookings[0]).join(', '));
        console.log('Has entity_id:', Object.keys(bookings[0]).includes('entity_id'));
        console.log('Has salon_config_id:', Object.keys(bookings[0]).includes('salon_config_id'));
    } else {
        console.log('Could not check BOOKINGS columns:', bookingsError?.message || 'Table empty');
    }
    
    console.log('---------------------------');
}

checkColumns();
