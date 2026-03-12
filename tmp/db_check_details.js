
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    const id = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    
    // 1. Agent
    const { data: agent } = await supabase.from('agents').select('*').eq('id', id).single();
    console.log('--- AGENT ---');
    console.log(JSON.stringify(agent, null, 2));

    if (!agent) return;

    // 2. Salon Config
    const { data: config } = await supabase.from('salon_configs').select('*').eq('user_id', agent.user_id).maybeSingle();
    console.log('\n--- SALON CONFIG ---');
    console.log(JSON.stringify(config, null, 2));

    // 3. Services
    const salonId = config?.id || agent.salon_config_id;
    if (salonId) {
        const { data: services } = await supabase.from('salon_services').select('*').eq('salon_config_id', salonId);
        console.log('\n--- SERVICES ---');
        console.log(`Count: ${services?.length || 0}`);
        if (services?.length) console.log(services.map(s => `${s.service_name}: ${s.price}`).join(', '));
    }
}

checkDetails();
