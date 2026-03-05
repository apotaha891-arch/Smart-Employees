import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { HelpCircle, Search, ChevronDown, ChevronUp, MessageCircle, Bot, Zap, Settings, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpCenter = () => {
    const { t, language } = useLanguage();
    const isArabic = language === 'ar';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [openFaq, setOpenFaq] = useState(null);

    const categories = [
        { id: 'all', icon: BookOpen, label: isArabic ? 'الكل' : 'All' },
        { id: 'getting_started', icon: Zap, label: isArabic ? 'البداية السريعة' : 'Getting Started' },
        { id: 'hiring', icon: Bot, label: isArabic ? 'توظيف الموظفين' : 'Hiring Agents' },
        { id: 'setup', icon: Settings, label: isArabic ? 'الإعداد والتهيئة' : 'Setup & Config' },
        { id: 'integrations', icon: MessageCircle, label: isArabic ? 'الربط والمنصات' : 'Integrations' }
    ];

    const faqs = [
        {
            id: 1,
            categoryId: 'getting_started',
            question: isArabic ? 'كيف أبدأ في استخدام منصة 24Shift؟' : 'How do I start using 24Shift?',
            answer: isArabic
                ? 'البدء سهل جداً! بعد تسجيل الدخول، سيطلب منك النظام تحديد قطاع عملك (مثل: صالون، عيادة، عقارات). بعد ذلك، ستنتقل إلى لوحة التحكم حيث يمكنك النقر على زر "+ استقطاب موظف جديد" لاختيار الموظف الرقمي الأنسب لعملك وبدء تدريبه.'
                : 'Getting started is easy! After logging in, select your business sector (e.g., salon, clinic, real estate). Then, go to your dashboard and click "+ Hire New Agent" to choose your digital employee and start training them.'
        },
        {
            id: 2,
            categoryId: 'hiring',
            question: isArabic ? 'ما الفرق بين قوالب الموظفين المختلفة؟' : 'What is the difference between agent templates?',
            answer: isArabic
                ? 'كل قالب مصمم ليلعب دوراً محدداً داخل قطاع عملك. فمثلاً في قطاع التجميل، "مسؤول الاستقبال" يركز على حجز المواعيد والرد على استفسارات الأسعار، بينما "مستشار الأناقة" يركز على تقديم النصائح وبيع الخدمات الإضافية. يمكنك توظيف عدة موظفين في نفس الوقت لأدوار مختلفة.'
                : 'Each template is designed for a specific role in your sector. In Beauty, a "Receptionist" focuses on bookings, while a "Style Consultant" focuses on advice and upsells. You can hire multiple agents for different roles.'
        },
        {
            id: 3,
            categoryId: 'setup',
            question: isArabic ? 'كيف أدرب الموظف الرقمي على تفاصيل عملي؟' : 'How do I train the digital agent on my business?',
            answer: isArabic
                ? 'بعد توظيف الموظف، يمكنك الذهاب إلى "إعداد المنشأة" (Setup). هناك يمكنك كتابة تفاصيل خدماتك، أوقات العمل، وسياسات الشركة، أو حتى رفع ملفات PDF تحتوي على قائمة أسعارك أو القواعد الخاصة بعملك. الموظف الرقمي سيحفظ كل هذا ويرد بناءً عليه فقط.'
                : 'After hiring, go to "Setup". There you can type your services, working hours, and policies, or upload PDF files like price lists. The digital agent will learn all this and reply based strictly on it.'
        },
        {
            id: 4,
            categoryId: 'integrations',
            question: isArabic ? 'كيف أربط الموظف برقم الواتساب الخاص بي؟' : 'How do I connect the agent to my WhatsApp?',
            answer: isArabic
                ? 'من لوحة التحكم (الرئيسية)، اذهب إلى قسم الموظفين وانقر على "ربط الواتساب" تحت صورة الموظف المطلوب. ستحتاج إلى إدخال Phone Number ID و Access Token من حساب Meta للمطورين الخاص بك. إذا كنت لا تعرف كيف تحصل عليهما، يمكنك التواصل مع فريق الدعم الفني لمساعدتك خطوة بخطوة.'
                : 'From the dashboard, go to Agents and click "Link WhatsApp" under your agent. You will need your Phone Number ID and Access Token from your Meta Developer account. If you need help, contact our support team.'
        },
        {
            id: 5,
            categoryId: 'integrations',
            question: isArabic ? 'لماذا يظهر كود التيليجرام ولم يعمل الموظف بعد؟' : 'Why is the Telegram bot not working after putting the code?',
            answer: isArabic
                ? 'تأكد أولاً أنك أخذت رمز البوت (Bot Token) الصحيح من @BotFather في تيليجرام وأنه بوضعية "Active" (مفعل) في لوحة التحكم لدينا. يعمل الموظف تلقائياً ليرد على العملاء بمجرد حفظ الإعدادات وتفعيل الزر الأخضر بجانب اسمه.'
                : 'Ensure you copied the correct Bot Token from @BotFather on Telegram and that the agent status is "Active" in your dashboard. The agent will reply automatically once the green button is toggled on.'
        },
        {
            id: 6,
            categoryId: 'getting_started',
            question: isArabic ? 'هل يمكنني إيقاف الموظف مؤقتاً؟' : 'Can I pause the agent temporarily?',
            answer: isArabic
                ? 'نعم بالتأكيد! بجانب كل موظف في لوحة التحكم يوجد زر (إيقاف/تفعيل). عند الإيقاف، لن يرد الموظف على أي رسائل جديدة حتى تقوم بتفعيله مرة أخرى.'
                : 'Yes! Next to each agent in the dashboard is a toggle button (Pause/Activate). When paused, the agent will not reply to new messages until activated again.'
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || faq.categoryId === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
            {/* Header Area */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '3rem 1rem', background: 'var(--n8n-surface-card, rgba(255,255,255,0.03))', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', marginBottom: '1.5rem' }}>
                    <HelpCircle size={32} />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, white, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {isArabic ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}
                </h1>
                <p style={{ color: '#9CA3AF', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    {isArabic
                        ? 'تصفح الإجابات الشاملة خطوة بخطوة لكل ما تحتاجه لإدارة وتدريب موظفيك الرقميين.'
                        : 'Browse comprehensive step-by-step answers for everything you need to manage your digital agents.'}
                </p>

                {/* Search Bar */}
                <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
                    <Search size={20} style={{ position: 'absolute', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                        type="text"
                        placeholder={isArabic ? 'ابحث عن سؤال، مشكلة، أو أداة...' : 'Search for a question, issue, or tool...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 3rem',
                            background: '#111827',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '99px',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>

                {/* Categories Scroll/Wrap */}
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '99px',
                                    border: isActive ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : '#111827',
                                    color: isActive ? '#C4B5FD' : '#9CA3AF',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    fontWeight: isActive ? 600 : 400
                                }}
                            >
                                <Icon size={18} />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* FAQ List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px' }}>
                    {filteredFaqs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
                            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>{isArabic ? 'لم نتمكن من العثور على أي نتائج لبحثك.' : 'We could not find any results for your search.'}</p>
                        </div>
                    ) : (
                        filteredFaqs.map(faq => (
                            <div
                                key={faq.id}
                                style={{
                                    background: '#111827',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '1.5rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: isArabic ? 'right' : 'left'
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem', fontWeight: 600, paddingRight: isArabic ? '0' : '1rem', paddingLeft: isArabic ? '1rem' : '0' }}>
                                        {faq.question}
                                    </span>
                                    <div style={{ flexShrink: 0, color: openFaq === faq.id ? '#8B5CF6' : '#9CA3AF' }}>
                                        {openFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {openFaq === faq.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div style={{
                                                padding: '0 1.5rem 1.5rem',
                                                color: '#A1A1AA',
                                                lineHeight: 1.8,
                                                fontSize: '0.95rem'
                                            }}>
                                                <div style={{
                                                    paddingTop: '1rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>

                <div style={{
                    marginTop: '2rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                            {isArabic ? 'لم تجد إجابة لسؤالك؟' : 'Still need help?'}
                        </h3>
                        <p style={{ color: '#9CA3AF', margin: 0 }}>
                            {isArabic
                                ? 'تحدث مع "المستشارة الذكية" لمنصة 24Shift، جاهزة لإرشادك والإجابة على استفساراتك فوراً.'
                                : 'Talk to our "AI Consultant" for 24Shift, ready to guide you and answer your questions instantly.'}
                        </p>
                    </div>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-concierge'))}
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                        }}>
                        <Bot size={20} />
                        {isArabic ? 'تحدث مع المستشارة' : 'Talk to Consultant'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
