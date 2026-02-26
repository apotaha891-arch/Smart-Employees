import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [{
    functionDeclarations: [{
        name: "book_appointment",
        description: "استخدمي هذه الأداة فقط عندما تجمعين معلومات الحجز كاملة: الاسم، الجوال، الخدمة، والوقت.",
        parameters: {
            type: "OBJECT",
            properties: {
                customer_name: { type: "STRING", description: "اسم" },
                customer_phone: { type: "STRING", description: "جوال" },
                service_requested: { type: "STRING", description: "خدمة" },
                booking_date_string: { type: "STRING", description: "تاريخ" }
            },
            required: ["customer_name", "customer_phone", "service_requested"]
        }
    }]
}];

async function test() {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: tools,
        systemInstruction: "أنتِ موظفة حجوزات. إذا قال العميل 'احجز لي' ومعه الاسم والجوال، استدعي أداة book_appointment فوراً."
    });

    const chat = model.startChat({ history: [] });
    // Simulate end of conversation
    const result = await chat.sendMessage("احجز لي خدمة تنظيف، اسمي سارة ورقمي 0555555555 والوقت بكرا العصر");

    console.log("TEXT RESPONSE:", result.response.text());

    // Check all possible locations for function call
    console.log("--- DEBUG INFO ---");
    console.log("result.response.functionCalls():", result.response.functionCalls ? result.response.functionCalls() : "UNDEFINED");
    console.log("(result.response).functionCalls:", (result.response as any).functionCalls);

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    console.log("Parts array:", JSON.stringify(parts, null, 2));

    const functionCallPart = parts.find((p: any) => p.functionCall);
    console.log("Function call part:", functionCallPart ? JSON.stringify(functionCallPart.functionCall, null, 2) : "NONE");
}

test().catch(console.error);
