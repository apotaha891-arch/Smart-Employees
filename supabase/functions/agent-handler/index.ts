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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 2. Fetch Agent Configuration
        const { data: agent, error: agentError } = await supabaseClient
            .from('agents')
            .select('*, user_id')
            .eq('id', agentId)
            .single();

        if (agentError || !agent) throw new Error('Agent not found');

        // 3. Fetch Available Integrations for the Salon User
        const { data: integrations, error: intError } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('user_id', agent.user_id)
            .eq('status', 'connected');

        // 3.5. Check Wallet Credits Balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallet_credits')
            .select('balance')
            .eq('user_id', agent.user_id)
            .single();

        // Ensure user has a wallet and positive balance. For MVP, we might auto-create or allow 0, but ideally block:
        if (walletError || !wallet || wallet.balance <= 0) {
            console.log("Insufficient funds for user:", agent.user_id);
            return new Response(
                JSON.stringify({ success: false, text: "عذراً، رصيد الحساب غير كافٍ لإتمام المحادثة. يرجى مراجعة إدارة المنشأة." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Initialize Gemini AI with Tool Definitions
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

        // Define native tools based on connected integrations
        const tools = [];
        if (integrations?.find(int => int.provider === 'google_calendar')) {
            tools.push({
                functionDeclarations: [
                    {
                        name: "check_calendar_availability",
                        description: "Check available time slots for appointments in the professional calendar.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                date: { type: "STRING", description: "Date in YYYY-MM-DD format" }
                            },
                            required: ["date"]
                        }
                    },
                    {
                        name: "book_appointment",
                        description: "Book an appointment in the Google Calendar.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                date: { type: "STRING", description: "Date in YYYY-MM-DD format" },
                                time: { type: "STRING", description: "Time in HH:MM format" },
                                customer_name: { type: "STRING", description: "Customer full name" },
                                customer_phone: { type: "STRING", description: "Customer phone number" },
                                service: { type: "STRING", description: "Type of service requested" }
                            },
                            required: ["date", "time", "customer_name", "customer_phone", "service"]
                        }
                    }
                ]
            });
        }

        if (integrations?.find(int => int.provider === 'google_sheets')) {
            tools.push({
                functionDeclarations: [
                    {
                        name: "sync_to_google_sheets",
                        description: "Save or sync booking and customer details to the company's Google Sheet.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                customer_name: { type: "STRING", description: "Customer full name" },
                                customer_phone: { type: "STRING", description: "Customer phone number" },
                                service: { type: "STRING", description: "Type of service requested" },
                                date: { type: "STRING", description: "Date of appointment in YYYY-MM-DD" },
                                time: { type: "STRING", description: "Time of appointment in HH:MM" },
                                status: { type: "STRING", description: "Status of booking, e.g., Confirmed, Pending" }
                            },
                            required: ["customer_name", "customer_phone", "service", "date", "time"]
                        }
                    }
                ]
            });
        }

        const systemInstruction = `
أنت موظف خدمة وحجوزات احترافي تعمل لدى ${agent.name}. 
تخصصك الدقيق: ${agent.specialty}.
نبرة الصوت المفضلة: ${agent.tone}.
المعلومات المرجعية: ${agent.knowledge_base}
مواعيد العمل: ${agent.working_hours?.start} إلى ${agent.working_hours?.end}

قواعد أساسية وسمات شخصية (صارمة جداً):
1. **الذكاء الاجتماعي (المرونة):** إجاباتك يجب أن تكون طبيعية، مريحة، ولبقة جداً. تعاطف مع أسئلة العميل وتجنب الردود الآلية الجامدة كأنك "روبوت".
2. **مجاراة اللهجة (Dialect Matching):** تفاعل مع لهجة العميل بدقة. إذا كان يتحدث بلهجة سعودية/خليجية، استخدم مفردات الترحيب والردود المناسبة بلهجة بيضاء ولطيفة (مثل: "أبشر"، "حياك الله"، "تحت أمرك"، "تم") بصورة طبيعية دون تكلّف مبالغ فيه.
3. **التقمص التام:** تقمص دور الموظف البشري الخبير. لا تذكر أبداً أنك ذكاء اصطناعي.
4. **البيانات الحقيقية فقط:** لا تخترع مواعيد غير موجودة، استخدم دائماً أداة check_calendar_availability.
5. **إتمام الحجوزات:** عند تأكيد الحجز استعمل أداة book_appointment.
6. **مزامنة البيانات:** بعد إتمام الحجز بنجاح، يجب عليك فوراً حفظ البيانات في ملف الإكسل باستخدام أداة sync_to_google_sheets.
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined
        });

        const chat = model.startChat({
            // Ideally retrieve chat history from a database here
            history: []
        });

        // 5. Send message and handle function calls (Tool Execution loop)
        const result = await chat.sendMessage(message);
        let finalResponse = result.response;

        // Check if LLM wants to call a function
        if (finalResponse.functionCalls && finalResponse.functionCalls.length > 0) {
            const call = finalResponse.functionCalls[0];
            const googleCalCreds = integrations.find((i: any) => i.provider === 'google_calendar')?.credentials;

            let funcResult: Record<string, any> = { status: "Feature implemented in future step" };

            // Initialize Google Calendar Client if credentials exist
            let calendar: any = null;
            if (googleCalCreds?.access_token) {
                const auth = new google.auth.OAuth2();
                auth.setCredentials(googleCalCreds);
                calendar = google.calendar({ version: 'v3', auth });
            }

            if (call.name === "check_calendar_availability") {
                console.log("Checking availability for:", call.args.date);
                if (calendar) {
                    try {
                        const startOfDay = new Date(call.args.date + "T00:00:00Z");
                        const endOfDay = new Date(call.args.date + "T23:59:59Z");

                        const response = await calendar.events.list({
                            calendarId: 'primary',
                            timeMin: startOfDay.toISOString(),
                            timeMax: endOfDay.toISOString(),
                            singleEvents: true,
                            orderBy: 'startTime',
                        });

                        // Basic logic: Return true/false or list of busy slots based on response
                        // For a real app, this should calculate free slots based on working hours.
                        // Here we just return busy slots to the LLM so it knows what to avoid.
                        const busySlots = response.data.items?.map((event: any) => ({
                            start: event.start.dateTime || event.start.date,
                            end: event.end.dateTime || event.end.date
                        })) || [];

                        funcResult = { status: "success", date: call.args.date, busy_slots: busySlots, note: "These slots are BUSY. Suggest times that do NOT overlap with these." };
                    } catch (calError: any) {
                        console.error("Calendar Error:", calError);
                        funcResult = { status: "error", message: "Failed to connect to Google Calendar." };
                    }
                } else {
                    // Fallback to mock if not configured properly yet
                    funcResult = { status: "success", available_slots: ["10:00", "11:30", "15:00", "17:00"] };
                }
            } else if (call.name === "book_appointment") {
                console.log("Booking appointment:", call.args);
                if (calendar) {
                    try {
                        const eventStart = new Date(`${call.args.date}T${call.args.time}:00`);
                        // Assume 1 hour duration. LLM could pass duration if added to schema
                        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);

                        const event = {
                            summary: `Appointment: ${call.args.service}`,
                            description: `Name: ${call.args.customer_name}\nPhone: ${call.args.customer_phone}`,
                            start: { dateTime: eventStart.toISOString() },
                            end: { dateTime: eventEnd.toISOString() },
                        };

                        const response = await calendar.events.insert({
                            calendarId: 'primary',
                            requestBody: event,
                        });

                        funcResult = { status: "success", confirmation_id: response.data.id, link: response.data.htmlLink };
                    } catch (calError: any) {
                        console.error("Booking Error:", calError);
                        funcResult = { status: "error", message: "Failed to create event in Google Calendar." };
                    }
                } else {
                    funcResult = { status: "success", confirmation_id: "BOOK-" + Math.floor(Math.random() * 10000) };
                }
            } else if (call.name === "sync_to_google_sheets") {
                console.log("Syncing to Google Sheets:", call.args);
                const googleSheetsCreds = integrations.find((i: any) => i.provider === 'google_sheets')?.credentials;

                if (googleSheetsCreds?.access_token && googleSheetsCreds?.spreadsheet_id) {
                    try {
                        const auth = new google.auth.OAuth2();
                        auth.setCredentials(googleSheetsCreds);
                        const sheets = google.sheets({ version: 'v4', auth });

                        // Prepare values
                        const values = [
                            [
                                new Date().toISOString(), // Timestamp
                                call.args.customer_name,
                                call.args.customer_phone,
                                call.args.service,
                                call.args.date,
                                call.args.time,
                                call.args.status || 'Confirmed'
                            ]
                        ];

                        const response = await sheets.spreadsheets.values.append({
                            spreadsheetId: googleSheetsCreds.spreadsheet_id,
                            range: 'Sheet1!A:G', // Adjust range as needed
                            valueInputOption: 'USER_ENTERED',
                            requestBody: { values },
                        });

                        funcResult = { status: "success", updated_cells: response.data.updates?.updatedCells };
                    } catch (sheetError: any) {
                        console.error("Sheets Error:", sheetError);
                        funcResult = { status: "error", message: "Failed to append row to Google Sheets." };
                    }
                } else {
                    funcResult = { status: "success", note: "Mock sync complete (no credentials provided)." };
                }
            }

            // Return function output to LLM
            const secondResult = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: funcResult
                }
            }]);
            finalResponse = secondResult.response;
        }

        // --- BILLING LOGIC ---
        // Extract token usage
        const tokensUsed = finalResponse.usageMetadata?.totalTokenCount || 0;

        if (tokensUsed > 0) {
            // Deduct from wallet
            await supabaseClient.rpc('deduct_wallet_credits', {
                p_user_id: agent.user_id,
                amount: tokensUsed
            });

            // Log usage
            await supabaseClient
                .from('token_usage_logs')
                .insert({
                    user_id: agent.user_id,
                    agent_id: agentId,
                    tokens_used: tokensUsed,
                    cost_deducted: tokensUsed // Assuming 1 token = 1 credit cost for now
                });
            console.log(`Charged ${tokensUsed} credits to user ${agent.user_id}`);
        }
        // ---------------------

        return new Response(
            JSON.stringify({ success: true, text: finalResponse.text() }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message || String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
