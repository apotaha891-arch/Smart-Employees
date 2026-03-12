
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const agentId = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    
    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .maybeSingle();
    
    if (!agent) { console.log('Agent not found'); return; }
    console.log('AGENT DATA:');
    console.log('ID:', agent.id);
    console.log('User ID:', agent.user_id);
    console.log('Specialty:', agent.specialty);
    console.log('Salon Config ID (direct):', agent.salon_config_id);

    const { data: config } = await supabase
        .from('salon_configs')
        .select('*')
        .eq('user_id', agent.user_id)
        .maybeSingle();
    
    if (config) {
        console.log('\nSALON CONFIG FOUND:');
        console.log('Description:', config.description);
        console.log('Knowledge Base:', config.knowledge_base);
    } else {
        console.log('\nNO SALON CONFIG FOUND FOR USER:', agent.user_id);
    }

    const { data: services } = await supabase
        .from('salon_services')
        .select('*')
        .eq('salon_config_id', config?.id || agent.salon_config_id);
    
    console.log('\nSERVICES COUNT:', services?.length || 0);
}

check();
