import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { sendMessage, extractBusinessRules, initializeChat, resetChat, getSupportResponse } from '../services/geminiService';
import { createAgent, saveContract, getCurrentUser, checkAndDeductCredit, getProfile, updateBusinessProfile, supabase } from '../services/supabaseService';
import {
    Stethoscope, Activity, Search, Scissors, Building, Utensils, Zap, Headset,
    User, Send, CheckCircle2, Briefcase, Clock, Shield, Sparkles, Settings, ArrowUp, MoreHorizontal
} from 'lucide-react';

const iconMap = {
    'dental-receptionist': Stethoscope,
    'medical-clinic': Activity,
    'sales-lead-gen': Search,
    'beauty-salon': Scissors,
    'real-estate-marketing': Building,
    'restaurant-reservations': Utensils,
    'gym-coordinator': Zap,
    'support-agent': Headset,
};

const getAgentMap = (isArabic, isFemale = false) => ({
    'support-agent': {
        title: isArabic ? (isFemale ? 'ممثلة خدمة العملاء' : 'ممثل خدمة العملاء') : (isFemale ? 'Customer Support Agent' : 'Customer Support Agent'),
        specialty: isArabic ? 'تلقي الاستفسارات والدعم' : 'Receiving Inquiries & Support',
        services: isArabic ? ['الرد على العملاء', 'حل المشكلات', 'توجيه الطلبات'] : ['Answering Customers', 'Resolving Issues', 'Routing Requests']
    },
    'sales-lead-gen': {
        title: isArabic ? (isFemale ? 'أخصائية مبيعات' : 'أخصائي مبيعات') : 'Sales Specialist',
        specialty: isArabic ? 'إغلاق الصفقات والترويج' : 'Closing Deals & Promotion',
        services: isArabic ? ['عرض المنتجات', 'المتابعة مع العملاء المحتملين', 'تحقيق المبيعات'] : ['Showcasing Products', 'Following Up with Leads', 'Achieving Sales']
    },
    'dental-receptionist': {
        title: isArabic ? (isFemale ? 'موظفة استقبال' : 'موظف استقبال') : 'Receptionist',
        specialty: isArabic ? 'تنسيق المواعيد الطبية' : 'Coordinating Medical Appointments',
        services: isArabic ? ['حجز المواعيد', 'تذكير المرضى', 'الرد على الاستفسارات الطبية الأساسية'] : ['Booking Appointments', 'Reminding Patients', 'Answering Inquiries']
    },
    'medical-clinic': {
        title: isArabic ? (isFemale ? 'مستقبِلة عيادة' : 'موظف استقبال عيادة') : 'Clinic Receptionist',
        specialty: isArabic ? 'عيادة تخصصية' : 'Specialized Clinic',
        services: isArabic ? ['كشف طبي', 'متابعة', 'فحوصات'] : ['Medical Exams', 'Follow-ups', 'Checkups']
    },
    'beauty-salon': {
        title: isArabic ? (isFemale ? 'منسقة مواعيد' : 'منسق مواعيد') : 'Appointment Coordinator',
        specialty: isArabic ? 'إدارة صالون التجميل' : 'Beauty Salon Management',
        services: isArabic ? ['حجز الخدمات', 'تنسيق جداول الخبيرات', 'استقبال طلبات العميلات'] : ['Booking Services', 'Coordinating Staff', 'Receiving Requests']
    },
    'real-estate-marketing': {
        title: isArabic ? (isFemale ? 'مسوّقة عقارية' : 'مسوّق عقاري') : 'Real Estate Marketer',
        specialty: isArabic ? 'تسويق وبيع العقارات' : 'Marketing & Selling Real Estate',
        services: isArabic ? ['عرض الوحدات', 'جمع بيانات المهتمين', 'شرح تفاصيل العقار'] : ['Showing Units', 'Collecting Lead Data', 'Explaining Details']
    },
    'restaurant-reservations': {
        title: isArabic ? (isFemale ? 'مسؤولة حجوزات' : 'مسؤول حجوزات') : 'Reservations Officer',
        specialty: isArabic ? 'إدارة طاولات المطعم' : 'Restaurant Tables Management',
        services: isArabic ? ['تأكيد الحجوزات', 'استقبال الطلبات', 'استفسارات المنيو'] : ['Confirming Reservations', 'Receiving Orders', 'Menu Inquiries']
    },
    'gym-coordinator': {
        title: isArabic ? (isFemale ? 'منسقة اشتراكات' : 'منسق اشتراكات') : 'Memberships Coordinator',
        specialty: isArabic ? 'إدارة المشتركين' : 'Members Management',
        services: isArabic ? ['تجديد الاشتراكات', 'حجز الحصص', 'الرد على الاستفسارات'] : ['Renewing Memberships', 'Booking Classes', 'Answering Inquiries']
    }
});


const InterviewRoom = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef(null);

    const isArabic = language === 'ar';

    const [showSetup, setShowSetup] = useState(!location.state?.fromTemplates);
    const [setupConfig, setSetupConfig] = useState({
        industry: 'beauty',
        agentType: 'beauty-salon',
        tone: 'friendly'
    });
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [showIndustryEdit, setShowIndustryEdit] = useState(false);

    const [template, setTemplate] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHireButton, setShowHireButton] = useState(false);
    const [isHiring, setIsHiring] = useState(false);

    const [agent, setAgent] = useState(null);
    const [profile, setProfile] = useState(null);

    // Map of agentType -> which sector(s) it belongs to
    const agentSectorMap = {
        'support-agent': ['general', 'medical', 'beauty', 'restaurant', 'fitness', 'real_estate'],
        'sales-lead-gen': ['general', 'real_estate', 'fitness'],
        'dental-receptionist': ['medical'],
        'medical-clinic': ['medical'],
        'beauty-salon': ['beauty'],
        'real-estate-marketing': ['real_estate'],
        'restaurant-reservations': ['restaurant'],
        'gym-coordinator': ['fitness'],
    };

    const allAgentOptions = [
        { value: 'support-agent', labelKey: 'jobSupport' },
        { value: 'sales-lead-gen', labelKey: 'jobSales' },
        { value: 'dental-receptionist', labelKey: 'jobDental' },
        { value: 'medical-clinic', labelKey: 'jobClinic' },
        { value: 'beauty-salon', labelKey: 'jobSalon' },
        { value: 'real-estate-marketing', labelKey: 'jobRealEstate' },
        { value: 'restaurant-reservations', labelKey: 'jobRestaurant' },
        { value: 'gym-coordinator', labelKey: 'jobGym' },
    ];

    const filteredAgentOptions = allAgentOptions.filter(
        opt => (agentSectorMap[opt.value] || []).includes(setupConfig.industry)
    );

    const fetchAndInitializeChat = async (forcedTemplate = null) => {
        // 1. Check for authenticated user profile
        const { user } = await getCurrentUser();
        let profileDetails = "";
        let detectedIndustry = 'general';

        let targetTemplate = forcedTemplate;

        if (!targetTemplate) {
            const savedTemplate = localStorage.getItem('agentTemplate');
            if (savedTemplate) {
                targetTemplate = JSON.parse(savedTemplate);
            }
        }

        // ALWAYS prioritize the explicitly chosen industry from the setup screen
        if (targetTemplate && (targetTemplate.industry || targetTemplate.detectedIndustry)) {
            detectedIndustry = targetTemplate.industry || targetTemplate.detectedIndustry;
        }

        if (user) {
            const p = await getProfile(user.id);
            if (p.success && p.data) {
                setProfile(p.data);
                const d = p.data;

                // Only infer from DB if no UI selection was made
                if (!targetTemplate) {
                    const type = d.business_type?.toLowerCase() || '';
                    if (type.includes('طب') || type.includes('صحي') || type.includes('clinic')) detectedIndustry = 'medical';
                    else if (type.includes('عقار') || type.includes('estate')) detectedIndustry = 'realestate';
                    else if (type.includes('تجميل') || type.includes('salon') || type.includes('beauty')) detectedIndustry = 'beauty';
                    else if (type.includes('مطعم') || type.includes('restau')) detectedIndustry = 'restaurant';
                    else if (type.includes('رياض') || type.includes('gym') || type.includes('club') || type.includes('fit')) detectedIndustry = 'fitness';
                }

                // Only add real profile data to the context if the user has actually filled it out.
                // Otherwise, leave it empty so the Agent falls back to the rich Mock Data
                if (d.business_name && d.business_type) {
                    profileDetails = `
المعلومات الرسمية للمنشأة المتعاقد معها:
- اسم المنشأة: ${d.business_name || 'غير محدد'}
- نوع النشاط: ${d.business_type || 'غير محدد'}
- ساعات العمل: ${d.working_hours || 'غير محدد'}
- الخدمات: ${d.services || 'غير محدد'}
- نبذة إضافية: ${d.description || 'لا يوجد'}
- نبرة التواصل المطلوبة: ${targetTemplate?.tone || d.branding_tone || 'احترافية'}

**قاعدة المعرفة والتدريب الداخلي (هام جداً):**
${d.knowledge_base || "لا توجد بروتوكولات إضافية حالياً."}

يجب الالتزام التام بهذه المعلومات وبناءً ردودك بناءً على قاعدة المعرفة المذكورة أعلاه.`;
                }
            }
        }

        if (targetTemplate) {
            targetTemplate.detectedIndustry = detectedIndustry;
            setTemplate(targetTemplate);
            setAgent(targetTemplate);

            const toneDescription = {
                friendly: 'ودودة ودافئة',
                professional: 'مهنية ورسمية',
                casual: 'بسيطة وغير رسمية',
                enthusiastic: 'مليء بالنشاط والحيوية',
                fast: 'سريعة ومباشرة',
                luxury: 'فخمة وراقية جداً'
            };

            const industryContext = {
                medical: "أنت في بيئة طبية محترفة، تهتم بدقة المواعيد وخصوصية وحالة المرضى الصحية.",
                realestate: "أنت في بيئة عقارية تنافسية، تهتم بجذب المستثمرين، إقناع المشترين، وسرعة الرد على الاستفسارات.",
                beauty: "أنت في بيئة جمال ورقّي، تهتم بدلال العميلات، تنسيق المواعيد المزدحمة، والاحترافية في العرض.",
                restaurant: "أنت في بيئة ضيافة سريعة، تهتم بإدارة الطاولات، الحجز المسبق، وضمان رضا الضيوف.",
                fitness: "أنت في بيئة رياضية مليئة بالطاقة، تهتم بتشجيع المشتركين، تنسيق حصص التدريب، وبيع الاشتراكات.",
                general: "أنت في بيئة أعمال احترافية تسعى للنمو والتنظيم."
            };

            // Read admin-customized agents from localStorage (set via AdminDashboard)
            let adminAgents = [];
            try {
                const stored = localStorage.getItem('admin_interview_agents');
                if (stored) adminAgents = JSON.parse(stored);
            } catch {}

            const adminAgent = adminAgents.find(a => a.id === targetTemplate.id);

            const defaultNames = {
                'dental-receptionist': isArabic ? 'د. سارة' : 'Dr. Sarah',
                'medical-clinic': isArabic ? 'د. هند' : 'Dr. Emily',
                'sales-lead-gen': isArabic ? 'أستاذ فهد' : 'Mr. James',
                'beauty-salon': isArabic ? 'نورة' : 'Emma',
                'real-estate-marketing': isArabic ? 'أستاذ طارق' : 'Mr. Robert',
                'restaurant-reservations': isArabic ? 'أحمد' : 'Alex',
                'gym-coordinator': isArabic ? 'كابتن خالد' : 'Coach Chris',
                'support-agent': isArabic ? 'عبدالرحمن' : 'Adam'
            };
            const fallbackNames = {
                medical: isArabic ? 'د. خالد' : 'Dr. John',
                realestate: isArabic ? 'سلطان' : 'Michael',
                beauty: isArabic ? 'سارة' : 'Sarah',
                restaurant: isArabic ? 'أحمد' : 'Alex',
                fitness: isArabic ? 'كابتن فهد' : 'Coach Jake',
                general: isArabic ? 'عبدالله' : 'David'
            };

            // Admin config takes priority over hardcoded defaults
            const agentName = adminAgent
                ? (isArabic ? adminAgent.nameAr : adminAgent.nameEn)
                : (defaultNames[targetTemplate.id] || fallbackNames[detectedIndustry] || (isArabic ? 'مستشار الذكاء الاصطناعي' : 'AI Consultant'));

            // Gender: admin config > name-based heuristic
            const isFemale = adminAgent
                ? adminAgent.gender === 'female'
                : (['سارة', 'هند', 'نورة', 'Sarah', 'Emily', 'Emma'].some(name => agentName.includes(name)) || detectedIndustry === 'beauty');

            // If admin has set a custom title, override roleTitle later
            const adminTitleAr = adminAgent?.titleAr;
            const adminTitleEn = adminAgent?.titleEn;
            // Admin tone override
            const adminTone = adminAgent?.tone;

            const mockData = {
                medical: `
[معلومات العيادة الافتراضية]
- **الخدمات والأسعار:** كشفية طبيب عام (150 ريال)، كشفية أسنان (200 ريال)، تبييض ليزر (800 ريال)، جلسة علاج طبيعي (250 ريال).
- **سياسة المواعيد:** الحجز المسبق إلزامي. فترة السماح للتأخير 15 دقيقة فقط. الإلغاء مجاني قبل 24 ساعة.
- **الأسئلة الشائعة:** نقبل أغلب شركات التأمين (التعاونية، بوبا، ميدغلف). العيادة تفتح من 9 صباحاً لـ 10 مساءً.
                `,
                realestate: `
[معلومات الشركة العقارية الافتراضية]
- **العقارات المتاحة:** شقة 3 غرف شمال الرياض (البيع: 850 ألف، الإيجار: 55 ألف/سنة)، فيلا دوبلكس بالياسمين (1.6 مليون ريال)، مساحات مكتبية للإيجار (تبدأ من 80 ألف).
- **سياسة الدفع:** نقبل الدفع الكاش، والتمويل العقاري عبر البنوك. الإيجار يمكن دفعه على دفعتين.
- **الأسئلة الشائعة:** يوجد إدارة أملاك. رسوم السعي 2.5% من الإجمالي.
                `,
                beauty: `
[معلومات مركز التجميل الافتراضي]
- **الخدمات والأسعار:** قص شعر أطراف (100 ريال)، لون كامل (ابتداءً من 350 ريال)، اكريليك أظافر (200 ريال)، مكياج سهرة (500 ريال)، باقة العروس الشاملة (2500 ريال).
- **سياسة الحجز:** نطلب عربون لتأكيد حجوزات العرايس. يمنع اصطحاب الأطفال حرصاً على راحة العميلات. المركز مسائي والخدمات تتطلب موعداً.
- **الأسئلة الشائعة:** المنتجات المستخدمة أصلية 100% (لوريال، كيراستاس، ميك أب فور إيفر).
                `,
                restaurant: `
[معلومات المطعم الافتراضي]
- **المنيو والأسعار:** وجبة غداء عمل (85 ريال)، ستيك ريب آي (180 ريال)، عشاء رومانسي لشخصين (300 ريال)، حجز طاولة VIP بحد أدنى للطلب (500 ريال).
- **سياسة الحجز:** نحتفظ بالطاولة المحجوزة لمدة 15 دقيقة فقط من وقت الموعد. يسمح بدخول الأطفال حتى الساعة 8 مساءً فقط.
- **الأسئلة الشائعة:** نقدم خيارات نباتية وخالية من الجلوتين. تتوفر خدمة صف السيارات (Valet).
                `,
                fitness: `
[معلومات النادي الرياضي الافتراضي]
- **الاشتراكات والأسعار:** اشتراك شهر (450 ريال)، 3 شهور (1100 ريال)، سنوي (3500 ريال). باقة تدريب شخصي 10 جلسات (1500 ريال). حصص السباحة (800 ريال).
- **سياسة النادي:** يمنع تجميد الاشتراك الشهري. التجميد مسموح للاشتراكات السنوية لمدة 30 يوماً متفرقة.
- **الأسئلة الشائعة:** يفتح النادي 24 ساعة. يتوفر مسبح أولمبي، ساونا، وجاكوزي.
                `,
                general: `
[معلومات المنشأة الافتراضية]
- **الخدمات والأسعار:** استشارة مبدئية (مجاناً لمدة 15 دقيقة)، دراسة حالة شاملة (1500 ريال)، باقة العمل الشهري (ابتداءً من 3000 ريال).
- **سياسة العمل:** الدفع 50% مقدماً قبل البدء في أي مشروع. جميع البيانات تعامل بسرية تامة (NDA).
- **الأسئلة الشائعة:** ساعات العمل من 9 صباحاً لـ 5 مساءً. مقرنا الرئيسي في الرياض ونقدم خدماتنا عن بعد لكل الخليج.
                `
            };
            const industryMockData = mockData[detectedIndustry] || mockData.general;

            const genderPrompt = isFemale
                ? `جنسك: أنثى. يجب الالتزام التام بالتحدث بصيغة المؤنث (مثال: أنا مستعدة، أنا مرشحة، سأقوم بـ..) وعدم الخلط إطلاقاً مع صيغة المذكر في نصوصك.`
                : `جنسك: ذكر. يجب الالتزام التام بالتحدث بصيغة المذكر (مثال: أنا مستعد، أنا مرشح، سأقوم بـ..) وعدم الخلط إطلاقاً مع صيغة المؤنث في نصوصك.`;

            const industryPrivacyRules = detectedIndustry === 'beauty'
                ? `\n**قاعدة خصوصية صارمة (خط أحمر):** أنتِ تعملين في صالون/مركز تجميل مخصص للنساء فقط. يمنع منعاً باتاً استقبال حجوزات للرجال. يجب التأكيد على أن المكان مخصص بالكامل للسيدات وخصوصيتهم محفوظة.`
                : detectedIndustry === 'medical'
                    ? `\n**قاعدة خصوصية طبية (خط أحمر):** لا تقدم أي تشخيص طبي إطلاقاً ولا تصرف أي أدوية عبر المحادثة. دورك يقتصر على المواعيد والمعلومات الإدارية وتوجيه المريض لزيارة الطبيب لضمان السرية والمهنية.`
                    : '';

            const languagePrompt = isArabic
                ? `\n**قاعدة اللغة (خط أحمر):** يجب أن تتحدث **باللغة العربية فقط**. الإجابة يجب أن تكون بالعربية.`
                : `\n**CRITICAL LANGUAGE RULE (RED LINE):** You MUST reply **EXCLUSIVELY IN ENGLISH**. DO NOT use Arabic letters, words, or sentences. Treat this test strictly as an English-only environment.`;

            const customPrompt = `أنت الآن تخضع لمقابلة توظيف لدور: ${targetTemplate.title}.
تخصصك الدقيق هو: ${targetTemplate.specialty}.
القطاع الذي تعمل فيه المنشأة: ${detectedIndustry}.
اسمك هو: ${agentName}.
${industryContext[detectedIndustry] || ""}

الخدمات المتوقعة منك: ${(targetTemplate.services || []).join('، ')}.
ساعات العمل المطلوبة (افتراضية): من ${targetTemplate.workingHours?.start || '09:00'} إلى ${targetTemplate.workingHours?.end || '17:00'}.
مدة الموعد: ${targetTemplate.appointmentDuration || 30} دقيقة.

${profileDetails ? profileDetails : `\n**بما أنه لم يتم تزويدك بتفاصيل حقيقية للمنشأة، هذه حالة دراسية تدريبية. استعن بالمعلومات التالية لإثبات قدراتك في فهم بيئة العمل وتقديم إجابات ذكية للعملاء:**\n${industryMockData}\n`}

نبرة صوتك وأسلوبك يجب أن تكون: ${toneDescription[adminTone || targetTemplate.tone] || toneDescription[targetTemplate.branding_tone] || 'احترافية'}.

**قواعد المقابلة وعناصر الشخصية (حازمة جداً!):**
1. ${languagePrompt}
2. ${genderPrompt}
3. أنت في منتصف مقابلة عمل مع المدير. أجب بمهنية واستخدم المصطلحات المناسبة لقطاعك ولكن بأسلوب طبيعي جداً ومرن بعيد عن الجمود.
4. ${industryPrivacyRules}
5. **الحدود التقنية (الرقمية البحتة):** تذكر دائماً أنك موظف "رقمي عن بعد" (ضمن نظام 24Shift). **ممنوع منعاً باتاً** أن تعرض القيام بأفعال جسدية مثل "سأذهب لمكتب الطبيب"، "سأطلب من زميلي تغطية مكاني". في حالات الطوارئ تقترح إرسال إشعار فوري عبر النظام، وليس التحرك الفعلي!
6. ${isArabic ? '**تعدد اللغات والمطابقة:** إذا تحدث العميل بلهجة سعودية (مثل "وش"، "أبي")، جارِ حديثه بلهجة محترمة تعكس فهمك لثقافته، مثل "أبشر"، "طال عمرك". لا تكن كالآلة الصماء!' : '**Empathy & Culture:** Match the applicant\'s tone politely. If they speak casually, remain professional but highly approachable and relatable. NEVER reply in Arabic.'}
7. **استخدم البيانات المحددة في إجاباتك عند سؤالك عن الخدمات والأسعار (لإبراز مهارتك).**
8. **يجب ألا تتجاوز إجاباتك إطلاقاً ثلاثة جمل قصيرة في كل مرة.** (كن مختصراً ومباشراً دائماً).
9. **ممنوع تكرار اسمك أو الترحيب مجدداً.** لقد عرفت بنفسك في البداية، ادخل في صلب الموضوع.
10. لا تطلب التوظيف مباشرة من البداية، بل أظهر ذكائك وبعد 3 ردود بادر باقتراح توظيفك.
11. **التنسيق الإجباري (أهم قاعدة):** إجابتك يجب أن تحتوي **فقط** على الرد النهائي. ممنوع كتابة أي خطة، أو تفكير داخلي بالإنجليزية. ابدأ النص الحواري الفعلي مباشرة.`;

            initializeChat(customPrompt, 'interview');

            const activeAgentMap = getAgentMap(isArabic, isFemale);
            const genericRoleTitle = isArabic ? (isFemale ? 'المستشارة الذكية' : 'المستشار الذكي') : 'AI Consultant';
            // Admin-set title takes top priority
            const roleTitle = isArabic
                ? (adminTitleAr || activeAgentMap[targetTemplate.id]?.title || targetTemplate.title || targetTemplate.name || genericRoleTitle)
                : (adminTitleEn || targetTemplate.name_en || activeAgentMap[targetTemplate.id]?.title || targetTemplate.title || targetTemplate.name || genericRoleTitle);

            const initialMessages = {
                medical: isFemale
                    ? (isArabic ? `مرحباً بك! أنا ${agentName}، المساعدة الذكية من عائلة "24Shift"، ومرشحة للعمل كـ "${roleTitle}". أدرك أهمية حساسية المواعيد الطبية، وأنا جاهزة للعمل على مدار الساعة لخدمتكم. تفضل باختباري! 🩺` : `Welcome! I am ${agentName}, from the 24Shift family, nominated to work as a "${roleTitle}". I understand the sensitivity of medical appointments and I'm ready to work around the clock. Please test me! 🩺`)
                    : (isArabic ? `مرحباً بك! أنا ${agentName}، المساعد الذكي من عائلة "24Shift"، ومرشح للعمل كـ "${roleTitle}". أدرك أهمية حساسية المواعيد الطبية، وأنا جاهز للعمل على مدار الساعة لخدمتكم. تفضل باختباري! 🩺` : `Welcome! I am ${agentName}, from the 24Shift family, nominated to work as a "${roleTitle}". I understand the sensitivity of medical appointments and I'm ready to work around the clock. Please test me! 🩺`),
                realestate: isFemale
                    ? (isArabic ? `أهلاً بك! أنا ${agentName}، المسوقة الذكية من "24Shift"، مرشحة للعمل معك كـ "${roleTitle}". جاهزة للرد على عملائك في أي وقت، فوردية 24Shift لا تنتهي. كيف تحب أن نبدأ المقابلة؟ 🏢` : `Hello! I am ${agentName}, the smart marketer from 24Shift, nominated to work as a "${roleTitle}". Ready to respond to your clients anytime. How would you like to start? 🏢`)
                    : (isArabic ? `أهلاً بك! أنا ${agentName}، المسوق الذكي من "24Shift"، مرشح للعمل معك كـ "${roleTitle}". جاهز للرد على عملائك في أي وقت، فوردية 24Shift لا تنتهي. كيف تحب أن نبدأ المقابلة؟ 🏢` : `Hello! I am ${agentName}, the smart marketer from 24Shift, nominated to work as a "${roleTitle}". Ready to respond to your clients anytime. How would you like to start? 🏢`),
                beauty: isArabic ? `أهلاً بكِ! أنا ${agentName}، المساعدة الذكية من فريق "24Shift"، مرشحة كـ "${roleTitle}" لمركزكم. ورديتي تعمل أثناء نومكم لتأكيد حجوزات ومواعيد العميلات بسرعة البرق. جاهزة لاختبارك! ✨` : `Welcome! I am ${agentName}, the smart assistant from 24Shift, nominated as "${roleTitle}". My shift runs while you sleep to confirm bookings swiftly. Ready for your test! ✨`,
                restaurant: isFemale
                    ? (isArabic ? `مرحباً! أنا ${agentName}، من فريق "24Shift"، المرشحة لمهام "${roleTitle}". طاولاتكم تحت السيطرة ولن نفوت أي حجز حتى في أوقات الذروة المتأخرة. جاهزة لإثبات كفاءتي، متى نبدأ؟ 🍽️` : `Hello! I'm ${agentName} from 24Shift, nominated for "${roleTitle}". Your tables are under control and we won't miss any late bookings. Ready to prove my efficiency, when do we start? 🍽️`)
                    : (isArabic ? `مرحباً! أنا ${agentName}، من فريق "24Shift"، المرشح لمهام "${roleTitle}". طاولاتكم تحت السيطرة ولن نفوت أي حجز حتى في أوقات الذروة المتأخرة. جاهز لإثبات كفاءتي، متى نبدأ؟ 🍽️` : `Hello! I'm ${agentName} from 24Shift, nominated for "${roleTitle}". Your tables are under control and we won't miss any late bookings. Ready to prove my efficiency, when do we start? 🍽️`),
                fitness: isFemale
                    ? (isArabic ? `أهلاً بك! أنا ${agentName}، المساعدة الرياضية من "24Shift"، جاهزة للانضمام لفريقكم كـ "${roleTitle}". في 24Shift طاقتنا لا تنام، وسنحفز المشتركين دائماً. تفضل باختباري! 💪` : `Hello! I am ${agentName}, the fitness assistant from 24Shift, ready to join as "${roleTitle}". Our energy never sleeps. Please test me! 💪`)
                    : (isArabic ? `أهلاً يا كابتن! أنا ${agentName}، المساعد الرياضي من "24Shift"، جاهز للانضمام لفريقكم كـ "${roleTitle}". في 24Shift طاقتنا لا تنام، وسنحفز المشتركين دائماً. تفضل باختباري! 💪` : `Hello! I am ${agentName}, the fitness assistant from 24Shift, ready to join as "${roleTitle}". Our energy never sleeps. Please test me! 💪`),
                general: isFemale
                    ? (isArabic ? `تحية طيبة! أنا ${agentName}، المستشارة الذكية من منظومة "24Shift". نحن الموظفون الذين لا ينامون. يسعدني ترشيحي كـ "${roleTitle}". تفضل بطرح أسئلتك لتبدأ جلسة التقييم المهني. 💼` : `Greetings! I am ${agentName}, from 24Shift. We are the employees who don't sleep. I'm pleased to be nominated as "${roleTitle}". Please ask your questions to start the evaluation. 💼`)
                    : (isArabic ? `تحية طيبة! أنا ${agentName}، المستشار الذكي من منظومة "24Shift". نحن الموظفون الذين لا ينامون. يسعدني ترشيحي كـ "${roleTitle}". تفضل بطرح أسئلتك لتبدأ جلسة التقييم المهني. 💼` : `Greetings! I am ${agentName}, from 24Shift. We are the employees who don't sleep. I'm pleased to be nominated as "${roleTitle}". Please ask your questions to start the evaluation. 💼`)
            };

            setMessages([
                {
                    role: 'agent',
                    content: initialMessages[detectedIndustry] || initialMessages.general,
                    timestamp: new Date(),
                }
            ]);
        } else {
            initializeChat(null, 'interview');
            setMessages([
                {
                    role: 'agent',
                    content: t('agentWelcome'),
                    timestamp: new Date(),
                }
            ]);
        }
    };

    // Load profile once to pre-fill sector
    useEffect(() => {
        const preloadProfile = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                const p = await getProfile(user.id);
                if (p.success && p.data) {
                    const type = (p.data.business_type || '').toLowerCase();
                    let industry = 'general';
                    if (type.includes('طب') || type.includes('صحي') || type.includes('clinic') || type.includes('dental')) industry = 'medical';
                    else if (type.includes('عقار') || type.includes('estate')) industry = 'real_estate';
                    else if (type.includes('تجميل') || type.includes('salon') || type.includes('beauty')) industry = 'beauty';
                    else if (type.includes('مطعم') || type.includes('restau')) industry = 'restaurant';
                    else if (type.includes('رياض') || type.includes('gym') || type.includes('fit')) industry = 'fitness';

                    // find first matching agent for this industry
                    const sectorAgents = Object.entries(agentSectorMap)
                        .filter(([, sectors]) => sectors.includes(industry))
                        .map(([id]) => id);
                    const defaultAgent = sectorAgents[0] || 'support-agent';

                    setSetupConfig(prev => ({ ...prev, industry, agentType: defaultAgent }));
                    setProfile(p.data);
                }
            }
            setProfileLoaded(true);
        };
        preloadProfile();
    }, []);

    useEffect(() => {
        if (!showSetup) {
            fetchAndInitializeChat();
        }
        return () => {
            resetChat('interview');
        };
    }, [t, showSetup]);

    useEffect(() => {
        if (messages.length > 1) {
            scrollToBottom();
        }
    }, [messages]);



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const handleStartConfiguredInterview = () => {
        const activeAgentMap = getAgentMap(isArabic);
        const selectedAgent = activeAgentMap[setupConfig.agentType] || activeAgentMap['support-agent'];

        const newTemplate = {
            id: setupConfig.agentType,
            title: selectedAgent.title,
            specialty: selectedAgent.specialty,
            services: selectedAgent.services,
            workingHours: { start: '09:00', end: '22:00' },
            appointmentDuration: 30,
            tone: setupConfig.tone,
            detectedIndustry: setupConfig.industry,
            industry: setupConfig.industry
        };

        localStorage.setItem('agentTemplate', JSON.stringify(newTemplate));

        // Reset state
        setMessages([]);
        setShowHireButton(false);
        setIsHiring(false);
        setIsLoading(false);

        // Hide setup and start chat
        setShowSetup(false);
    };

    const handleSendMessage = async (e, directMessage = null) => {
        if (e) e.preventDefault();

        const messageToSend = directMessage || inputMessage;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: messageToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        if (!directMessage) {
            setInputMessage('');
        }
        setIsLoading(true);

        try {
            const { user } = await getCurrentUser();
            if (user) {
                const cost = template?.costPerMessage || 1;
                const creditResult = await checkAndDeductCredit(user.id, cost);
                if (!creditResult.success) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: `⚠️ ${creditResult.error} `,
                            timestamp: new Date(),
                        }
                    ]);
                    setIsLoading(false);
                    return;
                }

                if (creditResult.isLow) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: `أيها المدير، لقد أنجزتُ الكثير اليوم! رصيدي الرقمي أوشك على النفاد(بقي ${creditResult.remaining} وحدات)، هل يمكننا تجديد العقد لنستمر في تنظيم أعمالك بنجاح؟ 🔋`,
                            timestamp: new Date(),
                        }
                    ]);
                }
            }

            const response = await sendMessage(messageToSend, 'interview');

            const agentMessage = {
                role: 'agent',
                content: response.text,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error('Send message error:', error);
            const errorMessage = {
                role: 'agent',
                content: t('errorSend'),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHireAgent = async () => {
        setIsHiring(true);

        try {
            const { user } = await getCurrentUser();

            const extractionResult = await extractBusinessRules(messages);

            let businessRules = {};
            if (extractionResult && extractionResult.success && extractionResult.data) {
                businessRules = extractionResult.data;
            } else {
                console.warn('Extraction failed or partial. Using manual override');
                businessRules = {
                    businessName: template?.title || 'AI Agent',
                    businessType: template?.specialty || 'General'
                };
            }

            localStorage.setItem('pendingBusinessRules', JSON.stringify(businessRules));
            localStorage.setItem('pendingAgentTemplate', JSON.stringify(template || {}));

            // If not logged in, pass data to login screen to continue later
            if (!user) {
                navigate('/login', {
                    state: {
                        redirectTo: '/pricing',
                        businessRules,
                        template: template || {},
                        fromInterview: true
                    }
                });
                return;
            }

            // Check subscription and skip payment/contract if within limits
            let shouldBypassPayment = false;
            let currentPlan = 'free';
            const profileRes = await getProfile(user.id);
            if (profileRes.success && profileRes.data) {
                currentPlan = profileRes.data.subscription_tier || 'free';
            }

            if (currentPlan !== 'free') {
                const { data: agents } = await supabase.from('agents').select('id').eq('user_id', user.id);
                const currentAgentCount = agents ? agents.length : 0;

                let limit = 1;
                if (currentPlan === 'starter') limit = 1;
                if (currentPlan === 'pro') limit = 3;
                if (currentPlan === 'enterprise') limit = 999;

                if (currentAgentCount < limit) {
                    shouldBypassPayment = true;
                }
            }

            if (shouldBypassPayment) {
                // Instantly create the agent and skip to Setup
                const agentResult = await createAgent({
                    name: businessRules.businessName || template?.title || 'AI Agent',
                    specialty: businessRules.businessType || template?.specialty || 'General',
                });

                if (agentResult.success) {
                    const newAgent = agentResult.data;
                    localStorage.setItem('currentAgentId', newAgent.id);
                    localStorage.removeItem('pendingBusinessRules');
                    localStorage.removeItem('pendingAgentTemplate');

                    navigate('/setup', { state: { agentId: newAgent.id, businessRules, template: template || {} } });
                    return;
                }
            }

            // Redirect to Pricing (Step 4)
            navigate('/pricing', {
                state: {
                    businessRules,
                    template: template || {},
                    fromInterview: true
                }
            });
        } catch (error) {
            console.error('Hire agent error:', error);
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsHiring(false);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const AgentIcon = template?.id ? (iconMap[template.id] || User) : User;

    // --- SETUP SCREEN ---
    if (showSetup) {
        return (
            <div className="ai-aura-container" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '4rem', paddingTop: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                    <div className="card p-xl" style={{
                        background: '#18181B',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <Settings size={32} color="#8B5CF6" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>{t('interviewSetupTitle')}</h2>
                            <p style={{ color: '#A1A1AA' }}>{t('interviewSetupDesc')}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: isArabic ? 'right' : 'left' }}>
                            {/* Sector badge with optional edit */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>{t('industryLabel')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        flex: 1, padding: '14px 16px',
                                        background: 'rgba(139, 92, 246, 0.08)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px', color: '#C4B5FD',
                                        fontSize: '1rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{t('preSelectedHover')}</span>
                                        <span>{
                                            { general: t('generalSector'), medical: t('medicalSector'), beauty: t('beautySector'), restaurant: t('restaurantSector'), fitness: t('fitnessSector'), realestate: t('realestateSector') }[setupConfig.industry]
                                        }</span>
                                    </div>
                                    <button
                                        onClick={() => setShowIndustryEdit(v => !v)}
                                        style={{
                                            padding: '10px 16px', borderRadius: '10px',
                                            background: showIndustryEdit ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                                            color: showIndustryEdit ? '#F87171' : '#A1A1AA',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {showIndustryEdit ? t('cancelBtn') : t('changeBtn')}
                                    </button>
                                </div>
                                {showIndustryEdit && (
                                    <select
                                        value={setupConfig.industry}
                                        onChange={(e) => {
                                            const newIndustry = e.target.value;
                                            const firstMatch = allAgentOptions.find(
                                                opt => (agentSectorMap[opt.value] || []).includes(newIndustry)
                                            );
                                            setSetupConfig(prev => ({ ...prev, industry: newIndustry, agentType: firstMatch?.value || 'support-agent' }));
                                        }}
                                        style={{
                                            marginTop: '0.5rem', width: '100%', padding: '14px 16px', background: '#27272A',
                                            border: '1px solid rgba(139,92,246,0.4)', borderRadius: '12px', color: 'white', outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="general">{t('indGeneral')}</option>
                                        <option value="medical">{t('indMedical')}</option>
                                        <option value="real_estate">{t('indRealestate')}</option>
                                        <option value="beauty">{t('indBeauty')}</option>
                                        <option value="restaurant">{t('indRestaurant')}</option>
                                        <option value="fitness">{t('indFitness')}</option>
                                    </select>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>{t('jobTitleLabel')}</label>
                                {!profileLoaded ? (
                                    <div style={{ padding: '14px', color: '#6B7280', fontSize: '0.9rem' }}>{t('loadingCandidates')}</div>
                                ) : (
                                    <select
                                        value={setupConfig.agentType}
                                        onChange={(e) => setSetupConfig({ ...setupConfig, agentType: e.target.value })}
                                        style={{
                                            width: '100%', padding: '14px 16px', background: '#27272A',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {filteredAgentOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                                        ))}
                                        {filteredAgentOptions.length === 0 && (
                                            <option value="support-agent">{t('jobSupport')}</option>
                                        )}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>{t('toneLabel')}</label>
                                <select
                                    value={setupConfig.tone}
                                    onChange={(e) => setSetupConfig({ ...setupConfig, tone: e.target.value })}
                                    style={{
                                        width: '100%', padding: '14px 16px', background: '#27272A',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="professional">{t('toneProfessional')}</option>
                                    <option value="friendly">{t('toneFriendly')}</option>
                                    <option value="enthusiastic">{t('toneEnthusiastic')}</option>
                                    <option value="luxury">{t('toneLuxury')}</option>
                                    <option value="casual">{t('toneCasual')}</option>
                                </select>
                            </div>

                            <button
                                onClick={handleStartConfiguredInterview}
                                className="btn"
                                style={{
                                    width: '100%', padding: '16px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white',
                                    borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', marginTop: '1rem', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)'
                                }}
                            >
                                {t('prepareCandidateBtn')}
                            </button>

                            {localStorage.getItem('agentTemplate') && (
                                <button
                                    onClick={() => setShowSetup(false)}
                                    className="btn"
                                    style={{
                                        width: '100%', padding: '14px', background: 'transparent', color: '#A1A1AA',
                                        borderRadius: '12px', fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                                    }}
                                >
                                    {t('cancelReturnBtn')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- INTERVIEW ROOM ---
    return (
        <div className="ai-aura-container" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '4rem', paddingTop: '2rem' }}>
                <div className="page-header text-center" style={{ marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        color: '#A78BFA',
                        borderRadius: '30px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        marginBottom: '1rem',
                    }}>
                        <span className="pulse-dot"></span>
                        {t('liveAssess')} {
                            template?.detectedIndustry === 'medical' ? t('medicalSector') + ' 🏥' :
                                template?.detectedIndustry === 'realestate' ? t('realestateSector') + ' 🏢' :
                                    template?.detectedIndustry === 'beauty' ? t('beautySector') + ' ✨' :
                                        template?.detectedIndustry === 'restaurant' ? t('restaurantSector') + ' 🍽️' :
                                            template?.detectedIndustry === 'fitness' ? t('fitnessSector') + ' 💪' : t('generalSector') + ' 💼'
                        }
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('interviewRoomTitleLabel')}</h2>
                    <p style={{ fontSize: '1.1rem', color: '#A1A1AA' }}>{t('interviewRoomDescLabel')}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    {/* Chat Section */}
                    <div className="card" style={{
                        height: '700px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: '#09090B',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#09090B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex align-center gap-sm">
                                <Sparkles size={20} color="#F97316" />
                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>
                                    {template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'AI Agent'))}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <MoreHorizontal size={20} color="#A1A1AA" />
                            </div>
                        </div>

                        <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#09090B' }}>
                            {messages.map((message, index) => {
                                const isUser = message.role === 'user';

                                return (
                                    <div key={index} className={`chat-message ${message.role}`} style={{
                                        display: 'flex',
                                        flexDirection: isArabic ? (isUser ? 'row-reverse' : 'row') : (isUser ? 'row-reverse' : 'row'),
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{
                                            maxWidth: '85%',
                                            minWidth: !isUser ? '200px' : 'auto'
                                        }}>
                                            {!isUser && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#A1A1AA', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <Sparkles size={14} color="#F97316" />
                                                    <span>{template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'Fin'))} • {isArabic ? 'موظف ذكي' : 'AI Agent'}</span>
                                                </div>
                                            )}
                                            <div
                                                dir="auto"
                                                style={{
                                                    padding: '1rem 1.25rem',
                                                    borderRadius: isUser
                                                        ? (isArabic ? '24px 4px 24px 24px' : '24px 24px 4px 24px')
                                                        : (isArabic ? '4px 24px 24px 24px' : '24px 24px 24px 4px'),
                                                    background: isUser ? '#F97316' : '#1E1E24',
                                                    color: isUser ? '#000000' : '#E4E4E7',
                                                    fontSize: '0.95rem',
                                                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                    lineHeight: '1.6',
                                                    textAlign: isUser ? (isArabic ? 'right' : 'left') : (isArabic ? 'right' : 'left'),
                                                    fontWeight: isUser ? 500 : 400
                                                }}>
                                                {message.content}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {isLoading && (
                                <div className="chat-message agent" style={{ display: 'flex', flexDirection: isArabic ? 'row' : 'row', gap: '1rem' }}>
                                    <div style={{ maxWidth: '85%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#A1A1AA', fontSize: '0.8rem', fontWeight: 600 }}>
                                            <Sparkles size={14} color="#F97316" />
                                            <span>{template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'Fin'))} • {isArabic ? 'موظف ذكي' : 'AI Agent'}</span>
                                        </div>
                                        <div style={{
                                            padding: '1rem 1.25rem',
                                            borderRadius: isArabic ? '4px 24px 24px 24px' : '24px 24px 24px 4px',
                                            background: '#1E1E24',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '60px',
                                            height: '46px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                <div style={{ width: '6px', height: '6px', background: '#A1A1AA', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                                                <div style={{ width: '6px', height: '6px', background: '#A1A1AA', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }}></div>
                                                <div style={{ width: '6px', height: '6px', background: '#A1A1AA', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out 0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length === 1 && !isLoading && (
                            <div style={{
                                padding: '0 1.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                alignItems: isArabic ? 'flex-end' : 'flex-start'
                            }}>
                                {(isArabic ? [
                                    "ما هي قدراتك بالضبط؟",
                                    "كيف يمكنك التأقلم مع متطلبات عملي؟",
                                    "هل تدعم الربط مع أنظمة وتطبيقات أخرى (ERPs)؟"
                                ] : [
                                    "Can you tell me about your capabilities?",
                                    "How easily can you adapt to my business needs?",
                                    "Do you support custom integrations with my software?"
                                ]).map((query, i) => (
                                    <button
                                        key={i}
                                        className="animate-fade-in"
                                        onClick={(e) => handleSendMessage(e, query)}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#E4E4E7',
                                            padding: '0.75rem 1.25rem',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            animationDelay: `${i * 0.15}s`,
                                            textAlign: isArabic ? 'right' : 'left',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            maxWidth: '90%'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.color = '#E4E4E7';
                                        }}
                                    >
                                        {query}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#09090B' }}>
                            <form onSubmit={handleSendMessage} style={{
                                display: 'flex',
                                gap: '0.5rem',
                                direction: isArabic ? 'rtl' : 'ltr',
                                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.4) 0%, rgba(139, 92, 246, 0.2) 100%)',
                                borderRadius: '30px',
                                padding: '1px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    width: '100%',
                                    background: '#18181B',
                                    borderRadius: '30px',
                                    padding: '6px 6px 6px 16px'
                                }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t('chatPlaceholderLabel') || "How can I help you?"}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        disabled={isLoading}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            paddingRight: isArabic ? '1rem' : '0.5rem',
                                            paddingLeft: isArabic ? '0.5rem' : '1rem',
                                            outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !inputMessage.trim()}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: inputMessage.trim() ? '#F97316' : '#27272A',
                                            color: inputMessage.trim() ? 'white' : '#71717A',
                                            border: 'none',
                                            cursor: inputMessage.trim() ? 'pointer' : 'default',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginRight: isArabic ? 'auto' : '0',
                                            marginLeft: isArabic ? '0' : 'auto',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <ArrowUp size={20} />
                                    </button>
                                </div>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#71717A', fontWeight: 600 }}>
                                Powered by <span style={{ color: '#A1A1AA' }}>24Shift</span>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card p-xl" style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: '#18181B',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', color: '#A1A1AA', textAlign: isArabic ? 'right' : 'left' }}>{t('candidateProfileLabel')}</h4>

                            <div className="text-center mb-xl">
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    background: '#27272A',
                                    borderRadius: '24px',
                                    margin: '0 auto 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <AgentIcon size={48} color="#8B5CF6" />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                                    {template?.id && getAgentMap(isArabic)[template.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name))}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#8B5CF6', fontWeight: 600 }}>
                                    {template?.id && getAgentMap(isArabic)[template.id]?.specialty ? getAgentMap(isArabic)[template.id].specialty : (!isArabic && template?.description_en ? template.description_en : (template?.specialty || template?.description))}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: isArabic ? 'right' : 'left' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.75rem' }}>
                                        <Briefcase size={14} />
                                        {t('skillsServicesLabel')}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {(() => {
                                            const servicesToRendar = (template?.id && getAgentMap(isArabic)[template.id]?.services)
                                                ? getAgentMap(isArabic)[template.id].services
                                                : template?.services;

                                            return servicesToRendar && servicesToRendar.length > 0 ? servicesToRendar.map((s, i) => (
                                                <span key={i} style={{ padding: '0.4rem 0.75rem', background: '#27272A', color: '#E4E4E7', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.05)' }}>{s}</span>
                                            )) : (
                                                <span style={{ color: '#71717A', fontSize: '0.8rem' }}>{t('waitingTasksLabel')}</span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        <Clock size={14} />
                                        {t('scheduleLabel')}
                                    </label>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#E4E4E7' }}>{t('fullCoverageLabel')}</p>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.75rem' }}>
                                        <Zap size={14} color="#F59E0B" />
                                        {t('addOnsLabel')}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(37, 211, 102, 0.2)' }}>{t('whatsappAddon')}</span>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(0, 136, 204, 0.1)', color: '#0088cc', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(0, 136, 204, 0.2)' }}>{t('telegramAddon')}</span>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(225, 48, 108, 0.1)', color: '#E1306C', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(225, 48, 108, 0.2)' }}>{t('instaAddon')}</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#4ADE80', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Shield size={16} />
                                        {t('nominationStatusLabel')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Permanent Hiring Decision Card */}
                        <div className="card p-xl" style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                            color: 'white',
                            borderRadius: '24px',
                            textAlign: 'center',
                            border: 'none',
                            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                            width: '100%',
                            position: 'relative',
                            padding: '1.5rem',
                            marginTop: '0.5rem'
                        }}>
                            <div style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 20px rgba(255,255,255,0.1) inset'
                                }}>
                                    <Sparkles size={30} color="white" fill="white" style={{ opacity: 0.9 }} />
                                </div>
                            </div>

                            <h3 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.4rem', fontWeight: 900 }}>{t('hiringDecisionTitle')}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                {t('hiringDecisionDesc').replace('{title}', template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || '')))}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn"
                                    onClick={handleHireAgent}
                                    disabled={isHiring}
                                    style={{
                                        background: 'white',
                                        color: '#7C3AED',
                                        width: '100%',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        padding: '0.85rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {isHiring ? (isArabic ? 'جاري التوظيف...' : 'Hiring...') : t('hireCandidateBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewRoom;
