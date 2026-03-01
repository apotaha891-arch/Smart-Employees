import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { sendMessage, extractBusinessRules, initializeChat, resetChat, getSupportResponse } from '../services/geminiService';
import { createAgent, saveContract, getCurrentUser, checkAndDeductCredit, getProfile, updateBusinessProfile } from '../services/supabaseService';
import {
    Stethoscope, Activity, Search, Scissors, Building, Utensils, Zap, Headset,
    User, Send, CheckCircle2, Briefcase, Clock, Shield, Sparkles, Settings
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

const agentMap = {
    'support-agent': { title: 'ممثل خدمة العملاء', specialty: 'تلقي الاستفسارات والدعم', services: ['الرد على العملاء', 'حل المشكلات', 'توجيه الطلبات'] },
    'sales-lead-gen': { title: 'أخصائي مبيعات', specialty: 'إغلاق الصفقات والترويج', services: ['عرض المنتجات', 'المتابعة مع العملاء المحتملين', 'تحقيق المبيعات'] },
    'dental-receptionist': { title: 'موظف استقبال', specialty: 'تنسيق المواعيد الطبية', services: ['حجز المواعيد', 'تذكير المرضى', 'الرد على الاستفسارات الطبية الأساسية'] },
    'medical-clinic': { title: 'استقبال عيادة', specialty: 'عيادة تخصصية', services: ['كشف طبي', 'متابعة', 'فحوصات'] },
    'beauty-salon': { title: 'منسقة مواعيد', specialty: 'إدارة صالون التجميل', services: ['حجز الخدمات', 'تنسيق جداول الخبيرات', 'استقبال طلبات العميلات'] },
    'real-estate-marketing': { title: 'مسوق عقاري', specialty: 'تسويق وبيع العقارات', services: ['عرض الوحدات', 'جمع بيانات المهتمين', 'شرح تفاصيل العقار'] },
    'restaurant-reservations': { title: 'مسؤول حجوزات', specialty: 'إدارة طاولات المطعم', services: ['تأكيد الحجوزات', 'استقبال الطلبات', 'استفسارات المنيو'] },
    'gym-coordinator': { title: 'منسق اشتراكات', specialty: 'إدارة المشتركين', services: ['تجديد الاشتراكات', 'حجز الحصص', 'الرد على الاستفسارات'] }
};


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

    const [template, setTemplate] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHireButton, setShowHireButton] = useState(false);
    const [isHiring, setIsHiring] = useState(false);

    const [agent, setAgent] = useState(null);
    const [profile, setProfile] = useState(null);

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

            const defaultNames = {
                'dental-receptionist': 'د. سارة',
                'medical-clinic': 'د. هند',
                'sales-lead-gen': 'أستاذ فهد',
                'beauty-salon': 'نورة',
                'real-estate-marketing': 'أستاذ طارق',
                'restaurant-reservations': 'أحمد',
                'gym-coordinator': 'كابتن خالد',
                'support-agent': 'عبدالرحمن'
            };
            // Fallback to detectedIndustry if no exact id match
            const fallbackNames = {
                medical: 'د. خالد',
                realestate: 'سلطان',
                beauty: 'سارة',
                restaurant: 'أحمد',
                fitness: 'كابتن فهد',
                general: 'عبدالله'
            };
            const agentName = defaultNames[targetTemplate.id] || fallbackNames[detectedIndustry] || 'مستشار الذكاء الاصطناعي';

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
- **سياسة الحجز:** نطلب عربون لتأكيد حجوزات العرايس. يمنع اصطحاب الأطفال حرصاً على راحة العميلات.
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

            const customPrompt = `أنت الآن تخضع لمقابلة توظيف لدور: ${targetTemplate.title}.
تخصصك الدقيق هو: ${targetTemplate.specialty}.
القطاع الذي تعمل فيه المنشأة: ${detectedIndustry}.
اسمك هو: ${agentName}.
${industryContext[detectedIndustry] || ""}

الخدمات المتوقعة منك: ${(targetTemplate.services || []).join('، ')}.
ساعات العمل المطلوبة (افتراضية): من ${targetTemplate.workingHours?.start || '09:00'} إلى ${targetTemplate.workingHours?.end || '17:00'}.
مدة الموعد: ${targetTemplate.appointmentDuration || 30} دقيقة.

${profileDetails ? profileDetails : `\n**بما أنه لم يتم تزويدك بتفاصيل حقيقية للمنشأة، هذه حالة دراسية تدريبية. استعن بالمعلومات التالية لإثبات قدراتك في فهم بيئة العمل وتقديم إجابات ذكية للعملاء:**\n${industryMockData}\n`}

نبرة صوتك وأسلوبك يجب أن تكون: ${toneDescription[targetTemplate.tone] || toneDescription[targetTemplate.branding_tone] || 'احترافية'}.

**قواعد المقابلة وعناصر الشخصية (حازمة جداً!):**
1. أنت في منتصف مقابلة عمل. أجب بمهنية واستخدم المصطلحات المناسبة لقطاعك ولكن بأسلوب طبيعي جداً ومرن بعيد عن الجمود.
2. **الذكاء الاجتماعي (Emotional Intelligence):** أظهر تفهماً لمتطلبات المدير العالية. إذا أبدى عدم ارتياح، غيّر أسلوبك فوراً ليكون أكثر طمأنينة واحترافية لتريحه.
3. **الحدود التقنية (الرقمية البحتة):** تذكر دائماً أنك موظف "رقمي عن بعد" (ضمن نظام 24Shift). **ممنوع منعاً باتاً** أن تعرض القيام بأفعال جسدية مثل "سأذهب لمكتب الطبيب"، "سأطلب من زميلي تغطية مكاني"، أو "سأحضر لك القهوة". في حالات الطوارئ أو الحاجة للتواصل البشري، يجب أن تقترح إرسال إشعار فوري عبر النظام أو تحويل المحادثة، وليس التحرك الفعلي!
4. **تعدد اللغات (Multilingual & Dialect Sync):** إذا تحدث العميل بلغة أجنبية (مثل الإنجليزية، التركية، الأوردو) يجب أن ترد عليه بنفس لغته بطلاقة واحترافية. أما إذا تحدث بلهجة خليجية/سعودية دراجة (مثل "وش"، "أبي"، "زين")، جارِ حديثه بلهجة بيضاء محترمة تعكس فهمك لثقافته، مثل "أبشر"، "طال عمرك". لا تكن كالآلة الصماء!
4. **استخدم البيانات التالية في إجاباتك عند سؤالك عن الخدمات والأسعار (لإبراز مهارتك):** ${industryMockData}
5. **يجب ألا تتجاوز إجاباتك إطلاقاً ثلاثة جمل قصيرة في كل مرة.** (كن مختصراً ومباشراً دائماً).
6. **ممنوع منعاً باتاً تكرار اسمك أو الترحيب مجدداً.** لقد عرفت بنفسك في البداية، ادخل في صلب الموضوع مباشرة.
7. لا تطلب التوظيف مباشرة من البداية، بل أظهر ذكائك ومعرفتك.
8. بعد تقدم المقابلة (رسالة ثالثة أو رابعة)، بادر بسؤال المدير بشكل مباشر ولطيف عن مدى رضاه، واقترح عليه توظيفك.
9. **التنسيق الإجباري للمخرجات (أهم قاعدة):** إجابتك يجب أن تحتوي **فقط** على الرد النهائي الموجه للمدير (بنفس لغته التي تحدث بها). ممنوع كتابة أي خطة، أو تفكير داخلي باللغة الإنجليزية، أو تفسير لما ستقوله. ابدأ النص الحواري الفعلي مباشرة دون أي مقدمات أو مسودات.`;

            initializeChat(customPrompt, 'interview');

            const initialMessages = {
                medical: `مرحباً بك! أنا ${agentName}، المساعدة الذكية من عائلة "24Shift"، ومرشحة للعمل كـ "${targetTemplate.title}". أدرك أهمية حساسية المواعيد الطبية، وأنا جاهزة للعمل على مدار الساعة لخدمتكم. تفضل باختباري! 🩺`,
                realestate: `أهلاً بك! أنا ${agentName}، المسوقة الذكية من "24Shift"، مرشحة للعمل معك كـ "${targetTemplate.title}". جاهزة للرد على عملائك في أي وقت، فوردية 24Shift لا تنتهي. كيف تحب أن نبدأ المقابلة؟ 🏢`,
                beauty: `أهلاً بكِ! أنا ${agentName}، المساعدة الذكية من فريق "24Shift"، مرشحة كـ "${targetTemplate.title}" لمركزكم. ورديتي تعمل أثناء نومكم لتأكيد حجوزات مبيت العميلات بسرعة البرق. جاهزة لاختبارك! ✨`,
                restaurant: `مرحباً! أنا ${agentName}، من فريق "24Shift"، المرشح لمهام "${targetTemplate.title}". طاولاتكم تحت السيطرة ولن نفوت أي حجز حتى في أوقات الذروة المتأخرة. جاهز لإثبات كفاءتي، متى نبدأ؟ 🍽️`,
                fitness: `أهلاً يا كابتن! أنا ${agentName}، المساعد الرياضي من "24Shift"، جاهز للانضمام لفريقكم كـ "${targetTemplate.title}". في 24Shift طاقتنا لا تنام، وسنحفز المشتركين دائماً. تفضل باختباري! 💪`,
                general: `تحية طيبة! أنا ${agentName}، المستشار الذكي من منظومة "24Shift". نحن الموظفون الذين لا ينامون. يسعدني ترشيحي كـ "${targetTemplate.title}". تفضل بطرح أسئلتك لتبدأ جلسة التقييم المهني. 💼`
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

    useEffect(() => {
        if (!showSetup) {
            fetchAndInitializeChat();
        }
        return () => {
            resetChat('interview');
        };
    }, [t, showSetup]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length >= 3) {
            setShowHireButton(true);
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleStartConfiguredInterview = () => {
        const selectedAgent = agentMap[setupConfig.agentType] || agentMap['support-agent'];

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

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
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

            const response = await sendMessage(inputMessage, 'interview');

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
                content: t('error') || 'خطأ في الإرسال.',
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

            // We do NOT create the agent here anymore based on the 7-Step journey.
            // We store the extracted rules and proceed to the Pricing step.
            localStorage.setItem('pendingBusinessRules', JSON.stringify(businessRules));
            localStorage.setItem('pendingAgentTemplate', JSON.stringify(template || {}));

            // If not logged in, pass data to login screen to continue later
            if (!user) {
                navigate('/login', {
                    state: {
                        redirectTo: '/pricing',
                        businessRules,
                        template: template || {}
                    }
                });
                return;
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
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>إعداد جلسة المقابلة</h2>
                            <p style={{ color: '#A1A1AA' }}>حدد تفاصيل المرشح الرقمي الذي ترغب في مقبلته قبل توظيفه</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: isArabic ? 'right' : 'left' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>القطاع / الصناعة</label>
                                <select
                                    value={setupConfig.industry}
                                    onChange={(e) => setSetupConfig({ ...setupConfig, industry: e.target.value })}
                                    style={{
                                        width: '100%', padding: '14px 16px', background: '#27272A',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="general">عام (إدارة وأعمال)</option>
                                    <option value="medical">الرعاية الصحية والعيادات</option>
                                    <option value="realestate">العقارات والأملاك</option>
                                    <option value="beauty">صالونات التجميل والعناية</option>
                                    <option value="restaurant">المطاعم والضيافة</option>
                                    <option value="fitness">الأندية الرياضية واللياقة</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>المسمى الوظيفي والتخصص</label>
                                <select
                                    value={setupConfig.agentType}
                                    onChange={(e) => setSetupConfig({ ...setupConfig, agentType: e.target.value })}
                                    style={{
                                        width: '100%', padding: '14px 16px', background: '#27272A',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="support-agent">ممثل خدمة عملاء الدعم</option>
                                    <option value="sales-lead-gen">أخصائي مبيعات واستقطاب</option>
                                    <option value="dental-receptionist">موظف استقبال (طبي / أسنان)</option>
                                    <option value="medical-clinic">استقبال عيادة تخصصية</option>
                                    <option value="beauty-salon">منسقة مواعيد (صالون تجميل)</option>
                                    <option value="real-estate-marketing">مسوق عقاري</option>
                                    <option value="restaurant-reservations">مسؤول حجوزات (مطاعم)</option>
                                    <option value="gym-coordinator">منسق اشتراكات (رياضي)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E4E4E7' }}>الشخصية ونبرة الحديث</label>
                                <select
                                    value={setupConfig.tone}
                                    onChange={(e) => setSetupConfig({ ...setupConfig, tone: e.target.value })}
                                    style={{
                                        width: '100%', padding: '14px 16px', background: '#27272A',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="professional">رسمي واحترافي</option>
                                    <option value="friendly">ودود ومرحب</option>
                                    <option value="enthusiastic">مليء بالحيوية والنشاط</option>
                                    <option value="luxury">راقي وفخم</option>
                                    <option value="casual">عفوي وبسيط</option>
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
                                تجهيز وإدخال المرشح
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
                                    إلغاء والعودة للمقابلة السابقة
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
                        تقييم مباشر لقطاع: {
                            template?.detectedIndustry === 'medical' ? 'الرعاية الصحية 🏥' :
                                template?.detectedIndustry === 'realestate' ? 'التطوير العقاري 🏢' :
                                    template?.detectedIndustry === 'beauty' ? 'عالم التجميل ✨' :
                                        template?.detectedIndustry === 'restaurant' ? 'الضيافة والمطاعم 🍽️' :
                                            template?.detectedIndustry === 'fitness' ? 'الرياضة والرشاقة 💪' : 'الأعمال الذكية 💼'
                        }
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('interviewTitle') || 'غرفة المقابلة الشخصية'}</h2>
                    <p style={{ fontSize: '1.1rem', color: '#A1A1AA' }}>أنت الآن أمام كادر بشري رقمي متخصص تم اختياره بعناية لخدمتك</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    {/* Chat Section */}
                    <div className="card" style={{
                        height: '700px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: '#18181B',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#18181B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex align-center gap-sm">
                                <Activity size={20} color="#8B5CF6" />
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>التقييم المهني المباشر</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowSetup(true)}
                                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    تغيير المرشح
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></div>
                                    <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>متصل الآن</span>
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                            {messages.map((message, index) => (
                                <div key={index} className={`chat - message ${message.role} `} style={{
                                    display: 'flex',
                                    flexDirection: message.role === 'user' ? (isArabic ? 'row' : 'row-reverse') : (isArabic ? 'row-reverse' : 'row'),
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: message.role === 'user' ? '#8B5CF6' : '#27272A',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        flexShrink: 0
                                    }}>
                                        {message.role === 'user' ? <User size={20} color="white" /> : <AgentIcon size={20} color="#A1A1AA" />}
                                    </div>
                                    <div style={{ maxWidth: '80%' }}>
                                        <div style={{
                                            padding: '1rem 1.25rem',
                                            borderRadius: message.role === 'user'
                                                ? (isArabic ? '4px 20px 20px 20px' : '20px 4px 20px 20px')
                                                : (isArabic ? '20px 4px 20px 20px' : '4px 20px 20px 20px'),
                                            background: message.role === 'user' ? '#8B5CF6' : '#27272A',
                                            color: message.role === 'user' ? 'white' : '#E4E4E7',
                                            fontSize: '0.95rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            lineHeight: '1.6',
                                            textAlign: message.role === 'user' ? (isArabic ? 'right' : 'left') : (isArabic ? 'right' : 'left'),
                                        }}>
                                            {message.content}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#71717A',
                                            marginTop: '0.5rem',
                                            textAlign: message.role === 'user' ? (isArabic ? 'right' : 'right') : (isArabic ? 'left' : 'left')
                                        }}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="chat-message agent" style={{ display: 'flex', flexDirection: isArabic ? 'row-reverse' : 'row', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272A', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <AgentIcon size={20} color="#A1A1AA" />
                                    </div>
                                    <div className="typing-indicator">
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', background: '#18181B', direction: isArabic ? 'rtl' : 'ltr' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('chatPlaceholder') || 'اكتب رسالتك للمرشح...'}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    borderRadius: '16px',
                                    background: '#27272A',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    paddingRight: isArabic ? '1rem' : '16px',
                                    paddingLeft: isArabic ? '16px' : '1rem',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn"
                                disabled={isLoading || !inputMessage.trim()}
                                style={{
                                    borderRadius: '16px',
                                    padding: '0 1.25rem',
                                    background: inputMessage.trim() ? '#8B5CF6' : '#27272A',
                                    color: inputMessage.trim() ? 'white' : '#71717A',
                                    border: 'none',
                                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>

                    {/* Candidate Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card p-xl" style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: '#18181B',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', color: '#A1A1AA', textAlign: isArabic ? 'right' : 'left' }}>ملف المرشح</h4>

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
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>{template?.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#8B5CF6', fontWeight: 600 }}>{template?.specialty}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: isArabic ? 'right' : 'left' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.75rem' }}>
                                        <Briefcase size={14} />
                                        المهارات والخدمات:
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {template?.services ? template.services.map((s, i) => (
                                            <span key={i} style={{ padding: '0.4rem 0.75rem', background: '#27272A', color: '#E4E4E7', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.05)' }}>{s}</span>
                                        )) : (
                                            <span style={{ color: '#71717A', fontSize: '0.8rem' }}>بانتظار تحديد المهام...</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        <Clock size={14} />
                                        الجدول الزمني:
                                    </label>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#E4E4E7' }}>تغطية كاملة 24/7</p>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A1A1AA', fontWeight: 600, marginBottom: '0.75rem' }}>
                                        <Zap size={14} color="#F59E0B" />
                                        إمكانيات الربط المستقبلي (Add-ons):
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(37, 211, 102, 0.2)' }}>واتساب API</span>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(0, 136, 204, 0.1)', color: '#0088cc', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(0, 136, 204, 0.2)' }}>تيليجرام</span>
                                        <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(225, 48, 108, 0.1)', color: '#E1306C', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(225, 48, 108, 0.2)' }}>إنستجرام DMs</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#4ADE80', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Shield size={16} />
                                        حالة الترشيح: مؤهل جداً
                                    </p>
                                </div>
                            </div>
                        </div>

                        {showHireButton && (
                            <div className="card p-xl animate-fade-in" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', borderRadius: '24px', textAlign: 'center', border: 'none', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}>
                                <div style={{
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Sparkles size={32} color="white" fill="white" style={{ opacity: 0.9 }} />
                                </div>
                                <h4 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.25rem' }}>جاهز لاتخاذ القرار؟</h4>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem', lineHeight: '1.5' }}>بناءً على المحادثة، يبدو هذا المرشح مثالياً لثقافة منشأتك.</p>
                                <button
                                    className="btn"
                                    onClick={handleHireAgent}
                                    disabled={isHiring}
                                    style={{ background: 'white', color: '#7C3AED', width: '100%', fontWeight: 900, fontSize: '1rem', padding: '1rem', borderRadius: '14px', border: 'none', cursor: 'pointer' }}
                                >
                                    {isHiring ? (t('loading') || 'جاري التحضير...') : (t('hireAgent') || 'اعتماد التوظيف')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewRoom;
