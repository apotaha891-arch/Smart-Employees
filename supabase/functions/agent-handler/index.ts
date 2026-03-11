import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Auto-refresh Google OAuth token ───────────────────────────────────────
// Returns a valid access_token, refreshing it if expired.
async function getValidGoogleToken(
    supabase: any,
    integration: any
): Promise<string | null> {
    const creds = integration?.credentials;
    if (!creds?.access_token) return null;

    // Check if token is still valid (with 5-minute buffer)
    if (creds.expires_at) {
        const expiresAt = new Date(creds.expires_at).getTime();
        const nowMs = Date.now();
        const bufferMs = 5 * 60 * 1000; // 5 minutes
        if (nowMs < expiresAt - bufferMs) {
            console.log("Google token still valid ✅");
            return creds.access_token;
        }
        console.log("Google token expired, refreshing...");
    }

    // Need refresh_token + client credentials to refresh
    const refreshToken = creds.refresh_token ?? creds.provider_refresh_token;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? creds.client_id;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? creds.client_secret;

    if (!refreshToken || !clientId || !clientSecret) {
        console.warn("Cannot refresh: missing refresh_token, client_id, or client_secret");
        return creds.access_token; // use existing token, may fail if expired
    }

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }).toString()
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Token refresh failed:", err);
            return creds.access_token; // fallback to old token
        }

        const newTokenData = await res.json();
        const newAccessToken = newTokenData.access_token;
        const expiresInSec = newTokenData.expires_in ?? 3600;
        const newExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

        // Save new token to DB
        const updatedCredentials = {
            ...creds,
            access_token: newAccessToken,
            expires_at: newExpiresAt,
            expires_in: expiresInSec,
        };

        await supabase.from('integrations')
            .update({ credentials: updatedCredentials })
            .eq('id', integration.id);

        console.log("Google token refreshed and saved ✅ (expires:", newExpiresAt, ")");
        return newAccessToken;

    } catch (e: any) {
        console.error("Token refresh error:", e.message);
        return creds.access_token;
    }
}
// ───────────────────────────────────────────────────────────────────────────

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

        // 2b. Fetch business info and services for this agent's salon
        let businessContext = '';
        let servicesText = '';
        try {
            // Resolve salon_config_id
            let salonConfigId = agent.salon_config_id;
            if (!salonConfigId) {
                const { data: sc } = await supabaseClient
                    .from('salon_configs')
                    .select('id, description, knowledge_base')
                    .eq('user_id', agent.user_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                salonConfigId = sc?.id;
                if (sc?.description) businessContext += `\nBusiness Description: ${sc.description}`;
                if (sc?.knowledge_base) businessContext += `\nKnowledge Base / Policies: ${sc.knowledge_base}`;
            } else {
                 const { data: sc } = await supabaseClient
                    .from('salon_configs')
                    .select('description, knowledge_base')
                    .eq('id', salonConfigId)
                    .maybeSingle();
                if (sc?.description) businessContext += `\nBusiness Description: ${sc.description}`;
                if (sc?.knowledge_base) businessContext += `\nKnowledge Base / Policies: ${sc.knowledge_base}`;
            }

            if (salonConfigId) {
                const { data: svcs } = await supabaseClient
                    .from('salon_services')
                    .select('service_name, price, duration_minutes')
                    .eq('salon_config_id', salonConfigId)
                    .order('service_name');
                if (svcs && svcs.length > 0) {
                    servicesText = `\n\nOFFICIAL SERVICE MENU (Always use these prices):\n`
                        + svcs.map((s: any) => `- ${s.service_name}: ${s.price} SAR${s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}`).join('\n');
                    console.log(`Loaded ${svcs.length} services for agent`);
                } else {
                    console.log('No services found for this agent');
                }
            }
        } catch (e: any) {
            console.warn('Could not load services/profile:', e.message);
        }

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

        // ── Dynamic System Prompt per Agent Type ────────────────────────────────
        const specialty = (agent.specialty || '').toLowerCase();
        const agentName = agent.name || 'الموظف الذكي';
        const businessName = agent.business_name || agentName;

        // Helper: detect specialty bucket
        const isBooking = ['حجز', 'استقبال', 'مواعيد', 'صالون', 'عيادة', 'مطعم', 'نادي', 'beauty', 'salon', 'clinic', 'medical', 'restaurant', 'fitness', 'booking', 'receptionist', 'coordinator'].some(k => specialty.includes(k));
        const isSales = ['مبيعات', 'تسويق', 'sales', 'sell', 'marketing', 'lead'].some(k => specialty.includes(k));
        const isHR = ['موارد', 'توظيف', 'hr', 'human resources', 'recruit', 'interview'].some(k => specialty.includes(k));
        const isSupport = ['دعم', 'خدمة عملاء', 'support', 'customer service', 'technical', 'help'].some(k => specialty.includes(k));
        const isEmail = ['بريد', 'ايميل', 'email', 'mail', 'correspondence'].some(k => specialty.includes(k));
        const isRealEstate = ['عقار', 'real estate', 'property', 'leasing', 'realty'].some(k => specialty.includes(k));

        let systemInstruction: string;

        if (isSales) {
            systemInstruction = `
You are an expert sales consultant working at ${businessName}.
Today's date: ${currentDateStr}${businessContext}${servicesText}

Primary Mission: Convert every inquiry into a closed deal.

Your Style:
- Always understand the user's needs before pitching.
- Use consultative selling: listen, build value, then solve.
- Handle objections confidently.
- Match the user's language (Arabic vs English) naturally.
- Keep responses concise and end with a clear Call to Action (CTA) or a direct question.
            `;
        } else if (isHR) {
            systemInstruction = `
You are a professional HR coordinator and recruiter at ${businessName}.
Today's date: ${currentDateStr}${businessContext}

Tasks:
1. Screen candidates based on qualifications.
2. Conduct initial message-based interviews.
3. Schedule official meetings using (book_appointment).
4. Match the user's language carefully.
            `;
        } else if (isSupport) {
            systemInstruction = `
You are a professional customer support representative at ${businessName}.
Today's date: ${currentDateStr}${businessContext}${servicesText}

Principles:
1. Show empathy first.
2. Solved step-by-step.
3. Ensure satisfaction.
4. Language Match: Speak the user's language fluently.
            `;
        } else if (isEmail) {
            systemInstruction = `
You are a professional correspondence assistant at ${businessName}.
Today's date: ${currentDateStr}${businessContext}
Tasks: Draft, summarize, and coordinate. Match the tone and language of the sender.
            `;
        } else if (isRealEstate) {
            systemInstruction = `
You are a licensed real estate consultant at ${businessName}.
Today's date: ${currentDateStr}${businessContext}${servicesText}
Tasks: Understand requirements, show units, book viewings (book_appointment). Match user language.
            `;
        } else {
            // Default: Booking agent
            systemInstruction = `
You are a polite and professional receptionist working for ${businessName} (${agentName}).
Specialty: ${agent.specialty || 'Services'}.
Today's date: ${currentDateStr} (${isoDateStr} Gregorian)${businessContext}${servicesText}

STRICT INSTRUCTIONS:
1. LANGUAGE MATCH: If the user speaks English, respond in English. If Arabic, respond in Arabic (you can use their dialect).
2. TONE: Warm, friendly, and helpful.
3. SERVICES & PRICING: Answer from the provided list only. Do not claim lack of authorization.
4. BOOKING FLOW: Collect info step-by-step (Service → Time → Name & Phone).
5. TOOL USE: Once you have ALL 4 details, immediately call (book_appointment).
6. Be concise. One question or actionable step per turn.
            `;
        }
        // ────────────────────────────────────────────────────────────────────────

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

        // 6. Model Fallback Loop — Flash first (fast ~3-5s), Pro last (slow ~30s)
        const MODELS = [
            "gemini-3-flash-preview",         // 🥇 الأسرع — يجب أن ينجح في <5 ثوانٍ
            "gemini-2.5-flash-preview-04-17", // 🥈 احتياطي سريع
            "gemini-1.5-flash",               // 🥉 الأكثر استقراراً
            "gemini-3.1-pro-preview",         // 🏅 الأقوى لكن بطيء — آخر محاولة
        ];

        let finalResponse: any = null;
        let chat: any = null;
        let lastModelError = '';

        for (const modelName of MODELS) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    tools: tools,
                    toolConfig: { functionCallingConfig: { mode: "AUTO" } }
                });
                chat = model.startChat({ history: chatHistory });

                const geminiTimeout = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Gemini timeout')), 20000) // 20s per model
                );
                const result: any = await Promise.race([chat.sendMessage(message), geminiTimeout]);
                finalResponse = result.response;
                console.log(`✅ Model ${modelName} succeeded`);
                break; // success — stop trying
            } catch (modelErr: any) {
                lastModelError = modelErr.message ?? String(modelErr);
                console.error(`❌ Model ${modelName} failed:`, lastModelError.substring(0, 120));
                // Only retry on quota/rate-limit/timeout errors
                const isRetryable = lastModelError.includes('429') ||
                    lastModelError.includes('quota') ||
                    lastModelError.includes('timeout') ||
                    lastModelError.includes('503') ||
                    lastModelError.includes('overloaded');
                if (!isRetryable) throw modelErr; // non-retryable — fail fast
            }
        }

        if (!finalResponse) {
            throw new Error(`All models failed. Last error: ${lastModelError}`);
        }

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
                const bookingDate = callArgs.booking_date || todayIsoDate;
                const bookingTime = callArgs.booking_time || "12:00:00";

                // --- Get salon config id (try multiple ways) ---
                let finalSalonId: string | null = agent.salon_config_id || null;
                if (!finalSalonId) {
                    const { data: salonConfigs } = await supabaseClient
                        .from('salon_configs')
                        .select('id')
                        .eq('user_id', agent.user_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    finalSalonId = salonConfigs?.id || null;
                }
                console.log("salon_config_id resolved:", finalSalonId);

                // --- Availability Check: is this slot already booked? ---
                const slotStart = new Date(`${bookingDate}T${bookingTime}`);
                const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // +1 hour

                const { data: conflicts } = await supabaseClient
                    .from('bookings')
                    .select('id, booking_date, booking_time, customer_name, service_requested')
                    .eq('booking_date', bookingDate)
                    .eq('status', 'pending')
                    .eq('agent_id', agentId);

                // Check for time overlap (within 60 min window)
                const hasConflict = conflicts?.some((b: any) => {
                    const existingStart = new Date(`${b.booking_date}T${b.booking_time}`);
                    const existingEnd = new Date(existingStart.getTime() + 60 * 60000);
                    return slotStart < existingEnd && slotEnd > existingStart;
                });

                if (hasConflict) {
                    const conflictList = conflicts
                        ?.filter((b: any) => {
                            const s = new Date(`${b.booking_date}T${b.booking_time}`);
                            const e = new Date(s.getTime() + 60 * 60000);
                            return slotStart < e && slotEnd > s;
                        })
                        .map((b: any) => `الساعة ${b.booking_time.substring(0, 5)} (${b.service_requested})`)
                        .join('، ');

                    console.warn("⚠️ Slot conflict detected:", conflictList);

                    const conflictResult = await chat.sendMessage([{
                        functionResponse: {
                            name: "book_appointment",
                            response: {
                                status: "conflict",
                                message: `هذا الموعد محجوز مسبقاً (${conflictList}). أخبري الزبونة بلطف أن الوقت غير متاح واقترحي وقتاً آخر قريباً.`
                            }
                        }
                    }]);

                    // Save history
                    try {
                        const newHistory = await chat.getHistory();
                        await supabaseClient.from('chat_sessions').upsert({
                            session_id: sessionId, agent_id: agentId,
                            history: newHistory, updated_at: new Date().toISOString()
                        }, { onConflict: 'session_id' });
                    } catch (_) { }

                    return new Response(
                        JSON.stringify({ success: true, text: conflictResult.response.text() }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }

                // --- No conflict: add customer if not exists ---
                if (finalSalonId) {
                    const phone = callArgs.customer_phone ?? '-';
                    const { data: existingCust } = await supabaseClient.from('customers')
                        .select('id').eq('customer_phone', phone).eq('salon_config_id', finalSalonId).maybeSingle();

                    if (!existingCust) {
                        const { error: custErr } = await supabaseClient.from('customers').insert([{
                            salon_config_id: finalSalonId,
                            customer_name: callArgs.customer_name ?? 'زبونة',
                            customer_phone: phone,
                            is_active: true
                        }]);
                        if (custErr) console.error("Customer insert error:", custErr.message);
                        else console.log("Customer added ✅");
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


            // ── Plan gating ── Google integrations are Pro features ──────────────
            const userPlan = agent.plan ?? 'basic';
            const isPro = userPlan === 'pro' || userPlan === 'enterprise';
            console.log("Agent plan:", userPlan, "| isPro:", isPro);

            if (isPro) {
                // Google Calendar — auto-refresh token if expired
                const googleInt = integrations?.find((i: any) =>
                    i.provider === 'google_calendar' || i.provider === 'google'
                );
                const calToken = await getValidGoogleToken(supabaseClient, googleInt);
                if (calToken) {
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
                                    'Authorization': `Bearer ${calToken}`,
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
                } else {
                    console.log("Calendar: no valid token, skipping.");
                }

                // Google Sheets — auto-refresh token if expired
                const sheetsInt = integrations?.find((i: any) =>
                    i.provider === 'google_sheets' || i.provider === 'google'
                );
                const sheetsToken = await getValidGoogleToken(supabaseClient, sheetsInt);
                const spreadsheetId =
                    sheetsInt?.config?.spreadsheet_id ??
                    sheetsInt?.credentials?.spreadsheet_id ??
                    Deno.env.get('GOOGLE_SPREADSHEET_ID') ?? null;

                if (sheetsToken && spreadsheetId) {
                    try {
                        const sheetRes = await fetch(
                            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
                            {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${sheetsToken}`,
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
                } else {
                    console.log("Sheets: missing token or spreadsheet_id:", spreadsheetId);
                }
            } else {
                console.log("📦 Basic plan — Google Calendar & Sheets sync skipped (Pro feature)");
            }
            // ─────────────────────────────────────────────────────────────────────


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
