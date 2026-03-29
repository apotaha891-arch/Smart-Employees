import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log('--- Checking Profiles ---');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
    if (pErr) console.error('Profiles Error:', pErr.message);
    else console.log('Profiles Found:', profiles.length, profiles[0] ? Object.keys(profiles[0]) : 'None');

    console.log('--- Checking Salon Configs ---');
    const { data: configs, error: cErr } = await supabase.from('salon_configs').select('*').limit(5);
    if (cErr) console.error('Salon Configs Error:', cErr.message);
    else console.log('Configs Found:', configs.length, configs[0] ? Object.keys(configs[0]) : 'None');

    console.log('--- Checking Customers (End Customers) ---');
    const { data: customers, error: cuErr } = await supabase.from('customers').select('*').limit(5);
    if (cuErr) console.error('Customers Error:', cuErr.message);
    else console.log('Customers Found:', customers.length, customers[0] ? Object.keys(customers[0]) : 'None');
}

checkData();
