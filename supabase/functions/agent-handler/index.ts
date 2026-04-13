import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?no-check";
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.21.0?no-check";

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

        if (agentError || !agent) {
            console.error(`Agent lookup failed for ID ${agentId}:`, agentError?.message);
            throw new Error(`Agent not found: ${agentId}`);
        }
        console.log("Agent loaded successfully:", agent.name, "Entity:", agent.entity_id);

        // --- 3. QUOTA & PLAN LOGIC ---
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('subscription_tier')
            .eq('id', agent.user_id)
            .maybeSingle();
        
        const subTier = profile?.subscription_tier || 'starter';
        console.log(`User Plan: ${subTier} for User: ${agent.user_id}`);

        let businessContext = '';
        let servicesText = '';
        let resolvedBusinessName = agent.name || 'الموظف الذكي';

        // UNIFICATION: Fetch latest entity config for THIS user (STABLE SCHEMA)
        const { data: latestConfig } = await supabaseClient
            .from('entities')
            .select('*')
            .eq('user_id', agent.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const ec = latestConfig;
        const finalEntityId = ec?.id || agent.entity_id;
        
        console.log(`Resource Resolution: EntityID=${finalEntityId} | UserID=${agent.user_id}`);

        if (ec) {
            console.log("Using Resolved Entity Business Name:", ec.business_name);
            if (ec.business_name) resolvedBusinessName = ec.business_name;
            
            // PRIORITY: Use Unified Source (Entities)
            businessContext = `Business Profile (Unified Source):\n`;
            if (ec.description) businessContext += `Description: ${ec.description}\n`;
            if (ec.knowledge_base) businessContext += `Knowledge Base: ${ec.knowledge_base}\n`;
            
            // Append agent specific role if it doesn't conflict
            if (agent.description) businessContext += `Agent Role: ${agent.description}\n`;
            
            if (ec.phone) businessContext += `Phone: ${ec.phone}\n`;
            if (ec.address) businessContext += `Address: ${ec.address}\n`;
            if (ec.website) businessContext += `Website: ${ec.website}\n`;
            
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
            if (ec.working_hours) businessContext += `Hours: ${formatWorkingHours(ec.working_hours)}\n`;
            if (ec.mission_statement) businessContext += `Mission: ${ec.mission_statement}\n`;
            if (ec.target_audience) businessContext += `Audience: ${ec.target_audience}\n`;
        } else {
            // Fallback to agent info ONLY if no entity config exists
            if (agent.description) businessContext += `\nRole: ${agent.description}`;
            if (agent.knowledge_base) businessContext += `\nKnowledge Base: ${agent.knowledge_base}`;
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

        // 4. Integrations Layer (SECURITY & AGENT-SPECIFIC FILTERING)
        // Only fetch integrations for this user
        const { data: integrations } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('user_id', agent.user_id)
            .eq('status', 'connected');

        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
        const now = new Date();
        const isoDateStr = now.toISOString().split('T')[0];
        const currentDateStr = `${isoDateStr} (${now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh', weekday: 'long' })})`;

        // --- 4.5 AGENT-SPECIFIC TOOL FILTERING & PLAN ENFORCEMENT ---
        // Ensure that even if tool_permissions is an empty array [], we default to basic tools
        let allowedToolNames = Array.isArray(agent.tool_permissions) && agent.tool_permissions.length > 0 
            ? agent.tool_permissions 
            : ['book_appointment', 'update_customer_notes'];
        
        console.info(`Agent ID: ${agentId} | Tier: ${subTier} | Raw Permissions: ${JSON.stringify(agent.tool_permissions)}`);
        
        const allFunctionDeclarations = [
            {
                name: "book_appointment",
                description: "Book an appointment after gathering Name, Phone, Service, and Time.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        customer_name: { type: SchemaType.STRING },
                        customer_phone: { type: SchemaType.STRING },
                        service_requested: { type: SchemaType.STRING, description: "The service the customer wants." },
                        booking_date: { type: SchemaType.STRING, description: "Gregorian date in YYYY-MM-DD format." },
                        booking_time: { type: SchemaType.STRING, description: "24-hour time in HH:mm:00 format." },
                        original_time_text: { type: SchemaType.STRING, description: "The time exactly as the customer said it." }
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
        ];

        // PLAN LIMIT ENFORCEMENT: [REMOVED/LEGACY]
        // Now using points system. No need to cap at 2 for 'starter'.
        const filteredFunctions = allFunctionDeclarations.filter(f => allowedToolNames.includes(f.name));

        const tools = filteredFunctions.length > 0 ? [{ functionDeclarations: filteredFunctions }] : [];

        const specialty = (agent.specialty || '').toLowerCase();
        const businessName = resolvedBusinessName || agent.name || 'الموظف الذكي';

        const isBooking = ['حجز', 'مواعيد', 'salon', 'booking', 'clinic'].some(k => specialty.includes(k));
        const isSales = ['مبيعات', 'sales', 'marketing'].some(k => specialty.includes(k));
        const isHR = ['توظيف', 'hr', 'recruitment'].some(k => specialty.includes(k));
        const isSupport = ['دعم', 'support', 'help'].some(k => specialty.includes(k));

        // --- DEEP PERSONALIZATION: Fetch Existing Customer Context ---
        let customerContext = '';
        try {
            const platformPrefix = sessionId.split('_')[0];
            const platformId = sessionId.split('_')[1];
            
            if (platformId && (platformPrefix === 'telegram' || platformPrefix === 'instagram')) {
                const searchColumn = platformPrefix === 'telegram' ? 'telegram_id' : 'instagram_id';
                
                const { data: existingCustomer } = await supabaseClient
                    .from('customers')
                    .select('id, customer_name, metadata, created_at')
                    .eq('entity_id', finalEntityId)
                    .eq(searchColumn, platformId)
                    .maybeSingle();

                if (existingCustomer) {
                    const knownName = existingCustomer.customer_name && existingCustomer.customer_name !== 'عميل محتمل' ? existingCustomer.customer_name : '';
                    const hasNotes = existingCustomer.metadata?.notes;
                    const lastService = existingCustomer.metadata?.last_service;

                    customerContext = `\n[CUSTOMER RECOGNITION SYSTEM: ACTIVATED]`;
                    if (knownName) customerContext += `\n- The person talking to you is a returning customer named: ${knownName}`;
                    if (lastService) customerContext += `\n- In their last visit, they requested: ${lastService}`;
                    if (hasNotes) customerContext += `\n- Critical Past Notes to remember: ${hasNotes}`;
                    if (knownName || lastService) {
                         customerContext += `\n-> INSTRUCTION: Welcome them back like a loyal friend. If they want to book, proactively suggest their usual service if it makes sense!`;
                    }
                    customerContext += `\n`;
                }
            }
        } catch (err) {
            console.warn("Personalization error ignored:", err);
        }

        let systemInstruction = `
You are a Professional Assistant at ${businessName}.
Today's date (Gregorian): ${isoDateStr} ${currentDateStr}
${businessContext}${servicesText}${customerContext}

CRITICAL DATE RULES:
- ALWAYS use Gregorian calendar dates in YYYY-MM-DD format (e.g., ${isoDateStr}).
- NEVER use Hijri/Islamic calendar dates.
- If the customer says "tomorrow", calculate from today ${isoDateStr}.
- If the customer says "بكرة" or "غداً", that means the next Gregorian day.

RULES:
1. Identify as ${businessName}.
2. Always reply in the user's language (Arabic/English).
3. TO BOOK: Gather Name, Phone, Service, and Time. You MUST CALL 'book_appointment' and WAIT for the tool's response before confirming to the customer.
4. [CRITICAL TRUTH] If a tool call (booking/notes) returns an error, NEVER tell the user it succeeded. Explain the issue politely.
5. Only confirm success to the user AFTER the tool response confirms it.
6. Calculate dates relative to Today: ${isoDateStr}.
${ec?.booking_requires_confirmation ? `7. After a SUCCESSFUL booking tool call, tell the customer: "تم تسجيل حجزك المبدئي بنجاح! سيصلك تأكيد نهائي قريباً."` : ''}
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

        // 5. Load chat history (Robust loading)
        let chatHistory: any[] = [];
        const { data: sessionData, error: sessionError } = await supabaseClient
            .from('chat_sessions')
            .select('history')
            .eq('session_id', sessionId)
            .eq('agent_id', agentId)
            .maybeSingle();
        
        if (sessionError) {
            console.warn("History retrieval error (non-fatal):", sessionError.message);
        } else if (sessionData?.history) {
            console.log(`Loaded ${sessionData.history.length} messages from history for session ${sessionId}`);
            chatHistory = sessionData.history;
        } else {
            console.log(`New session started: ${sessionId}`);
        }

        // 6. Gemini Models — Fetch from Settings or Fallback
        const { data: activeModelSetting } = await supabaseClient
            .from('platform_settings')
            .select('value')
            .eq('key', 'active_llm_model')
            .maybeSingle();
        
        const preferredModel = activeModelSetting?.value ? JSON.parse(activeModelSetting.value) : "gemini-3-flash-preview";

        const MODELS = [
            "gemini-3-flash-preview",         // 🥇 Primary
            "gemini-1.5-flash",               // 🥈 Stable fallback
            "gemini-2.0-flash-exp",           // 🥉 Experimental
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

        // --- 6.5 CREDIT DEDUCTION (UNIFIED PRICING) ---
        // Every successful AI response generation costs credits to the business owner.
        try {
            console.log(`Deducting message credit for User: ${agent.user_id}...`);
            const { data: deduction, error: deductErr } = await supabaseClient.rpc('deduct_wallet_credits', {
                p_user_id: agent.user_id,
                p_amount: 1, // Change this if you have dynamic rates
                p_reason: 'تم الرد عبر الموظف الرقمي',
                p_platform: sessionId.startsWith('telegram') ? 'telegram' : sessionId.startsWith('whatsapp') ? 'whatsapp' : 'web',
                p_metadata: { agent_id: agentId, session_id: sessionId }
            });

            if (deductErr || !deduction?.success) {
                console.warn("Credit deduction failed:", deductErr?.message || deduction?.error);
                // Return a polite message indicating service suspension
                return new Response(JSON.stringify({ 
                    success: false, 
                    text: "عذراً، أرغب بمساعدتك لكن رصيد المحادثات في هذا المتجر انتهى. يرجى التواصل مع الإدارة للتعبئة للمتابعة. 🙏" 
                }), { headers: corsHeaders });
            }
            console.log("Credit deducted successfully. Remaining:", deduction.remaining_balance);
        } catch (e: any) {
            console.error("Credit workflow error:", e.message);
            // In case of a hard error in deduction service, we might choose to fail-safe (not block user)
            // but for now, we enforce the rule.
        }

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
                
                // --- SCHEMA RESILIENT BOOKING INSERTION ---
                const bookingPayload = {
                    agent_id: agentId,
                    customer_name: args.customer_name,
                    customer_phone: args.customer_phone,
                    service_requested: args.service_requested,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    duration_minutes: 60,
                    status: requiresConfirmation ? 'pending' : 'confirmed'
                };

                let bErr: any = null;
                let newBooking: any = null;

                if (!finalEntityId) {
                    console.error("Critical: No EntityID resolved for user", agent.user_id);
                    return { status: "error", message: "تعذر إتمام الحجز لعدم وجود ملف منشأة نشط. يرجى التواصل مع الدعم." };
                }

                // Only use the correct schema (entity_id)
                console.log(`Inserting booking for Entity: ${finalEntityId}`);
                let res = await supabaseClient.from('bookings').insert([{ ...bookingPayload, entity_id: finalEntityId }]).select('*').single();
                
                newBooking = res.data;
                bErr = res.error;

                if (bErr) {
                    console.error("Critical: Booking insertion failed:", bErr.message);
                    return { status: "error", message: `فشل تسجيل الحجز في الأنظمة: ${bErr.message}` };
                }

                // ─── DUAL INSERTION: CREATE TASK ENTRY FOR DASHBOARD ────────────────
                // This ensures the dashboard "hears" the new appointment and updates stats.
                const { error: tErr } = await supabaseClient.from('tasks').insert([{
                    agent_id: agentId,
                    task_type: 'booking',
                    task_data: { 
                        booking_id: newBooking.id,
                        customer_name: args.customer_name,
                        service: args.service_requested,
                        date: bookingDate,
                        time: bookingTime
                    },
                    completed_at: new Date().toISOString()
                }]);
                if (tErr) console.warn("Failed to create task entry, but booking was saved:", tErr.message);

                // Sync to Customers Table (STABLE SCHEMA)
                const platformPrefix = sessionId.split('_')[0];
                const platformId = sessionId.split('_')[1];
                
                const customerPayload: any = {
                    user_id: agent.user_id,
                    customer_name: args.customer_name,
                    customer_phone: args.customer_phone,
                    last_service_date: bookingDate,
                    updated_at: new Date().toISOString()
                };
                if (platformPrefix === 'instagram') customerPayload.instagram_id = platformId;
                if (platformPrefix === 'telegram') customerPayload.telegram_id = platformId;
                const conflictCol = platformPrefix === 'instagram' ? 'instagram_id' : (platformPrefix === 'telegram' ? 'telegram_id' : 'customer_phone');

                let custRes = await supabaseClient.from('customers').upsert({ ...customerPayload, entity_id: finalEntityId }, { onConflict: conflictCol });
                if (custRes.error) {
                     await supabaseClient.from('customers').upsert({ ...customerPayload, salon_config_id: finalEntityId }, { onConflict: conflictCol });
                }
 
                // TRIGGER SYNC (Async but awaited for log reliability)
                try {
                    const functionBaseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co/functions/v1');
                    const authHeader = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
                    
                    if (functionBaseUrl && newBooking) {
                        console.log("Triggering Integration Syncs for booking:", newBooking.id);
                        
                        const syncPayload = { 
                            type: 'INSERT', 
                            record: {
                                ...newBooking,
                                // Add entity info to help the sync functions find credentials
                                google_sheets_id: ec?.google_sheets_id,
                                google_calendar_id: ec?.google_calendar_id
                            }
                        };

                        // 1. Sheets Sync
                        fetch(`${functionBaseUrl}/sheets-sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                            body: JSON.stringify(syncPayload)
                        }).catch(e => console.error("Sheets Sync Trigger failed:", e.message));

                        // 2. Calendar Sync
                        fetch(`${functionBaseUrl}/calendar-sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                            body: JSON.stringify(syncPayload)
                        }).catch(e => console.error("Calendar Sync Trigger failed:", e.message));
                    }
                } catch (syncErr: any) {
                    console.warn("Integration Sync Orchestration Error:", syncErr.message);
                }

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

                const notesPayload: any = {
                    user_id: agent.user_id,
                    notes: args.notes,
                    customer_phone: args.customer_phone,
                    customer_name: args.customer_name || 'عميل مهتم',
                    updated_at: new Date().toISOString()
                };
                if (platformPrefix === 'instagram') notesPayload.instagram_id = platformId;
                if (platformPrefix === 'telegram') notesPayload.telegram_id = platformId;
                const conflictColNotes = platformPrefix === 'instagram' ? 'instagram_id' : (platformPrefix === 'telegram' ? 'telegram_id' : 'customer_phone');

                let nRes = await supabaseClient.from('customers').upsert({ ...notesPayload, entity_id: finalEntityId }, { onConflict: conflictColNotes });
                if (nRes.error) {
                     await supabaseClient.from('customers').upsert({ ...notesPayload, salon_config_id: finalEntityId }, { onConflict: conflictColNotes });
                }
                return { status: "success", message: "Customer notes updated." };
            }
        };

        // Handle Function Calls (Supports recursive/multi-step tool calls)
        let loopCount = 0;
        let toolExecutedSuccessfully = false;
        
        while (loopCount < 5) {
            const currentParts = finalResponse.candidates?.[0]?.content?.parts || [];
            const functionCalls = currentParts.filter((p: any) => p.functionCall);
            
            if (functionCalls.length === 0) break;
            
            loopCount++;
            const toolResults = [];
            
            for (const fcPart of functionCalls) {
                const { name, args } = fcPart.functionCall;
                console.log(`[Round ${loopCount}] Executing Tool: ${name}`, args);
                
                if (TOOL_HANDLERS[name]) {
                    try {
                        const result = await TOOL_HANDLERS[name](args);
                        toolResults.push({
                            functionResponse: { name, response: result }
                        });
                        toolExecutedSuccessfully = true;
                    } catch (err: any) {
                        console.error(`Tool Execution Failed (${name}):`, err.message);
                        toolResults.push({
                            functionResponse: { name, response: { status: "error", message: err.message } }
                        });
                    }
                } else {
                    console.warn(`Unknown tool called: ${name}`);
                    toolResults.push({
                        functionResponse: { name, response: { status: "error", message: "Tool not found." } }
                    });
                }
            }
            
            if (toolResults.length > 0) {
                console.log(`[Round ${loopCount}] Sending ${toolResults.length} tool results back to Gemini...`);
                const secondResult = await chat.sendMessage(toolResults);
                finalResponse = secondResult.response;
            } else {
                break;
            }
        }

        // 8. FINAL PERSISTENCE & RESPONSE (Consolidated & Awaited)
        let aiText = '';
        const candidate = finalResponse.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const finalParts = candidate?.content?.parts || [];

        // Log raw response for debugging in Supabase dashboard
        console.log("RAW Gemini Response:", JSON.stringify(finalResponse));

        try {
            aiText = finalResponse.text() || "";
        } catch (e: any) {
            console.warn("Standard extraction failed:", e.message);
        }

        // --- ENHANCED EXTRACTION & FALLBACKS ---
        if (!aiText) {
            // Check if there's any text part manually
            aiText = finalParts.find((p: any) => p.text)?.text || "";
        }

        if (!aiText) {
            if (finishReason === 'SAFETY') {
                aiText = "عذراً، لا يمكنني الإجابة على هذا الطلب لأسباب تتعلق بخصوصية البيانات أو الأمان.";
            } else if (finishReason === 'RECITATION') {
                aiText = "عذراً، هذا الرد محمي بحقوق النشر.";
            } else if (toolExecutedSuccessfully) {
                // If a tool was successful but no final text, synthesize one
                aiText = "تمت معالجة طلبك بنجاح! هل تحتاج لأي مساعدة أخرى؟";
            } else {
                aiText = "عذراً، لم أستطع توليد نص مناسب لهذا الطلب. هل يمكنك إعادة صياغته؟";
            }
        }

        console.log(`Final Response Generated: [${finishReason}] ${aiText.substring(0, 50)}...`);

        const finalHistory = await chat.getHistory();
        console.log(`Saving history for ${sessionId}: ${finalHistory.length} messages`);
        
        // Custom Upsert Logic to avoid the missing 'ON CONFLICT constraint' error!
        const { data: existingSession } = await supabaseClient
            .from('chat_sessions')
            .select('session_id') // Changed from 'id' to 'session_id' as it appears to be the PK
            .eq('session_id', sessionId)
            .maybeSingle();

        let sessionSaveErr = null;
        if (existingSession) {
             const { error: updErr } = await supabaseClient
                .from('chat_sessions')
                .update({ history: finalHistory, agent_id: agentId, updated_at: new Date().toISOString() })
                .eq('session_id', sessionId); // Update using session_id
             sessionSaveErr = updErr;
        } else {
             const { error: insErr } = await supabaseClient
                .from('chat_sessions')
                .insert([{ session_id: sessionId, agent_id: agentId, history: finalHistory, updated_at: new Date().toISOString() }]);
             sessionSaveErr = insErr;
        }

        if (sessionSaveErr) {
            console.error("Critical: Failed to save chat history:", sessionSaveErr.message);
        }

        // --- 9. DASHBOARD ACTIVITY LOGGING ---
        // Ensure every message is recorded in the tasks table so the dashboard shows activity
        try {
            await supabaseClient.from('tasks').insert([{
                agent_id: agentId,
                task_type: 'interact',
                task_data: { 
                    message: message,
                    reply: aiText,
                    sessionId: sessionId,
                    channel: sessionId.startsWith('telegram') ? 'telegram' : 'web'
                },
                completed_at: new Date().toISOString()
            }]);
            console.log("Activity logged to tasks table ✅");
        } catch (taskErr: any) {
            console.warn("Failed to log activity task (non-fatal):", taskErr.message);
        }

        return new Response(JSON.stringify({ success: true, text: aiText }), { headers: corsHeaders });

    } catch (error: any) {
        console.error("FATAL ERROR IN AGENT-HANDLER:", error.stack || error.message);
        return new Response(
            JSON.stringify({ 
                success: false, 
                text: `⚠️ عذراً، حدث خطأ تقني في المساعد التجاري. التفاصيل: ${error.message}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
