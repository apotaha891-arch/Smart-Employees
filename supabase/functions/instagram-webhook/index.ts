import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // 1. Webhook Verification (Meta challenge)
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        
        console.log(`Webhook Verification Attempt: mode=${mode}, token=${token}`);

        // We use a fixed verify token or check it against Env
        const verifyToken = Deno.env.get('IG_VERIFY_TOKEN') || '24shift_instagram_verify';

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Instagram Webhook Verified Successfully ✅');
            return new Response(challenge, { status: 200 });
        }
        console.error(`Verification Failed: Expected ${verifyToken}, got ${token}`);
        return new Response('Forbidden', { status: 403 });
    }

    // 2. Process Incoming Events
    let body: any;
    try {
        body = await req.json();
    } catch (_) {
        return new Response("Bad Request", { status: 400 });
    }

    if (body.object !== "instagram") {
        return new Response("Not an instagram event", { status: 404 });
    }

    // 3. Handle processing in background
    const backgroundTask = (async () => {
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

            for (const entry of body.entry) {
                for (const messaging of entry.messaging) {
                    const senderId = messaging.sender.id;
                    const recipientId = messaging.recipient.id;
                    const message = messaging.message;

                    if (!message || !message.text) continue;

                    // A. Find the matching salon_config/agent using the recipientId (IG Page ID)
                    // In a multi-tenant setup, we usually store the page_id in instagram_settings
                    const { data: config, error: configError } = await supabase
                        .from('salon_configs')
                        .select('id, user_id, instagram_token, instagram_settings')
                        .contains('instagram_settings', { page_id: recipientId })
                        .maybeSingle();

                    if (!config || !config.instagram_token) {
                        console.error('No config found for Instagram Page ID:', recipientId);
                        continue;
                    }

                    // B. Get the agent linked to this config
                    const { data: agent } = await supabase
                        .from('agents')
                        .select('id')
                        .eq('salon_config_id', config.id)
                        .maybeSingle();

                    if (!agent) continue;

                    // C. Call agent-handler
                    const agentHandlerUrl = `${supabaseUrl}/functions/v1/agent-handler`;
                    const agentRes = await fetch(agentHandlerUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: message.text,
                            sessionId: `instagram_${senderId}`,
                            agentId: agent.id
                        })
                    });

                    if (!agentRes.ok) continue;
                    const agentData = await agentRes.json();
                    if (!agentData.text) continue;

                    // D. Send Response back to Instagram
                    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${config.instagram_token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipient: { id: senderId },
                            message: { text: agentData.text }
                        })
                    });
                }
            }
        } catch (err: any) {
            console.error('Instagram Webhook Background Error:', err.message);
        }
    })();

    // Run without blocking
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
        (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
    } else {
        await backgroundTask;
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
});
