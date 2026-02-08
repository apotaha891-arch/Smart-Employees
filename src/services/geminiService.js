import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use Gemini 3 Flash Preview - User's Available Model
const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        temperature: 0.7,
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

export const extractBusinessRules = async (conversationHistory) => {
    try {
        const prompt = `
أنت خبير في تحليل المحادثات واستخراج قواعد العمل Business Rules. 
قم بتحليل المحادثة التالية واستخرج البيانات بصيغة JSON:
${JSON.stringify(conversationHistory, null, 2)}
أعد فقط JSON بدون أي نص إضافي.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const businessRules = JSON.parse(text);

        return { success: true, data: businessRules };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const resetChat = (sessionId = 'default') => {
    delete chatSessions[sessionId];
};
