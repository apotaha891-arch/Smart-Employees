
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostic() {
    console.log('--- START DIAGNOSTIC ---');
    
    // Check tables existence by attempting a count
    const tables = ['agents', 'salon_configs', 'salon_services', 'profiles', 'agent_templates'];
    
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table [${table}]: ERROR - ${error.message} (${error.code})`);
        } else {
            console.log(`Table [${table}]: EXISTS - Count: ${count}`);
        }
    }

    // Try a direct query for the specific agent in the screenshot
    const id = '8ea126ed-6622-4055-bfbc-6ffbbdc03eae';
    const { data: agent } = await supabase.from('agents').select('*').eq('id', id).maybeSingle();
    console.log('\nSpecific Agent Search (8ea...3eae):', agent ? 'FOUND' : 'NOT FOUND');
    if (agent) console.log('Agent Name:', agent.name);

    console.log('--- END DIAGNOSTIC ---');
}

diagnostic();
