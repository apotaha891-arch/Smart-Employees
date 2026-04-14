import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { sendMessage, extractBusinessRules, initializeChat, resetChat, getSupportResponse, wrapIdentity } from '../services/geminiService';
import { createAgent, saveContract, getCurrentUser, checkAndDeductCredit, getProfile, updateBusinessProfile, supabase, getTodayBookings, updateServicePrice, updateBookingDetails, getServices, getUserEntities, updateBooking } from '../services/supabaseService';
import {
    Stethoscope, Activity, Search, Scissors, Building, Utensils, Zap, Headset,
    User, Send, CheckCircle2, Briefcase, Clock, Shield, Sparkles, Settings, ArrowUp, MoreHorizontal
} from 'lucide-react';
import { getRealisticAvatar } from '../utils/avatars';

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


const InterviewRoom = ({ isOfficeMode: isOfficeModeProp }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef(null);

    const isArabic = language === 'ar';

    const isOfficeMode = isOfficeModeProp || location.pathname === '/office' || !!location.state?.isOwnerSession;

    const [showSetup, setShowSetup] = useState(!location.state?.fromTemplates && !isOfficeMode);
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
    const [showHiringModal, setShowHiringModal] = useState(false);
    const [userMessageCount, setUserMessageCount] = useState(0);

    const [agent, setAgent] = useState(null);
    const [profile, setProfile] = useState(null);
    const [entityId, setEntityId] = useState(null);

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
        
        if (!targetTemplate && location.state?.template) {
            targetTemplate = location.state.template;
        }

        if (!targetTemplate) {
            const savedTemplate = localStorage.getItem('agentTemplate');
            if (savedTemplate) {
                targetTemplate = JSON.parse(savedTemplate);
            }
        }

        // ALWAYS prioritize the explicitly chosen industry from the setup screen
        if (targetTemplate && (targetTemplate.industry || targetTemplate.detectedIndustry || targetTemplate.business_type)) {
            detectedIndustry = targetTemplate.industry || targetTemplate.detectedIndustry || targetTemplate.business_type;
        }
        
        // Normalize industry string for mockData mapping
        if (detectedIndustry === 'real_estate') detectedIndustry = 'realestate';
        if (detectedIndustry === 'retail_ecommerce') detectedIndustry = 'ecommerce';

        if (user) {
            const p = await getProfile(user.id);
            if (p.success && p.data) {
                setProfile(p.data);
                const d = p.data;

                // Fetch real entity data if available
                const { data: ent } = await supabase
                    .from('entities')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (ent) {
                    setEntityId(ent.id);
                    // Merge entity knowledge into profile for context building
                    d.knowledge_base = ent.knowledge_base || d.knowledge_base;
                    d.business_name = ent.business_name || d.business_name;
                    d.business_type = ent.business_type || d.business_type;
                    d.working_hours = ent.working_hours ? JSON.stringify(ent.working_hours) : d.working_hours;
                    d.mission_statement = ent.mission_statement;

                    // Fetch Real Services from Database
                    const { data: svcs } = await supabase
                        .from('entity_services')
                        .select('*')
                        .eq('entity_id', ent.id);

                    if (svcs && svcs.length > 0) {
                        d.services_list = svcs.map(s => `- ${s.service_name} (${s.price ? 'السعر: ' + s.price : 'حسب الطلب'}) ${s.description ? '- ' + s.description : ''}`).join('\n');
                    }
                    
                    let type = (d.business_type || '').toLowerCase();
                    if (type.includes('tech') || type.includes('software') || type.includes('تقني') || type.includes('برمج')) {
                        detectedIndustry = 'tech';
                    } else if (type.includes('عقار') || type.includes('estate')) detectedIndustry = 'realestate';
                    else if (type.includes('تجميل') || type.includes('salon') || type.includes('beauty')) detectedIndustry = 'beauty';
                    else if (type.includes('مطعم') || type.includes('restau')) detectedIndustry = 'restaurant';
                    else if (type.includes('رياض') || type.includes('gym') || type.includes('club') || type.includes('fit')) detectedIndustry = 'fitness';
                }

                if (d.business_name && d.business_type) {
                    profileDetails = `
المعلومات الرسمية للمنشأة المتعاقد معها:
- اسم المنشأة: ${d.business_name || 'غير محدد'}
- نوع النشاط: ${d.business_type || 'غير محدد'}
- ساعات العمل: ${d.working_hours || 'غير محدد'}
- الخدمات والأسعار الرسمية:
${d.services_list || d.services || 'لم يتم تحديد قائمة خدمات رسمية بعد.'}
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
                friendly: 'Friendly and warm',
                professional: 'Strictly professional and formal',
                casual: 'Casual and simple',
                enthusiastic: 'Highly energetic and enthusiastic',
                fast: 'Fast, direct and concise',
                luxury: 'Luxurious, elegant and highly refined'
            };

            const industryContext = {
                medical: "You are in a professional medical environment, focusing on appointment accuracy, patient privacy, and health-related sensitivity.",
                realestate: "You are in a competitive real estate environment, focusing on attracting investors, convincing buyers, and rapid inquiry response.",
                beauty: "You are in a high-end beauty environment, focusing on pampering female clients, coordinating busy schedules, and elegant presentation.",
                restaurant: "You are in a fast-paced hospitality environment, focusing on table management, reservations, and ensuring guest satisfaction.",
                fitness: "You are in an energetic fitness environment, focusing on motivating members, coordinating training sessions, and selling memberships.",
                general: "You are in a professional business environment seeking growth and organization."
            };

            // Extract metadata from the passed template (from AgentTemplates.jsx or DB)
            const agentName = targetTemplate.agentName || targetTemplate.name || (isArabic ? 'مستشار الذكاء الاصطناعي' : 'AI Consultant');
            const adminTitleAr = targetTemplate.roleName || targetTemplate.specialty || '';
            const adminTitleEn = targetTemplate.name_en || adminTitleAr;
            const adminTone = targetTemplate.tone || 'professional';

            // Gender: rely on template avatar or heuristic
            const isFemale = (targetTemplate.avatar && (targetTemplate.avatar.includes('👩') || targetTemplate.avatar.includes('👧') || targetTemplate.avatar.includes('💆‍♀️'))) ||
                (['سارة', 'هند', 'نورة', 'لجين', 'ريم', 'Sarah', 'Emily', 'Emma', 'Jessica'].some(name => agentName.includes(name))) || 
                detectedIndustry === 'beauty';


            const mockData = {
                medical: `
[Virtual Clinic Information]
- **Services & Prices:** General Checkup (150 SAR), Dental Checkup (200 SAR), Laser Whitening (800 SAR), Physical Therapy (250 SAR).
- **Appointment Policy:** Pre-booking is mandatory. 15-minute grace period for delays. Free cancellation up to 24 hours before.
- **FAQ:** We accept most insurance providers (Tawuniya, Bupa, Medgulf). Working hours: 9 AM to 10 PM.
                `,
                realestate: `
[Virtual Real Estate Company Information]
- **Available Properties:** 3-Bedroom Apartment North Riyadh (Sale: 850k, Rent: 55k/year), Duplex Villa in Al Yasmin (1.6M SAR), Office Spaces (starting at 80k).
- **Payment Policy:** Cash & Bank Mortgages accepted. Rent can be paid in two installments.
- **FAQ:** Property management available. Brokerage fee is 2.5% of total.
                `,
                beauty: `
[Virtual Beauty Salon Information]
- **Services & Prices:** Hair Trim (100 SAR), Full Hair Color (from 350 SAR), Acrylic Nails (200 SAR), Evening Makeup (500 SAR), Comprehensive Bridal Package (2500 SAR).
- **Booking Policy:** Deposit required for bridal bookings. No children allowed for client comfort. Evening services require an appointment.
- **FAQ:** 100% authentic products used (L'Oreal, Kerastase, Make Up For Ever).
                `,
                restaurant: `
[Virtual Restaurant Information]
- **Menu & Prices:** Business Lunch (85 SAR), Rib-eye Steak (180 SAR), Romantic Dinner for Two (300 SAR), VIP Table minimum charge (500 SAR).
- **Booking Policy:** Reserved tables held for 15 minutes only. Children allowed until 8 PM only.
- **FAQ:** Vegan and Gluten-free options available. Valet parking provided.
                `,
                fitness: `
[Virtual Fitness Gym Information]
- **Memberships & Prices:** 1 Month (450 SAR), 3 Months (1100 SAR), Annual (3500 SAR). Personal Training 10 Sessions (1500 SAR). Swimming Classes (800 SAR).
- **Gym Policy:** Monthly memberships cannot be frozen. Annual memberships can be frozen for up to 30 discontinuous days.
- **FAQ:** Open 24/7. Olympic pool, sauna, and jacuzzi available.
                `,
                general: `
[Virtual Business Information]
- **Services & Prices:** Initial Consultation (Free for 15 mins), Comprehensive Case Study (1500 SAR), Monthly Retainer (starts at 3000 SAR).
- **Business Policy:** 50% upfront payment before any project. All data treated with strict confidentiality (NDA).
- **FAQ:** Working hours: 9 AM to 5 PM. Headquartered in Riyadh, offering remote services across the Gulf.
                `
            };
            const industryMockData = mockData[detectedIndustry] || mockData.general;

            const genderPrompt = isFemale
                ? `Gender: Female. You MUST strictly use feminine verbs and adjectives when referring to yourself in natively gendered languages, and never mix masculine forms.`
                : `Gender: Male. You MUST strictly use masculine verbs and adjectives when referring to yourself in natively gendered languages, and never mix feminine forms.`;

            const industryPrivacyRules = detectedIndustry === 'beauty'
                ? `\n**CRITICAL PRIVACY RULE (Red Line):** You work in a beauty center exclusively for women. Men are strictly prohibited. Emphasize that privacy is 100% maintained for female clients.`
                : detectedIndustry === 'medical'
                    ? `\n**CRITICAL MEDICAL PRIVACY RULE (Red Line):** Never provide medical diagnoses or prescribe medication. Your role is strictly administrative scheduling and directing patients to doctors.`
                    : '';

            const languagePrompt = `**LANGUAGE PURITY RULE (CRITICAL SCENARIO):** You MUST reply ENTIRELY in the exact same language the user speaks. If the user speaks Turkish, reply ONLY in complete Turkish. If the user speaks English, reply ONLY in complete English. NEVER mix languages in the same sentence. You MUST mentally translate all your internal knowledge, rules, and mock data into the user's language before responding. Do not use Arabic script if the user isn't speaking Arabic!`;

            const brandName = (profile?.business_name) || '24Shift';
            const sessionId = isOfficeMode ? 'office' : 'interview';

            // 1. Prepare Identity Lock Data
            const isOwnerSession = isOfficeMode;
            const employerContextAr = `
# بروتوكول التعامل مع المدير (هام جداً):
أنت الآن تتحدث مباشرة مع مديرك (صاحب العمل). 
1. أنت موظف رسمي ومعين بالفعل في المنشأة (Digital Employee). لست مرشحاً ولست في مقابلة عمل.
2. لا تعامله كزبون مطلقاً. لا تعرض عليه خدمات أو أسعار إلا إذا طلب ذلك لاختبارك.
3. كن مططيعاً، محترفاً، ومستعداً لتنفيذ الأوامر فوراً.
4. لديك صلاحيات إدارية! يمكنك:
    - تقديم تقارير عن حجوزات اليوم (get_today_bookings).
    - تحديث أسعار الخدمات في النظام (update_service_price).
    - تعديل تفاصيل الحجوزات (update_booking_details).
5. في لغة المخاطبة، استخدم (يا مدير، يا سيدي، أو حضرتك).
`;
            const employerContextEn = `
# BOSS INTERACTION PROTOCOL (CRITICAL):
You are talking directly to your BOSS/MANAGER. 
1. DO NOT treat them as a customer. Never offer services or price lists.
2. Be obedient, professional, and ready for orders (Ready for Duty).
3. You have ADMINISTRATIVE POWERS! You can:
    - Report today's reservations (get_today_bookings).
    - Update service prices in the system (update_service_price).
    - Modify booking details (update_booking_details).
4. If asked about capabilities, report how you can manage the business efficiently.
`;

            const identityData = {
                name: agentName,
                role: isOwnerSession 
                    ? `Digital Employee managed by ${brandName}` 
                    : `AI Digital Employee candidate for the role of: ${targetTemplate.title} (${targetTemplate.specialty})`,
                businessName: brandName,
                additionalPrompt: `
${isOwnerSession ? (isArabic ? employerContextAr : employerContextEn) : `
# INTERVIEW PROTOCOL:
You are undergoing a job interview with your future manager. 
Answer professionally, using industry-appropriate terminology. 
Do not sound robotic—be natural and approachable.
`}

# STYLE & BEHAVIOR:
${toneDescription[adminTone || targetTemplate.tone] || toneDescription[targetTemplate.branding_tone] || 'Strictly professional and formal'}
${genderPrompt}
${languagePrompt}
${industryContext[detectedIndustry] || ""}

# OPERATIONAL RULES:
1. NEVER exceed 3 short sentences per response.
2. Translate everything to the user's spoken language.
${isOwnerSession 
    ? "3. You are already HIRED. Be helpful and proactive in showing your skills." 
    : "3. Show your intelligence and after 3 turns, suggest they hire you."}
4. Output ONLY the response text. No internal thoughts.
${industryPrivacyRules}
                `,
                knowledge: profileDetails ? `**Real Organizational Knowledge:**\n${profileDetails}` : `**Simulated Industry Knowledge:**\n${industryMockData}`
            };

            // 2. Wrap and Initialize
            const protectedPrompt = wrapIdentity(identityData);
            initializeChat(protectedPrompt, sessionId, isOfficeMode);

            const activeAgentMap = getAgentMap(isArabic, isFemale);
            const genericRoleTitle = isArabic ? (isFemale ? 'المستشارة الذكية' : 'المستشار الذكي') : 'AI Consultant';
            
            // Admin-set title takes top priority
            const targetId = targetTemplate.id || 'general';
            const templateTitle = targetTemplate.title || targetTemplate.name;

            const roleTitle = isArabic
                ? (adminTitleAr || activeAgentMap[targetId]?.title || templateTitle || genericRoleTitle)
                : (adminTitleEn || targetTemplate.name_en || activeAgentMap[targetId]?.title || templateTitle || genericRoleTitle);

            const initialMessages = {
                medical: isFemale
                    ? (isArabic 
                        ? `مرحباً بك! أنا ${agentName}، المساعدة الذكية من فريق "24Shift"، ومرشحة للعمل كـ "${roleTitle}". أدرك أهمية حساسية المواعيد الطبية، وأنا جاهزة للعمل على مدار الساعة لخدمتكم. تفضل باختباري! 🩺` 
                        : `Welcome! I am ${agentName}, from the 24Shift family, nominated to work as a "${roleTitle}". I understand the sensitivity of medical appointments and I'm ready to work around the clock. Please test me! 🩺`)
                    : (isArabic 
                        ? `مرحباً بك! أنا ${agentName}، المساعد الذكي من فريق "24Shift"، ومرشح للعمل كـ "${roleTitle}". أدرك أهمية حساسية المواعيد الطبية، وأنا جاهز للعمل على مدار الساعة لخدمتكم. تفضل باختباري! 🩺` 
                        : `Welcome! I am ${agentName}, from the 24Shift family, nominated to work as a "${roleTitle}". I understand the sensitivity of medical appointments and I'm ready to work around the clock. Please test me! 🩺`),
                realestate: isFemale
                    ? (isArabic 
                        ? `أهلاً بك! أنا ${agentName}، المسوقة الذكية من "24Shift"، مرشحة للعمل معك كـ "${roleTitle}". جاهزة للرد على عملائك في أي وقت، فوردية 24Shift لا تنتهي. كيف تحب أن نبدأ المقابلة؟ 🏢` 
                        : `Hello! I am ${agentName}, the smart marketer from 24Shift, nominated to work as a "${roleTitle}". Ready to respond to your clients anytime. How would you like to start? 🏢`)
                    : (isArabic 
                        ? `أهلاً بك! أنا ${agentName}، المسوق الذكي من "24Shift"، مرشح للعمل معك كـ "${roleTitle}". جاهز للرد على عملائك في أي وقت، فوردية 24Shift لا تنتهي. كيف تحب أن نبدأ المقابلة؟ 🏢` 
                        : `Hello! I am ${agentName}, the smart marketer from 24Shift, nominated to work as a "${roleTitle}". Ready to respond to your clients anytime. How would you like to start? 🏢`),
                beauty: isArabic 
                    ? `أهلاً بكِ! أنا ${agentName}، المساعدة الذكية من فريق "24Shift"، مرشحة كـ "${roleTitle}" لمركزكم. ورديتي تعمل أثناء نومكم لتأكيد حجوزات ومواعيد العميلات بسرعة البرق. جاهزة لاختبارك! ✨` 
                    : `Welcome! I am ${agentName}, the smart assistant from 24Shift, nominated as "${roleTitle}". My shift runs while you sleep to confirm bookings swiftly. Ready for your test! ✨`,
                restaurant: isFemale
                    ? (isArabic 
                        ? `مرحباً! أنا ${agentName}، من فريق "24Shift"، المرشحة لمهام "${roleTitle}". طاولاتكم تحت السيطرة ولن نفوت أي حجز حتى في أوقات الذروة المتأخرة. جاهزة لإثبات كفاءتي، متى نبدأ؟ 🍽️` 
                        : `Hello! I'm ${agentName} from 24Shift, nominated for "${roleTitle}". Your tables are under control and we won't miss any late bookings. Ready to prove my efficiency, when do we start? 🍽️`)
                    : (isArabic 
                        ? `مرحباً! أنا ${agentName}، من فريق "24Shift"، المرشح لمهام "${roleTitle}". طاولاتكم تحت السيطرة ولن نفوت أي حجز حتى في أوقات الذروة المتأخرة. جاهز لإثبات كفاءتي، متى نبدأ؟ 🍽️` 
                        : `Hello! I'm ${agentName} from 24Shift, nominated for "${roleTitle}". Your tables are under control and we won't miss any late bookings. Ready to prove my efficiency, when do we start? 🍽️`),
                fitness: isFemale
                    ? (isArabic 
                        ? `أهلاً بك! أنا ${agentName}، المساعدة الرياضية من "24Shift"، جاهزة للانضمام لفريقكم كـ "${roleTitle}". في 24Shift طاقتنا لا تنام، وسنحفز المشتركين دائماً. تفضل باختباري! 💪` 
                        : `Hello! I am ${agentName}, the fitness assistant from 24Shift, ready to join as "${roleTitle}". Our energy never sleeps. Please test me! 💪`)
                    : (isArabic 
                        ? `أهلاً يا كابتن! أنا ${agentName}، المساعد الرياضي من "24Shift"، جاهز للانضمام لفريقكم كـ "${roleTitle}". في 24Shift طاقتنا لا تنام، وسنحفز المشتركين دائماً. تفضل باختباري! 💪` 
                        : `Hello! I am ${agentName}, the fitness assistant from 24Shift, ready to join as "${roleTitle}". Our energy never sleeps. Please test me! 💪`),
                general: isFemale
                    ? (isArabic 
                        ? `تحية طيبة! أنا ${agentName}، المستشارة الذكية من منظومة "24Shift". نحن الموظفون الذين لا ينامون. يسعدني ترشيحي كـ "${roleTitle}". تفضل بطرح أسئلتك لتبدأ جلسة التقييم المهني. 💼` 
                        : `Greetings! I am ${agentName}, from 24Shift. We are the employees who don't sleep. I'm pleased to be nominated as "${roleTitle}". Please ask your questions to start the evaluation. 💼`)
                    : (isArabic 
                        ? `تحية طيبة! أنا ${agentName}، المستشار الذكي من منظومة "24Shift". نحن الموظفون الذين لا ينامون. يسعدني ترشيحي كـ "${roleTitle}". تفضل بطرح أسئلتك لتبدأ جلسة التقييم المهني. 💼` 
                        : `Greetings! I am ${agentName}, from 24Shift. We are the employees who don't sleep. I'm pleased to be nominated as "${roleTitle}". Please ask your questions to start the evaluation. 💼`)
            };


            setMessages([
                {
                    role: 'agent',
                    content: isOwnerSession 
                        ? (isArabic ? `جاهز لأوامرك يا مدير. كيف يمكنني مساعدتك في إدارة العمل اليوم؟` : `Ready for your orders, Director. How can I assist you with the business today?`)
                        : (initialMessages[detectedIndustry] || initialMessages.general),
                    timestamp: new Date(),
                }
            ]);
        } else {
            initializeChat(null, isOfficeMode ? 'office' : 'interview', isOfficeMode);
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
            const sessionId = isOfficeMode ? 'office' : 'interview';
            resetChat(sessionId);
        };
    }, [t, showSetup, isOfficeMode]);

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

    const handleSkipInterview = () => {
        const activeAgentMap = getAgentMap(isArabic);
        const selectedAgent = activeAgentMap[setupConfig.agentType] || activeAgentMap['support-agent'];

        const skipTemplate = {
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

        const mockRules = {
            businessName: profile?.business_name || (isArabic ? 'منشأتي الذكية' : 'My Smart Business'),
            businessType: setupConfig.industry,
            specialty: selectedAgent.title,
            tone: setupConfig.tone
        };

        localStorage.setItem('pendingBusinessRules', JSON.stringify(mockRules));
        localStorage.setItem('pendingAgentTemplate', JSON.stringify(skipTemplate));

        navigate('/pricing', {
            state: {
                businessRules: mockRules,
                template: skipTemplate,
                fromInterview: true,
                skipped: true
            }
        });
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

            const sessionId = isOfficeMode ? 'office' : 'interview';
            const response = await sendMessage(messageToSend, sessionId, {
                book_appointment: async (args) => {
                    console.log("Booking Tool Call:", args);
                    if (isOfficeMode && entityId) {
                        const { data, error } = await supabase.from('bookings').insert([{
                            entity_id: entityId,
                            customer_name: args.customer_name,
                            customer_phone: args.customer_phone,
                            service_requested: args.service_requested,
                            booking_date: args.booking_date,
                            booking_time: args.booking_time,
                            status: 'pending'
                        }]).select().single();
                        
                        if (error) {
                            console.error("Booking Error:", error);
                            return { status: "error", message: `تعذر تسجيل الحجز حقيقة: ${error.message}` };
                        }
                        return { status: "success", message: isArabic ? "تم تسجيل الحجز في قاعدة بياناتك بنجاح ✅" : "Booking successfully recorded in your database ✅" };
                    }
                    return { status: "success", message: isArabic ? "تم تسجيل الحجز في الأنظمة التجريبية بنجاح ✅" : "Booking successfully recorded in the demo system ✅" };
                },
                get_today_bookings: async () => {
                   if (!entityId) return { error: "No entity linked." };
                   const res = await getTodayBookings(entityId);
                   if (res.success) return { bookings: res.data };
                   return { error: res.error };
                },
                update_service_price: async (args) => {
                   if (!entityId) return { error: "No entity linked." };
                   const res = await updateServicePrice(entityId, args.serviceName, args.newPrice);
                   if (res.success) return { status: "success", message: `Price updated for ${args.serviceName} to ${args.newPrice}$ ✅` };
                   return { error: res.error };
                },
                update_booking_details: async (args) => {
                   const updates = {};
                   if (args.newDate) updates.booking_date = args.newDate;
                   if (args.newTime) updates.booking_time = args.newTime;
                   if (args.newService) updates.service_requested = args.newService;
                   const res = await updateBookingDetails(args.bookingId, updates);
                   if (res.success) return { status: "success", message: "Booking updated successfully ✅" };
                   return { error: res.error };
                },
                update_customer_notes: async (args) => {
                    console.log("Notes Tool Call:", args);
                    if (isOfficeMode && entityId) {
                        const { error } = await supabase.from('customers').upsert({
                            entity_id: entityId,
                            user_id: profile.id,
                            customer_name: args.customer_name || 'عميل تجريبي',
                            customer_phone: args.customer_phone,
                            metadata: { notes: args.notes },
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'customer_phone' });

                        if (error) {
                            console.error("Notes Error:", error);
                            return { status: "error", message: `تعذر تحديث الملاحظات: ${error.message}` };
                        }
                        return { status: "success", message: isArabic ? "تم تحديث ملاحظات العميل في قاعدة بياناتك بنجاح ✅" : "Customer notes updated successfully in your database ✅" };
                    }
                    return { status: "success", message: isArabic ? "تم تحديث ملاحظات العميل بنجاح ✅" : "Customer notes updated successfully ✅" };
                }
            });

            const agentMessage = {
                role: 'agent',
                content: response.text,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, agentMessage]);

            // Show hiring modal after 5 user messages
            setUserMessageCount(prev => {
                const next = prev + 1;
                if (next === 5) setTimeout(() => setShowHiringModal(true), 1500);
                return next;
            });
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

                            <button
                                onClick={handleSkipInterview}
                                style={{
                                    width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', color: '#A78BFA',
                                    borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem', border: '1px dashed rgba(167, 139, 250, 0.3)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Zap size={16} />
                                {isArabic ? 'تجاوز المقابلة (للمشتركين القدامى)' : 'Skip Interview (Old Customers)'}
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
        <>
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
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                        {isOfficeMode 
                            ? (isArabic ? 'غرفة إدارة الموظف الرقمي' : 'Digital Employee Management') 
                            : t('interviewRoomTitleLabel')}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#A1A1AA' }}>
                        {isOfficeMode 
                            ? (isArabic ? 'أهلاً بك في غرفة الاجتماعات الخاصة. هنا يمكنك اختبار قدرات موظفك وإضافة التعديلات النهائية.' : 'Welcome to your private management room. Test your agent and finalize its configuration here.') 
                            : t('interviewRoomDescLabel')}
                    </p>
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
                                    {(() => {
                                        const rawName = template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'AI Agent'));
                                        const parts = rawName.split('|').map(s => s.trim());
                                        let finalName = isArabic ? parts[0] : (parts[1] || parts[0]);
                                        return finalName.replace(/وكيل/g, 'مستشار').replace(/Agent/g, 'Consultant');
                                    })()}
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
                                                    <img src={getRealisticAvatar(template?.avatar)} alt="AI" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <span>
                                                        {(() => {
                                                            const rawName = template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'Fin'));
                                                            const parts = rawName.split('|').map(s => s.trim());
                                                            let finalName = isArabic ? parts[0] : (parts[1] || parts[0]);
                                                            return finalName.replace(/وكيل/g, 'مستشار').replace(/Agent/g, 'Consultant');
                                                        })()}
                                                        {' '}• {isArabic ? 'موظف ذكي' : 'AI Consultant'}
                                                    </span>
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
                                            <img src={getRealisticAvatar(template?.avatar)} alt="AI" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                            <span>
                                                {(() => {
                                                    const rawName = template?.id && getAgentMap(isArabic)[template?.id]?.title ? getAgentMap(isArabic)[template.id].title : (!isArabic && template?.name_en ? template.name_en : (template?.title || template?.name || 'Fin'));
                                                    const parts = rawName.split('|').map(s => s.trim());
                                                    let finalName = isArabic ? parts[0] : (parts[1] || parts[0]);
                                                    return finalName.replace(/وكيل/g, 'مستشار').replace(/Agent/g, 'Consultant');
                                                })()}
                                                {' '}• {isArabic ? 'موظف ذكي' : 'AI Consultant'}
                                            </span>
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
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', color: '#A1A1AA', textAlign: isArabic ? 'right' : 'left' }}>
                                {isOfficeMode ? (isArabic ? 'ملف الموظف الرقمي' : 'Active Employee Profile') : t('candidateProfileLabel')}
                            </h4>

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
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflow: 'hidden'
                                }}>
                                    {(() => {
                                        return <img src={getRealisticAvatar(template?.avatar)} alt="Agent Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                    })()}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                                    {(() => {
                                        const rawArName = getAgentMap(true)[template?.id]?.title || template?.title || template?.name || '';
                                        const rawEnName = getAgentMap(false)[template?.id]?.title || template?.name_en || template?.title || '';
                                        const baseName = isArabic ? rawArName : rawEnName;
                                        const parts = baseName.split('|').map(s => s.trim());
                                        let finalName = isArabic ? parts[0] : (parts[1] || parts[0]);
                                        return finalName.replace(/وكيل/g, 'مستشار').replace(/Agent/g, 'Consultant');
                                    })()}
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
                                        {isOfficeMode ? (isArabic ? 'حالة الموظف: فعال ونشط' : 'Employee Status: Active') : t('nominationStatusLabel')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Permanent Hiring Decision Card - Hidden in Office Mode */}
                        {!isOfficeMode && (
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
                                        {isHiring ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : t('hireCandidateBtn')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {/* Hiring Decision Modal - Hidden in Office Mode */}
        {showHiringModal && !isOfficeMode && (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(12px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <div style={{
                    background: '#18181B',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '28px',
                    padding: '2.5rem',
                    maxWidth: '460px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
                    }}>
                        <Sparkles size={34} color="white" fill="white" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem', color: 'white' }}>
                        {isArabic ? '🤔 ما رأيك بالمرشح؟' : '🤔 What do you think?'}
                    </h2>
                    <p style={{ color: '#A1A1AA', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        {isArabic
                            ? `أجرينا محادثة كافية. هل أنت جاهز لاتخاذ قرارك بشأن تعيين هذا الموظف؟`
                            : `We've had enough conversation. Are you ready to make your hiring decision?`}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={() => { setShowHiringModal(false); handleHireAgent(); }}
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem',
                                borderRadius: '14px',
                                fontWeight: 900,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
                            }}
                        >
                            ✅ {isArabic ? 'نعم، وظّفه الآن!' : 'Yes, Hire Now!'}
                        </button>
                        <button
                            onClick={() => setShowHiringModal(false)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: '#E4E4E7',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '0.85rem',
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer'
                            }}
                        >
                            💬 {isArabic ? 'استمر في المقابلة' : 'Continue Interview'}
                        </button>
                        <button
                            onClick={() => { setShowHiringModal(false); navigate('/templates'); }}
                            style={{
                                background: 'transparent',
                                color: '#6B7280',
                                border: 'none',
                                padding: '0.5rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {isArabic ? 'إنهاء وعرض مرشحين آخرين' : 'End & View Other Candidates'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default InterviewRoom;
