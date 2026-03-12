
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    
    // 1. Agent
    const { data: agent } = await supabase.from('agents').select('*').eq('id', id).single();
    if (!agent) { console.log('Agent not found'); return; }
    console.log('--- AGENT ---');
    console.log('Name:', agent.name);
    console.log('Specialty:', agent.specialty);
    console.log('Metadata:', JSON.stringify(agent.metadata));
    console.log('User ID:', agent.user_id);

    // 2. Salon Config
    const { data: config } = await supabase.from('salon_configs').select('*').eq('user_id', agent.user_id).maybeSingle();
    console.log('\n--- SALON CONFIG ---');
    if (config) {
        console.log('Business Name (agent_name field):', config.agent_name);
        console.log('Description:', config.description);
        console.log('Knowledge Base:', config.knowledge_base);
    } else {
        console.log('No config found');
    }

    // 3. Services
    const { data: services } = await supabase.from('salon_services').select('*').eq('salon_config_id', config?.id);
    console.log('\n--- SERVICES ---');
    services?.forEach(s => console.log(`- ${s.service_name}: ${s.price}`));
}

check();
