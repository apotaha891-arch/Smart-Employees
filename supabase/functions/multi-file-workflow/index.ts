import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getBoundary(contentType: string) {
  const m = contentType.match(/boundary=(?:"?)([^";]+)/i);
  return m ? m[1] : null;
}

async function parseMultipart(body: Uint8Array, boundary: string) {
  const dashBoundary = `--${boundary}`;
  const parts: Array<{ headers: Record<string, string>, data: Uint8Array }> = [];
  const bodyStr = new TextDecoder('latin1').decode(body);
  const sections = bodyStr.split(dashBoundary).slice(1, -1);
  for (const sec of sections) {
    const [rawHeaders, ...rest] = sec.split('\r\n\r\n');
    if (!rawHeaders) continue;
    const headerLines = rawHeaders.split('\r\n').map(l => l.trim()).filter(Boolean);
    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      headers[name] = value;
    }
    const dataStr = rest.join('\r\n\r\n');
    const trimmed = dataStr.endsWith('\r\n') ? dataStr.slice(0, -2) : dataStr;
    const data = new TextEncoder().encode(trimmed);
    parts.push({ headers, data });
  }
  return parts;
}

function parseContentDisposition(cd: string) {
  const res: Record<string, string> = {};
  const parts = cd.split(';').map(p => p.trim());
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!v) { res['type'] = k; continue; }
    const val = v.replace(/^"|"$/g, '');
    res[k] = val;
  }
  return res;
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

  // Fallback Loop — same models as agent-handler (proven working)
  const MODELS = [
    "gemini-3-flash-preview",          // fastest
    "gemini-2.5-flash-preview-04-17",  // fast fallback
    "gemini-3.1-pro-preview",          // most capable
    "gemini-2.0-flash",                // stable fallback
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
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) return new Response('Content-Type must be multipart/form-data', { status: 400, headers: corsHeaders });

    const boundary = getBoundary(ct);
    if (!boundary) return new Response('No boundary found', { status: 400, headers: corsHeaders });

    const bodyBuf = new Uint8Array(await req.arrayBuffer());
    const parts = await parseMultipart(bodyBuf, boundary);

    const files: Array<{ filename: string, content: Uint8Array }> = [];
    let urls: string[] = [];

    for (const p of parts) {
      const cd = p.headers['content-disposition'] || '';
      const info = parseContentDisposition(cd);

      if (info.name === 'urls') {
        try {
          urls = JSON.parse(new TextDecoder().decode(p.data));
        } catch (e) { console.error("Could not parse URLs JSON", e); }
      } else if (info.filename) {
        files.push({ filename: info.filename, content: p.data });
      }
    }

    const results: any[] = [];
    for (const file of files) {
      const lower = file.filename.toLowerCase();
      const metadata = { filename: file.filename, size: file.content.length };
      try {
        if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
          const decoder = new TextDecoder('utf-8');
          const s = decoder.decode(file.content);
          results.push({ ...metadata, text: s.slice(0, 10000) });
          continue;
        }
        if (lower.endsWith('.pdf')) {
          const decoder = new TextDecoder('latin1');
          const s = decoder.decode(file.content);
          const matches = Array.from(s.matchAll(/\(([^)]*)\) Tj/g));
          const extracted = matches.map(m => m[1]).join('\n');
          const text = extracted || s.slice(0, 1000);
          results.push({ ...metadata, text: text.slice(0, 10000) });
          continue;
        }
        const preview = new TextDecoder().decode(file.content.slice(0, 1000));
        results.push({ ...metadata, preview });
      } catch (e) {
        results.push({ ...metadata, error: String(e) });
      }
    }

    let combinedText = results.map(r => r.text || r.preview || '').join('\n\n--- NEXT FILE ---\n\n');

    // Fetch and process URLs
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          // Extremely basic HTML to text (strip tags)
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
