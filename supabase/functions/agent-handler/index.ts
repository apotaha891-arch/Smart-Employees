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

        // --- QUOTA LOGIC (Unified Wallet System) ---
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallet_credits')
            .select('balance')
            .eq('user_id', agent.user_id)
            .maybeSingle();

        if (walletError) {
            console.error("Wallet fetch error:", walletError.message);
        }

        const currentBalance = wallet?.balance ?? 50; // Default if not found

        if (currentBalance <= 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    text: "عذراً، لقد استنفد هذا الموظف رصيد المحادثات الخاص به. يرجى من صاحب المنشأة شحن الرصيد لضمان استمرار الخدمة.",
                    errorCode: 'OUT_OF_CREDITS'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Decrement the balance by 1
        await supabaseClient
            .from('wallet_credits')
            .update({ balance: currentBalance - 1 })
            .eq('user_id', agent.user_id);
        // --- END QUOTA LOGIC ---

        let businessContext = '';
        let servicesText = '';
        let resolvedBusinessName = agent.name || 'الموظف الذكي';

        if (agent.description) businessContext += `\nAgent Primary Role: ${agent.description}`;
        if (agent.knowledge_base) businessContext += `\nAgent Knowledge Base: ${agent.knowledge_base}`;

        // UNIFICATION: Fetch latest entity config for THIS user
        const { data: latestConfig } = await supabaseClient
            .from('entities')
            .select('*')
            .eq('user_id', agent.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const ec = latestConfig;
        const finalEntityId = ec?.id || agent.entity_id;

        if (ec) {
            console.log("Using Unified Business Config:", ec.id);
            if (ec.business_name) resolvedBusinessName = ec.business_name;
            if (ec.description) businessContext += `\nBusiness Description: ${ec.description}`;
            if (ec.knowledge_base) businessContext += `\nBusiness Knowledge Base/FAQ: ${ec.knowledge_base}`;
            if (ec.phone) businessContext += `\nBusiness Contact Phone: ${ec.phone}`;
            if (ec.address) businessContext += `\nBusiness Physical Address: ${ec.address}`;
            if (ec.website) businessContext += `\nBusiness Official Website: ${ec.website}`;
            
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
            if (ec.working_hours) businessContext += `\nWorking Hours: ${formatWorkingHours(ec.working_hours)}`;
            if (ec.mission_statement) businessContext += `\nBusiness Mission: ${ec.mission_statement}`;
            if (ec.target_audience) businessContext += `\nTarget Audience: ${ec.target_audience}`;
            if (ec.brand_voice_details) businessContext += `\nBrand Voice/Tone: ${ec.brand_voice_details}`;
            if (ec.sop_instructions) businessContext += `\nStandard Operating Procedures (SOP): ${ec.sop_instructions}`;
        }

        if (finalEntityId) {
            const { data: svcs } = await supabaseClient
                .from('entity_services')
                .select('service_name, price, duration_minutes')
                .eq('entity_id', finalEntityId)
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
${ec?.booking_requires_confirmation ? `5. IMPORTANT: After booking, tell the customer: "تم تسجيل حجزك المبدئي بنجاح! سيصلك تأكيد نهائي قريباً." (Your preliminary booking is registered! You will receive a final confirmation soon.)` : ''}
`;

        if (isSales) systemInstruction += "\nRole: Sales & Consultation Expert.";
        else if (isHR) systemInstruction += "\nRole: HR & Recruitment Coordinator.";
        else if (isSupport) systemInstruction += "\nRole: Technical Support Expert.";

        // --- 4.5 Automated Customer Registration (Lead Generation) ---
        try {
            const platformPrefix = sessionId.split('_')[0];
            const platformId = sessionId.split('_')[1];
            
            const customerUpsert: any = {
                entity_id: finalEntityId,
                user_id: agent.user_id,
                updated_at: new Date().toISOString()
            };

            if (platformPrefix === 'instagram') customerUpsert.instagram_id = platformId;
            else if (platformPrefix === 'telegram') customerUpsert.telegram_id = platformId;
            // Add other platforms if needed

            // Search for existing chat name in history to update customer_name if possible
            // For now, we just ensure the record exists so they show up in "Customers"
            const { error: custError } = await supabaseClient
                .from('customers')
                .upsert(customerUpsert, { onConflict: platformPrefix === 'instagram' ? 'instagram_id' : 'telegram_id' });
            
            if (custError) console.warn("Customer registration error (non-fatal):", custError.message);
        } catch (e) {
            console.warn("Auto-registration logic failed:", e);
        }

        // 5. Load chat history
        let chatHistory: any[] = [];
        const { data: sessionData } = await supabaseClient
            .from('chat_sessions')
            .select('history')
            .eq('session_id', sessionId)
            .eq('agent_id', agentId)
            .maybeSingle();
        if (sessionData?.history) chatHistory = sessionData.history;

        // 6. Gemini Models — Fetch from Settings or Fallback
        const { data: activeModelSetting } = await supabaseClient
            .from('platform_settings')
            .select('value')
            .eq('key', 'active_llm_model')
            .maybeSingle();
        
        const preferredModel = activeModelSetting?.value ? JSON.parse(activeModelSetting.value) : "gemini-3-flash-preview";

        const MODELS = [
            preferredModel,                   // 🥇 Preferred from settings
            "gemini-3-flash-preview",         // 🥈 Default Gen3
            "gemini-1.5-flash",               // 🥉 Stable fallback
        ];
        
        let finalResponse: any = null;
        let chat: any = null;
        let lastModelError = '';

        for (const modelName of MODELS) {
            try {
                console.log(`Attempting model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    tools,
                    toolConfig: { functionCallingConfig: { mode: "AUTO" } }
                });
                chat = model.startChat({ history: chatHistory });
                const result: any = await Promise.race([
                    chat.sendMessage(message),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
                ]);
                finalResponse = result.response;
                break;
            } catch (err: any) {
                lastModelError = err.message;
                console.error(`Model ${modelName} failed:`, lastModelError);
            }
        }

        if (!finalResponse) throw new Error(`All models failed: ${lastModelError}`);

        // 7. TOOL DISPATCHER (SCALABLE ARCHITECTURE)
        const TOOL_HANDLERS: any = {
            book_appointment: async (args: any) => {
                let bookingDate = args.booking_date;
                const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!isoRegex.test(bookingDate)) {
                    bookingDate = new Date().toISOString().split('T')[0];
                }
                const bookingTime = args.booking_time || '12:00:00';
                
                // Conflict Check
                const { data: conflicts } = await supabaseClient
                    .from('bookings')
                    .select('id')
                    .eq('entity_id', finalEntityId)
                    .eq('booking_date', bookingDate)
                    .eq('booking_time', bookingTime)
                    .eq('status', 'confirmed');

                if (conflicts && conflicts.length > 0) {
                    return { status: "error", message: "هذا الوقت محجوز مسبقاً." };
                }

                const requiresConfirmation = ec?.booking_requires_confirmation ?? false;
                const { data: newBooking, error: bErr } = await supabaseClient.from('bookings').insert([{
                    agent_id: agentId,
                    entity_id: finalEntityId,
                    customer_name: args.customer_name,
                    customer_phone: args.customer_phone,
                    service_requested: args.service_requested,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    duration_minutes: 60,
                    status: requiresConfirmation ? 'pending' : 'confirmed',
                    session_id: sessionId
                }]).select('id').single();
                
                if (bErr) throw bErr;

                // Sync to Customers Table with Full Details
                const platformPrefix = sessionId.split('_')[0];
                const platformId = sessionId.split('_')[1];
                
                const customerData: any = {
                    entity_id: finalEntityId,
                    user_id: agent.user_id,
                    customer_name: args.customer_name,
                    customer_phone: args.customer_phone,
                    last_service_date: bookingDate,
                    updated_at: new Date().toISOString()
                };
                if (platformPrefix === 'instagram') customerData.instagram_id = platformId;
                if (platformPrefix === 'telegram') customerData.telegram_id = platformId;

                await supabaseClient.from('customers').upsert(customerData, { 
                    onConflict: platformPrefix === 'instagram' ? 'instagram_id' : (platformPrefix === 'telegram' ? 'telegram_id' : 'customer_phone') 
                });

                return { 
                    status: requiresConfirmation ? 'pending_confirmation' : 'confirmed',
                    message: requiresConfirmation 
                        ? 'تم تسجيل الحجز المبدئي بنجاح. سيتم تأكيده من قبل الإدارة قريباً.' 
                        : 'تم تأكيد حجزك بنجاح!' 
                };
            },
            update_customer_notes: async (args: any) => {
                const platformPrefix = sessionId.split('_')[0];
                const platformId = sessionId.split('_')[1];

                const notesData: any = {
                    entity_id: finalEntityId,
                    user_id: agent.user_id,
                    notes: args.notes,
                    customer_phone: args.customer_phone,
                    customer_name: args.customer_name || 'عميل مهتم',
                    updated_at: new Date().toISOString()
                };
                if (platformPrefix === 'instagram') notesData.instagram_id = platformId;
                if (platformPrefix === 'telegram') notesData.telegram_id = platformId;

                await supabaseClient.from('customers').upsert(notesData, { 
                    onConflict: platformPrefix === 'instagram' ? 'instagram_id' : (platformPrefix === 'telegram' ? 'telegram_id' : 'customer_phone') 
                });
                return { status: "success", message: "Customer notes updated." };
            }
        };

        // Handle Function Calls (Supports potential multiple calls)
        const parts = finalResponse.candidates?.[0]?.content?.parts || [];
        const functionCalls = parts.filter((p: any) => p.functionCall);

        if (functionCalls.length > 0) {
            const toolResults = [];
            for (const fcPart of functionCalls) {
                const { name, args } = fcPart.functionCall;
                console.log(`Executing Tool: ${name}`, args);
                
                if (TOOL_HANDLERS[name]) {
                    try {
                        const result = await TOOL_HANDLERS[name](args);
                        toolResults.push({
                            functionResponse: { name, response: result }
                        });
                    } catch (err: any) {
                        toolResults.push({
                            functionResponse: { name, response: { status: "error", message: err.message } }
                        });
                    }
                }
            }

            if (toolResults.length > 0) {
                const secondResult = await chat.sendMessage(toolResults);
                const aiText = secondResult.response.text();
                // Update history with full cycle
                const finalHistory = await chat.getHistory();
                await supabaseClient.from('chat_sessions').upsert({
                    session_id: sessionId, agent_id: agentId,
                    history: finalHistory, updated_at: new Date().toISOString()
                }, { onConflict: 'session_id,agent_id' });

                return new Response(JSON.stringify({ success: true, text: aiText }), { headers: corsHeaders });
            }
        }

        // Final Fallback for regular text response
        const aiText = finalResponse.text();
        const finalHistory = await chat.getHistory();
        await supabaseClient.from('chat_sessions').upsert({
            session_id: sessionId, agent_id: agentId,
            history: finalHistory, updated_at: new Date().toISOString()
        }, { onConflict: 'session_id,agent_id' });

        return new Response(JSON.stringify({ success: true, text: aiText }), { headers: corsHeaders });

    } catch (error: any) {
        console.error("FATAL ERROR:", error.message);
        return new Response(
            JSON.stringify({ success: false, text: `⚠️ عذراً، حدث خطأ تقني. التفاصيل: ${error.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

