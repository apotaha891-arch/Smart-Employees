# تعليمات استيراد وتفعيل n8n Workflow

## 📥 الخطوة 1: استيراد الـ Workflow

1. افتح **n8n Dashboard**
2. اضغط على **"+"** → **Import from File**
3. اختر ملف `n8n-telegram-booking-workflow.json`
4. اضغط **Import**

---

## 🔑 الخطوة 2: إعداد الـ Credentials

يجب إضافة 3 Credentials:

### أ) Telegram Bot Credential

1. في n8n، اذهب إلى **Settings** → **Credentials** → **New**
2. اختر **Telegram API**
3. **Access Token**: احصل عليه من [@BotFather](https://t.me/botfather):
   - أرسل `/newbot`
   - اتبع التعليمات
   - انسخ الـ Token (مثال: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. احفظ الـ Credential

### ب) Supabase Credential

1. **New Credential** → **Supabase**
2. **Host**: `https://YOUR-PROJECT.supabase.co`
3. **Service Role Key**: من Supabase Dashboard → Settings → API → `service_role` key
   - ⚠️ **مهم**: استخدم `service_role` وليس `anon` key لتجاوز RLS
4. احفظ الـ Credential

### ج) Gemini API Key

1. احصل على API Key من [Google AI Studio](https://aistudio.google.com/app/apikey)
2. في الـ workflow، افتح Node **"Gemini Chat"**
3. في Query Parameters → `key`، ضع الـ API Key
4. احفظ

---

## ⚙️ الخطوة 3: ربط الـ Credentials بالـ Nodes

افتح الـ workflow وعدّل هذه الـ Nodes:

### 1. Telegram Trigger
- اضغط على الـ Node
- **Credential**: اختر الـ Telegram credential الذي أنشأته

### 2. Get Salon Config
- **Credential**: اختر الـ Supabase credential

### 3. Get Services
- **Credential**: نفس الـ Supabase credential

### 4. Get Today Bookings
- **Credential**: نفس الـ Supabase credential

### 5. Create Booking
- **Credential**: نفس الـ Supabase credential

### 6. Send Booking Confirmation
- **Credential**: الـ Telegram credential

### 7. Send Chat Response
- **Credential**: الـ Telegram credential

---

## ✅ الخطوة 4: التفعيل

1. **احفظ الـ Workflow** (Ctrl+S)
2. اضغط على زر **Active** في الأعلى (يتحول للأخضر)
3. الـ workflow الآن يعمل! 🎉

---

## 🧪 الخطوة 5: الاختبار

### اختبار سريع:

1. **افتح Telegram** وابحث عن البوت الخاص بك
2. **أرسل**: "مرحبا"
3. **يجب أن يرد** البوت بترحيب ويعرض الخدمات

### اختبار الحجز الكامل:

```
المستخدم: مرحبا
البوت: أهلاً وسهلاً! أنا سارة...

المستخدم: أريد حجز موعد لقص شعر
البوت: رائع! متى تفضلين الموعد؟

المستخدم: غداً الساعة 3 مساءً
البوت: ممتاز! ما اسمك ورقم هاتفك؟

المستخدم: اسمي فاطمة ورقمي +966501234567
البوت: ✅ تم تأكيد الحجز!
      📋 تفاصيل الحجز:
      👤 العميلة: فاطمة
      💇‍♀️ الخدمة: قص شعر
      ...
```

4. **تحقق من `/bookings`** في التطبيق - يجب أن يظهر الحجز!

---

## 🐛 استكشاف الأخطاء

### البوت لا يرد:
- ✅ تأكد أن الـ workflow **Active**
- ✅ تحقق من الـ Telegram Token
- ✅ افتح **Executions** في n8n لرؤية الأخطاء

### "salon_services not found":
- ✅ تأكد أنك شغّلت `db-setup-complete.sql`
- ✅ أضف خدمة واحدة على الأقل في `/salon-setup`

### الحجز لا يُحفظ:
- ✅ تأكد من استخدام `service_role` key وليس `anon`
- ✅ تحقق من RLS policies في Supabase

### Gemini لا يرد:
- ✅ تحقق من API Key
- ✅ تأكد من وجود Quota كافي

---

## 📊 مراقبة الأداء

- **Executions**: شاهد جميع التنفيذات في n8n → Executions
- **Bookings**: راقب الحجوزات في `/bookings`
- **Logs**: تحقق من الأخطاء في n8n Console

---

## 🚀 الخطوات التالية

بعد نجاح الاختبار:
1. ✅ أضف المزيد من الخدمات
2. ✅ جرّب حجوزات متعددة
3. ✅ اختبر الأوقات المحجوزة (يجب أن يرفض البوت الحجز في وقت محجوز)
4. 🔄 استبدل Telegram بـ WhatsApp (نفس المنطق، فقط غيّر الـ Trigger)

---

**جاهز للانطلاق! 🎉**
