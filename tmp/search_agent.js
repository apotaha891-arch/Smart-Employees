
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    const { data: agents } = await supabase.from('agents').select('id, name');
    console.log('--- ALL AGENTS IN DB ---');
    agents?.forEach(a => console.log(`${a.id} | ${a.name}`));
    
    const target = agents?.find(a => a.id === id);
    if (target) {
        console.log(`\nTARGET AGENT [${id}] FOUND:`, target.name);
    } else {
        console.log(`\nTARGET AGENT [${id}] NOT FOUND in ${agents?.length || 0} agents.`);
    }
}

check();
