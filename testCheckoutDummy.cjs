const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value) acc[key.trim()] = value.join('=').trim();
    return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY.trim();

async function test() {
    try {
        console.log("We'll use a hardcoded (invalid) JWT just to observe the EXACT error we get. If the edge function is handling the error, it will return a JSON with { error: '...' }.");

        const resPost = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'POST',
            body: JSON.stringify({ planId: 'starter', successUrl: 'http://localhost/success', cancelUrl: 'http://localhost/cancel' }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173',
                'Authorization': `Bearer ${supabaseAnonKey}` // Using anon key as a dummy JWT
            }
        });

        const bodyText = await resPost.text();
        console.log('Edge Post Status:', resPost.status, resPost.statusText);
        console.log('Edge Post Body text:', bodyText);
    } catch (e) {
        console.log('Fetch error:', e);
    }
}

test();
