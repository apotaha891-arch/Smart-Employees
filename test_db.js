require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing SUPABASE environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching agents...");
    const { data: agents, error: err1 } = await supabase.from('agents').select('*');
    console.log("Agents:", agents);
    if (err1) console.error("Agent Error:", err1);

    console.log("\nFetching integrations...");
    const { data: ints, error: err2 } = await supabase.from('integrations').select('id, provider, user_id, status');
    console.log("Integrations:", ints);
    if (err2) console.error("Integration Error:", err2);

    console.log("\nFetching recent bookings...");
    const { data: books, error: err3 } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(3);
    console.log("Bookings:", books);
    if (err3) console.error("Booking Error:", err3);
}

check();
