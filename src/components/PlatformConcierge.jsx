import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, initializeChat } from '../services/geminiService';
import { getPlatformSettings } from '../services/adminService';
import { useLanguage } from '../LanguageContext';
import { supabase, getCurrentUser } from '../services/supabaseService';
import { saveConciergeConversation, getUserConversation } from '../services/conciergeService';

const PlatformConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState(null);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);
    const { t, language } = useLanguage();

    const loadConfig = async (isRefreshing = false) => {
        try {
            const managerConfig = await getPlatformSettings('manager_ai_config');
            setConfig(managerConfig);

            if (managerConfig) {
                const maxLengthConstraintAr = managerConfig.max_length ? `\n\nتنبيه هام جداً: يجب أن لا يتجاوز طول ردك ${managerConfig.max_length} حرفاً بأي حال من الأحوال. كوني مختصرة ومباشرة جداً.` : '';
                const maxLengthConstraintEn = managerConfig.max_length ? `\n\nCRITICAL: Your response MUST NOT exceed ${managerConfig.max_length} characters. Be extremely concise and direct.` : '';

                const systemPromptAr = managerConfig.prompt_ar ? `${managerConfig.prompt_ar}\n\nمعلومات المنصة: ${managerConfig.knowledge}${maxLengthConstraintAr}` : `
أنتِ "نورة"، المستشارة الرقمية المتميزة لمنصة 24Shift.
مهمتكِ:
1. مساعدة العملاء بأسلوب لبق واحترافي يشبه أرقى مكاتب الاستشارات.
2. توجيههم لاختيار "نخبة الموظفين الرقميين" الأنسب لنمو أعمالهم.
3. التأكيد على أن هؤلاء الموظفين هم "شركاء نجاح" يعملون بدقة متناهية 24/7.
4. إذا طلبوا تخصيصاً، وجهيهم بلهجة ودودة لتقديم طلب خاص.
5. تجنبي المصطلحات التقنية المعقدة، ركزي على "راحة البال" و "النمو المستدام".
6. الرجاء التحدث باللغة العربية.

معلومات المنصة: ${managerConfig.knowledge}${maxLengthConstraintAr}`;

                const systemPromptEn = managerConfig.prompt_en ? `${managerConfig.prompt_en}\n\nPlatform Knowledge: ${managerConfig.knowledge}${maxLengthConstraintEn}` : `
You are "Noura", the distinguished digital consultant for 24Shift platform.
Your mission:
1. Assist clients in a polite and professional manner akin to top-tier consulting firms.
2. Guide them to select the most suitable "elite digital employees" for their business growth.
3. Emphasize that these employees are "success partners" operating with extreme precision 24/7.
4. If they request customization, guide them warmly to submit a custom request.
5. Avoid complex technical terms; focus on "peace of mind" and "sustainable growth".
6. Please speak in English.

Platform Knowledge: ${managerConfig.knowledge}${maxLengthConstraintEn}`;

                initializeChat(language === 'ar' ? systemPromptAr : systemPromptEn, 'concierge');
                
                // Only set default greeting if we're not middle-conversation
                if (messages.length === 0 || isRefreshing) {
                    const initialGreetingAr = `أهلاً بك. أنا نورة، مستشارتكِ في المنصة. كيف يمكنني مساعدتكِ اليوم في تطوير أعمالكِ وتخفيف أعباءكِ الإدارية؟ ✨`;
                    const initialGreetingEn = `Welcome. I am Noura, your platform consultant. How can I assist you today in developing your business and easing your administrative burdens? ✨`;

                    setMessages([{
                        role: 'agent',
                        content: language === 'ar' ? initialGreetingAr : initialGreetingEn
                    }]);
                }
            }
        } catch (err) {
            console.error('Error loading concierge config:', err);
        }
    };

    // Initial load
    useEffect(() => {
        const init = async () => {
            const { user: currUser } = await getCurrentUser();
            setUser(currUser);
            
            if (currUser) {
                const { data: history } = await getUserConversation(currUser.id);
                if (history?.messages?.length > 0) {
                    setMessages(history.messages);
                } else {
                    loadConfig();
                }
            } else {
                loadConfig();
            }
        };
        init();
    }, [language]);

    // Re-sync whenever the window is opened to ensure latest admin settings
    useEffect(() => {
        if (isOpen) {
            loadConfig(messages.length === 0);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for custom event to open the concierge window
    useEffect(() => {
        const handleOpenConcierge = (e) => {
            setIsOpen(true);
            
            // If it's a special request (like Elite/Enterprise from Pricing)
            if (e.detail?.type === 'elite') {
                const eliteGreetingAr = `سعيدة جداً باهتمامكم بالانضمام لنخبة شركائنا المتميزين. بصفتي مستشارة المنصة، سأكون معكِ خطوة بخطوة لتصميم حلول تقنية ذكية مفصلة خصيصاً لتناسب تطلعات منشأتكِ الفاخرة. ما هي المتطلبات الخاصة أو التخصصات التي تودين البدء بها؟ ✨`;
                const eliteGreetingEn = `I am absolutely delighted by your interest in joining our elite circle of partners. As your platform consultant, I will be with you step-by-step to design smart technical solutions tailored specifically to your luxury facility's ambitions. What specific requirements or specialties would you like to start with? ✨`;
                
                setMessages([{
                    role: 'agent',
                    content: language === 'ar' ? eliteGreetingAr : eliteGreetingEn
                }]);
            }
        };
        window.addEventListener('open-concierge', handleOpenConcierge);
        return () => window.removeEventListener('open-concierge', handleOpenConcierge);
    }, [language]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const response = await sendMessage(input, 'concierge');
        if (response.success) {
            const agentMsg = { role: 'agent', content: response.text };
            const updatedMessages = [...newMessages, agentMsg];
            setMessages(updatedMessages);
            
            // Save to database
            if (user) {
                await saveConciergeConversation(user.id, updatedMessages);
            }
        }
        setIsLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '2.5rem',
                    left: '2.5rem',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '1.75rem',
                    border: 'none',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                    <img src="/noura_avatar.png" alt="Noura Concierge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '2.5rem',
                left: '2.5rem',
                width: '400px',
                height: '550px',
                backgroundColor: 'rgba(24, 24, 27, 0.95)', // Solid dark background 
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)', // Stronger shadow
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(139, 92, 246, 0.3)' // Subtle purple border
            }}
            className="animate-fade-in"
        >
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(39, 39, 42, 0.9)', // Slightly lighter header
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#18181B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <img src="/noura_avatar.png" alt="Noura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>{language === 'ar' ? 'نورة' : 'Noura'}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{t('nouraStatus')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    &times;
                </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#09090B' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            maxWidth: '80%',
                            padding: '0.75rem 1rem',
                            borderRadius: '16px',
                            fontSize: '0.9rem',
                            backgroundColor: msg.role === 'user' ? '#8B5CF6' : '#27272A',
                            color: msg.role === 'user' ? 'white' : '#E4E4E7',
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: msg.role === 'user' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: '1rem', background: '#18181B', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        style={{ marginTop: 0, paddingRight: '1rem', paddingLeft: '1rem', background: '#27272A', border: '1px solid rgba(255,255,255,0.1)', textAlign: language === 'ar' ? 'right' : 'left' }}
                        placeholder={t('nouraPlaceholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '12px' }} disabled={isLoading}>
                        🚀
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PlatformConcierge;
