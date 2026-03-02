import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // 2. Handle Webhook Verification (Meta / Facebook requires this when setting up the webhook)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const targetAgentId = url.searchParams.get('agent_id');

    if (mode === 'subscribe' && token && targetAgentId) {
      // Check token against database
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { data: agent, error } = await supabase
          .from('agents')
          .select('whatsapp_settings')
          .eq('id', targetAgentId)
          .single();

        if (!error && agent?.whatsapp_settings?.verifyToken === token) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { status: 200 });
        }
      } catch (e) {
        console.error("Verification DB Error:", e);
      }
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Parse body once
  let body: any;
  try {
    body = await req.json();
  } catch (_) {
    return new Response("Bad Request", { status: 400 });
  }

  console.log("WhatsApp Webhook Payload:", JSON.stringify(body));

  // 3. Extract Message from WhatsApp Payload (Cloud API format)
  if (body.object !== "whatsapp_business_account") {
    return new Response("Not a WhatsApp event", { status: 404 });
  }

  // WhatsApp nests the actual message deep inside entries/changes/value/messages
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || !messages[0] || messages[0].type !== "text") {
    // Ignore non-text messages (like status updates, images, etc.) for now
    return new Response("OK", { status: 200 });
  }

  const message = messages[0];
  const contactPhone = message.from; // Phone number of the user sending the message
  const text = message.text.body;

  // We should get agent_id from URL query params.
  const targetAgentId = url.searchParams.get('agent_id');

  // 5. Process AI in background using EdgeRuntime.waitUntil
  const backgroundTask = (async () => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      if (!targetAgentId) {
        console.error("Missing agent_id in webhook URL");
        return;
      }

      // Find the matching Agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, whatsapp_settings')
        .eq('id', targetAgentId)
        .single();

      if (agentError || !agent || !agent.whatsapp_settings) {
        console.error("Agent or WhatsApp settings not found");
        return;
      }
      // --- QUOTA LOGIC: Check owner's message_limit ---
      const { data: owner } = await supabase
        .from('profiles')
        .select('id, message_limit')
        .eq('id', agent.user_id)
        .single();

      const { token: waToken, phoneNumberId: waPhoneId } = agent.whatsapp_settings;

      if (!waToken || !waPhoneId) {
        console.error("Incomplete WhatsApp configuration for agent", targetAgentId);
        return;
      }

      // Helper: send WhatsApp message
      async function sendWhatsApp(msg: string) {
        const apiStr = `https://graph.facebook.com/v19.0/${waPhoneId}/messages`;
        try {
          const res = await fetch(apiStr, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: contactPhone,
              type: "text",
              text: { body: msg }
            })
          });
          const data = await res.json();
          if (!res.ok) console.error("WhatsApp sending error:", data);
        } catch (e: any) {
          console.error("WhatsApp send exception:", e.message);
        }
      }

      if (!owner || owner.message_limit <= 0) {
        await sendWhatsApp("عذراً، لقد استنفد هذا الموظف رصيد المحادثات الخاص به. يرجى من صاحب المنشأة ترقية الباقة لضمان استمرار الخدمة.");
        return;
      }

      // Decrement the quota limit by 1
      await supabase.from('profiles').update({ message_limit: owner.message_limit - 1 }).eq('id', owner.id);
      // --- END QUOTA LOGIC ---

      const sessionId = `whatsapp_${contactPhone}`;

      // Call our agent-handler edge function with a generous timeout
      const agentHandlerUrl = `${supabaseUrl}/functions/v1/agent-handler`;
      console.log(`Calling agent-handler: agent=${targetAgentId}, session=${sessionId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

      let aiReply = "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";

      try {
        const agentRes = await fetch(agentHandlerUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: text,
            sessionId: sessionId,
            agentId: targetAgentId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!agentRes.ok) {
          const errText = await agentRes.text();
          console.error(`agent-handler returned ${agentRes.status}:`, errText);
          // Simplify error message for real users
          aiReply = "عذراً، نواجه ضغطاً تقنياً حالياً، يرجى المحاولة لاحقاً.";
        } else {
          const agentData = await agentRes.json();
          if (agentData.text) {
            aiReply = agentData.text;
          }
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          console.error("agent-handler timed out after 55s");
          aiReply = "عذراً، استغرق معالجة طلبك وقتاً أطول من المعتاد. يرجى المحاولة مرة أخرى.";
        } else {
          console.error("Fetch error calling agent-handler:", fetchErr.message);
          aiReply = "عذراً، حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.";
        }
      }

      // Send the AI response back via WhatsApp
      await sendWhatsApp(aiReply);
      console.log(`Replied to ${contactPhone}: ${aiReply.substring(0, 80)}...`);

    } catch (error: any) {
      console.error("Background task error:", error.message);
    }
  })();

  // Run background task without blocking the response
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
    (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
  } else {
    await backgroundTask;
  }

  // 6. Return 200 to WhatsApp IMMEDIATELY
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
