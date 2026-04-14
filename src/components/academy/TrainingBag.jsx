import React, { useState, useEffect } from 'react';
import AcademyLayout from '../layouts/AcademyLayout';
import { useLanguage } from '../../LanguageContext';
import { 
    BookOpen, Video, FileText, CheckCircle2, Lock, Star, 
    PlayCircle, Trophy, Sparkles, Zap, Users, Globe, ArrowRight, ChevronLeft,
    Pointer, Rocket, Target, Award, Layers, Cpu, Share2, Info, ChevronRight,
    ArrowUpRight, ListChecks, MessageCircle, LayoutDashboard, MousePointer2,
    Settings, BrainCircuit, QrCode, PartyPopper, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';

const TrainingBag = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const { user, isAdmin } = useAuth();
    const [hasAccess, setHasAccess] = useState(isAdmin || false);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [currentStep, setCurrentStep] = useState({ stage: 0, lesson: 0 });

    useEffect(() => {
        const checkAccess = async () => {
            const isOwner = user?.email && ['tayaran442000@gmail.com', 'sabah@gajha.com'].includes(user.email);
            if (isAdmin || isOwner) { setHasAccess(true); setLoading(false); return; }
            if (!user?.id) { setLoading(false); return; }
            try {
                const { data } = await supabase.from('academy_access').select('*').eq('user_id', user.id).maybeSingle();
                if (data) setHasAccess(true);
                else {
                    const { data: leadData } = await supabase.from('academy_leads').select('status').eq('email', user.email).eq('status', 'paid').maybeSingle();
                    if (leadData) setHasAccess(true);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        checkAccess();
    }, [user?.id, user?.email, isAdmin]);

    const curriculum = [
        {
            stage: 1,
            title_ar: 'المرحلة 1: الرؤية الاقتصادية - عصر الموظف الرقمي',
            title_en: 'Stage 1: Economic Vision - The Era of Digital Employees',
            lessons: [
                {
                    title_ar: 'تحليل الأداء: كيف يوفر لك النظام 200 ساعة عمل شهرياً؟',
                    title_en: 'Performance Analysis: Saving 200 Work Hours Monthly',
                    summary_ar: 'فهم لغة الأرقام وكيفية قراءة العائد المباشر على الاستثمار من خلال لوحة التحكم.',
                    summary_en: 'Understanding the language of numbers and how to read direct ROI through the dashboard.',
                    material_ar: `في هذه الشاشة الافتتاحية، نركز على "القوة الكامنة" للأتمتة. انظر إلى عداد المحادثات (Dashboard Stats)؛ معالجة 1,420 محادثة لا يعني مجرد "رسائل"، بل يعني استبدال جهد بشري كان سيستغرق أسابيع من العمل المتواصل.
                    
                    التحليل العملي لهذه الواجهة:
                    - **المحادثات النشطة**: كل محادثة هي فرصة بيع محتملة تمت معالجتها بدقة 100% وبدون تعب أو تذمر.
                    - **الكيانات النشطة**: تعبر عن عدد الفروع أو المشاريع التي تديرها تحت مظلة واحدة، مما يمنحك نظرة "الصقر" على إمبراطوريتك الرقمية بالكامل.
                    - **المحفظة المالية (Wallet)**: هي الوقود المحرك؛ في 24شفت، أنت لا تدفع رواتب ثابتة للموظفين ولا أجار مكاتب، بل تدفع مقابل الاستهلاك الفعلي فقط، مما يجعل التكلفة التشغيلية تنخفض بنسبة تصل إلى 80% مقارنة بالتوظيف التقليدي.`,
                    material_en: `In this opening screen, we focus on the "Latent Power" of automation. Look at the chat counter; processing 1,420 conversations doesn't just mean "messages"—it means replacing human effort that would have taken weeks of continuous work.
                    
                    Practical Analysis of this Interface:
                    - **Active Conversations**: Every chat is a potential sales lead processed with 100% accuracy, 24/7, without fatigue.
                    - **Active Entities**: Represents the number of branches or projects you manage under one umbrella, giving you a "Hawk-Eye" view of your entire digital empire.
                    - **Wallet Balance**: This is the fuel. In 24Shift, you don't pay fixed salaries or office rent; you pay only for actual consumption, reducing operational costs by up to 80% compared to traditional hiring.`,
                    steps_ar: [
                        'تحويل نظرتك من "بوت دردشة" إلى "موظف مبيعات رقمي" يعالج آلاف الطلبات',
                        'مراقبة عداد المحادثات اليومي لمعرفة حجم الضغط الحقيقي الذي تم رفعه عن عاتقك',
                        'ضمان شحن رصيد المحفظة بمبلغ كافٍ لتأمين استمرارية الموظفين في الرد اللحظي'
                    ],
                    steps_en: [
                        'Shift your mindset from "chatbot" to "Digital Sales Employee" handling thousands of requests',
                        'Monitor daily chat counters to gauge the real workload lifted from your shoulders',
                        'Ensure sufficient wallet balance to guarantee continuous real-time agent responses'
                    ],
                    image_ar: '/academy/dashboard.png',
                    image_en: '/academy/dashboard_en.png',
                    practiceTask_ar: 'افتح لوحة التحكم، ادخل إلى قسم "الكيانات"، وقم بتوثيق أول "منشأة" تجريبية لك للتمرس.',
                    practiceTask_en: 'Open the dashboard, enter the "Entities" section, and document your first pilot "Entity" for practice.'
                }
            ]
        },
        {
            stage: 2,
            title_ar: 'المرحلة 2: هندسة القيادة والتحكم المالي الرقمي',
            title_en: 'Stage 2: Command Architecture & Digital Finance Control',
            lessons: [
                {
                    title_ar: 'هيكلة العمل داخل مركز القيادة - المكونات الأربعة للسيطرة',
                    title_en: 'Workforce Structuring - The Four Core Control Pillars',
                    summary_ar: 'إتقان إدارة المربعات الاستراتيجية الأربعة التي تمنحك السيطرة الكاملة على المنظمة ونموها.',
                    summary_en: 'Mastering the four strategic blocks that give you total control over the organization and its growth.',
                    material_ar: `تعتمد واجهة 24شفت الاحترافية على مبدأ "البساطة المعقدة". نحن نوفر لك 4 أعمدة رئيسية للسيطرة تظهر في أعلى لوحة التحكم لتعرف حالة شركتك في 3 ثوانٍ فقط:
                    
                    1. **إجمالي الوكلاء (Agents)**: يوضح حجم قوتك العاملة الرقمية الحالية المنتشرة في السوق.
                    2. **المواعيد المحجوزة (Bookings)**: هذا هو الرقم الأهم؛ فهو يعكس "الإنتاجية الملموسة" وتحول المحادثات إلى مواعيد حقيقية في تقويمك.
                    3. **قاعدة العملاء (Customers)**: كنزك الحقيقي الذي ينمو آلياً؛ هنا يتم أرشفة بيانات كل من تواصل مع النظام لبناء قاعدة بيانات ضخمة للتسويق المستقبلي.
                    4. **إحصائيات الرسائل (Messages)**: تتبع حجم التفاعل اللحظي والضغط على النظام.
                    
                    **نصيحة ذهبية**: تابع قسم "آخر العمليات" (Latest Operations) في الأسفل دائماً؛ فهو يعطيك نبض العمل المباشر وتدفق العملاء الجدد من الواتساب ثانية بثانية، مما يجعلك مطلعاً على كل تفاصيل التفاعل دون الحاجة لفتح كل محادثة يدوياً.`,
                    material_en: `The professional 24Shift interface is built on the principle of "Complex Simplicity." We provide 4 core control pillars at the top of your dashboard to assess your company's status in just 3 seconds:
                    
                    1. **Total Agents**: Shows the current size of your digital workforce deployed in the market.
                    2. **Bookings/Appointments**: This is the most critical number; it reflects "Tangible Productivity" and the conversion of chats into real appointments in your calendar.
                    3. **Customer Base**: Your real, automatically growing treasure; here DATA from everyone who interacted with the system is archived for future marketing.
                    4. **Message Stats**: Tracks real-time interaction volume and system pressure.
                    
                    **Golden Tip**: Always follow the "Latest Operations" section at the bottom; it gives you the live pulse of the work and the flow of new customers from WhatsApp, second by second, keeping you informed without needing to open every chat manually.`,
                    steps_ar: [
                        'تحليل العلاقة بين عدد المحادثات وعدد المواعيد المحجوزة لفهم كفاءة الإقناع (Conversion Rate)',
                        'تتبع مصادر العملاء (واتساب، ويب) في جدول "أحدث العمليات" لتعرف من أين يأتي الربح',
                        'استخدام شريط البحث الذكي للوصول الفوري لأي ملف عميل بالاسم أو رقم الهاتف'
                    ],
                    steps_en: [
                        'Analyze the ratio between chats and bookings to understand persuasion efficiency (Conversion Rate)',
                        'Track customer sources (WhatsApp, Web) in the "Latest Operations" table to see where profit comes from',
                        'Use the smart search bar for instant access to any customer file by name or phone number'
                    ],
                    image_ar: '/academy/dashboard.png',
                    image_en: '/academy/dashboard_en.png',
                    practiceTask_ar: 'قم بفرز جدول العملاء لتعرف من هم آخر 5 أشخاص تواصلوا مع النظام اليوم وراقب حالتهم.',
                    practiceTask_en: 'Filter the customer table to identify the last 5 people who interacted with the system today and monitor their status.'
                }
            ]
        },
        {
            stage: 3,
            title_ar: 'المرحلة 3: معرض النخب الرقمية - فن الاستقطاب والتعيين الذكي',
            title_en: 'Stage 3: Digital Elite Marketplace - Smart Sourcing & Hiring',
            lessons: [
                {
                    title_ar: 'استنساخ الكوادر التخصصية الجاهزة - سرعة التوسع',
                    title_en: 'Cloning Specialized Ready-Made Talent - Scaling Speed',
                    summary_ar: 'كيفية اختيار الموظف "المُبرمج مسبقاً" بعناية ليتناسب مع أهدافك البيعية أو الخدمية.',
                    summary_en: 'How to carefully choose a "pre-programmed" employee tailored to your sales or service goals.',
                    material_ar: `في "معرض الموظفين" (Hire Agent)، أنت لا تقوم ببناء بوت محادثة بدائي من الصفر، بل تختار "عقولاً رقمية" (Digital Brains) تم تدريبها مسبقاً على آلاف المحادثات الناجحة:
                    
                    - **سارة (موظفة مبيعات عقارية)**: شخصية هجومية، مبرمجة لتكون مقنعة، صبورة، ومركزة جداً على إغلاق الصفقات بذكاء.
                    - **خالد (منسق حجوزات طبية/فنية)**: خبير في إدارة الوقت، الربط بالتقاويم، ومعالجة الاعتراضات المتعلقة بالمواعيد بمرونة عالية.
                    - **ليلى (دعم عملاء متعدد اللغات)**: تمتلك القدرة على قراءة ملفات المعرفة الضخمة واستنباط الإجابات بدقة علمية مذهلة.
                    
                    بمجرد ضغطك على "توظيف الآن"، يقوم النظام بعمل نسخة خاصة (Instance) من هذا الموظف لمنشأتك، حيث يمكنك فوراً البدء في تخصيصه وتدريبه على "بياناتك الخاصة" دون الحاجة لتعليماته كيفية التحدث أو التعامل مع العملاء.`,
                    material_en: `In the "Agent Marketplace" (Hire Agent), you're not building a primitive chatbot from scratch; you're choosing "Digital Brains" pre-trained on thousands of successful conversations:
                    
                    - **Sarah (Real Estate Sales)**: An assertive persona, programmed to be persuasive, patient, and highly focused on closing deals smartly.
                    - **Khaled (Medical/Tech Booking Coordinator)**: Expert in time management, calendar syncing, and handling appointment objections with high flexibility.
                    - **Laila (Multilingual Support)**: Capable of reading massive knowledge files and extracting answers with amazing scientific precision.
                    
                    By clicking "Hire Now," the system creates a private "Instance" of this employee for your entity, allowing you to immediately start customizing and training them on your "Private Data" without needing to teach them basic communication skills.`,
                    steps_ar: [
                        'استعراض معرض الموظفين واختيار الشخصية التي تتناسب "نبرة صوتها" مع عملاء منشأتك',
                        'فهم أن التوظيف الرقمي يعني الحصول على خبرة مبرمجة مسبقاً وليست مجرد واجهة برمجة',
                        'إعطاء الموظف اسماً وصورة تعكس "هوية العلامة التجارية" (Branding) الخاصة بك فور تعيينه'
                    ],
                    steps_en: [
                        'Browse the marketplace and choose a persona whose "Tone of Voice" matches your clients',
                        'Understand that digital hiring means getting pre-programmed expertise, not just an API',
                        'Give the agent a name and photo that reflects your "Brand Identity" immediately upon hiring'
                    ],
                    image_ar: '/academy/marketplace.png',
                    image_en: '/academy/marketplace_en.png',
                    practiceTask_ar: 'وظف "موظف مبيعات" جديد، وقم بتخصيص صورته الشخصية لتناسب طابع عملك الخاص.',
                    practiceTask_en: 'Hire a new "Sales Employee" and customize their profile photo to match your business style.'
                }
            ]
        },
        {
            stage: 4,
            title_ar: 'المرحلة 4: هندسة المعرفة - كيف نلقن الموظف أسرار العمل؟',
            title_en: 'Stage 4: Knowledge Engineering - Training on Business Secrets',
            lessons: [
                {
                    title_ar: 'بناء قاعدة المعرفة (Knowledge Base) والدقة المرجعية',
                    title_en: 'Building the Knowledge Base with Referential Precision',
                    summary_ar: 'تحويل المستندات الصامتة إلى تفاعل ذكي يخدم العملاء بمعلومات دقيقة وموثوقة.',
                    summary_en: 'Transforming silent documents into smart interaction serving customers with accurate and reliable info.',
                    material_ar: `هذه هي المرحلة الجوهرية التي تفصل بين "البوت العادي" و"الموظف الخبير". في قسم "إعدادات الكيان" (Entity Setup)، ستجد تبويب "قاعدة المعرفة".
                    
                    **منهجية التدريب الصحيحة**:
                    - **رفع الملفات**: ارفع ملفات (PDF, TXT) تحتوي على قائمة أسعارك، شروط تقديم الخدمة، وتفاصيل دقيقة عن منتجاتك.
                    - **الدقة المتناهية**: الموظف لا يرتجل؛ بل يذهب للوثيقة التي رفعتها ويستخرج منها الإجابة. إذا كان الملف دقيقاً، ستكون الردود مذهلة.
                    - **تطوير المهارات (Skills)**: يمكنك هنا تفعيل مهارات خاصة مثل "تحليل البيانات" أو "فهم اللهجات" لزيادة كفاءة الرد.
                    
                    بهذه الخطوة، أنت تمنح الموظف الرقمي "ذاكرة مؤسسية" تجعله يتحدث بذكاء يتفوق أحياناً على الموظف البشري لعدم نسيانه أي تفصيل مذكور في الملفات.`,
                    material_en: `This is the core stage that distinguishes a "Standard Bot" from an "Expert Employee." In the "Entity Setup" section, you'll find the "Knowledge Base" tab.
                    
                    **Correct Training Methodology**:
                    - **File Uploading**: Upload files (PDF, TXT) containing your price lists, terms of service, and granular product details.
                    - **Extreme Precision**: The agent doesn't improvise; it refers to the document you provided and extracts the answer. If the file is accurate, the responses will be stunning.
                    - **Skill Development**: Here you can activate specific skills like "Data Analysis" or "Dialect Understanding" to enhance response efficiency.
                    
                    By this step, you are giving the digital employee an "Institutional Memory" that makes it speak with intelligence that sometimes surpasses a human employee because it never forgets a detail from the files.`,
                    steps_ar: [
                        'تجهيز ملف "دليل الموظف" الذي يحتوي على كل ما قد يسأل عنه العميل بدقة',
                        'رفع الملف ومتابعة حالة "المعالجة" لضمان دخول المعلومات في عقل الموظف الرقمي',
                        'إجراء محادثات تجريبية في "قسم الاختبار" للتأكد من أن الموظف يستنبط الإجابات الصحيحة'
                    ],
                    steps_en: [
                        'Prepare an "Employee Guide" file containing everything a customer might ask for',
                        'Upload the file and monitor the "Processing" status to ensure information ingest',
                        'Conduct test chats in the "Playground" to verify the agent extracts the correct answers'
                    ],
                    image_ar: '/academy/agent_skills.png',
                    image_en: '/academy/agent_skills_en.png',
                    practiceTask_ar: 'ارفع ملفاً يحتوي على "ساعات العمل" و "موقع الفرع"، واختبر الموظف بسؤال: "متى تغلقون اليوم؟".',
                    practiceTask_en: 'Upload a file with "Working Hours" and "Branch Location," then test the agent with: "When do you close today?".'
                }
            ]
        },
        {
            stage: 6,
            title_ar: 'المرحلة 6: مختبر الذكاء - استراتيجيات التحليل والتطوير المستمر',
            title_en: 'Stage 6: Intelligence Lab - Analytics & Continuous Growth',
            lessons: [
                {
                    title_ar: 'مراقبة الجودة: قراءة سجلات المحادثة وتصحيح المسار آلياً',
                    title_en: 'Quality Control: Reading Chat Logs & Automated Correction',
                    summary_ar: 'تعلم كيف تراقب جودة ردود الموظف وتعدل سلوكه بناءً على تفاعل العملاء الفعلي.',
                    summary_en: 'Learn how to monitor agent response quality and adjust behavior based on actual customer interaction.',
                    material_ar: `في هذه المرحلة المتقدمة، ننتقل من "بناء المنظومة" إلى "تحسين الأداء". تظهر لقطة الشاشة "مركز الدعم والتذاكر"؛ هذه الواجهة هي مختبرك الحقيقي:
                    
                    1. **مراقبة الجودة**: يمكنك مراجعة كل محادثة تمت بين العميل والموظف الرقمي لحظة بلحظة.
                    2. **التدخل الذكي**: إذا وجدت أن الموظف عجز عن الإجابة على سؤال معين، لا تقم بالرد يدوياً فقط، بل اذهب فوراً إلى "قاعدة المعرفة" وأضف الإجابة هناك. في المرة القادمة، سيعرف الموظف الرد آلياً دون تدخل بشري.
                    3. **تذاكر الدعم**: أي محادثة تتطلب تدخل بشري يتم تحويلها لتذكرة، مما يسمح لك بالتركيز فقط على القضايا المعقدة وترك الروتين للموظف الرقمي.`,
                    material_en: `At this advanced stage, we move from "Building the System" to "Improving Performance." The screenshot shows the "Support & Tickets Central"—this interface is your real lab:
                    
                    1. **Quality Monitoring**: You can review every conversation between the client and the digital employee in real-time.
                    2. **Smart Intervention**: If you find the agent failed to answer a specific question, don't just reply manually. Go immediately to the "Knowledge Base" and add the answer there. Next time, the agent will handle it automatically without human intervention.
                    3. **Support Tickets**: Any conversation requiring human intervention is converted into a ticket, allowing you to focus only on complex issues while leaving the routines to the digital employee.`,
                    steps_ar: [
                        'مراجعة سجل المحادثات (Inbox) بشكل دوري لرصد الأسئلة المتكررة التي لم يجيب عليها الموظف بدقة',
                        'استخراج "الفجوات المعرفية" (Knowledge Gaps) وتحديث ملفات قاعدة المعرفة فوراً',
                        'مراقبة سرعة استجابة النظام لضمان تجربة مستخدم سلسة واحترافية'
                    ],
                    steps_en: [
                        'Regularly review chat logs (Inbox) to identify recurring questions the agent didn\'t answer accurately',
                        'Extract "Knowledge Gaps" and update Knowledge Base files immediately',
                        'Monitor system response speed to ensure a smooth and professional user experience'
                    ],
                    image_ar: '/academy/chat_logs.png',
                    image_en: '/academy/chat_logs_en.png',
                    practiceTask_ar: 'ادخل لمحرر المحادثات، ابحث عن سؤال لم يعرف الموظف إجابته، وقم بإضافة الإجابة في قاعدة المعرفة.',
                    practiceTask_en: 'Enter the chat editor, find a question the agent couldn\'t answer, and add the answer to the Knowledge Base.'
                },
                {
                    title_ar: 'النمو المبني على البيانات: قراءة لغة الأرقام والتحليلات',
                    title_en: 'Data-Driven Growth: Interpreting Numbers & Analytics',
                    summary_ar: 'استخدام لوحة التحليلات المتقدمة لفهم سلوك العملاء واتخاذ قرارات توسع ذكية.',
                    summary_en: 'Using the advanced analytics dashboard to understand customer behavior and make smart scaling decisions.',
                    material_ar: `لقد وصلت إلى قمة الهرم التدريبي. لقطة الشاشة "لوحة التحليلات" (Performance Dashboard) تمثل لوحة القيادة لنمو عملك:
                    
                    - **تحليل المبيعات**: تتبع كيف يساهم الموظفون الرقميون في زيادة حجم المبيعات الإجمالي.
                    - **أداء الوكلاء**: قارن بين أداء "سارة" و "خالد"؛ من منهم يحول العملاء لمواعيد أكثر؟
                    - **الانتشار الجغرافي والزمني**: اعرف متى يكون الضغط الأعلى على النظام لتخصيص مواردك وميزانيتك التسويقية بذكاء.
                    
                    تذكر: العمل العشوائي ينتهي بموت المنشأة، بينما العمل المبني على الأرقام هو الذي يصنع الإمبراطوريات. الآن، أنت تملك الأدوات، والعالم بانتظار انطلاقتك.`,
                    material_en: `You have reached the pinnacle of the training pyramid. The "Performance Dashboard" screenshot represents the cockpit of your business growth:
                    
                    - **Sales Analysis**: Track how digital employees contribute to overall sales volume.
                    - **Agent Performance**: Compare Sarah and Khaled's performance; who converts more clients into appointments?
                    - **Geographic & Temporal Trends**: Know when your system is under peak pressure to smartly allocate your marketing budget and resources.
                    
                    Remember: Random work leads to business decline, while data-driven work builds empires. Now you have the tools, and the world is waiting for your launch.`,
                    steps_ar: [
                        'مراقبة منحنى نمو المحادثات والمواعيد أسبوعياً للتأكد من تصاعد الأداء',
                        'تحديد "ساعات الذروة" التي يكثر فيها طلب العملاء لتركيز حملاتك الإعلانية فيها',
                        'تحليل ميزانية الاستهلاك (Credits) لضمان تحقيق أعلى عائد مقابل كل دولار منففق'
                    ],
                    steps_en: [
                        'Monitor weekly conversation and booking growth trends to ensure rising performance',
                        'Identify "Peak Hours" of customer demand to focus your advertising campaigns',
                        'Analyze credit consumption budget to ensure the highest ROI for every dollar spent'
                    ],
                    image_ar: '/academy/analytics.png',
                    image_en: '/academy/analytics_en.png',
                    practiceTask_ar: 'انظر للرسم البياني في لوحة تحليلاتك، وحدد أكثر يوم في الأسبوع وصلت فيه رسائل لعملك.',
                    practiceTask_en: 'View the chart in your analytics dashboard and identify the busiest day of the week for your business.'
                }
            ]
        },
        {
            stage: 7,
            title_ar: 'المرحلة 7: ماكينة الأرباح - التوسع كوكالة حلول ذكاء اصطناعي',
            title_en: 'Stage 7: The Money-Machine - Scaling as an AI Solutions Agency',
            lessons: [
                {
                    title_ar: 'استراتيجية التسعير وتحقيق أول 1000 دولار',
                    title_en: 'Pricing Strategy & Achieving Your First $1,000',
                    summary_ar: 'كيفية تحويل خبرتك في النظام إلى باقات خدمية تبيعها للشركات والمشاريع الناشئة.',
                    summary_en: 'How to turn your system expertise into service packages sold to businesses and startups.',
                    material_ar: `أنت الآن لست مجرد مستخدم، أنت "مهندس حلول". نموذج العمل كوكالة (Agency Model) يعتمد على ثلاث ركائز مالية:
                    
                    1. **رسوم التأسيس (Setup Fee)**: مقابل بناء "الكيان"، رفع ملفات المعرفة، وبرمجة الموظف الرقمي لأول مرة. (تتراوح غالباً بين 100$ - 500$ لكل عميل).
                    2. **الاشتراك الشهري (Management Fee)**: مقابل متابعة جودة الردود، تحديث المعلومات، وتحليل التقارير للعميل.
                    3. **هامش استهلاك الرصيد**: يمكنك إعادة بيع أرصدة المحادثات (Credits) للعملاء بهامش ربح بسيط.
                    
                    **قاعدة الذهب**: ابحث عن "نقاط الألم" عند العميل (مثلاً: تأخر الرد في الواتساب، ضياع الحجوزات) وقدم الموظف الرقمي كحل مالي وتشغيلي فوري.`,
                    material_en: `You are no longer just a user; you are a "Solutions Architect." The Agency Model relies on three financial pillars:
                    
                    1. **Setup Fee**: For building the "Entity," uploading knowledge files, and programming the digital employee for the first time. (Standard range: $100 - $500 per client).
                    2. **Management Fee**: For monitoring response quality, updating info, and analyzing reports for the client.
                    3. **Credit Margin**: You can resell chat credits to clients with a modest profit margin.
                    
                    **Golden Rule**: Find the client's "Pain Points" (e.g., delayed WhatsApp replies, lost bookings) and present the Digital Employee as an instant financial and operational solution.`,
                    steps_ar: [
                        'تحديد الفئة المستهدفة (مطاعم، عيادات، شركات عقارية) وتجهيز عرض سعر لكل منها',
                        'استخدام رابط "لوحة تحكم الوكالة" لإدارة جميع حسابات عملائك من شاشة واحدة',
                        'تحديد ميزانية تسويقية لاستهداف أصحاب الأعمال عبر لينكد إن ومنصات التواصل'
                    ],
                    steps_en: [
                        'Identify target niches (restaurants, clinics, real estate) and prepare price quotes for each',
                        'Use the "Agency Dashboard" link to manage all client accounts from a single screen',
                        'Set a marketing budget to target business owners via LinkedIn and social platforms'
                    ],
                    image_ar: '/academy/agency_dashboard.png',
                    image_en: '/academy/agency_dashboard_en.png',
                    practiceTask_ar: 'قم بإنشاء مستند "باقة العميل الأول"، واقترح سعراً لخدمة "الموظف الرقمي للعقارات".',
                    practiceTask_en: 'Create a "First Client Package" document and propose a price for a "Real Estate Digital Employee" service.'
                }
            ]
        }
    ];


    const activeLesson = curriculum[currentStep.stage].lessons[currentStep.lesson];

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505' }}><div className="loading-spinner"></div></div>;

    if (!hasAccess) return (
        <AcademyLayout title={isArabic ? "الحقيبة التدريبية" : "Training Bag"}>
             <div style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                <Lock size={80} color="#EF4444" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.3))' }} />
                <h1 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '1.5rem' }}>{isArabic ? 'بوابة الممارسة مقفلة' : 'Practice Portal Locked'}</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', marginBottom: '3rem' }}>
                    {isArabic ? 'التدريب مجاني، لكن الممارسة تتطلب تفعيل حسابك التجريبي (20$).' : 'Training is free, but practice requires activating your test account ($20).'}
                </p>
                <button onClick={() => window.location.href = '/opportunity'} style={{ background: '#8B5CF6', color: 'var(--color-text-main)', padding: '1.25rem 3rem', borderRadius: '16px', fontWeight: 950, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)' }}>{isArabic ? 'فعل حساب الممارسة واستلم الرصيد' : 'Activate Practice Account & Get Credits'}</button>
            </div>
        </AcademyLayout>
    );

    return (
        <AcademyLayout title={isArabic ? "حقيبة التدريب الذكية" : "Smart Training Bag"}>
            <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '2.5rem', minHeight: 'calc(100vh - 200px)' }}>
                {/* Roadmap Sidebar - Now First for proper RTL/LTR scaling */}
                <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--color-border-subtle)', backdropFilter: 'blur(10px)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                            <div style={{ background: '#8B5CF6', padding: '10px', borderRadius: '12px' }}><Trophy size={20} color="white" /></div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{isArabic ? 'خارطة الطريق' : 'Academy Roadmap'}</h3>
                        </div>

                        {curriculum.map((stage, sIdx) => (
                            <div key={sIdx} style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                    {isArabic ? stage.title_ar : stage.title_en}
                                </div>
                                {stage.lessons.map((lesson, lIdx) => (
                                    <div 
                                        key={lIdx} 
                                        onClick={() => {
                                            setIsCompleted(false);
                                            setCurrentStep({ stage: sIdx, lesson: lIdx });
                                        }}
                                        style={{ 
                                            padding: '1rem', 
                                            borderRadius: '16px', 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            background: currentStep.stage === sIdx && currentStep.lesson === lIdx ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            border: `1px solid ${currentStep.stage === sIdx && currentStep.lesson === lIdx ? 'rgba(139, 92, 246, 0.3)' : 'transparent'}`,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: currentStep.stage === sIdx && currentStep.lesson === lIdx ? '#8B5CF6' : '#374151' 
                                        }} />
                                        <span style={{ 
                                            fontSize: '0.9rem', 
                                            color: currentStep.stage === sIdx && currentStep.lesson === lIdx ? 'white' : '#9CA3AF',
                                            fontWeight: currentStep.stage === sIdx && currentStep.lesson === lIdx ? 700 : 500
                                        }}>
                                            {isArabic ? lesson.title_ar : lesson.title_en}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                            <Award color="#F59E0B" size={24} style={{ marginBottom: '1rem' }} />
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F59E0B', marginBottom: '0.5rem' }}>{isArabic ? 'شهادة الأكاديمية' : 'Academy Certificate'}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{isArabic ? 'سيتم إصدار وثيقة معتمدة باسمك عند الانتهاء لفتح حسابات العملاء.' : 'A certified document will be issued in your name upon completion to unlock client accounts.'}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {isCompleted ? (
                            <motion.div
                                key="celebration"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="animate-fade-in"
                                style={{ background: 'var(--color-bg-surface)', borderRadius: '32px', border: '1px solid rgba(139, 92, 246, 0.3)', overflow: 'hidden', boxShadow: '0 25px 60px rgba(139, 92, 246, 0.15)', padding: '5rem 3rem', textAlign: 'center' }}
                            >
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                                    <PartyPopper size={50} color="#8B5CF6" />
                                </div>
                                <h2 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '1.5rem', background: 'linear-gradient(to right, #8B5CF6, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {isArabic ? 'تهانينا.. لقد أتممت التدريب!' : 'Congratulations.. Training Complete!'}
                                </h2>
                                <p style={{ fontSize: '1.4rem', color: 'var(--color-text-secondary)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                                    {isArabic 
                                        ? 'أنت الآن مسلح بالمعرفة الكاملة لإدارة أقوى منظومة ذكاء اصطناعي. موظفوك الرقميون بانتظار أوامرك لتحقيق أهدافك.' 
                                        : 'You are now armed with the full knowledge to manage the most powerful AI system. Your digital employees are waiting for your orders.'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                                    <button 
                                        onClick={() => window.location.href = '/dashboard'}
                                        style={{ padding: '1.3rem 3rem', borderRadius: '18px', background: 'linear-gradient(45deg, #8B5CF6, #6366F1)', color: 'var(--color-text-main)', fontWeight: 950, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', boxShadow: '0 15px 30px rgba(139, 92, 246, 0.4)' }}
                                    >
                                        {isArabic ? 'انتقل للوحة التحكم الآن' : 'Go to Dashboard Now'} <Rocket size={24} />
                                    </button>
                                    <button 
                                        onClick={() => setIsCompleted(false)}
                                        style={{ padding: '1.3rem 3rem', borderRadius: '18px', background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}
                                    >
                                        {isArabic ? 'مراجعة المنهج' : 'Review Curriculum'}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`${currentStep.stage}-${currentStep.lesson}`}
                                initial={{ opacity: 0, x: isArabic ? 50 : -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isArabic ? -50 : 50 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="animate-fade-in"
                            >
                                <div style={{ background: 'var(--color-bg-surface)', borderRadius: '32px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                                    <div style={{ padding: '3rem', borderBottom: '1px solid var(--color-border-subtle)', background: 'linear-gradient(to right, var(--color-bg-surface), var(--color-bg-input))' }}>
                                        <div style={{ color: '#8B5CF6', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
                                            <Sparkles size={18} /> {isArabic ? curriculum[currentStep.stage].title_ar : curriculum[currentStep.stage].title_en}
                                        </div>
                                        <h1 style={{ fontSize: '3rem', fontWeight: 950, lineHeight: 1.1 }}>{isArabic ? activeLesson.title_ar : activeLesson.title_en}</h1>
                                    </div>

                                    {/* SCREENSHOT PREVIEW */}
                                    <div style={{ padding: '0', background: '#000', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                                            <img 
                                                src={isArabic ? activeLesson.image_ar : activeLesson.image_en} 
                                                alt="Platform Step" 
                                                style={{ width: '100%', height: 'auto', display: 'block', filter: 'brightness(0.9) contrast(1.1)', transition: 'all 0.5s' }} 
                                                className="hover:scale-105"
                                            />
                                            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(5,5,5,0.8)', padding: '8px 16px', borderRadius: '10px', backdropFilter: 'blur(5px)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Pointer size={14} /> {isArabic ? 'لقطة شاشة حقيقية من المنصة' : 'Real screenshot from the platform'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '3rem', background: 'var(--color-bg-base)' }}>
                                        <div style={{ marginBottom: '3rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: '#8B5CF6' }}>
                                                <BookOpen size={24} />
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{isArabic ? 'الشرح والدليل العلمي' : 'Explanation & Scientific Guide'}</h3>
                                            </div>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', lineHeight: 1.8, whiteSpace: 'pre-line', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--color-border-subtle)' }}>
                                                {isArabic ? activeLesson.material_ar : activeLesson.material_en}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '3rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: '#10B981' }}>
                                                <ListChecks size={24} />
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{isArabic ? 'خطوات التنفيذ (بالرجوع للصورة)' : 'Execution Steps (Referring to Image)'}</h3>
                                            </div>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {(isArabic ? activeLesson.steps_ar : activeLesson.steps_en).map((step, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)', fontSize: '0.8rem', fontWeight: 900 }}>{idx + 1}</div>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Practice Milestone */}
                                        <div style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1), rgba(16, 185, 129, 0.1))', padding: '2.5rem', borderRadius: '28px', border: '2px dashed #10B981', marginBottom: '3rem' }}>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#10B981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Target size={24} /> {isArabic ? 'مرحلة التطبيق الميداني' : 'Field Practice Milestone'}
                                            </h3>
                                            <p style={{ color: 'var(--color-text-main)', marginBottom: '1.8rem', fontSize: '1.2rem', lineHeight: 1.6 }}>{isArabic ? activeLesson.practiceTask_ar : activeLesson.practiceTask_en}</p>
                                            <button onClick={() => window.open('/dashboard', '_blank')} style={{ background: '#10B981', color: 'var(--color-text-main)', padding: '1.1rem 2.5rem', borderRadius: '16px', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                                                {isArabic ? 'انتقل للوحة التحكم وطبق الآن' : 'Go to Dashboard and Apply Now'} <ArrowUpRight size={22} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
                                            <button 
                                                disabled={currentStep.stage === 0 && currentStep.lesson === 0}
                                                onClick={() => {
                                                    if (currentStep.lesson > 0) setCurrentStep({ ...currentStep, lesson: currentStep.lesson - 1 });
                                                    else if (currentStep.stage > 0) {
                                                        const prevStage = currentStep.stage - 1;
                                                        setCurrentStep({ stage: prevStage, lesson: curriculum[prevStage].lessons.length - 1 });
                                                    }
                                                }}
                                                style={{ padding: '1.1rem 2.2rem', borderRadius: '16px', background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}
                                            >
                                                <ChevronLeft size={22} /> {isArabic ? 'السابق' : 'Previous'}
                                            </button>
                                            
                                            <button 
                                                onClick={() => {
                                                    if (currentStep.lesson < curriculum[currentStep.stage].lessons.length - 1) {
                                                        setCurrentStep({ ...currentStep, lesson: currentStep.lesson + 1 });
                                                    } else if (currentStep.stage < curriculum.length - 1) {
                                                        setCurrentStep({ stage: currentStep.stage + 1, lesson: 0 });
                                                    } else {
                                                        setIsCompleted(true);
                                                    }
                                                }}
                                                style={{ padding: '1.1rem 3rem', borderRadius: '16px', background: 'linear-gradient(45deg, #8B5CF6, #6366F1)', border: 'none', color: 'var(--color-text-main)', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)' }}
                                            >
                                                {currentStep.stage === curriculum.length - 1 && currentStep.lesson === curriculum[curriculum.length - 1].lessons.length - 1
                                                    ? (isArabic ? 'إنهاء التدريب' : 'Finish Training')
                                                    : (isArabic ? 'الدرس التالي' : 'Next Lesson')}
                                                <ArrowRight size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AcademyLayout>
    );
};

export default TrainingBag;
