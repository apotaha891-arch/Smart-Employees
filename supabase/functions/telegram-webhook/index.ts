import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Parse body once
    let body: any;
    try {
        body = await req.json();
    } catch (_) {
        return new Response("Bad Request", { status: 400 });
    }

    console.log("Telegram Webhook Payload:", JSON.stringify(body));

    // 2. Extract Message from Telegram Payload
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
        // Ignore non-text messages (images, stickers, etc.)
        return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text;
    // 5. Process AI in background using EdgeRuntime.waitUntil
    //    This lets us return 200 to Telegram immediately (within 5s limit)
    //    while the AI processing continues asynchronously.
    const backgroundTask = (async () => {
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

            const url = new URL(req.url);
            let targetAgentId = url.searchParams.get('agent_id');

            // --- 2.5 INFRASTRUCTURE UPGRADE: Fallback Agent Discovery ---
            // If agent_id is missing in URL (happens if webhook is set manually/incorrectly)
            // we discover the agent by the token associated with this webhook.
            // This requires the function to be invoked with the token in the URL or 
            // the bot to have been contacted. Telegram doesn't send the token in the payload,
            // so we rely on the URL param or search.
            
            if (!targetAgentId) {
                console.log("Missing agent_id in URL, attempting discovery via token lookup...");
                // Note: We can't easily know WHICH bot this is without the token in the URL 
                // UNLESS we check the specific agent matching the token but we don't have the token yet.
                // However, we can check salon_configs for tokens.
                console.error("Discovery failed: No agent_id provided in Webhook URL.");
                return;
            }

            // Find the matching Agent
            const { data: agent, error: agentError } = await supabase
                .from('agents')
                .select('id, user_id, telegram_token, salon_config_id')
                .eq('id', targetAgentId)
                .single();

            if (agentError || !agent) {
                console.warn("Agent ID lookup failed, trying token reverse-lookup for ID:", targetAgentId);
                // Fallback: If targetAgentId is actually a TOKEN or just wrong, try finding any agent with it
                const { data: fallbackAgent } = await supabase
                    .from('agents')
                    .select('id, user_id, telegram_token, salon_config_id')
                    .eq('telegram_token', targetAgentId) // Maybe they passed token as ID?
                    .limit(1)
                    .maybeSingle();
                
                if (!fallbackAgent) {
                    console.error("Agent not found and discovery failed for:", targetAgentId);
                    return;
                }
                // Update reference
                Object.assign(agent || {}, fallbackAgent);
            }

            // CRITICAL: Strict token isolation with fallback.
            let dynamicBotToken = agent.telegram_token;

            // Fallback to salon_configs if token isn't in agent table yet
            if (!dynamicBotToken && agent.salon_config_id) {
                console.log("Agent token missing, falling back to salon_configs...");
                const { data: config } = await supabase
                    .from('salon_configs')
                    .select('telegram_token')
                    .eq('id', agent.salon_config_id)
                    .single();
                if (config?.telegram_token) {
                    dynamicBotToken = config.telegram_token;
                    console.log("Found token via salon_configs fallback ✅");
                }
            }

            if (!dynamicBotToken) {
                console.error("No telegram token configured for agent or salon config", targetAgentId);
                return;
            }

            // Helper: send Telegram message
            async function sendTelegram(msg: string) {
                const apiStr = `https://api.telegram.org/bot${dynamicBotToken}/sendMessage`;
                try {
                    await fetch(apiStr, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: msg })
                    });
                } catch (e: any) {
                    console.error("Telegram send error:", e.message);
                }
            }

            // --- QUOTA LOGIC ---
            const { data: owner } = await supabase
                .from('profiles')
                .select('id, message_limit')
                .eq('id', agent.user_id)
                .single();

            if (!owner || (owner.message_limit !== null && owner.message_limit <= 0)) {
                await sendTelegram("عذراً، لقد استنفد هذا الموظف رصيد المحادثات الخاص به. يرجى من صاحب المنشأة ترقية الباقة لضمان استمرار الخدمة.");
                return;
            }

            // Decrement the quota limit by 1
            await supabase.from('profiles').update({ message_limit: owner.message_limit - 1 }).eq('id', owner.id);
            // --- END QUOTA LOGIC ---



            // Send "Typing..." indicator
            const typingApiUrl = `https://api.telegram.org/bot${dynamicBotToken}/sendChatAction`;
            fetch(typingApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
            }).catch(err => console.error("Typing action error:", err));

            const sessionId = `telegram_${chatId}`;

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
                    aiReply = "عذراً، حدث خطأ أثناء معالجة طلبك. رمز الخطأ: " + agentRes.status + " تفاصيل: " + errText.substring(0, 100);
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
                    aiReply = "عذراً، حدث خطأ أثناء معالجة طلبك. الخطأ: " + String(fetchErr.message) + " url: " + agentHandlerUrl;
                }
            }

            // Send the AI response back via Telegram
            await sendTelegram(aiReply);
            console.log(`Replied to ${chatId}: ${aiReply.substring(0, 80)}...`);

        } catch (error: any) {
            console.error("Background task error:", error.message);
            // We can't use sendTelegram here because it might not be initialized, 
            // but we'll try if botToken is defined... it depends on where it failed.
        }
    })();

    // Run background task without blocking the response
    // EdgeRuntime.waitUntil keeps the function alive after response is sent
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
        (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
    } else {
        // Fallback: await normally (will block but won't time out Telegram's webhook)
        await backgroundTask;
    }

    // 6. Return 200 to Telegram IMMEDIATELY (before AI processing finishes)
    //    This prevents Telegram from retrying the webhook and sending duplicate messages.
    return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
});

