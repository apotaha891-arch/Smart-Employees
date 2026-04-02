import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Meta Webhook Handler (Instagram & WhatsApp)
 * This single endpoint handles unique incoming messages using the 'user_id' query parameter.
 * URL Example: https://YOUR_PROJECT.supabase.co/functions/v1/meta-webhook?user_id=REAL_USER_UUID
 */
serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');

  // 1. Handle GET request from Meta for Webhook verification
  if (req.method === 'GET') {
    const hubMode = url.searchParams.get('hub.mode');
    const hubChallenge = url.searchParams.get('hub.challenge');
    const hubVerifyToken = url.searchParams.get('hub.verify_token');

    // For BYOT, we use a simple/default verify token or the one stored in DB.
    // For now, we accept 'smart_employees_verify' or simply echo the challenge.
    if (hubMode === 'subscribe' && hubChallenge) {
      console.log('Incoming Meta Webhook verification for user:', userId);
      return new Response(hubChallenge, { status: 200 });
    }
  }

  // 2. Handle POST request (Incoming message notification)
  if (req.method === 'POST') {
    if (!userId) {
      return new Response('User ID missing', { status: 400 });
    }

    try {
      const payload = await req.json();
      console.log(`Incoming Meta notification for user ${userId}:`, JSON.stringify(payload, null, 2));

      // Initialize Supabase Client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Store the interaction in the database for the agent to process
      // We'll insert into a 'meta_interactions' table (to be created) or similar.
      const { error } = await supabase.from('meta_notifications').insert({
        user_id: userId,
        payload: payload,
        platform: payload.object || 'unknown', // 'whatsapp_business_account' or 'instagram'
        processed: false
      });

      if (error) {
        console.error('Error storing Meta notification:', error);
      }

      // 3. Trigger n8n or internal processing
      // You can call an n8n webhook here if needed
      
      return new Response('EVENT_RECEIVED', { status: 200 });
    } catch (err) {
      console.error('Webhook processing error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
