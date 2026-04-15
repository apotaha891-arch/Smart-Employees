export const INTEGRATION_GUIDES = {
    whatsapp_api_key: {
        stepsAr: [
            'اذهب إلى (Meta for Developers) وافتح تطبيقك.',
            'من القائمة الجانبية اختر (WhatsApp) ثم (Configuration).',
            'قم بإنشاء (System User Token) جديد.',
            'تأكد من اختيار صلاحيات: whatsapp_business_management و whatsapp_business_messaging.'
        ],
        stepsEn: [
            'Go to (Meta for Developers) and open your app.',
            'From the side menu, select (WhatsApp) then (Configuration).',
            'Generate a new (System User Token).',
            'Ensure you select: whatsapp_business_management and whatsapp_business_messaging permissions.'
        ],
        url: 'https://developers.facebook.com/apps/'
    },
    whatsapp_number: {
        stepsAr: [
            'اذهب إلى تطبيقك في Meta for Developers.',
            'اختر (WhatsApp) ثم (API Setup).',
            'ستجد (Phone number ID) في قسم خطوات الإرسال.',
            'انسخ الرقم الطويل المكون من عدة خانات.'
        ],
        stepsEn: [
            'Go to your app in Meta for Developers.',
            'Select (WhatsApp) then (API Setup).',
            'You will find (Phone number ID) in the "Send and receive messages" section.',
            'Copy the long numeric ID.'
        ],
        url: 'https://developers.facebook.com/apps/'
    },
    whatsapp_waba_id: {
        stepsAr: [
            'اذهب إلى تطبيقك في Meta for Developers.',
            'اختر (WhatsApp) ثم (API Setup).',
            'ستجد (WhatsApp Business Account ID) تحت رقم الهاتف.',
            'انسخ هذا المعرّف لاستخدامه هنا.'
        ],
        stepsEn: [
            'Go to your app in Meta for Developers.',
            'Select (WhatsApp) then (API Setup).',
            'You will find (WhatsApp Business Account ID) right below the Phone ID.',
            'Copy this ID to use here.'
        ],
        url: 'https://developers.facebook.com/apps/'
    },
    instagram_token: {
        stepsAr: [
            'اذهب إلى Meta for Developers.',
            'أنشئ (System User Token) مع صلاحية instagram_manage_messages.',
            'يجب أن يكون حساب إنستجرام مربوطاً بصفحة فيسبوك داخل نفس الـ Business Manager.'
        ],
        stepsEn: [
            'Go to Meta for Developers.',
            'Generate a (System User Token) with instagram_manage_messages permission.',
            'Ensure your Instagram account is linked to a Facebook Page within the same Business Manager.'
        ],
        url: 'https://developers.facebook.com/apps/'
    },
    instagram_account_id: {
        stepsAr: [
            'افتح (Meta Business Suite).',
            'اذهب إلى (Settings) ثم (Business Assets).',
            'اذهب لتبويب (Instagram Accounts) وستجد المعرّف هناك.',
            'أو من خلال إعدادات صفحة فيسبوك المربوطة.'
        ],
        stepsEn: [
            'Open (Meta Business Suite).',
            'Go to (Settings) then (Business Assets).',
            'Go to the (Instagram Accounts) tab to find the ID.',
            'Alternatively, find it via your linked Facebook Page settings.'
        ]
    },
    google_sheets_id: {
        stepsAr: [
            'افتح ملف جوجل شيت الخاص بك.',
            'انسخ الجزء الموجود في الرابط (URL) بين /d/ و /edit.',
            'مثال: 1BxiMVs0XRA... هو المعرّف المطلوب.'
        ],
        stepsEn: [
            'Open your Google Sheet.',
            'Copy the part of the URL between /d/ and /edit.',
            'Example: 1BxiMVs0XRA... is the ID you need.'
        ]
    }
};

export const AI_LOADING_MESSAGES = {
    ar: [
        'جاري رفع الملفات وقراءتها...',
        'جاري تحليل المحتوى بالذكاء الاصطناعي...',
        'يتم استخراج تفاصيل المنشأة...',
        'شارفنا على الانتهاء...'
    ],
    en: [
        'Uploading and reading files...',
        'Analyzing with AI...',
        'Extracting business details...',
        'Almost done...'
    ]
};

export const INDUSTRY_OPTIONS = [
    { value: 'beauty', labelAr: '💄 تجميل وعناية', labelEn: '💄 Beauty & Wellness' },
    { value: 'medical', labelAr: '🏥 طبي وصحي', labelEn: '🏥 Medical & Health' },
    { value: 'telecom_it', labelAr: '📡 اتصالات وتقنية', labelEn: '📡 Telecom & IT' },
    { value: 'banking', labelAr: '🏦 بنوك ومالية', labelEn: '🏦 Banking & Finance' },
    { value: 'real_estate', labelAr: '🏢 عقارات', labelEn: '🏢 Real Estate' },
    { value: 'restaurant', labelAr: '🍽️ مطاعم', labelEn: '🍽️ Restaurant' },
    { value: 'fitness', labelAr: '💪 لياقة ورياضة', labelEn: '💪 Fitness & Sports' },
    { value: 'retail_ecommerce', labelAr: '🛍️ تجزئة ومتاجر', labelEn: '🛍️ Retail & E-commerce' },
    { value: 'call_center', labelAr: '🎧 خدمة عملاء', labelEn: '🎧 Customer Support' },
    { value: 'general', labelAr: '🏬 أخرى / عام', labelEn: '🏬 General / Other' }
];

export const HELP_GUIDES = (language, currentUserId) => ({
    sheets: {
        title: language === 'ar' ? 'دليل ربط جداول جوجل 📊' : 'Google Sheets Setup Guide 📊',
        color: '#0F9D58',
        steps: language === 'ar' ? [
            { t: 'أنشئ جدول بيانات جديد', d: 'قم بفتح Google Sheets وأنشئ جدولاً جديداً أو استخدم جدولاً موجوداً.' },
            { t: 'المشاركة مع الموظف الذكي', d: 'هذه أهم خطوة! اضغط على زر "مشاركة" (Share) وأضف البريد التالي كـ "محرر" (Editor):', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
            { t: 'نسخ معرّف الجدول', d: 'ستجده في رابط المتصفح (URL) بين /d/ و /edit. مثال: 1BxiMVs0XRA...' },
            { t: 'الحفظ والاختبار', d: 'ضع المعرف في الخانة المخصصة واضغط "اختبار الربط" للتأكد من وصول البيانات.' }
        ] : [
            { t: 'Create a Spreadsheet', d: 'Open Google Sheets and create a new sheet or use an existing one.' },
            { t: 'Share with the AI Agent', d: 'Crucial step! Click "Share" and add this email as an "Editor":', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
            { t: 'Copy Spreadsheet ID', d: 'Found in the URL between /d/ and /edit. Example: 1BxiMVs0XRA...' },
            { t: 'Save & Test', d: 'Enter the ID in the field and click "Test Connection" to verify.' }
        ]
    },
    calendar: {
        title: language === 'ar' ? 'دليل ربط تقويم جوجل 📅' : 'Google Calendar Setup Guide 📅',
        color: '#4285F4',
        steps: language === 'ar' ? [
            { t: 'افتح إعدادات التقويم', d: 'اذهب إلى Google Calendar، اضغط على أيقونة الترس ثم "الإعدادات".' },
            { t: 'المشاركة مع الموظف', d: 'اختر تقويمك من القائمة الجانبية، ثم "مشاركة مع أشخاص محددين". أضف البريد التالي:', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
            { t: 'تعيين الصلاحيات', d: 'تأكد من اختيار صلاحية "إجراء تغييرات على الأحداث" (Make changes to events).' },
            { t: 'معرّف التقويم (ID)', d: 'انزل لأسفل في الإعدادات لقسم "دمج التقويم"، وانسخ الـ Calendar ID كاملاً (مثال: email@group.calendar.google.com).' }
        ] : [
            { t: 'Open Calendar Settings', d: 'Go to Google Calendar, click the gear icon, then "Settings".' },
            { t: 'Share with the Agent', d: 'Select your calendar on the left, then "Share with specific people". Add this email:', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
            { t: 'Set Permissions', d: 'Ensure you select "Make changes to events" permission.' },
            { t: 'Calendar ID', d: 'Scroll down to the "Integrate calendar" section and copy the full Calendar ID (e.g., email@group.calendar.google.com).' }
        ]
    },
    whatsapp: {
        title: language === 'ar' ? 'دليل ربط واتساب للأعمال 💬' : 'WhatsApp Business Setup Guide 💬',
        color: '#25D366',
        steps: language === 'ar' ? [
            { t: 'بوابة Meta للمطورين', d: 'سجل الدخول في developers.facebook.com وأنشئ تطبيقاً من نوع Business.' },
            { t: 'إعداد واتساب', d: 'أضف منتج "WhatsApp" لتطبيقك وقم بربط رقم هاتفك.' },
            { t: 'الرموز والمعرفات', d: 'ستحتاج لنسخ الـ Phone ID والـ WABA ID من قسم API Setup.' },
            { t: 'مفتاح الوصول الدائم', d: 'أنشئ System User Token دائم وتأكد من اختيار صلاحيات الرسائل.' }
        ] : [
            { t: 'Meta Developers Portal', d: 'Log in to developers.facebook.com and create a "Business" type app.' },
            { t: 'Setup WhatsApp', d: 'Add "WhatsApp" to your app and link your phone number.' },
            { t: 'IDs & Tokens', d: 'Copy the Phone ID and WABA ID from the API Setup section.' },
            { t: 'Permanent Token', d: 'Generate a Permanent System User Token with messaging permissions.' }
        ]
    },
    instagram: {
        title: language === 'ar' ? 'دليل ربط إنستجرام للأعمال 📸' : 'Instagram Business Setup Guide 📸',
        color: '#E4405F',
        steps: language === 'ar' ? [
            { t: 'حساب تجاري', d: 'تأكد أن حسابك في إنستجرام هو حساب "تجاري" (Business) أو "صانع محتوى" (Creator).' },
            { t: 'ربط بصفحة فيسبوك', d: 'يجب ربط حساب إنستجرام بصفحة فيسبوك نشطة من خلال Meta Business Suite.' },
            { t: 'تفعيل الوصول للرسائل', d: 'من تطبيق إنستجرام: الإعدادات > الرسائل والردود على القصص > أدوات المراسلة > فعل "السماح بالوصول إلى الرسائل".' },
            { t: 'بوابة Meta للمطورين', d: 'سجل في developers.facebook.com وأنشئ تطبيقاً من نوع (Business). أضف منتج "Instagram Graph API".' },
            { t: 'معرّف الحساب (ID)', d: 'ستجد Instagram Business ID في Meta Business Suite > Settings > Business Assets.' },
            { t: 'رمز الوصول الدائم (Token)', d: 'أنشئ (System User Token) دائم عبر Business Manager بصلاحيات: instagram_basic, instagram_manage_messages.' },
            { t: 'إعداد الـ Webhook', d: 'في إعدادات تطبيق Meta، استخدم الرابط التالي لتلقي الرسائل مجاناً وفي الوقت الفعلي:', copy: (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/meta-webhook?user_id=' + currentUserId }
        ] : [
            { t: 'Business Account', d: 'Ensure your Instagram account is set to "Business" or "Creator" mode.' },
            { t: 'Link Facebook Page', d: 'Your Instagram must be linked to a Facebook Page via Meta Business Suite.' },
            { t: 'Allow Message Access', d: 'In Instagram App: Settings > Messages & Story Replies > Message Tools > Toggle "Allow Access to Messages".' },
            { t: 'Meta Developer App', d: 'Sign up at developers.facebook.com and create a "Business" type app. Add the "Instagram Graph API" product.' },
            { t: 'Business Account ID', d: 'Found in Meta Business Suite > Settings > Business Assets under Instagram Accounts.' },
            { t: 'Permanent Token', d: 'Generate a Permanent System User Token in Business Manager with permissions: instagram_basic, instagram_manage_messages.' },
            { t: 'Configure Webhook', d: 'In your Meta App Webhook settings, use this URL to receive live messages:', copy: (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/meta-webhook?user_id=' + currentUserId }
        ]
    },
    telegram: {
        title: language === 'ar' ? 'دليل إعداد بوت تيليجرام 🤖' : 'Telegram Bot Setup Guide 🤖',
        color: '#229ED9',
        steps: language === 'ar' ? [
            { t: 'ابدأ مع BotFather', d: 'افتح تطبيق تيليجرام وابحث عن @BotFather.' },
            { t: 'إنشاء بوت جديد', d: 'أرسل الأمر /newbot واتبع التعليمات لاختيار اسم ومعرف للبوت.' },
            { t: 'الحصول على التوكن', d: 'بعد الانتهاء، سيعطيك BotFather "API Token" (رقم طويل مع أحرف). انسخه هنا.' },
            { t: 'تفعيل الموظف', d: 'ضع التوكن في الخانة المخصصة واحفظ الإعدادات لتفعيل الرد التلقائي.' }
        ] : [
            { t: 'Start with BotFather', d: 'Open Telegram and search for @BotFather.' },
            { t: 'Create New Bot', d: 'Send /newbot and follow instructions to set a name and username.' },
            { t: 'Get API Token', d: 'BotFather will provide a long numeric/alphabetic token. Copy it.' },
            { t: 'Activate Agent', d: 'Paste the token in the field and save your settings.' }
        ]
    }
});
