
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyTables() {
    console.log('--- EMPTY TABLE SCHEMA CHECK ---');
    
    // Check bookings schema by attempting to select the column
    const { error: bookingsError } = await supabase.from('bookings').select('entity_id').limit(0);
    console.log('BOOKINGS has entity_id:', !bookingsError ? 'YES ✅' : 'NO ❌ (' + bookingsError.message + ')');

    // Check customers schema
    const { error: customersError } = await supabase.from('customers').select('entity_id').limit(0);
    console.log('CUSTOMERS has entity_id:', !customersError ? 'YES ✅' : 'NO ❌ (' + customersError.message + ')');
    
    console.log('-------------------------------');
}

checkEmptyTables();
