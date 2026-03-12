
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    const { data: agent } = await supabase.from('agents').select('*').eq('id', id).single();
    if (!agent) { console.log('Agent not found'); return; }
    
    console.log('AGENT:', JSON.stringify(agent, null, 2));

    const { data: config } = await supabase.from('salon_configs').select('*').eq('user_id', agent.user_id).maybeSingle();
    console.log('\nCONFIG:', JSON.stringify(config, null, 2));

    const { data: services } = await supabase.from('salon_services').select('*').eq('salon_config_id', config?.id);
    console.log('\nSERVICES:', services?.length || 0);
    services?.forEach(s => console.log(`- ${s.service_name}: ${s.price}`));
}

check();
