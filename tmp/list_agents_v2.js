
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listAgents() {
    const { data: agents, error } = await supabase.from('agents').select('id, name, user_id, specialty');
    if (error) {
        console.error(error);
        return;
    }
    console.log("Agents in DB:");
    agents.forEach(a => {
        console.log(`- ${a.name} (${a.specialty}) | UserID: ${a.user_id}`);
    });
}

listAgents();
