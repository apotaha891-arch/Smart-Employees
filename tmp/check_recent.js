
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: configs } = await supabase.from('salon_configs').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('--- RECENT SALON CONFIGS ---');
    configs?.forEach(c => {
        console.log(`ID: ${c.id} | User: ${c.user_id} | Name: ${c.agent_name} | Desc: ${c.description?.slice(0, 30)}`);
    });

    const { data: agents } = await supabase.from('agents').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('\n--- RECENT AGENTS ---');
    agents?.forEach(a => {
        console.log(`ID: ${a.id} | User: ${a.user_id} | Name: ${a.name} | Spec: ${a.specialty}`);
    });
}

check();
