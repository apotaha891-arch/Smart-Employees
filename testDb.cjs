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
        console.log('Edge Post Status (Anon Key):', resPost.status, resPost.statusText);
        console.log('Edge Post Body text:', bodyText);
    } catch (e) {
        console.log('Fetch error:', e);
    }

    try {
        const { data, error } = await supabase.from('profiles').select('business_name').limit(1);
        console.log('Profiles Query (business_name) Error:', error);
    } catch (e) {
        console.log('test profile schema err', e);
    }
}

test();
