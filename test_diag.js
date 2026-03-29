
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testDiag() {
    console.log(`Diagnostic test for: ${supabaseUrl}`);
    
    // Test 1: Valid Key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: d1, error: e1 } = await supabase.from('custom_requests').insert([{ business_type: 'Diag' }]);
    console.log('Test 1 (Valid Key) result:', e1 ? e1.message : 'Success');

    // Test 2: Invalid Key (should be 401)
    const supabaseInvalid = createClient(supabaseUrl, 'invalid-key');
    const { data: d2, error: e2 } = await supabaseInvalid.from('custom_requests').insert([{ business_type: 'Diag' }]);
    console.log('Test 2 (Invalid Key) result:', e2 ? e2.message : 'Success');
    if (e2 && e2.message.includes('Unauthorized')) {
        console.log('Confirmed: Invalid key results in "Unauthorized" (401)');
    }
}

testDiag();
