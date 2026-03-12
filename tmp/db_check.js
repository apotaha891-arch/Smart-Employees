const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: salonCols } = await supabase.rpc('inspect_table', { t_name: 'salon_configs' });
    console.log('salon_configs columns:', salonCols);
    
    const { data: profileCols } = await supabase.rpc('inspect_table', { t_name: 'profiles' });
    console.log('profiles columns:', profileCols);
}
// wait, I don't have inspect_table rpc. I'll use a standard query if possible or just try to select.
