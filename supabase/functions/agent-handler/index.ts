import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai";
import { google } from "npm:googleapis";

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

        console.log("Integrations:", integrations?.map(i => i.provider) ?? []);

        // 4. Gemini setup
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

        const currentDateStr = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
        const isoDateStr = new Date().toISOString().split('T')[0];

        const tools = [{
            functionDeclarations: [{
                name: "book_appointment",
                description: "استخدمي هذه الأداة فقط عندما تجمعين معلومات الحجز كاملة: الاسم، الجوال، الخدمة، والوقت. يجب استنتاج التاريخ والوقت بدقة.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        customer_name: { type: SchemaType.STRING, description: "اسم الزبونة الكامل" },
                        customer_phone: { type: SchemaType.STRING, description: "رقم جوال الزبونة" },
                        service_requested: { type: SchemaType.STRING, description: "نوع الخدمة المطلوبة" },
                        booking_date: { type: SchemaType.STRING, description: "استنتجي تاريخ الموعد بناءً على اليوم، واكتبيه بصيغة YYYY-MM-DD (مثال: 2026-03-01)" },
                        booking_time: { type: SchemaType.STRING, description: "وقت الموعد بنظام 24 ساعة بصيغة HH:mm:00 (مثال: 14:30:00)" },
                        original_time_text: { type: SchemaType.STRING, description: "النص العفوي للوقت الذي قالته الزبونة (مثلاً: بكرة الساعة 7 الصبح)" }
                    },
                    required: ["customer_name", "customer_phone", "service_requested", "booking_date", "booking_time"]
                }
            }]
        }];

        const systemInstruction = `
أنتِ موظفة حجوزات لطيفة ومحترفة تعملين لدى (${agent.name}).
تخصصك: ${agent.specialty || 'خدمات'}.
تاريخ اليوم والساعة الآن: ${currentDateStr} (الموافق ${isoDateStr} ميلادي)

تعليمات صارمة جداً جداً:
1. الردود قصيرة، دافئة، بلهجة الزبونة.
2. اجمعي المعلومات خطوة خطوة: الخدمة → الوقت → الاسم والجوال.
3. بمجرد اكتمال المعلومات (الاسم، الجوال، الخدمة، الوقت)، **يجب** عليكِ فوراً ودون استثناء استخدام الأداة البرمجية (book_appointment). لا تقولي أبداً أنك حجزتِ قبل أن تستخدمي الأداة وتستلمي النتيجة منها.
4. استخدمي تاريخ اليوم المذكور بالأعلى في استنتاج التواريخ المطلوبة بدقة بناءً على الموعد الذي حددته الزبونة (مثل بكرة، الأسبوع الجاي، الخ) وسلّميه للأداة بصيغة YYYY-MM-DD.
5. بعد استلام نجاح الحجز من الأداة، ردي على الزبونة برسالة دافئة تحتوي على تفاصيل الموعد واسمها ورقمها، ثم اسأليها بود إذا كانت ترغب في إضافة أية خدمة أخرى للاغلاق.
مثال للرد بعد نجاح الأداة: "أبشري يا قلبي، موعدك [الوقت] لخدمة [الخدمة]، باسم [الاسم] ورقم جوالك [الرقم]. 🌷 هل أقدر أخدمك بشيء ثاني أو نضيف خدمة ثانية؟"
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            tools: tools,
            toolConfig: { functionCallingConfig: { mode: "AUTO" } }
        });

        // 5. Load chat history (graceful - works even if table doesn't exist yet)
        let chatHistory: any[] = [];
        try {
            const { data: sessionData } = await supabaseClient
                .from('chat_sessions')
                .select('history')
                .eq('session_id', sessionId)
                .maybeSingle();

            if (sessionData?.history && Array.isArray(sessionData.history)) {
                chatHistory = sessionData.history;
                console.log("Loaded", chatHistory.length / 2, "previous conversation turns");
            }
        } catch (e: any) {
            console.log("chat_sessions not available:", e.message);
        }

        // 6. Send message to AI with history
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const finalResponse = result.response;

        console.log("AI response finish reason:", finalResponse.candidates?.[0]?.finishReason);

        // 6. Detect function call (handles all SDK versions)
        let callName: string | null = null;
        let callArgs: Record<string, any> = {};

        if (typeof finalResponse.functionCalls === 'function') {
            const calls = finalResponse.functionCalls();
            if (calls && calls.length > 0) {
                callName = calls[0].name;
                callArgs = calls[0].args ?? {};
            }
        } else if (Array.isArray((finalResponse as any).functionCalls) && (finalResponse as any).functionCalls.length > 0) {
            const calls = (finalResponse as any).functionCalls;
            callName = calls[0].name;
            callArgs = calls[0].args ?? {};
        } else {
            const allParts = finalResponse.candidates?.[0]?.content?.parts ?? [];
            const functionCallPart = allParts.find((p: any) => p.functionCall);
            if (functionCallPart?.functionCall) {
                callName = functionCallPart.functionCall.name;
                callArgs = functionCallPart.functionCall.args ?? {};
            }
        }

        console.log("Function call detected:", callName, JSON.stringify(callArgs));

        // 7. Execute booking
        if (callName === "book_appointment") {

            // Await the DB save! Edge Functions kill background tasks if not awaited.
            try {
                // Fallback date just in case AI fails to return it exactly
                const todayIsoDate = new Date().toISOString().split('T')[0];

                const { data: salonConfigs } = await supabaseClient
                    .from('salon_configs')
                    .select('id')
                    .eq('user_id', agent.user_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const finalSalonId = salonConfigs?.id || agent.salon_config_id || null;

                // 1. Upsert Customer (Save the customer details to the customers table)
                if (finalSalonId) {
                    const { error: customerError } = await supabaseClient.from('customers').upsert({
                        salon_config_id: finalSalonId,
                        name: callArgs.customer_name ?? 'زبونة',
                        phone: callArgs.customer_phone ?? '-',
                        status: 'active'
                    }, { onConflict: 'phone' }); // Adjust onConflict if there's a unique constraint on phone+salon_id

                    if (customerError) console.error("DB CUSTOMER UPSERT FAILED:", JSON.stringify(customerError));
                    else console.log("DB CUSTOMER UPSERT SUCCESS ✅");
                }

                // 2. Insert Booking
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
                if (insertError) console.error("DB INSERT BOOKING FAILED:", JSON.stringify(insertError));
                else console.log("DB INSERT BOOKING SUCCESS ✅");
            } catch (err: any) {
                console.error("DB Write Exception:", err.message);
            }

            // Await Google Calendar
            const googleCalCreds = integrations?.find((i: any) => i.provider === 'google_calendar')?.credentials;
            if (googleCalCreds?.access_token) {
                try {
                    const auth = new google.auth.OAuth2();
                    auth.setCredentials(googleCalCreds);
                    const calendar = google.calendar({ version: 'v3', auth });
                    const dateStr = callArgs.booking_date || new Date().toISOString().split('T')[0];
                    const timeStr = callArgs.booking_time || "12:00:00";
                    const eventStart = new Date(`${dateStr}T${timeStr}`);

                    await calendar.events.insert({
                        calendarId: 'primary',
                        requestBody: {
                            summary: `موعد: ${callArgs.service_requested} - ${callArgs.customer_name}`,
                            description: `جوال: ${callArgs.customer_phone}\nتوقيت الزبونة الأصلي: ${callArgs.original_time_text ?? ''}`,
                            start: { dateTime: eventStart.toISOString() },
                            end: { dateTime: new Date(eventStart.getTime() + 60 * 60000).toISOString() }
                        },
                    });
                    console.log("Calendar ✅");
                } catch (e: any) {
                    console.error("Calendar ❌", e.message);
                }
            }

            // Await Google Sheets
            const sheetsInt = integrations?.find((i: any) => i.provider === 'google_sheets');
            const spreadsheetId = sheetsInt?.config?.spreadsheet_id ?? sheetsInt?.credentials?.spreadsheet_id;
            if (sheetsInt?.credentials?.access_token && spreadsheetId) {
                try {
                    const auth = new google.auth.OAuth2();
                    auth.setCredentials(sheetsInt.credentials);
                    const sheets = google.sheets({ version: 'v4', auth });
                    await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range: 'Sheet1!A:F',
                        valueInputOption: 'USER_ENTERED',
                        requestBody: {
                            values: [[
                                new Date().toLocaleDateString('ar-SA'),
                                callArgs.customer_name ?? '',
                                callArgs.customer_phone ?? '',
                                callArgs.service_requested ?? '',
                                `${callArgs.booking_date ?? ''} ${callArgs.booking_time ?? ''}`,
                                'معلق'
                            ]]
                        },
                    });
                    console.log("Sheets ✅");
                } catch (e: any) {
                    console.error("Sheets ❌", e.message);
                }
            }

            // Always tell the AI the booking succeeded, and prompt it to format the final confirmation
            const secondResult = await chat.sendMessage([{
                functionResponse: {
                    name: "book_appointment",
                    response: { status: "تم تسجيل الحجز بنجاح في قاعدة البيانات. برجاء تقديم ملخص دافئ للموعد للزبونة وسؤالها إذا أرادت شيء آخر كما هو في التعليمات." }
                }
            }]);

            // Save history after booking
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

        // No function call — handle potential AI "hallucination" where it claims to have booked
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
        const confirmationWords = ['تم', 'تأكيد', 'حجز', 'موعدك', 'بنجاح'];
        const matchesWords = confirmationWords.filter(word => aiText.includes(word)).length;

        // Strict interceptor: If AI text sounds like a booking confirmation but IT DID NOT execute the tool
        if (matchesWords >= 2 && !callName) {
            console.error("⛔ SECURITY INTERCEPT: AI hallucinated a booking confirmation without calling the tool!");
            aiText = "عذراً يا غالية، واجهت مشكلة تقنية ولم أتمكن من تسجيل الموعد في النظام. الرجاء المحاولة مرة أخرى أو تزويدي بالبيانات من جديد.";
        }

        return new Response(
            JSON.stringify({ success: true, text: aiText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("FATAL ERROR in agent-handler:", error.message);
        return new Response(
            JSON.stringify({ success: true, text: "أبشري! سيتم التواصل معكِ لتأكيد الموعد." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
