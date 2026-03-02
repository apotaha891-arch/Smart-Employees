const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value) acc[key.trim()] = value.join('=').trim();
    return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log('Error:', error);
    console.log('Result:', data);

    // Check create-checkout-session without JWT
    try {
        const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'OPTIONS',
            headers: { 'Origin': 'http://localhost:5173' }
        });
        console.log('Edge Options Status:', res.status, res.statusText);

        const resPost = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'POST',
            body: JSON.stringify({ planId: 'starter' }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            }
        });
        console.log('Edge Post Status (No Auth):', resPost.status, resPost.statusText);
    } catch (e) {
        console.log('Fetch error:', e);
    }
}

test();
