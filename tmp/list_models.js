import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available Models:");
    models.forEach(m => {
        console.log(`- ${m.name} (displayName: ${m.displayName})`);
    });
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
