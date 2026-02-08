import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { sendMessage, extractBusinessRules, initializeChat, resetChat } from '../services/geminiService';
import { createAgent, saveContract, getCurrentUser, checkAndDeductCredit, getProfile } from '../services/supabaseService';

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

    useEffect(() => {
        const initializeWithProfile = async () => {
            // 1. Check for authenticated user profile
            const { user } = await getCurrentUser();
            let profileDetails = "";
            let detectedIndustry = 'general';

            if (user) {
                const profile = await getProfile(user.id);
                if (profile.success && profile.data) {
                    const d = profile.data;
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
                const creditResult = await checkAndDeductCredit(user.id);
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

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div className="page-header text-center" style={{ marginBottom: '3rem' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    background: template?.detectedIndustry === 'medical' ? '#ECFDF5' :
                        template?.detectedIndustry === 'realestate' ? '#F0F9FF' :
                            template?.detectedIndustry === 'beauty' ? '#FDF2F8' : 'var(--accent-soft)',
                    color: template?.detectedIndustry === 'medical' ? '#059669' :
                        template?.detectedIndustry === 'realestate' ? '#0284C7' :
                            template?.detectedIndustry === 'beauty' ? '#DB2777' : 'var(--accent)',
                    borderRadius: '30px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    border: '1px solid currentColor'
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
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>أنت الآن أمام كادر بشري رقمي متخصص تم اختياره بعناية لخدمتك</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                {/* Chat Section */}
                <div className="card" style={{
                    height: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="flex align-center gap-sm">
                            <span style={{ fontSize: '1.25rem' }}>💼</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>التقييم المهني المباشر</span>
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
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: message.role === 'user' ? 'var(--primary-light)' : '#E5E7EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem'
                                }}>
                                    {message.role === 'user' ? '👨‍💼' : template?.icon || '👤'}
                                </div>
                                <div style={{ maxWidth: '80%' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: message.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                        background: message.role === 'user' ? 'var(--primary)' : '#F3F4F6',
                                        color: message.role === 'user' ? 'white' : 'var(--text-main)',
                                        fontSize: '0.95rem',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {message.content}
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
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
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {template?.icon || '👤'}
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

                    <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={t('chatPlaceholder')}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isLoading}
                            style={{ flex: 1, borderRadius: '12px' }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !inputMessage.trim()}
                            style={{ borderRadius: '12px', padding: '0 1.5rem' }}
                        >
                            {isLoading ? t('sending') : t('sendMessage')}
                        </button>
                    </form>
                </div>

                {/* Candidate Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card p-xl" style={{ border: '1px solid var(--border-light)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.75rem' }}>ملف المرشح</h4>

                        <div className="text-center mb-xl">
                            <div style={{ width: '80px', height: '80px', background: '#F9FAFB', borderRadius: '20px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                {template?.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{template?.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>{template?.specialty}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.5rem' }}>المهارات والخدمات:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {template?.services ? template.services.map((s, i) => (
                                        <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'var(--accent-soft)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--accent)' }}>{s}</span>
                                    )) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>بانتظار تحديد المهام...</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.25rem' }}>الجدول الزمني:</label>
                                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>تغطية كاملة 24/7</p>
                            </div>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-soft)', borderRadius: '12px', border: '1px solid rgba(46, 125, 50, 0.2)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--success)', margin: 0, fontWeight: 800 }}>✨ حالة الترشيح: مؤهل جداً</p>
                            </div>
                        </div>
                    </div>

                    {showHireButton && (
                        <div className="card p-xl animate-fade-in" style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>جاهز لاتخاذ القرار؟</h4>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>بناءً على المحادثة، يبدو هذا المرشح مثالياً لثقافة منشأتك.</p>
                            <button
                                className="btn"
                                onClick={handleHireAgent}
                                disabled={isHiring}
                                style={{ background: 'var(--accent)', color: 'var(--primary)', width: '100%', fontWeight: 800 }}
                            >
                                {isHiring ? t('loading') : t('hireAgent')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewRoom;
