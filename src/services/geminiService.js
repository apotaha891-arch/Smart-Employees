import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use Gemini 1.5 Flash - Stable and reliable version
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.4, // Reduced temperature for more consistent JSON extraction
        maxOutputTokens: 2048,
    }
});

// Dictionary to store multiple chat sessions (e.g., 'agent', 'manager')
let chatSessions = {};

const DEFAULT_SYSTEM_PROMPT = `أنت موظف ذكاء اصطناعي متخصص في مقابلات التوظيف. مهمتك هي التعرف على تفاصيل العمل لاستخراج قواعد العمل.`;

/**
 * Creates/Resets a specific chat session
 */
export const initializeChat = (customPrompt, sessionId = 'default') => {
    const prompt = customPrompt || DEFAULT_SYSTEM_PROMPT;
    chatSessions[sessionId] = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: prompt }]
            },
            {
                role: "model",
                parts: [{ text: "فهمت تماماً! أنا جاهز للعمل وفقاً للتعليمات المحددة. سأقوم بمهامي باحترافية تامة." }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        },
    });
    return chatSessions[sessionId];
};

/**
 * Sends a message to a specific session
 */
export const sendMessage = async (message, sessionId = 'default') => {
    try {
        if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
            throw new Error('Gemini API Key is missing.');
        }

        if (!chatSessions[sessionId]) {
            initializeChat(null, sessionId);
        }

        const result = await chatSessions[sessionId].sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            text: text,
        };
    } catch (error) {
        console.error(`Gemini API Error [${sessionId}]:`, error);
        return {
            success: false,
            error: error.message,
            text: 'عذراً، حدث خطأ في معالجة طلبك.'
        };
    }
};

/**
 * Helper to extract JSON from text even if model adds conversational filler
 */
const parseSafeJSON = (text) => {
    try {
        // Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // Try regex extraction of the first JSON block
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {
                throw new Error("Could not parse extracted JSON block");
            }
        }
        throw new Error("No JSON block found in response");
    }
};

export const extractBusinessRules = async (conversationHistory) => {
    try {
        const prompt = `
أنت خبير في تحليل المحادثات واستخراج قواعد العمل Business Rules. 
قم بتحليل المحادثة التالية واستخرج البيانات بصيغة JSON حصراً.
المطلوب في الـ JSON:
- businessName: اسم المنشأة
- businessType: نوع النشاط
- services: قائمة الخدمات المذكورة
- rules: قواعد العمل المستنتجة

المحادثة:
${JSON.stringify(conversationHistory.slice(-10), null, 2)}

أعد فقط كائن JSON واحد يبدأ بـ { وينتهي بـ }. لا تضف أي نص قبله أو بعده.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Use the safe parser to handle markdown or filler text
        const businessRules = parseSafeJSON(text);

        return { success: true, data: businessRules };
    } catch (error) {
        console.error("Extraction Error:", error);
        return { success: false, error: error.message };
    }
};

export const resetChat = (sessionId = 'default') => {
    delete chatSessions[sessionId];
};
