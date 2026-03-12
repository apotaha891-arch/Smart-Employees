
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) {
        console.error('FETCH ERROR:', error.message, error.code);
    } else {
        console.log('AGENTS COUNT:', data?.length || 0);
        console.log('DATA:', JSON.stringify(data, null, 2));
    }
}

check();
