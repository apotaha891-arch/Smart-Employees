
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://dydflepcfdrlslpxapqo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I'll need to find this or use anon key if allowed (unlikely for DDL)

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    const sql = fs.readFileSync('supabase/migrations/10_add_widget_config_to_salon_configs.sql', 'utf8');
    
    // Supabase JS client doesn't have a direct 'execute sql' method for DDL.
    // It's usually done via RPC or migrations.
    // However, I can try to use a specialized RPC if one exists like 'exec_sql'.
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration succeeded:', data);
    }
}

runMigration();
