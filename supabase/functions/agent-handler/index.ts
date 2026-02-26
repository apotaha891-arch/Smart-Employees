import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, sessionId, agentId } = await req.json();

        // 1. Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 2. Fetch Agent
        const { data: agent, error: agentError } = await supabaseClient
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();

        if (agentError || !agent) throw new Error(`Agent not found: ${agentError?.message}`);
        console.log("Agent loaded:", agent.name);

        // 3. Fetch connected integrations
        const { data: integrations } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('status', 'connected');

        console.log("Integrations:", integrations?.map((i: any) => i.provider) ?? []);

        // 4. Gemini setup
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

        const currentDateStr = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
        const isoDateStr = new Date().toISOString().split('T')[0];

        const tools = [{
            functionDeclarations: [{
                name: "book_appointment",
                description: "استخدمي هذه الأداة فقط عندما تجمعين معلومات الحجز كاملة: الاسم، الجوال، الخدمة، والوقت.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        customer_name: { type: SchemaType.STRING, description: "اسم الزبونة الكامل" },
                        customer_phone: { type: SchemaType.STRING, description: "رقم جوال الزبونة" },
                        service_requested: { type: SchemaType.STRING, description: "نوع الخدمة المطلوبة" },
                        booking_date: { type: SchemaType.STRING, description: "تاريخ الموعد بصيغة YYYY-MM-DD" },
                        booking_time: { type: SchemaType.STRING, description: "وقت الموعد بنظام 24 ساعة بصيغة HH:mm:00" },
                        original_time_text: { type: SchemaType.STRING, description: "النص العفوي للوقت الذي قالته الزبونة" }
                    },
                    required: ["customer_name", "customer_phone", "service_requested", "booking_date", "booking_time"]
                }
            }]
        }];

        const systemInstruction = `
أنتِ موظفة حجوزات لطيفة ومحترفة تعملين لدى (${agent.name}).
تخصصك: ${agent.specialty || 'خدمات'}.
تاريخ اليوم والساعة الآن: ${currentDateStr} (الموافق ${isoDateStr} ميلادي)

تعليمات صارمة:
1. الردود قصيرة، دافئة، بلهجة الزبونة.
2. اجمعي المعلومات خطوة خطوة: الخدمة → الوقت → الاسم والجوال.
3. بمجرد اكتمال المعلومات، استخدمي فوراً الأداة (book_appointment).
4. استخدمي تاريخ اليوم في استنتاج التواريخ (مثل بكرة، الأسبوع الجاي).
5. بعد نجاح الحجز، ردي برسالة دافئة وسؤال إذا أرادت خدمة أخرى.
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction,
            tools: tools,
            toolConfig: { functionCallingConfig: { mode: "AUTO" } }
        });

        // 5. Load chat history
        let chatHistory: any[] = [];
        try {
            const { data: sessionData } = await supabaseClient
                .from('chat_sessions')
                .select('history')
                .eq('session_id', sessionId)
                .maybeSingle();

            if (sessionData?.history && Array.isArray(sessionData.history)) {
                chatHistory = sessionData.history;
                console.log("Loaded", chatHistory.length / 2, "previous turns");
            }
        } catch (e: any) {
            console.log("chat_sessions not available:", e.message);
        }

        // 6. Send message to Gemini with 50s timeout
        const chat = model.startChat({ history: chatHistory });
        const geminiTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout after 50s')), 50000)
        );
        const result = await Promise.race([chat.sendMessage(message), geminiTimeout]);
        const finalResponse = result.response;

        console.log("AI finish reason:", finalResponse.candidates?.[0]?.finishReason);

        // 7. Detect function call
        let callName: string | null = null;
        let callArgs: Record<string, any> = {};

        if (typeof finalResponse.functionCalls === 'function') {
            const calls = finalResponse.functionCalls();
            if (calls && calls.length > 0) {
                callName = calls[0].name;
                callArgs = calls[0].args ?? {};
            }
        } else {
            const allParts = finalResponse.candidates?.[0]?.content?.parts ?? [];
            const functionCallPart = allParts.find((p: any) => p.functionCall);
            if (functionCallPart?.functionCall) {
                callName = functionCallPart.functionCall.name;
                callArgs = functionCallPart.functionCall.args ?? {};
            }
        }

        console.log("Function call:", callName, JSON.stringify(callArgs));

        // 8. Execute booking
        if (callName === "book_appointment") {
            try {
                const todayIsoDate = new Date().toISOString().split('T')[0];

                // Get salon config id
                const { data: salonConfigs } = await supabaseClient
                    .from('salon_configs')
                    .select('id')
                    .eq('user_id', agent.user_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const finalSalonId = salonConfigs?.id || agent.salon_config_id || null;

                // Add customer if not exists
                if (finalSalonId) {
                    const phone = callArgs.customer_phone ?? '-';
                    const { data: existingCust } = await supabaseClient.from('customers')
                        .select('id').eq('phone', phone).eq('salon_config_id', finalSalonId).maybeSingle();

                    if (!existingCust) {
                        await supabaseClient.from('customers').insert([{
                            salon_config_id: finalSalonId,
                            name: callArgs.customer_name ?? 'زبونة',
                            phone: phone,
                            status: 'active'
                        }]);
                    }
                }

                // Insert booking
                const { error: insertError } = await supabaseClient.from('bookings').insert([{
                    agent_id: agentId,
                    salon_config_id: finalSalonId,
                    customer_name: callArgs.customer_name ?? 'زبونة',
                    customer_phone: callArgs.customer_phone ?? '-',
                    service_requested: callArgs.service_requested ?? '',
                    booking_date: callArgs.booking_date || todayIsoDate,
                    booking_time: callArgs.booking_time || "12:00:00",
                    duration_minutes: 60,
                    notes: `توقيت الزبونة الأصلي: ${callArgs.original_time_text ?? 'غير محدد'}`,
                    status: 'pending'
                }]);
                if (insertError) console.error("DB INSERT FAILED:", JSON.stringify(insertError));
                else console.log("DB INSERT BOOKING SUCCESS ✅");

            } catch (err: any) {
                console.error("DB Write Exception:", err.message);
            }

            // Google Calendar — Direct REST API (no googleapis library needed)
            const googleCalCreds = integrations?.find((i: any) => i.provider === 'google_calendar')?.credentials;
            if (googleCalCreds?.access_token) {
                try {
                    const dateStr = callArgs.booking_date || new Date().toISOString().split('T')[0];
                    const timeStr = callArgs.booking_time || "12:00:00";
                    const eventStart = new Date(`${dateStr}T${timeStr}`);
                    const eventEnd = new Date(eventStart.getTime() + 60 * 60000);

                    const calRes = await fetch(
                        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${googleCalCreds.access_token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                summary: `موعد: ${callArgs.service_requested} - ${callArgs.customer_name}`,
                                description: `جوال: ${callArgs.customer_phone}\nتوقيت الزبونة الأصلي: ${callArgs.original_time_text ?? ''}`,
                                start: { dateTime: eventStart.toISOString() },
                                end: { dateTime: eventEnd.toISOString() }
                            })
                        }
                    );
                    if (calRes.ok) console.log("Calendar ✅");
                    else console.error("Calendar ❌", await calRes.text());
                } catch (e: any) {
                    console.error("Calendar error:", e.message);
                }
            }

            // Google Sheets — Direct REST API
            const sheetsInt = integrations?.find((i: any) => i.provider === 'google_sheets');
            const spreadsheetId = sheetsInt?.config?.spreadsheet_id ?? sheetsInt?.credentials?.spreadsheet_id;
            if (sheetsInt?.credentials?.access_token && spreadsheetId) {
                try {
                    const sheetRes = await fetch(
                        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${sheetsInt.credentials.access_token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                values: [[
                                    new Date().toLocaleDateString('ar-SA'),
                                    callArgs.customer_name ?? '',
                                    callArgs.customer_phone ?? '',
                                    callArgs.service_requested ?? '',
                                    `${callArgs.booking_date ?? ''} ${callArgs.booking_time ?? ''}`,
                                    'معلق'
                                ]]
                            })
                        }
                    );
                    if (sheetRes.ok) console.log("Sheets ✅");
                    else console.error("Sheets ❌", await sheetRes.text());
                } catch (e: any) {
                    console.error("Sheets error:", e.message);
                }
            }

            // Tell AI booking succeeded
            const secondResult = await chat.sendMessage([{
                functionResponse: {
                    name: "book_appointment",
                    response: { status: "تم تسجيل الحجز بنجاح. برجاء تقديم ملخص دافئ للموعد للزبونة." }
                }
            }]);

            // Save history
            try {
                const newHistory = await chat.getHistory();
                await supabaseClient.from('chat_sessions').upsert({
                    session_id: sessionId,
                    agent_id: agentId,
                    history: newHistory,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'session_id' });
            } catch (e: any) { console.log("History save skipped:", e.message); }

            return new Response(
                JSON.stringify({ success: true, text: secondResult.response.text() }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // No function call — save history and return text
        try {
            const newHistory = await chat.getHistory();
            await supabaseClient.from('chat_sessions').upsert({
                session_id: sessionId,
                agent_id: agentId,
                history: newHistory,
                updated_at: new Date().toISOString()
            }, { onConflict: 'session_id' });
        } catch (e: any) { console.log("History save skipped:", e.message); }

        let aiText = finalResponse.text();

        // Security: if AI claims booking was done without calling the tool, block it
        const confirmationWords = ['تم', 'تأكيد', 'حجز', 'موعدك', 'بنجاح'];
        const matchCount = confirmationWords.filter(w => aiText.includes(w)).length;
        if (matchCount >= 2 && !callName) {
            console.error("⛔ AI hallucinated booking confirmation without tool call!");
            aiText = "عذراً يا غالية، واجهت مشكلة تقنية. الرجاء المحاولة مرة أخرى.";
        }

        return new Response(
            JSON.stringify({ success: true, text: aiText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("FATAL ERROR:", error.message);
        const errMsg = error.message?.includes('timeout')
            ? "عذراً، استغرق الرد وقتاً أطول من المعتاد. يرجى المحاولة مرة أخرى."
            : "عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى بعد لحظات.";
        return new Response(
            JSON.stringify({ success: false, text: errMsg, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
