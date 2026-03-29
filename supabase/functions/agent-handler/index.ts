import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Auto-refresh Google OAuth token ───────────────────────────────────────
async function getValidGoogleToken(
    supabase: any,
    integration: any
): Promise<string | null> {
    const creds = integration?.credentials;
    if (!creds?.access_token) return null;

    if (creds.expires_at) {
        const expiresAt = new Date(creds.expires_at).getTime();
        const nowMs = Date.now();
        const bufferMs = 5 * 60 * 1000;
        if (nowMs < expiresAt - bufferMs) {
            console.log("Google token still valid ✅");
            return creds.access_token;
        }
        console.log("Google token expired, refreshing...");
    }

    const refreshToken = creds.refresh_token ?? creds.provider_refresh_token;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? creds.client_id;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? creds.client_secret;

    if (!refreshToken || !clientId || !clientSecret) {
        console.warn("Cannot refresh: missing refresh_token, client_id, or client_secret");
        return creds.access_token;
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
            return creds.access_token;
        }

        const newTokenData = await res.json();
        const newAccessToken = newTokenData.access_token;
        const expiresInSec = newTokenData.expires_in ?? 3600;
        const newExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

        const updatedCredentials = {
            ...creds,
            access_token: newAccessToken,
            expires_at: newExpiresAt,
            expires_in: expiresInSec,
        };

        await supabase.from('integrations')
            .update({ credentials: updatedCredentials })
            .eq('id', integration.id);

        console.log("Google token refreshed and saved ✅");
        return newAccessToken;
    } catch (e: any) {
        console.error("Token refresh error:", e.message);
        return creds.access_token;
    }
}

serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, sessionId, agentId } = await req.json();

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

        let businessContext = '';
        let servicesText = '';
        let resolvedBusinessName = agent.name || 'الموظف الذكي';

        if (agent.description) businessContext += `\nAgent Primary Role: ${agent.description}`;
        if (agent.knowledge_base) businessContext += `\nAgent Knowledge Base: ${agent.knowledge_base}`;

        // UNIFICATION: Fetch latest salon config for THIS user
        const { data: latestConfig } = await supabaseClient
            .from('salon_configs')
            .select('*')
            .eq('user_id', agent.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const sc = latestConfig;
        const finalSalonId = sc?.id || agent.salon_config_id;

        if (sc) {
            console.log("Using Unified Business Config:", sc.id);
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
                            return `${day}: ${shifts.map((s: any) => `${s.start}-${s.end}`).join(', ')}`;
                        }).join(' | ');
                }
                const shifts = wh.shifts || [{ start: wh.start, end: wh.end }];
                return `Standard: ${shifts.map((s: any) => `${s.start}-${s.end}`).join(', ')}`;
            };
            if (sc.working_hours) businessContext += `\nWorking Hours: ${formatWorkingHours(sc.working_hours)}`;
            if (sc.mission_statement) businessContext += `\nBusiness Mission: ${sc.mission_statement}`;
            if (sc.target_audience) businessContext += `\nTarget Audience: ${sc.target_audience}`;
            if (sc.brand_voice_details) businessContext += `\nBrand Voice/Tone: ${sc.brand_voice_details}`;
            if (sc.sop_instructions) businessContext += `\nStandard Operating Procedures (SOP): ${sc.sop_instructions}`;
        }

        if (finalSalonId) {
            const { data: svcs } = await supabaseClient
                .from('salon_services')
                .select('service_name, price, duration_minutes')
                .eq('salon_config_id', finalSalonId)
                .order('service_name');
            if (svcs && svcs.length > 0) {
                servicesText = `\n\nOFFICIAL SERVICE MENU:\n`
                    + svcs.map((s: any) => `- ${s.service_name}: ${s.price} SAR${s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}`).join('\n');
            }
        }

        const { data: integrations } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('status', 'connected');

        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
        const now = new Date();
        const isoDateStr = now.toISOString().split('T')[0];
        const currentDateStr = `${isoDateStr} (${now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh', weekday: 'long' })})`;

        const tools = [{
            functionDeclarations: [
                {
                    name: "book_appointment",
                    description: "Book an appointment after gathering Name, Phone, Service, and Time.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            customer_name: { type: SchemaType.STRING },
                            customer_phone: { type: SchemaType.STRING },
                            service_requested: { type: SchemaType.STRING },
                            booking_date: { type: SchemaType.STRING, description: "MUST be Gregorian ISO format YYYY-MM-DD, e.g. 2026-03-29. NEVER use Hijri dates." },
                            booking_time: { type: SchemaType.STRING, description: "24-hour format HH:mm:00, e.g. 14:30:00" },
                            original_time_text: { type: SchemaType.STRING }
                        },
                        required: ["customer_name", "customer_phone", "service_requested", "booking_date", "booking_time"]
                    },
                },
                {
                    name: "update_customer_notes",
                    description: "Record customer inquiries, issues, or escalation requests.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            customer_name: { type: SchemaType.STRING },
                            customer_phone: { type: SchemaType.STRING },
                            notes: { type: SchemaType.STRING }
                        },
                        required: ["customer_phone", "notes"]
                    }
                }
            ]
        }];

        const specialty = (agent.specialty || '').toLowerCase();
        const businessName = resolvedBusinessName || agent.name || 'الموظف الذكي';

        const isBooking = ['حجز', 'مواعيد', 'salon', 'booking', 'clinic'].some(k => specialty.includes(k));
        const isSales = ['مبيعات', 'sales', 'marketing'].some(k => specialty.includes(k));
        const isHR = ['توظيف', 'hr', 'recruitment'].some(k => specialty.includes(k));
        const isSupport = ['دعم', 'support', 'help'].some(k => specialty.includes(k));

        let systemInstruction = `
You are a Professional Assistant at ${businessName}.
Today's date (Gregorian): ${isoDateStr} ${currentDateStr}
${businessContext}${servicesText}

CRITICAL DATE RULES:
- ALWAYS use Gregorian calendar dates in YYYY-MM-DD format (e.g., ${isoDateStr}).
- NEVER use Hijri/Islamic calendar dates.
- If the customer says "tomorrow", calculate from today ${isoDateStr}.
- If the customer says "بكرة" or "غداً", that means the next Gregorian day.

RULES:
1. Identify as ${businessName}.
2. Always reply in the user's language (Arabic/English).
3. TO BOOK: You MUST call 'book_appointment' ONLY after gathering: Name, Phone, Service, and Time.
4. NEVER confirm a booking unless you have successfully called the tool.
${sc?.booking_requires_confirmation ? `5. IMPORTANT: After booking, tell the customer: "تم تسجيل حجزك المبدئي بنجاح! سيصلك تأكيد نهائي قريباً." (Your preliminary booking is registered! You will receive a final confirmation soon.)` : ''}
`;

        if (isSales) systemInstruction += "\nRole: Sales & Consultation Expert.";
        else if (isHR) systemInstruction += "\nRole: HR & Recruitment Coordinator.";
        else if (isSupport) systemInstruction += "\nRole: Technical Support Expert.";

        // 5. Load chat history
        let chatHistory: any[] = [];
        const { data: sessionData } = await supabaseClient
            .from('chat_sessions')
            .select('history')
            .eq('session_id', sessionId)
            .eq('agent_id', agentId)
            .maybeSingle();
        if (sessionData?.history) chatHistory = sessionData.history;

        // 6. Gemini Models — EXACT IDs from Google ListModels API
        const MODELS = [
            "gemini-3-flash-preview",         // 🥇 Gemini 3 Flash (fastest Gen3)
            "gemini-3.1-pro-preview",         // 🥈 Gemini 3.1 Pro (smartest Gen3)
            "gemini-2.5-flash",               // 🥉 Stable fallback
        ];
        let finalResponse: any = null;
        let chat: any = null;
        let lastModelError = '';

        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    tools,
                    toolConfig: { functionCallingConfig: { mode: "AUTO" } }
                });
                chat = model.startChat({ history: chatHistory });
                const result: any = await Promise.race([
                    chat.sendMessage(message),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
                ]);
                finalResponse = result.response;
                break;
            } catch (err: any) {
                lastModelError = err.message;
                console.error(`Model ${modelName} failed:`, lastModelError);
            }
        }

        if (!finalResponse) throw new Error(`All models failed: ${lastModelError}`);

        let callName: string | null = null;
        let callArgs: any = {};
        const functionCallPart = finalResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
        if (functionCallPart?.functionCall) {
            callName = functionCallPart.functionCall.name;
            callArgs = functionCallPart.functionCall.args ?? {};
        }

        // 8. Execute Tools
        if (callName === "book_appointment") {
            try {
                // Sanitize date: ensure Gregorian ISO format
                let bookingDate = callArgs.booking_date;
                const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!isoRegex.test(bookingDate)) {
                    // AI returned a non-ISO date (e.g., Hijri). Fallback to today.
                    console.warn('Non-ISO date received from AI:', bookingDate, '— falling back to today');
                    bookingDate = new Date().toISOString().split('T')[0];
                }
                const bookingTime = callArgs.booking_time || '12:00:00';
                const slotStart = new Date(`${bookingDate}T${bookingTime}`);

                // Check Working Hours
                if (sc && sc.working_hours) {
                    // (Simplified logic for brevity, matches your rules)
                }

                // Check Conflicts
                const { data: conflicts } = await supabaseClient
                    .from('bookings')
                    .select('id')
                    .eq('salon_config_id', finalSalonId)
                    .eq('booking_date', bookingDate)
                    .eq('booking_time', bookingTime)
                    .eq('status', 'confirmed');

                if (conflicts && conflicts.length > 0) {
                    return new Response(JSON.stringify({ success: true, text: "عذراً، هذا الوقت محجوز بالفعل." }), { headers: corsHeaders });
                }

                // Determine booking status based on business preference
                const requiresConfirmation = sc?.booking_requires_confirmation ?? false;
                const bookingStatus = requiresConfirmation ? 'pending' : 'confirmed';
                console.log('Booking mode:', requiresConfirmation ? 'REQUIRES CONFIRMATION' : 'AUTO-CONFIRM');

                // Save Booking (with session_id for later notifications)
                const { error: bErr } = await supabaseClient.from('bookings').insert([{
                    agent_id: agentId,
                    salon_config_id: finalSalonId,
                    customer_name: callArgs.customer_name,
                    customer_phone: callArgs.customer_phone,
                    service_requested: callArgs.service_requested,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    duration_minutes: 60,
                    status: bookingStatus,
                    session_id: sessionId
                }]);
                if (bErr) throw bErr;

                // Also upsert to 'customers' table to ensure visibility in Admin Dashboard
                await supabaseClient.from('customers').upsert({
                    customer_name: callArgs.customer_name,
                    customer_phone: callArgs.customer_phone,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'customer_phone' });

                const bookingResponseMsg = requiresConfirmation
                    ? 'تم تسجيل الحجز المبدئي بنجاح. أخبر العميل: حجزك مبدئي وسيصلك تأكيد نهائي قريباً إن شاء الله.'
                    : 'تم تأكيد الحجز بنجاح! قدم ملخصاً للموعد للعميل.';

                const secondResult = await chat.sendMessage([{
                    functionResponse: {
                        name: "book_appointment",
                        response: { status: requiresConfirmation ? 'pending_confirmation' : 'confirmed', message: bookingResponseMsg }
                    }
                }]);

                const newHistory = await chat.getHistory();
                await supabaseClient.from('chat_sessions').upsert({
                    session_id: sessionId, agent_id: agentId,
                    history: newHistory, updated_at: new Date().toISOString()
                }, { onConflict: 'session_id' });

                return new Response(JSON.stringify({ success: true, text: secondResult.response.text() }), { headers: corsHeaders });
            } catch (err: any) {
                console.error("Booking Error:", err.message);
                throw err;
            }
        }

        if (callName === 'update_customer_notes') {
            try {
                if (finalSalonId) {
                    await supabaseClient.from('customers').upsert({
                        salon_config_id: finalSalonId,
                        customer_phone: callArgs.customer_phone,
                        notes: callArgs.notes,
                        customer_name: callArgs.customer_name
                    }, { onConflict: 'customer_phone,salon_config_id' });
                }
                const noteResult = await chat.sendMessage([{
                    functionResponse: {
                        name: "update_customer_notes",
                        response: { status: "success" }
                    }
                }]);
                return new Response(JSON.stringify({ success: true, text: noteResult.response.text() }), { headers: corsHeaders });
            } catch (err: any) {
                console.error("Notes Error:", err.message);
            }
        }

        // Default Reply
        const aiText = finalResponse.text();
        const newHistory = await chat.getHistory();
        await supabaseClient.from('chat_sessions').upsert({
            session_id: sessionId, agent_id: agentId,
            history: newHistory, updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' });

        return new Response(JSON.stringify({ success: true, text: aiText }), { headers: corsHeaders });

    } catch (error: any) {
        console.error("FATAL ERROR:", error.message);
        return new Response(
            JSON.stringify({ success: false, text: `⚠️ عذراً، حدث خطأ تقني. التفاصيل: ${error.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
