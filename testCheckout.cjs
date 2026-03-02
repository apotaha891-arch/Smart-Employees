const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value) acc[key.trim()] = value.join('=').trim();
    return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        // Sign in first to get a real user token
        // You'll need to use a real testing account for this to work correctly
        // Or we just test with the anon key and see if the error is auth related

        console.log("Testing with Anon Key (Expect Unauthorized if verify_jwt works, or 400 if validation fails inside)");

        const resPost = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'POST',
            body: JSON.stringify({ planId: 'starter' }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173',
                'Authorization': `Bearer ${supabaseAnonKey}`
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
