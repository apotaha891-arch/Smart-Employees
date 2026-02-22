import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. WhatsApp Webhook Verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // You would typically store this verify_token in Supabase Secrets
    const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'elite_agents_secure_token_123';

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }
    return new Response('Bad Request', { status: 400 });
  }

  // 2. Handling Incoming WhatsApp Messages (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      // Check if it's a WhatsApp status update or an actual message
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages && value.messages.length > 0) {
          const message = value.messages[0];
          const phoneNumber = message.from;
          const textContent = message.text?.body;

          // We need to figure out which Agent this phone number belongs to.
          // This requires looking up the WhatsApp phone number in our integrations table.
          const phoneNumberId = value.metadata?.phone_number_id;

          console.log(`Received message from ${phoneNumber}: ${textContent}`);

          console.log(`Received message from ${phoneNumber}: ${textContent}`);

          // 1. Initialize Supabase Admin Client
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // 2. Find the user/salon associated with this WhatsApp number
          // In a real app, you'd store the phone_number_id in integrations.
          // For now, we fetch the first connected WhatsApp integration to find the owner.
          const { data: integrations, error: intError } = await supabaseAdmin
            .from('integrations')
            .select('user_id, credentials')
            .eq('provider', 'whatsapp')
            .eq('status', 'connected');

          if (intError || !integrations || integrations.length === 0) {
            console.error("No WhatsApp integration found.");
            return new Response('EVENT_RECEIVED', { status: 200 });
          }

          // Assume the first one for the MVP, or match by phone_number_id
          const integration = integrations[0];
          const userId = integration.user_id;
          const waToken = integration.credentials?.access_token || Deno.env.get('WHATSAPP_API_TOKEN');

          // 3. Find the active Agent for this user
          const { data: agent, error: agentError } = await supabaseAdmin
            .from('agents')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

          if (agentError || !agent) {
            console.error("No active agent found for user:", userId);
            return new Response('EVENT_RECEIVED', { status: 200 });
          }

          // 4. Call the agent-handler Edge Function
          // We invoke it via HTTP so it runs as a separate process and handles billing natively
          const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/agent-handler`;

          const agentResponse = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` // Basic auth, handler uses it
            },
            body: JSON.stringify({
              message: textContent,
              sessionId: phoneNumber, // Use phone number as session ID for memory context
              agentId: agent.id
            })
          });

          const agentData = await agentResponse.json();
          let replyText = agentData.text || "عذراً، أواجه مشكلة تقنية حالياً. يرجى المحاولة لاحقاً.";

          // 5. Send the response back via WhatsApp API
          const waApiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

          await fetch(waApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phoneNumber,
              type: "text",
              text: { body: replyText }
            })
          });

          console.log("Successfully replied to WhatsApp.");
        }
      }

      // WhatsApp requires a 200 OK response immediately to acknowledge receipt
      return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
});
