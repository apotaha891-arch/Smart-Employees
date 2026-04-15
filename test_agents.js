import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xofmxyjofqndrchqszla.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgents() {
    console.log("Checking agents for user d35b596b-290f-410c-98ce-8731676adc7c...");
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', 'd35b596b-290f-410c-98ce-8731676adc7c');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found agents:", data.length);
        console.log(data);
    }
}

checkAgents();
