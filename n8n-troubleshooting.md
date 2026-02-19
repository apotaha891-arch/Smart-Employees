# حل مشكلة توقف n8n Workflow

## المشكلة
الـ workflow يتوقف عند Code Nodes ولا يكمل التنفيذ.

## الحل: استخدام Function Node بدلاً من Code Node

### الخطوات:

1. **احذف Node "Prepare Data"**

2. **أضف Function Node جديد**:
   - اسمه: `Prepare Data`
   - النوع: `Function`
   - الكود:

```javascript
// Get user message
const userMessage = items[0].json.message.text;
const chatId = items[0].json.message.chat.id;

// Mock services data
const services = [
  { name: 'قص شعر', price: 150, duration: 45 },
  { name: 'صبغة', price: 250, duration: 90 },
  { name: 'مكياج', price: 200, duration: 60 }
];

return [{
  json: {
    userMessage: userMessage,
    chatId: chatId,
    services: services,
    bookedSlots: [],
    agentName: 'سارة',
    specialty: 'شامل'
  }
}];
```

3. **اربط الـ Nodes**:
   ```
   Telegram Trigger → Prepare Data → Gemini Chat
   ```

4. **احفظ وفعّل**

---

## حل بديل: استخدام Set Node (الأسهل)

إذا لم يعمل Function Node أيضاً:

1. **احذف "Prepare Data"**
2. **أضف Set Node**:
   - **Mode**: Manual Mapping
   - **Fields**:
     ```
     userMessage: {{ $json.message.text }}
     chatId: {{ $json.message.chat.id }}
     agentName: سارة
     specialty: شامل
     ```

3. **في Gemini Chat Node**:
   - غيّر الـ system instruction لتستخدم قيم ثابتة بدلاً من `$json.services`

---

## الحل الأسرع: تجاوز المشكلة تماماً

استخدم **HTTP Request Node** مباشرة بدون تحضير:

### Node: Gemini Direct
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY",
  "body": {
    "contents": [{
      "role": "user",
      "parts": [{ "text": "={{ $json.message.text }}" }]
    }],
    "systemInstruction": {
      "parts": [{
        "text": "أنت سارة، موظفة استقبال في صالون. الخدمات: قص شعر (150 ريال)، صبغة (250 ريال)، مكياج (200 ريال). ساعد العميلات في الحجز."
      }]
    }
  }
}
```

---

## 🧪 اختبار سريع

لمعرفة ما إذا كانت المشكلة في Code Nodes:

1. **أضف Set Node** بسيط بعد Telegram Trigger
2. **Set**: `test = "hello"`
3. **شغّل الـ workflow**
4. **إذا عمل** → المشكلة في Code Nodes
5. **إذا لم يعمل** → المشكلة في n8n نفسه

---

أي حل تريد تجربته؟ 🤔
