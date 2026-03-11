import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callGeminiAndExtract(text: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please run: supabase secrets set GEMINI_API_KEY=your_key");
  }

  const systemPrompt = `
      أنت مساعد ذكي متخصص في تحليل ملفات الشركات واستخراج المعلومات الأساسية وتجهيز الملف التعريفي للشركة (Business Profile).
      قم بقراءة النص المقدم لك، واستخرج الحقول التالية بدقة وبصيغة JSON صالحة (Valid JSON) فقط، بدون أي نصوص أو تعليقات أخرى.
      
      يجب أن يكون الـ JSON بهذا الهيكل (استخدم قيم فارغة '' إذا لم تجد المعلومة):
      {
        "business_name": "اسم الشركة / المنشأة",
        "business_type": "نوع النشاط (مثال: صالون تجميل، عيادة، مطعم..)",
        "phone": "رقم التواصل أو الهاتف",
        "address": "الموقع أو العنوان",
        "website": "رابط الموقع الإلكتروني إن وجد",
        "working_hours": "ساعات العمل المذكورة",
        "services": "قائمة بالخدمات المقدمة (مفصولة بفواصل أو بنقاط، باختصار)",
        "description": "وصف عام وموجز للنشاط التجاري",
        "knowledge_base": "أي تعليمات، بروتوكولات، شروط، سياسات، تفاصيل أسعار، أو أي معلومات إضافية هامة وجدتها في الملف وضعها هنا بشكل منسق ليقرأها الذكاء الاصطناعي لاحقاً."
      }
    `;

  const genAI = new GoogleGenerativeAI(apiKey);

  const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
  ];

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: text.slice(0, 40000) }] }]
      });

      let jsonOutput = result.response.text();

      if (jsonOutput.startsWith('```json')) {
        jsonOutput = jsonOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      return JSON.parse(jsonOutput);
    } catch (err: any) {
      console.error(`Model ${modelName} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All AI models failed during extraction. Last error: ${lastError?.message}`);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    
    const formData = await req.formData();
    const urlsVal = formData.get('urls');
    let urls: string[] = [];
    if (urlsVal && typeof urlsVal === 'string') {
        try { urls = JSON.parse(urlsVal); } catch(e) { console.error("URL parse error", e); }
    }
    
    // Process Files
    const fileEntries = formData.getAll('files');
    const processedFiles: any[] = [];
    
    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      
      const file = entry as File;
      const lower = file.name.toLowerCase();
      const metadata = { filename: file.name, size: file.size };
      const content = new Uint8Array(await file.arrayBuffer());
      
      try {
        if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
          const s = new TextDecoder('utf-8').decode(content);
          processedFiles.push({ ...metadata, text: s.slice(0, 15000) });
          continue;
        }
        if (lower.endsWith('.pdf')) {
          const s = new TextDecoder('latin1').decode(content);
          const matches = Array.from(s.matchAll(/\(([^)]*)\) Tj/g));
          const extracted = matches.map(m => m[1]).join('\n');
          processedFiles.push({ ...metadata, text: (extracted || s.slice(0, 1000)).slice(0, 15000) });
          continue;
        }
        processedFiles.push({ ...metadata, preview: "Binary or unsupported format" });
      } catch (e) {
        processedFiles.push({ ...metadata, error: String(e) });
      }
    }

    let combinedText = processedFiles.map(r => r.text || r.preview || '').join('\n\n--- NEXT FILE ---\n\n');

    // Fetch and process URLs
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          combinedText += `\n\n--- CONTENT FROM URL: ${url} ---\n\n${text.slice(0, 15000)}`;
        } else {
          combinedText += `\n\n--- FAILED TO FETCH URL: ${url} (Status: ${res.status}) ---\n\n`;
        }
      } catch (e) {
        combinedText += `\n\n--- ERROR FETCHING URL: ${url} ---\n\n${String(e)}`;
      }
    }

    if (!combinedText.trim()) {
      return new Response(JSON.stringify({ error: "No text could be extracted from the provided files or URLs." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const extractedData = await callGeminiAndExtract(combinedText);

    return new Response(JSON.stringify(extractedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
