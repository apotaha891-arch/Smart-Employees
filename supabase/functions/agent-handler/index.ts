import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import { google } from "npm:googleapis";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, sessionId, agentId } = await req.json();

        // 1. Initialize Supabase Client securely
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 2. Fetch Agent Configuration
        const { data: agent, error: agentError } = await supabaseClient
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();

        if (agentError || !agent) throw new Error('Agent not found');

        // 3. Fetch Available Integrations (Simplified for MVP without user_id)
        const { data: integrations, error: intError } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('status', 'connected');


        // 4. Initialize Gemini AI with Tool Definitions
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

        // Define tools
        const tools = [{
            functionDeclarations: [
                {
                    name: "book_appointment",
                    description: "استخدمي هذه الأداة فقط عندما تجمعين معلومات الحجز كاملة واضحة من الزبونة (الاسم، الجوال، الخدمة المطلوبة بدقة، ووقت وتاريخ مبدئي). ستقوم بحفظ الحجز في قاعدة البيانات و إضافته إلى جوجل كالندر وشيتس إذا كانت متاحة.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            customer_name: { type: "STRING", description: "اسم الزبونة الكامل" },
                            customer_phone: { type: "STRING", description: "رقم جوال الزبونة" },
                            service_requested: { type: "STRING", description: "نوع الخدمة المطلوبة بدقة" },
                            booking_date_string: { type: "STRING", description: "تاريخ ووقت الحجز (بأي صيغة كتبتها الزبونة مثل بكرا العصر، أو يوم الثلاثاء)" }
                        },
                        required: ["customer_name", "customer_phone", "service_requested"]
                    }
                }
            ]
        }];


        const systemInstruction = `
أنتِ موظفة حجوزات لطيفة ومحترفة تعملين لدى (${agent.name}).
تخصصك: ${agent.specialty || 'خدمات'}. 

قواعد الأنسنة والحجز:
1. الردود قصيرة جداً سطر أو سطرين دافئة بلهجة الزبونة (أبشري، عيني لك، غالية).
2. لا تسألي وتطلبي معلومات الحجز دفعة واحدة. دردشي، قولي "أبشري وش الخدمة؟"، ثم "متى يناسبك؟"، ثم الاسم والجوال.
3. بمجرد أن تتجمع لديك بياناتها (الاسم، الجوال، الخدمة، الموعد)، استخدمي أداة (book_appointment) فوراً لتسجيل حجزها.
4. بعد تأكيدك للحجز بالأداة، اكتبي للزبونة: "تم تأكيد موعدك يا غالية! 🌷"
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Updated to the available paid tier model
            systemInstruction,
            tools: tools
        });

        // --- Retrieve Chat History ---
        let chatHistory: any[] = [];
        const { data: sessionData } = await supabaseClient
            .from('chat_sessions')
            .select('history')
            .eq('session_id', sessionId)
            .maybeSingle();

        if (sessionData && sessionData.history && Array.isArray(sessionData.history)) {
            chatHistory = sessionData.history;
        }

        // تشغيل المحادثة
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        let finalResponse = result.response;

        // 5. Tool Execution Logic - robust detection for gemini-2.5-flash
        // gemini-2.5-flash may return functionCalls in candidates[0].content.parts
        const rawFunctionCalls = finalResponse.functionCalls?.() ?? [];
        const allParts = finalResponse.candidates?.[0]?.content?.parts ?? [];
        const functionCallPart = allParts.find((p: any) => p.functionCall);

        console.log("Raw functionCalls length:", rawFunctionCalls.length);
        console.log("Parts count:", allParts.length);
        console.log("Function call part found:", !!functionCallPart);

        const hasFunctionCall = rawFunctionCalls.length > 0 || !!functionCallPart;
        const call = rawFunctionCalls[0] ?? (functionCallPart ? { name: functionCallPart.functionCall.name, args: functionCallPart.functionCall.args } : null);

        if (hasFunctionCall && call) {

            if (call.name === "book_appointment") {
                const args = call.args;

                // 5.a Save to Supabase (Unified bookings table)
                const { error: insertError } = await supabaseClient
                    .from('bookings')
                    .insert([{
                        user_id: agent.user_id,
                        agent_id: agent.id,
                        customer_name: args.customer_name || 'زبونة مجهولة',
                        customer_phone: args.customer_phone || '-',
                        service_requested: args.service_requested,
                        notes: `تاريخ الموعد: ${args.booking_date_string}`,
                        status: 'pending' // Let the dashboard owner confirm
                    }]);

                if (insertError) console.error("Database Insert Error:", insertError);

                let googleStatus = "";

                // 5.b Add to Google Calendar if configured
                const googleCalCreds = integrations?.find((i: any) => i.provider === 'google_calendar')?.credentials;
                if (googleCalCreds && googleCalCreds.access_token) {
                    try {
                        const auth = new google.auth.OAuth2();
                        auth.setCredentials(googleCalCreds);
                        const calendar = google.calendar({ version: 'v3', auth });

                        // Default to something 24 hrs from now if exact time isn't parseable easily
                        const eventStart = new Date();
                        eventStart.setDate(eventStart.getDate() + 1);
                        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);

                        await calendar.events.insert({
                            calendarId: 'primary',
                            requestBody: {
                                summary: `موعد: ${args.service_requested} (${args.customer_name})`,
                                description: `رقم الجوال: ${args.customer_phone}\nملاحظات: ${args.booking_date_string}`,
                                start: { dateTime: eventStart.toISOString() },
                                end: { dateTime: eventEnd.toISOString() }
                            },
                        });
                        googleStatus += "[Calendar Triggered] ";
                    } catch (err: any) {
                        console.error("Google Calendar Error:", err.message);
                        googleStatus += "[Calendar Error] ";
                    }
                }

                // 5.c Append to Google Sheets if configured
                const googleSheetsInt = integrations?.find((i: any) => i.provider === 'google_sheets');
                if (googleSheetsInt && googleSheetsInt.credentials?.access_token && googleSheetsInt.config?.spreadsheet_id) {
                    try {
                        const auth = new google.auth.OAuth2();
                        auth.setCredentials(googleSheetsInt.credentials);
                        const sheets = google.sheets({ version: 'v4', auth });

                        await sheets.spreadsheets.values.append({
                            spreadsheetId: googleSheetsInt.config.spreadsheet_id,
                            range: 'Sheet1!A:G', // Default range assumption
                            valueInputOption: 'USER_ENTERED',
                            requestBody: {
                                values: [[
                                    new Date().toLocaleDateString('ar-SA'),
                                    args.customer_name,
                                    args.customer_phone,
                                    args.service_requested,
                                    args.booking_date_string,
                                    "معلق من تيليجرام"
                                ]]
                            },
                        });
                        googleStatus += "[Sheets Triggered]";
                    } catch (err: any) {
                        console.error("Google Sheets Error:", err.message);
                        googleStatus += "[Sheets Error]";
                    }
                }

                // Inform the LLM the function hit the database and Google integrations
                const secondResult = await chat.sendMessage([{
                    functionResponse: {
                        name: "book_appointment",
                        response: { status: insertError ? "فشل الحفظ قاعدة البيانات" : "تم الحفظ", integrations: googleStatus }
                    }
                }]);
                finalResponse = secondResult.response;
            }
        }

        // --- Save Updated Chat History AFTER all interactions ---
        const newHistory = await chat.getHistory();
        const upsertResult = await supabaseClient.from('chat_sessions').upsert({
            session_id: sessionId,
            agent_id: agentId,
            history: newHistory,
            updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' });

        if (upsertResult.error) {
            console.error("Failed to save chat history:", upsertResult.error);
        }

        return new Response(
            JSON.stringify({ success: true, text: finalResponse.text() }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, text: `[نظام 24Shift - خطأ داخلي]:\n${error.message || String(error)}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
