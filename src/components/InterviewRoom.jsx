import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { sendMessage, extractBusinessRules, initializeChat, resetChat, getSupportResponse } from '../services/geminiService';
import { createAgent, saveContract, getCurrentUser, checkAndDeductCredit, getProfile, updateBusinessProfile } from '../services/supabaseService';
import {
    Stethoscope, Activity, Search, Scissors, Building, Utensils, Zap, Headset,
    User, Send, CheckCircle2, Briefcase, Clock, Shield, Sparkles
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

const InterviewRoom = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [template, setTemplate] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHireButton, setShowHireButton] = useState(false);
    const [isHiring, setIsHiring] = useState(false);

    const [agent, setAgent] = useState(null);
    const [profile, setProfile] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [businessData, setBusinessData] = useState(null);
    const [credits, setCredits] = useState(null);

    useEffect(() => {
        const initializeWithProfile = async () => {
            // 1. Check for authenticated user profile
            const { user } = await getCurrentUser();
            let profileDetails = "";
            let detectedIndustry = 'general';

            if (user) {
                const p = await getProfile(user.id);
                if (p.success && p.data) {
                    setProfile(p.data);
                    const d = p.data;
                    const type = d.business_type?.toLowerCase() || '';
                    if (type.includes('طب') || type.includes('صحي') || type.includes('clinic')) detectedIndustry = 'medical';
                    else if (type.includes('عقار') || type.includes('estate')) detectedIndustry = 'realestate';
                    else if (type.includes('تجميل') || type.includes('salon') || type.includes('beauty')) detectedIndustry = 'beauty';
                    else if (type.includes('مطعم') || type.includes('restau')) detectedIndustry = 'restaurant';
                    else if (type.includes('رياض') || type.includes('gym') || type.includes('club') || type.includes('fit')) detectedIndustry = 'fitness';

                    profileDetails = `
المعلومات الرسمية للمنشأة المتعاقد معها:
- اسم المنشأة: ${d.business_name}
- نوع النشاط: ${d.business_type}
- ساعات العمل: ${d.working_hours}
- الخدمات: ${d.services}
- نبذة إضافية: ${d.description}
- نبرة التواصل المطلوبة: ${d.branding_tone}

**قاعدة المعرفة والتدريب الداخلي (هام جداً):**
${d.knowledge_base || "لا توجد بروتوكولات إضافية حالياً."}

يجب الالتزام التام بهذه المعلومات وبناءً ردودك بناءً على قاعدة المعرفة المذكورة أعلاه.`;
                }
            }

            // 2. Load template from local storage
            const savedTemplate = localStorage.getItem('agentTemplate');
            if (savedTemplate) {
                const parsed = JSON.parse(savedTemplate);
                setTemplate({ ...parsed, detectedIndustry });
                setAgent(parsed); // Set agent for the new logic

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

                const customPrompt = `أنت الآن تخضع لمقابلة توظيف لدور: ${parsed.title}.
تخصصك الدقيق هو: ${parsed.specialty}.
القطاع الذي تعمل فيه المنشأة: ${detectedIndustry}.
${industryContext[detectedIndustry] || ""}

الخدمات المتوقعة منك: ${parsed.services.join('، ')}.
ساعات العمل المطلوبة (افتراضية): من ${parsed.workingHours.start} إلى ${parsed.workingHours.end}.
مدة الموعد: ${parsed.appointmentDuration} دقيقة.

${profileDetails}

نبرة صوتك وأسلوبك يجب أن تكون: ${toneDescription[parsed.tone] || toneDescription[parsed.branding_tone] || 'احترافية'}.

**قواعد المقابلة وعناصر الشخصية:**
1. ابدأ بتقديم نفسك كمرشح خبير في قطاع "${detectedIndustry}".
2. استخدم مصطلحات مهنية تليق بقطاعك (مثال: "المرضى" في الطبي، "المستثمرين" في العقار، "الضيف" في الضيافة).
3. اشرح كيف ستتعامل مع الخدمات المذكورة أعلاه بذكاء.
4. اطرح سؤالاً ذكياً على صاحب العمل بخصوص كيف يفضل التعامل مع "العملاء" في منشأته تحديداً.
5. لا تطلب التوظيف مباشرة، بل أظهر أنك إضافة استراتيجية للمنشأة.
6. اجعل ردودك مركزة، قصيرة، ومباشرة.`;

                initializeChat(customPrompt, 'interview');

                const initialMessages = {
                    medical: `تحية طيبة دكتور. لقد اطلعت على ملف عيادتكم وأدرك تماماً أهمية الدقة في مواعيد المرضى والخصوصية الطبية. بصفتي ${parsed.title}، كيف يمكنني مساعدتكم في تنظيم تدفق الحالات اليوم؟ 🩺`,
                    realestate: `أهلاً بك. في سوق العقار، الثانية الواحدة قد تساوي صفقة ضائعة. أنا جاهز لإدارة استفسارات المشترين وعرض الوحدات العقارية بأفضل صورة كـ ${parsed.title}. من أي شريحة عملاء نبدأ اليوم؟ 🏢`,
                    beauty: `أهلاً بكي. يسعدني جداً أن أكون الواجهة الرقمية الأنيقة لمركزكم. كـ ${parsed.title}، سأحرص على توفير تجربة حجز راقية تليق بعميلاتكم. كيف ننسق جداول الخبيرات اليوم؟ ✨`,
                    restaurant: `مرحباً. يسعدني الانضمام لفريق الضيافة كـ ${parsed.title}. سأقوم بإدارة الطاولات وضمان عدم ضياع أي حجز حتى في أوقات الذروة. هل نركز على حجوزات الـ VIP أولاً؟ 🍽️`,
                    fitness: `أهلاً يا بطل! كـ ${parsed.title}، أنا هنا لأضمن أن الكل ملتزم بتمارينه واشتراكاته. سأقوم بتنظيم حصص التدريب وتحفيز الأعضاء للانضمام. مستعدون للبدء؟ 💪`,
                    general: `تحية طيبة. أنا مستعد لتولي مهام ${parsed.title} ورفع كفاءة عملياتكم الرقمية. لقد قمت بدراسة متطلبات منشأتكم، كيف تود أن نبدأ جلسة التقييم المهني؟ 💼`
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

        initializeWithProfile();

        return () => {
            resetChat('interview');
        };
    }, [t]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Show hire button after 3+ exchanges
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length >= 3) {
            setShowHireButton(true);
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            // 1. Credit Check & Deduction
            const { user } = await getCurrentUser();
            if (user) {
                // Use template cost or default to 1
                const cost = template?.costPerMessage || 1;
                const creditResult = await checkAndDeductCredit(user.id, cost);
                if (!creditResult.success) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: `⚠️ ${creditResult.error}`,
                            timestamp: new Date(),
                        }
                    ]);
                    setIsLoading(false);
                    return;
                }

                // 2. "Tired Agent" logic if credits are low
                if (creditResult.isLow) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: `أيها المدير، لقد أنجزتُ الكثير اليوم! رصيدي الرقمي أوشك على النفاد (بقي ${creditResult.remaining} وحدات)، هل يمكننا تجديد العقد لنستمر في تنظيم أعمالك بنجاح؟ 🔋`,
                            timestamp: new Date(),
                        }
                    ]);
                }
            }

            // 3. Specialized logic for Support Agent vs Standard Interview
            let response;
            if (agent?.id === 'support-agent' && profile?.knowledge_base) {
                response = await getSupportResponse(inputMessage, profile.knowledge_base);
            } else {
                response = await sendMessage(inputMessage, 'interview');
            }

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
                content: t('error'),
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
            // Extract business rules from conversation
            const extractionResult = await extractBusinessRules(messages);

            if (!extractionResult.success) {
                alert('حدث خطأ في استخراج البيانات. يرجى المحاولة مرة أخرى.');
                setIsHiring(false);
                return;
            }

            const businessRules = extractionResult.data;

            // Create agent in database
            const agentResult = await createAgent({
                name: businessRules.businessName || 'AI Agent',
                specialty: businessRules.businessType || 'General',
            });

            if (!agentResult.success) {
                alert('حدث خطأ في إنشاء الوكيل. يرجى المحاولة مرة أخرى.');
                setIsHiring(false);
                return;
            }

            const agent = agentResult.data;

            // Save contract
            const contractResult = await saveContract(agent.id, businessRules);

            if (!contractResult.success) {
                alert('حدث خطأ في حفظ العقد. يرجى المحاولة مرة أخرى.');
                setIsHiring(false);
                return;
            }

            // Store agent ID in localStorage for dashboard
            localStorage.setItem('currentAgentId', agent.id);

            // Show success message
            alert(t('agentHired'));

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Hire agent error:', error);
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsHiring(false);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const AgentIcon = template?.id ? (iconMap[template.id] || User) : User;

    return (
        <div className="ai-aura-container">
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
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('interviewTitle')}</h2>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></div>
                                <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>متصل الآن</span>
                            </div>
                        </div>

                        <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                            {messages.map((message, index) => (
                                <div key={index} className={`chat-message ${message.role}`} style={{
                                    display: 'flex',
                                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
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
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {message.role === 'user' ? <User size={20} color="white" /> : <AgentIcon size={20} color="#A1A1AA" />}
                                    </div>
                                    <div style={{ maxWidth: '80%' }}>
                                        <div style={{
                                            padding: '1rem 1.25rem',
                                            borderRadius: message.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                                            background: message.role === 'user' ? '#8B5CF6' : '#27272A',
                                            color: message.role === 'user' ? 'white' : '#E4E4E7',
                                            fontSize: '0.95rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            lineHeight: '1.6'
                                        }}>
                                            {message.content}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#71717A',
                                            marginTop: '0.5rem',
                                            textAlign: message.role === 'user' ? 'left' : 'right'
                                        }}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="chat-message agent" style={{ display: 'flex', gap: '1rem' }}>
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

                        <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', background: '#18181B' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('chatPlaceholder')}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    borderRadius: '16px',
                                    background: '#27272A',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    paddingRight: '1rem'
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
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', color: '#A1A1AA' }}>ملف المرشح</h4>

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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#4ADE80', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Shield size={16} />
                                        حالة الترشيح: مؤهل جداً
                                    </p>
                                </div>
                            </div>
                        </div>

                        {showHireButton && (
                            <div className="card p-xl animate-fade-in" style={{ background: '#8B5CF6', color: 'white', borderRadius: '24px', textAlign: 'center', border: 'none', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}>
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
                                    style={{ background: 'white', color: '#7C3AED', width: '100%', fontWeight: 900, fontSize: '1rem', padding: '1rem', borderRadius: '14px', border: 'none' }}
                                >
                                    {isHiring ? t('loading') : t('hireAgent')}
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
