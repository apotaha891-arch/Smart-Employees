import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    apiVersion: "v1beta",
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
    },
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
    ]
});

// Dictionary to store multiple chat sessions (e.g., 'agent', 'manager')
let chatSessions = {};

const DEFAULT_SYSTEM_PROMPT = `أنت موظف ذكاء اصطناعي متخصص في مقابلات التوظيف. مهمتك هي التعرف على تفاصيل العمل لاستخراج قواعد العمل.`;

/**
 * Creates/Resets a specific chat session
 */
export const initializeChat = (customPrompt, sessionId = 'default') => {
    const prompt = customPrompt || DEFAULT_SYSTEM_PROMPT;

    // Create a specific model instance for this session with the system instruction
    const sessionModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        apiVersion: "v1beta",
        systemInstruction: prompt,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        ]
    });

    chatSessions[sessionId] = sessionModel.startChat({
        history: [] // Start with clean history since we use systemInstruction
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
        // Clean the text before returning to ensure no THOUGHT blocks or markdown leak
        const text = cleanAIText(response.text());

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

/**
 * Cleans AI text for WhatsApp compatibility (removes Markdown markers)
 */
export const cleanAIText = (text) => {
    if (!text) return '';
    let txt = text;
    // 0. Remove THOUGHT blocks or internal reasoning (often generated by Gemini)
    // Matches "THOUGHT:" or "تفكير:" and removes everything until the next empty line or a specific delimiter
    txt = txt.replace(/THOUGHT:[\s\S]*?(?=\n\n|$)/gi, '');
    txt = txt.replace(/تفكيـ?ر:[\s\S]*?(?=\n\n|$)/gi, '');

    // 1. Remove bold / italic / strike markers (**bold**, *italic*, ~~strike~~)
    txt = txt.replace(/[*_~]+/g, '');
    // 2. Convert [Text](https://url) → Text https://url
    txt = txt.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 $2');
    // 3. Collapse 3+ blank lines
    txt = txt.replace(/\n{3,}/g, '\n\n').trim();
    // 4. Remove unwanted source-reference preambles (case insensitive)
    txt = txt.replace(/^.*?based on the document you provided[,:]?\s*/i, '');
    txt = txt.replace(/^.*?وفقاً للمستند[,:]?\s*/i, '');
    return txt;
};

/**
 * Specifically for the Support Agent using a Knowledge Base
 */
export const getSupportResponse = async (userMessage, knowledgeBaseText) => {
    try {
        const date = new Date();
        const formattedDate = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

        const prompt = `
أنت المساعد الذكي لخدمة العملاء. وظيفتك الإجابة على الأسئلة برحابة صدر واحترافية عالية مع تقديم المعلومات من قاعدة المعرفة فقط.
تعليمات وسمات شخصية صارمة:
1. الجانب الإنساني: تحدث بأسلوب بشري طبيعي ولبق، وتجنب الإجابات الآلية الجامدة.
2. مجاراة اللهجة: إذا لاحظت أن العميل يتحدث بلهجة خليجية أو لتسهيل التواصل، جارِ حديثه بلهجة بيضاء محترمة تعكس لباقة الاستقبال (استخدم كلمات ترحيب مثل "أبشر"، "حاضر"، "يا ليت").
3. الصياغة: لا تستخدم مقدمات مثل "بناءً على المستند" أو "وفقاً للمعلومات".
4. ادخل في صلب الإجابة مباشرة ولكن بأسلوب دافئ.
5. لا تذكر تاريخ اليوم إلا إذا سُئلت عنه.
تاريخ اليوم هو: ${formattedDate}

قاعدة المعرفة الأساسية:
${knowledgeBaseText || 'لا توجد معلومات محددة حالياً.'}

سؤال العميل:
${userMessage}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text().trim();

        return {
            success: true,
            text: cleanAIText(rawText)
        };
    } catch (error) {
        console.error("Support API Error:", error);
        return {
            success: false,
            error: error.message,
            text: 'عذراً، حدث خطأ في معالجة طلب الدعم.'
        };
    }
};

export const resetChat = (sessionId = 'default') => {
    delete chatSessions[sessionId];
};
