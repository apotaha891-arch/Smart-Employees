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

    try {
        const url = new URL(req.url);

        // --- 2. Initialize Supabase Client (Service Role for admin DB access) ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // --- 3. Extract Message from Telegram Payload ---
        const body = await req.json();
        console.log("Telegram Webhook Payload:", JSON.stringify(body));

        // Telegram sends 'message' or 'edited_message'
        const message = body.message || body.edited_message;
        if (!message || !message.text) {
            // Ignore non-text messages for now (like images or system messages)
            return new Response("OK", { status: 200 });
        }

        const chatId = message.chat.id;
        const text = message.text;
        const botToken = "8579575826:AAHrYDyorHTlFSWDQajjt41n2nQYZM2TmVg"; // From User Request. TODO: Fetch from DB in production.

        console.log(`Received message from ${chatId}: ${text}`);

        // --- 4. Find the matching Agent ID from DB ---
        // For testing purposes, we fetch the FIRST active agent, or ideally we query the 'integrations' table.
        // Let's assume there is at least one agent in the DB since the user was testing in the Interview Room.
        const { data: agents, error: agentError } = await supabase
            .from('agents')
            .select('id')
            .limit(1);

        if (agentError || !agents || agents.length === 0) {
            throw new Error("No agent found in database to handle the request.");
        }

        const targetAgentId = agents[0].id;
        // Session ID will be the Telegram Chat ID to keep conversation history isolated per user
        const sessionId = `telegram_${chatId}`;

        // --- 5. Forward text to our Native Engine (agent-handler) ---
        // Note: We use Deno fetch to call our own Supabase edge function securely.
        const agentHandlerUrl = `${supabaseUrl}/functions/v1/agent-handler`;
        console.log(`Calling agent-handler for agent: ${targetAgentId}, session: ${sessionId}`);

        // --- 4.5. Send "Typing..." action to Telegram ---
        const typingApiUrl = `https://api.telegram.org/bot${botToken}/sendChatAction`;
        // We don't need to await this to block the execution, let it run in background
        fetch(typingApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        }).catch(err => console.error("Typing action error:", err));

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
            })
        });

        const agentData = await agentRes.json();
        const aiReply = agentData.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";

        // --- 6. Send the AI response back via Telegram API ---
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const tgRes = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: aiReply,
                parse_mode: 'Markdown'
            })
        });

        if (!tgRes.ok) {
            const errTg = await tgRes.text();
            console.error("Failed to push to Telegram:", errTg);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
