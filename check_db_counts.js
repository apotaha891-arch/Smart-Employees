import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: salonConfigsCount } = await supabase.from('salon_configs').select('*', { count: 'exact', head: true });
    const { count: bookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    const { count: agentsCount } = await supabase.from('agents').select('*', { count: 'exact', head: true });

    console.log('--- Database Counts ---');
    console.log(`Profiles: ${profilesCount}`);
    console.log(`Salon Configs: ${salonConfigsCount}`);
    console.log(`Bookings: ${bookingsCount}`);
    console.log(`Agents: ${agentsCount}`);

    // Check the first few IDs to see if they match
    const { data: configs } = await supabase.from('salon_configs').select('user_id, agent_name').limit(5);
    console.log('\n--- Recent Salon Configs ---');
    console.table(configs);
}

checkCounts();
