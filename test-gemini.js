import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const modelNames = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.5-pro'];

async function testModels() {
    for (const name of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent('hello');
            console.log(`Success: ${name}`);
        } catch (e) {
            console.log(`Failed: ${name} - ${e.message}`);
        }
    }
}

testModels();
