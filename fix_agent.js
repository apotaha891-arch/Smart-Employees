import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xofmxyjofqndrchqszla.supabase.co';
// Need service role key to bypass RLS for updating
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAgent() {
    console.log("Transferring Maryam to Dr. Imtinan...");
    // Update both user_id and entity_id (if Dr. Imtinan has an entity)
    const { data: entityData } = await supabase.from('entities').select('id').eq('user_id', '0f089ffd-f5d6-492e-a000-b48462aa71d2').limit(1).maybeSingle();
    
    const { data, error } = await supabase
        .from('agents')
        .update({ 
            user_id: '0f089ffd-f5d6-492e-a000-b48462aa71d2',
            entity_id: entityData?.id || null,
        })
        .eq('id', 'ff73211a-f955-43ee-b42f-7ca5d2968ec7');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success, Maryam transferred! Check dashboard.");
    }
}

fixAgent();
