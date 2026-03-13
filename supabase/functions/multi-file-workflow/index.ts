import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractDocxText(buffer: Uint8Array): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";
    // Robust extraction: catch text in paragraphs and tables
    const text = docXml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<w:tab[^>]*>/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\n\s*\n/g, "\n")
      .trim();
    return text;
  } catch (e) {
    console.error("Docx extraction error:", e);
    return "";
  }
}

async function callGeminiAndExtract(parts: any[]) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const systemPrompt = `
      أنت مساعد ذكي متخصص في تحليل ملفات الشركات (Onboarding Specialist).
      مهمتك هي قراءة الملفات والروابط المرفقة واستخراج ملف تعريفي شامل للشركة.
      
      يجب أن يكون الرد بصيغة JSON فقط:
      {
        "business_name": "اسم المنشأة",
        "business_type": "مجال العمل (e.g. commerce, beauty, medical, restaurant, real_estate, fitness, call_center, telecom_it, general)",
        "phone": "رقم الهاتف",
        "address": "الموقع",
        "website": "الموقع الإلكتروني",
        "working_hours": "ساعات العمل",
        "services": "قائمة الخدمات والمنتجات",
        "description": "وصف جذاب وموجز للنشاط",
        "knowledge_base": "قاعدة المعرفة: استخرج كل المعلومات التفصيلية (أسعار، سياسات، تفاصيل تقنية، بروتوكولات، تعليمات خاصة) وضعها هنا بشكل منظم جداً ومفصل لتدريب الموظف الرقمي لاحقاً."
      }
      
      قواعد:
      1. إذا لم تجد معلومة، حاول استنتاجها من السياق (خصوصاً اسم المنشأة والمجال).
      2. لـ business_type التزم بالكلمات: commerce, beauty, medical, restaurant, real_estate, fitness, call_center, telecom_it, general.
      3. كن كريماً جداً في ملء حقل knowledge_base، فهو أهم حقل لدينا.
    `;

  const genAI = new GoogleGenerativeAI(apiKey);
  // EXACT sequence from agent-handler as requested
  const models = [
    "gemini-3-flash-preview",         // 🥇 Fastest (Futuristic)
    "gemini-2.5-flash-preview-04-17", // 🥈 Rapid Backup
    "gemini-1.5-flash",               // 🥉 Stable Production
    "gemini-3.1-pro-preview",         // 🏅 Ultra-Deep Analysis
  ];

  for (const modelName of models) {
    try {
      console.log(`Analyzing with: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      });

      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const responseText = result.response.text();
      return JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (err: any) {
      console.warn(`Model ${modelName} failed:`, err.message);
      if (modelName === models[models.length - 1]) throw err;
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const urlsVal = formData.get('urls');
    let urls: string[] = [];
    if (urlsVal && typeof urlsVal === 'string') urls = JSON.parse(urlsVal);
    
    const fileEntries = formData.getAll('files');
    const geminiParts: any[] = [];
    let textBuffer = "";

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      const file = entry as File;
      const lower = file.name.toLowerCase();
      const bytes = new Uint8Array(await file.arrayBuffer());

      console.log(`Processing file: ${file.name} (${file.size} bytes)`);

      if (lower.endsWith('.pdf')) {
        geminiParts.push({ inlineData: { data: encode(bytes), mimeType: "application/pdf" } });
      } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
        geminiParts.push({ inlineData: { data: encode(bytes), mimeType: lower.endsWith('.png') ? 'image/png' : 'image/jpeg' } });
      } else if (lower.endsWith('.docx')) {
        const txt = await extractDocxText(bytes);
        textBuffer += `\n\n--- FILE: ${file.name} ---\n${txt}`;
      } else {
        const txt = new TextDecoder().decode(bytes);
        textBuffer += `\n\n--- FILE: ${file.name} ---\n${txt.slice(0, 30000)}`;
      }
    }

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const clean = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          textBuffer += `\n\n--- URL: ${url} ---\n${clean.slice(0, 20000)}`;
        }
      } catch (e) {
        console.error(`URL Fetch Error (${url}):`, e);
      }
    }

    if (textBuffer.trim()) {
      geminiParts.unshift({ text: "Content from documents and websites:\n" + textBuffer });
    }

    if (geminiParts.length === 0) {
      return new Response(JSON.stringify({ error: "No content found to analyze." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await callGeminiAndExtract(geminiParts);
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error("Workflow Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Extraction failed" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


