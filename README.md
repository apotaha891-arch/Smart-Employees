# Elite Agents Platform

منصة SaaS احترافية لتوظيف وإدارة الوكلاء الأذكياء، مدعومة بـ Gemini 1.5 Flash و Supabase.

## المميزات الرئيسية

- 🎯 **غرفة المقابلة التفاعلية**: محادثة ذكية لاختبار قدرات الوكيل قبل التوظيف
- 🤖 **استخراج تلقائي للبيانات**: تحويل الحوارات إلى JSON منظم باستخدام Gemini
- 📊 **لوحة تحكم لحظية**: متابعة أداء الوكيل مع تحديثات فورية
- 📈 **تقارير شاملة**: إحصائيات تفصيلية عن الإنتاجية والأداء
- 🌐 **دعم لغتين**: العربية والإنجليزية مع RTL كامل
- 💾 **تصدير البيانات**: Excel و CSV بضغطة واحدة

## التثبيت والإعداد

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد المفاتيح البيئية

انسخ ملف `.env.example` إلى `.env` وأضف مفاتيحك:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### الحصول على مفتاح Gemini:
1. افتح [Google AI Studio](https://aistudio.google.com/app/apikey)
2. أنشئ مفتاح API جديد
3. انسخه إلى ملف `.env`

#### إعداد Supabase:
1. أنشئ حساب في [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. انتقل إلى Settings > API
4. انسخ Project URL و anon/public key
5. انتقل إلى SQL Editor وشغّل السكريبت التالي:

```sql
-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  business_rules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  task_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_agent_id ON contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on contracts" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
```

### 3. تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على `http://localhost:5173`

## البنية التقنية

```
src/
├── components/          # المكونات التفاعلية
│   ├── Home.jsx        # الصفحة الرئيسية
│   ├── InterviewRoom.jsx  # غرفة المقابلة
│   ├── Dashboard.jsx   # لوحة التحكم
│   ├── Reports.jsx     # صفحة التقارير
│   └── Navbar.jsx      # شريط التنقل
├── services/           # خدمات الـ API
│   ├── geminiService.js   # تكامل Gemini
│   └── supabaseService.js # تكامل Supabase
├── LanguageContext.jsx # إدارة اللغات
├── translations.js     # ملف الترجمة
├── index.css          # نظام التصميم
├── App.jsx            # المكون الرئيسي
└── main.jsx           # نقطة الدخول
```

## كيفية الاستخدام

1. **ابدأ بالمقابلة**: انتقل إلى "غرفة المقابلة" وتحدث مع الوكيل عن نوع عملك
2. **وظّف الوكيل**: بعد 3 رسائل، سيظهر زر "توظيف الوكيل"
3. **راقب الأداء**: انظر إلى لوحة التحكم لمتابعة المهام المنجزة
4. **صدّر البيانات**: احصل على تقارير Excel أو CSV
5. **تحليل الأداء**: شاهد التقارير والإحصائيات التفصيلية

## التقنيات المستخدمة

- **Frontend**: React 18 + Vite
- **Styling**: Vanilla CSS مع Glassmorphism
- **AI Engine**: Google Gemini 1.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Routing**: React Router DOM
- **Export**: XLSX library

## الترخيص

MIT License - يمكنك استخدام المشروع بحرية

---

Built with ❤️ using Elite Agents Platform
