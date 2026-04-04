import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { action } = payload;

        // Initialize Supabase client with admin privileges (Service Role)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        
        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Extract auth token from the incoming client request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('No authorization header provided');
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) throw new Error('Unauthorized');

        // Check if the caller is an active Agency
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_agency, agency_max_clients')
            .eq('id', user.id)
            .single();

        if (!profile?.is_agency) {
            throw new Error('Forbidden: Only Agency Managers can perform this action');
        }

        // Action: Create Sub-Account
        if (action === 'create_sub_account') {
            const { email, password, businessName } = payload;

            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Verify Agency Client Quota Limit
            const { count } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('agency_id', user.id);
            
            const currentClients = count || 0;
            const maxClients = profile.agency_max_clients || 0;

            if (currentClients >= maxClients) {
                throw new Error(`Quota Exceeded: Your plan allows a maximum of ${maxClients} clients.`);
            }

            // 1. Create Auth User silently using Admin Auth API
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // Auto-confirm, no email verification needed for white-labeled sub-accounts
                user_metadata: { role: 'business_owner', agency_managed: true }
            });

            if (createError) throw new Error(`Auth Error: ${createError.message}`);

            const newUserId = newUser.user.id;

            // 2. Link profile to the Agency
            // Note: `profiles` table triggers might take a few ms to generate the profile, 
            // but we use upsert or wait to assign the agency_id
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for trigger to fire
            
            const { error: profileUpdateError } = await supabaseAdmin.from('profiles')
                .update({ agency_id: user.id })
                .eq('id', newUserId);

            if (profileUpdateError) {
                console.warn("Could not bind agency ID immediately:", profileUpdateError.message);
            }

            // 3. Create initial Entity (Business Profile)
            const { data: entityData, error: entityError } = await supabaseAdmin.from('entities')
                .insert([{ 
                    user_id: newUserId, 
                    business_name: businessName || 'عميل فرعي جديد', 
                    business_type: 'general' 
                }])
                .select()
                .single();
            
            if (entityError) throw new Error(`Entity Error: ${entityError.message}`);

            return new Response(
                JSON.stringify({ 
                    success: true, 
                    user: { id: newUserId, email }, 
                    entity: entityData,
                    remaining_quota: maxClients - (currentClients + 1)
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error('Invalid action');

    } catch (error: any) {
        console.error("Agency Manager Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
