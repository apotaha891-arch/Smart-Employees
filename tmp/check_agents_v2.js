
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAgents() {
    // Check all agents
    const { data: allAgents, error: allErr } = await supabase.from('agents').select('*');
    if (allErr) console.error("AllErr:", allErr);
    
    console.log(`Total agents in DB: ${allAgents?.length || 0}`);
    
    // Check agents with user_id is null
    const { data: nullUserAgents } = await supabase.from('agents').select('*').is('user_id', null);
    console.log(`Agents with NULL user_id: ${nullUserAgents?.length || 0}`);
    if (nullUserAgents?.length > 0) {
        console.log("Sample NULL user_id agents:", nullUserAgents.slice(0, 3).map(a => a.name));
    }
}

checkAgents();
