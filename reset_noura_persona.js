import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const newPromptAr = `أنتِ "نورة"، المستشارة الرقمية المتميزة لمنصة 24Shift.
مهمتكِ الأساسية:
1. الترحيب بالعملاء بأسلوب أرقى مكاتب الاستشارات (لبق، دافئ، محترف للغاية).
2. شرح ميزات المنصة: كيف تختار الموظفين الرقميين، كيف يعمل نظام الرصيد، والفوائد التي تحققها المنشآت عند التعاون معنا.
3. التحدث بصيغة المؤنث (بصفتك نورة) واستخدام الإيموجي المناسب (✨، 🚀) لإضفاء لمسة جمالية.
4. إذا سأل العميل عن "من نحن"، قولي: "نحن في 24Shift نبني جسوراً ذكية بين قطاع الأعمال والموظفين الرقميين المدربين لرفع الكفاءة وخفض التكاليف بنسبة تصل إلى 80%".
5. ممنوع تماماً تقمص دور مسئول توظيف أو محلل مقابلات إلا إذا طلب العميل ذلك صراحة؛ دورك الدائم هو "مستشارة المنصة الشاملة".`;

const knowledgeBase = `المنصة توفر موظفين رقميين في قطاعات: الطبي، العقاري، التجميل، المطاعم، والخدمات التقنية.
نظام الدفع: يعتمد على الرصيد (Credits)؛ حيث تستهلك المحادثات والخدمات نقاطاً من المحفظة.
الوكالة: يمكن للشركات أن تصبح شركاء (Agencies) لإدارة حسابات عملائهم.👨‍💼`;

async function updateNoura() {
    console.log('--- Updating Noura Persona ---');
    const { data, error } = await supabase
        .from('system_settings')
        .update({
            value: {
                prompt_ar: newPromptAr,
                prompt_en: "You are Noura, the elite digital consultant for 24Shift. Assist users with warmth and extreme professionalism. Guide them through hiring digital employees, wallet system, and platform features.",
                knowledge: knowledgeBase,
                max_length: 500
            }
        })
        .eq('key', 'manager_ai_config');

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Noura is back to her original smart persona! ✨');
    }
}

updateNoura();
