import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Meta Connection Handler
 * Validates a user-provided Meta access token and stores it in the 'integrations' table.
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, token, phone_number_id, waba_id, instagram_account_id } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    
    // 1. Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // 2. Validate Token with Meta API
    // We check if the token is valid for the provided platform.
    const validationUrl = provider === 'whatsapp' 
        ? `https://graph.facebook.com/v21.0/${phone_number_id}?access_token=${token}`
        : `https://graph.facebook.com/v21.0/${instagram_account_id}?fields=id,name&access_token=${token}`;

    const metaCheck = await fetch(validationUrl);
    const metaData = await metaCheck.json();

    if (!metaCheck.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid Meta credentials. Please check your token and ID.',
        error: metaData.error || 'Meta API error'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // 3. Store in integrations table
    // Provider: 'custom_whatsapp' or 'custom_instagram'
    const integration_provider = provider === 'whatsapp' ? 'custom_whatsapp' : 'custom_instagram';
    
    const { error: dbError } = await supabase.from('integrations').upsert({
      user_id: user.id,
      provider: integration_provider,
      status: 'connected',
      credentials: {
        token,
        phone_number_id: phone_number_id || null,
        waba_id: waba_id || null,
        instagram_account_id: instagram_account_id || null,
        connected_at: new Date().toISOString()
      }
    }, { onConflict: 'user_id,provider' });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully connected your custom ${provider} integration!` 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (err: any) {
    console.error('Meta Connection Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
});
