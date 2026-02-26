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
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? "8579575826:AAHrYDyorHTlFSWDQajjt41n2nQYZM2TmVg";

    console.log(`Received message from ${chatId}: ${text}`);

    // 3. Helper: send Telegram message
    async function sendTelegram(msg: string) {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg })
            });
        } catch (e: any) {
            console.error("Telegram send error:", e.message);
        }
    }

    // 4. Send "Typing..." indicator immediately (non-blocking)
    const typingApiUrl = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    fetch(typingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    }).catch(err => console.error("Typing action error:", err));

    // 5. Process AI in background using EdgeRuntime.waitUntil
    //    This lets us return 200 to Telegram immediately (within 5s limit)
    //    while the AI processing continues asynchronously.
    const backgroundTask = (async () => {
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

            // Find the matching Agent — fetch first active agent
            const { data: agents, error: agentError } = await supabase
                .from('agents')
                .select('id')
                .eq('status', 'active')
                .limit(1);

            if (agentError || !agents || agents.length === 0) {
                console.error("No active agent found:", agentError?.message);
                await sendTelegram("عذراً، لا يوجد موظف نشط في النظام حالياً. يرجى التواصل مع الإدارة.");
                return;
            }

            const targetAgentId = agents[0].id;
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
                }
            }

            // Send the AI response back via Telegram
            await sendTelegram(aiReply);
            console.log(`Replied to ${chatId}: ${aiReply.substring(0, 80)}...`);

        } catch (error: any) {
            console.error("Background task error:", error.message);
            await sendTelegram("حدث خطأ تقني مؤقت. يرجى المحاولة مرة أخرى بعد قليل.");
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
