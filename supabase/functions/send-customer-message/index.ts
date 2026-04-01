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

    try {
        const { customerId, entityId, message, platform = 'telegram' } = await req.json();

        if (!message || !entityId) {
            throw new Error("Missing required fields: message, entityId");
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 2. Fetch Entity Token
        const { data: entity, error: entityError } = await supabase
            .from('entities')
            .select('telegram_token, agent_name')
            .eq('id', entityId)
            .single();

        if (entityError || !entity) throw new Error("Entity config not found");

        const botToken = entity.telegram_token;
        if (!botToken) throw new Error("Telegram token not configured for this entity");

        // 3. Fetch Customer Details
        let chatIds: string[] = [];
        if (customerId) {
            const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('telegram_id, instagram_id')
                .eq('id', customerId)
                .single();
            if (customerError || !customer) throw new Error("Customer not found");
            
            const targetId = platform === 'telegram' ? customer.telegram_id : customer.instagram_id;
            if (!targetId) throw new Error(`Customer has no ${platform} ID linked`);
            chatIds = [targetId];
        } else {
            // BROADCAST CASE: Fetch all customers for this entity with IDs
            const { data: customers } = await supabase
                .from('customers')
                .select('telegram_id')
                .eq('entity_id', entityId)
                .not('telegram_id', 'is', null);
            
            chatIds = customers?.map(c => c.telegram_id).filter(id => !!id) || [];
        }

        if (chatIds.length === 0) throw new Error("No recipients found");

        const results = [];

        // 4. Send Messaging
        for (const chatId of chatIds) {
            const apiStr = `https://api.telegram.org/bot${botToken}/sendMessage`;
            try {
                const res = await fetch(apiStr, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: message })
                });
                const data = await res.json();
                results.push({ chatId, ok: data.ok });

                // log the individual notification if it's for a specific person
                if (customerId) {
                  await supabase.from('customer_notifications').insert({
                    customer_id: customerId,
                    entity_id: entityId,
                    type: customerId ? 'direct' : 'broadcast',
                    platform: platform,
                    message: message,
                    status: data.ok ? 'sent' : 'failed'
                  });
                }
            } catch (e: any) {
                results.push({ chatId, ok: false, error: e.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("send-customer-message error:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
