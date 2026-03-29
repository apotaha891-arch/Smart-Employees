
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log(`Testing insert to ${supabaseUrl}...`);
    
    const testData = {
        business_type: 'Test Business',
        required_tasks: 'Test Tasks',
        contact_name: 'Test Name',
        contact_phone: '123456789',
        contact_email: 'test@example.com',
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('custom_requests')
        .insert([testData]);

    if (error) {
        console.error('Insert failed:', error.message);
        if (error.code === 'PGRST116') {
            console.log('Note: Error PGRST116 is normal if you are inserting without returning data in some versions.');
        }
    } else {
        console.log('Insert successful!');
        console.log('Result:', data);
    }
}

testInsert();
