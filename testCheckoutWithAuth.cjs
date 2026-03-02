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
        const testEmail = `test${Date.now()}@example.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'password123',
            options: { data: { full_name: 'Test User' } }
        });

        if (authError || !authData.session) {
            console.log("Failed to create test user:", authError?.message);
            return;
        }

        const jwt = authData.session.access_token;
        console.log("Got JWT, calling edge function...");

        const resPost = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'POST',
            body: JSON.stringify({ planId: 'starter', successUrl: 'http://localhost/success', cancelUrl: 'http://localhost/cancel' }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173',
                'Authorization': `Bearer ${jwt}`
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
