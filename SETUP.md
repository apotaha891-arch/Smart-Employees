# دليل الإعداد السريع - Elite Agents Platform

## 📋 الخطوات المطلوبة

### 1️⃣ تثبيت المكتبات

```bash
npm install
```

### 2️⃣ إعداد Gemini API

1. افتح [Google AI Studio](https://aistudio.google.com/app/apikey)
2. سجل الدخول بحساب Google
3. اضغط على "Create API Key"
4. انسخ المفتاح

### 3️⃣ إعداد Supabase

1. افتح [Supabase](https://supabase.com)
2. سجل الدخول أو أنشئ حساب جديد
3. اضغط "New Project"
4. املأ البيانات:
   - **Name**: elite-agents
   - **Database Password**: (اختر كلمة سر قوية)
   - **Region**: (اختر أقرب منطقة)
5. انتظر حتى يكتمل الإعداد (2-3 دقائق)

### 4️⃣ الحصول على مفاتيح Supabase

1. في لوحة تحكم Supabase، اذهب إلى:
   - **Settings** → **API**
2. انسخ:
   - **Project URL** (مثال: https://xxxxx.supabase.co)
   - **anon public** key

### 5️⃣ إنشاء الجداول في Supabase

1. في لوحة تحكم Supabase، اذهب إلى:
   - **SQL Editor**
2. افتح ملف `database-setup.sql` من المشروع
3. انسخ **المحتوى بالكامل** (Ctrl+A ثم Ctrl+C)
4. الصق في SQL Editor في Supabase (Ctrl+V)
5. اضغط **"Run"** لتنفيذ الكود
6. يجب أن تظهر رسالة **"Success. No rows returned"**

> ⚠️ **ملاحظة مهمة**: لا تنسخ من ملف README.md - استخدم ملف `database-setup.sql` فقط!

### 6️⃣ إنشاء ملف .env

1. انسخ ملف `.env.example` وأعد تسميته إلى `.env`
2. املأ المفاتيح:

```env
VITE_GEMINI_API_KEY=AIzaSy... # المفتاح من Google AI Studio
VITE_SUPABASE_URL=https://xxxxx.supabase.co # من Supabase Settings
VITE_SUPABASE_ANON_KEY=eyJhb... # من Supabase Settings
```

### 7️⃣ تشغيل المشروع

```bash
npm run dev
```

### 8️⃣ افتح المتصفح

```
http://localhost:5173
```

---

## 🎯 اختبار المنصة

### الطريقة الأولى: مقابلة حقيقية

1. اذهب إلى "غرفة المقابلة"
2. ابدأ محادثة مع الوكيل، مثال:

```
أنا: مرحباً، أنا صاحب عيادة أسنان
الوكيل: مرحباً بك! أخبرني المزيد...
أنا: اسم العيادة "عيادة النور"، نعمل من 9 صباحاً حتى 9 مساءً
الوكيل: ممتاز، ما هي الخدمات التي تقدمونها؟
أنا: فحص روتيني، تنظيف، حشوات، تبييض
```

3. بعد 3 رسائل أو أكثر، اضغط "توظيف الوكيل"
4. انتقل إلى "لوحة التحكم"

### الطريقة الثانية: بيانات تجريبية

1. افتح Developer Console في المتصفح (F12)
2. انسخ والصق:

```javascript
import { generateDemoData } from './src/utils/demoData.js';
await generateDemoData();
```

3. انتقل إلى "لوحة التحكم" لرؤية البيانات

---

## 🔧 حل المشاكل الشائعة

### المشكلة: "Failed to fetch"

**الحل**: تأكد من أن مفاتيح `.env` صحيحة وأن الإنترنت متصل

### المشكلة: "Failed to create tables"

**الحل**: تأكد من تشغيل SQL script في Supabase SQL Editor

### المشكلة: الصفحة فارغة

**الحل**:
1. افتح Developer Console (F12)
2. ابحث عن أخطاء في Console
3. تأكد من تشغيل `npm run dev`

### المشكلة: اللغة لا تتغير

**الحل**: امسح cache المتصفح أو جرب في نافذة تصفح خاص

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع ملف `README.md`
2. تحقق من أن جميع المفاتيح صحيحة
3. تأكد من اتصال الإنترنت

---

✨ **أنت الآن جاهز للبدء!**
