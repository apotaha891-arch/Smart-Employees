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

serve(async (req: any) => {
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
        let resolvedBusinessName = agent.name || 'الموظف الذكي';

        // Add Agent's OWN defined context first
        if (agent.description) businessContext += `\nAgent Primary Role: ${agent.description}`;
        if (agent.knowledge_base) businessContext += `\nAgent Knowledge Base: ${agent.knowledge_base}`;

        try {
            // Resolve salon_config_id
            let salonConfigId = agent.salon_config_id;
            
            // STRICT ISOLATION: 
            // We no longer fallback to 'latest' config by user_id. 
            // An agent must be explicitly linked to a salon_config_id.
            if (salonConfigId) {
                 const { data: sc } = await supabaseClient
                    .from('salon_configs')
                    .select('*')
                    .eq('id', salonConfigId)
                    .maybeSingle();

                if (sc) {
                    if (sc.business_name) resolvedBusinessName = sc.business_name;
                    if (sc.description) businessContext += `\nBusiness Description: ${sc.description}`;
                    if (sc.knowledge_base) businessContext += `\nBusiness Knowledge Base/FAQ: ${sc.knowledge_base}`;
                    if (sc.phone) businessContext += `\nBusiness Contact Phone: ${sc.phone}`;
                    if (sc.address) businessContext += `\nBusiness Physical Address: ${sc.address}`;
                    if (sc.website) businessContext += `\nBusiness Official Website: ${sc.website}`;
                    const formatWorkingHours = (wh: any) => {
                        if (!wh) return 'Not specified';
                        if (typeof wh === 'string') return wh;
                        
                        if (wh.isCustom && wh.days) {
                            return Object.entries(wh.days)
                                .map(([day, data]: [string, any]) => {
                                    if (!data.active) return `${day}: Closed`;
                                    const shifts = data.shifts || [{ start: data.start, end: data.end }];
                                    const shiftsStr = shifts.map((s: any) => `${s.start}-${s.end}`).join(', ');
                                    return `${day}: ${shiftsStr}`;
                                })
                                .join(' | ');
                        } else {
                            const shifts = wh.shifts || [{ start: wh.start, end: wh.end }];
                            const shiftsStr = shifts.map((s: any) => `${s.start}-${s.end}`).join(', ');
                            return `Standard: ${shiftsStr}`;
                        }
                    };
                    if (sc.working_hours) businessContext += `\nWorking Hours: ${formatWorkingHours(sc.working_hours)}`;
                    if (sc.working_days) businessContext += `\nWorking Days: ${typeof sc.working_days === 'string' ? sc.working_days : JSON.stringify(sc.working_days)}`;
                    if (sc.mission_statement) businessContext += `\nBusiness Mission: ${sc.mission_statement}`;
                    if (sc.target_audience) businessContext += `\nTarget Audience: ${sc.target_audience}`;
                    if (sc.brand_voice_details) businessContext += `\nBrand Voice/Tone: ${sc.brand_voice_details}`;
                    if (sc.sop_instructions) businessContext += `\nStandard Operating Procedures (SOP): ${sc.sop_instructions}`;
                }
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
                },
            },
            {
                name: "update_customer_notes",
                description: "استخدمي هذه الأداة لتحديث سجل الزبونة بملاحظات جديدة أو لتسجيل مشكلة دعم فني/استفسار دون الحاجة لحجز موعد.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        customer_name: { type: SchemaType.STRING, description: "اسم الزبونة" },
                        customer_phone: { type: SchemaType.STRING, description: "رقم جوال الزبونة (مطلوب للتعريف)" },
                        notes: { type: SchemaType.STRING, description: "الملاحظات الجديدة المراد تسجيلها (مثل: مشكلة تقنية، استفسار عن سعر، إلخ)" }
                    },
                    required: ["customer_phone", "notes"]
                }
            }]
        }];

        const specialty = (agent.specialty || '').toLowerCase();
        const agentName = agent.name || 'الموظف الذكي';
        const businessName = resolvedBusinessName || agentName;

        // Helper: detect specialty bucket
        const isBooking = ['حجز', 'استقبال', 'مواعيد', 'صالون', 'عيادة', 'مطعم', 'نادي', 'مركز', 'beauty', 'salon', 'clinic', 'medical', 'restaurant', 'fitness', 'booking', 'receptionist', 'coordinator', 'spa'].some(k => specialty.includes(k));
        const isSales = ['مبيعات', 'تسويق', 'استشاري', 'برمجة', 'تطوير', 'ويب', 'web', 'software', 'it', 'digital', 'consultant', 'sales', 'sell', 'marketing', 'lead', 'agency', 'creative'].some(k => specialty.includes(k));
        const isHR = ['موارد', 'توظيف', 'hr', 'human resources', 'recruit', 'interview', 'career'].some(k => specialty.includes(k));
        const isSupport = ['دعم', 'صيانة', 'خدمة عملاء', 'technical', 'support', 'customer service', 'help', 'repair'].some(k => specialty.includes(k));
        const isEmail = ['بريد', 'ايميل', 'email', 'mail', 'correspondence'].some(k => specialty.includes(k));
        const isRealEstate = ['عقار', 'real estate', 'property', 'leasing', 'realty', 'villa', 'apartment'].some(k => specialty.includes(k));
        
        let systemInstruction: string;

        if (isSales) {
            systemInstruction = `
You are a Premier Business Consultant and Sales Expert working at ${businessName}.
Today's date: ${currentDateStr}
${businessContext}${servicesText}

STRICT IDENTITY & KNOWLEDGE:
1. You represent ${businessName}. You are the face of this business.
2. USE THE BUSINESS DETAILS: Study the "Business Description", "Phone", "Website", and "Knowledge Base" provided above. You must use THESE specific details in your answers.
3. NEVER use placeholders like "[Company Phone Number]" or invent emails like "info@company.com" unless they are explicitly provided in the context above. If a customer asks for contact info and it's missing from your context, ask them to wait while you check or provide the details you DO have.
4. NEVER say "I don't know" or "I am an AI". If information is missing, be professional and supportive.

YOUR MISSION:
- Act as a high-level consultant. Don't just answer; guide.
- Primary Goal: Convert inquiries into bookings or sales.
- Consultative Selling: Listen carefully to the customer's needs, build massive value by explaining HOW our services solve their problems, then close the deal.

STYLE & TONE:
- Professional, authoritative, yet warm and persuasive.
- Handle objections by highlighting benefits and success stories.
- Match the user's language (Arabic vs English) naturally.
- Be concise but complete. End with a clear Call to Action (CTA) or a strategic question.
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
You are an Expert Support Specialist and System Guide at ${businessName}.
Today's date: ${currentDateStr}
${businessContext}${servicesText}

YOUR ROLE:
1. You are a master of our system. Use the "Knowledge Base" and "Business Description" above to provide detailed, accurate guidance.
2. Show empathy first. Understand the frustration, then provide a clear, step-by-step solution.
3. If a service is mentioned, use the "OFFICIAL SERVICE MENU" above for pricing and details.
4. RECORD ISSUES: Always use the (update_customer_notes) tool to save the customer's technical issue or inquiry in their file so the team can follow up.
5. Ensure the customer feels supported and valued throughout the interaction.
            `;
        } else if (isEmail) {
            systemInstruction = `
You are the Executive Correspondence Assistant at ${businessName}.
Today's date: ${currentDateStr}
${businessContext}

Tasks: Draft professional emails, summarize complex threads, and coordinate communication. 
Always maintain the professional tone of ${businessName} and match the sender's language perfectly.
            `;
        } else if (isRealEstate) {
            systemInstruction = `
You are a Senior Real Estate Advisor at ${businessName}.
Today's date: ${currentDateStr}
${businessContext}${servicesText}

YOUR EXPERTISE:
1. You know every property and service we offer. Reference the details provided above constantly.
2. Understand requirements (budget, location, unit type) deeply before suggesting.
3. Goal: Book viewings using the (book_appointment) tool.
4. Match user language and maintain a premium, trustworthy tone.
            `;
        } else {
            // Default: Professional Assistant
            systemInstruction = `
You are a highly professional and intelligent executive assistant working for ${businessName} (${agentName}).
Specialty: ${agent.specialty || 'Professional Services'}.
Today's date: ${currentDateStr} (${isoDateStr} Gregorian)
${businessContext}${servicesText}

YOUR GUIDELINES:
1. IDENTITY: You are a key part of ${businessName}. Match their professional brand personality perfectly.
2. KNOWLEDGE BASE: Use the "Business Description", "Contact Phone", "Website", "Working Hours" and "Knowledge Base" sections provided above as your ONLY sources of truth.
3. NO HALLUCINATIONS: Do not invent phone numbers, emails, or prices. Use the "OFFICIAL SERVICE MENU" above if provided.
4. SERVICES & PRICING: If a "SERVICE MENU" is provided, use only those prices. If not, act as a general expert in ${agent.specialty || 'this industry'}.
4. GOAL: Be helpful, answer questions accurately, and build trust with the visitor. 
5. LANGUAGE: Seamlessly match the user's language (Arabic vs English).
6. IF BOOKING IS NEEDED: Collect Service, Time, Name, and Phone, then use (book_appointment).
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
                .eq('agent_id', agentId)
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

                // --- Availability Check: is this slot already booked or outside working hours? ---
                const slotStart = new Date(`${bookingDate}T${bookingTime}`);
                const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // +1 hour

                // 1. Check Working Hours
                if (sc && sc.working_hours) {
                    const wh = sc.working_hours;
                    const daysMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
                    const bookingDayName = daysMap[slotStart.getDay()];
                    
                    let dayShifts = [];
                    let isActive = true;

                    if (wh.isCustom && wh.days) {
                        const dayData = wh.days[bookingDayName];
                        if (!dayData || !dayData.active) isActive = false;
                        else dayShifts = dayData.shifts || [{ start: dayData.start, end: dayData.end }];
                    } else {
                        isActive = (sc.working_days || []).includes(bookingDayName) || true; // fallback to true if not specified
                        dayShifts = wh.shifts || [{ start: wh.start, end: wh.end }];
                    }

                    if (!isActive) {
                        return new Response(
                            JSON.stringify({ success: true, text: `عذراً، يوم ${bookingDayName} هو يوم عطلة لدينا. يرجى اقتراح يوم آخر.` }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                        );
                    }

                    const isWithinAnyShift = dayShifts.some((s: any) => {
                        const [sH, sM] = s.start.split(':').map(Number);
                        const [eH, eM] = s.end.split(':').map(Number);
                        const [bH, bM] = bookingTime.split(':').map(Number);
                        
                        const startTotal = sH * 60 + sM;
                        const endTotal = eH * 60 + eM;
                        const bookingTotal = bH * 60 + bM;
                        
                        // Assume 1 hour duration if not specified
                        return bookingTotal >= startTotal && (bookingTotal + 60) <= endTotal;
                    });

                    if (!isWithinAnyShift) {
                        const shiftsText = dayShifts.map((s: any) => `${s.start}-${s.end}`).join(' و ');
                        const msg = `هذا الوقت خارج ساعات العمل لهذا اليوم. ساعات العمل المتاحة هي: ${shiftsText}. يرجى إبلاغ الزبونة واقتراح وقت بديل.`;
                        
                        const outsideResult = await chat.sendMessage([{
                            functionResponse: {
                                name: "book_appointment",
                                response: { status: "outside_hours", message: msg }
                            }
                        }]);

                        return new Response(
                            JSON.stringify({ success: true, text: outsideResult.response.text() }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                        );
                    }
                }

                // 2. Check for conflicts with other bookings
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
                
                if (!insertError && finalSalonId) {
                    // Update Customer's Last Visit and potentially Notes
                    await supabaseClient.from('customers').update({
                        last_service_date: callArgs.booking_date || todayIsoDate,
                        notes: `آخر حجز: ${callArgs.service_requested} (${callArgs.original_time_text ?? ''})`
                    }).eq('customer_phone', callArgs.customer_phone).eq('salon_config_id', finalSalonId);
                }

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

        // --- Handle update_customer_notes ---
        if (callName === 'update_customer_notes') {
            console.log("📝 Executing update_customer_notes for:", callArgs.customer_phone);
            try {
                // Determine salon_config_id (same logic as above)
                const { data: agnt } = await supabaseClient.from('agents').select('user_id, salon_config_id').eq('id', agentId).single();
                let finalSalonId = agnt?.salon_config_id;
                if (!finalSalonId && agnt?.user_id) {
                    const { data: sc } = await supabaseClient.from('salon_configs').select('id').eq('user_id', agnt.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
                    finalSalonId = sc?.id;
                }

                if (finalSalonId) {
                    const phone = callArgs.customer_phone;
                    const { data: existingCust } = await supabaseClient.from('customers')
                        .select('id').eq('customer_phone', phone).eq('salon_config_id', finalSalonId).maybeSingle();

                    if (!existingCust) {
                        await supabaseClient.from('customers').insert([{
                            salon_config_id: finalSalonId,
                            customer_name: callArgs.customer_name ?? 'زبونة',
                            customer_phone: phone,
                            notes: callArgs.notes,
                            is_active: true
                        }]);
                    } else {
                        await supabaseClient.from('customers').update({
                            notes: callArgs.notes,
                            customer_name: callArgs.customer_name ?? undefined // update name if provided
                        }).eq('id', existingCust.id);
                    }
                }
            } catch (err: any) {
                console.error("Notes Update Error:", err.message);
            }

            const noteResult = await chat.sendMessage([{
                functionResponse: {
                    name: "update_customer_notes",
                    response: { status: "تم تحديث سجل الزبونة بالملاحظات بنجاح." }
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
                JSON.stringify({ success: true, text: noteResult.response.text() }),
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
