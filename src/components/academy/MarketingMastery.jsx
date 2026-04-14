import React from 'react';
import AcademyLayout from '../layouts/AcademyLayout';
import { useLanguage } from '../../LanguageContext';
import { 
    Zap, Target, DollarSign, MessageSquare, Briefcase, 
    TrendingUp, ShieldCheck, Users, ArrowRight, CheckCircle2,
    FileText, Presentation, PenTool, Layout, Rocket, BarChart3,
    Smartphone, Globe, Award, Sparkles, ChevronRight, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MarketingMastery = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const isArabic = language === 'ar';
    const t = (ar, en) => isArabic ? ar : en;

    // Refined Typography - Clearer and more professional
    const fontSize = {
        h1: isArabic ? '2.4rem' : '2.2rem',
        h2: isArabic ? '1.6rem' : '1.5rem',
        h3: isArabic ? '1.2rem' : '1.1rem',
        body: isArabic ? '1rem' : '0.95rem',
        small: isArabic ? '0.85rem' : '0.8rem'
    };

    const coreSteps = [
        {
            id: 'products',
            icon: <Briefcase color="#A78BFA" size={20} />,
            title: t('باقة المنتجات المربحة', 'The Profitable Product Suite'),
            description: t('ما هي الخدمات التي ستقوم ببيعها فعلياً؟', 'What services will you actually be selling?'),
            bullets: [
                t('الموظف البيعي: إغلاق الصفقات عبر الواتساب والموقع 24/7.', 'The Sales Closer: Closing deals 24/7 on WhatsApp & Web.'),
                t('دعم العملاء الذكي: تقليل تكاليف الدعم البشري بنسبة 70%.', 'Smart CS: Reducing human support costs by 70%.'),
                t('منسق المواعيد: حجز المواعيد آلياً وتنظيم الكالندر.', 'Appointment Setter: Automated booking & calendar sync.')
            ],
            link: '/agents',
            linkText: t('استكشف الموظفين الرقميين', 'Explore Digital Employees')
        },
        {
            id: 'roadmap',
            icon: <TrendingUp color="#10B981" size={20} />,
            title: t('خارطة الطريق (0-10 عملاء)', 'The 0-to-10 Client Roadmap'),
            description: t('خطوات واضحة لتوسيع وكالتك من الصفر.', 'Clear steps to scale your agency from scratch.'),
            bullets: [
                t('المرحلة 1: أول 3 عملاء - التركيز على قصص النجاح والتقييمات.', 'Phase 1: First 3 Clients - Focus on results & testimonials.'),
                t('المرحلة 2: نطاق الـ 10 عملاء - تفعيل رسوم التأسيس ($500+).', 'Phase 2: The 10-Client Scale - Implement Setup Fees ($500+).'),
                t('المرحلة 3: الأتمتة - الاعتماد على هوامش الرصيد والاشتراكات.', 'Phase 3: Full Automation - Rely on Usage Margins.')
            ],
            link: '/pricing',
            linkText: t('راجع خطط الأسعار', 'Review Pricing')
        }
    ];

    const salesTools = [
        {
            title: t('استراتيجية "Golden Demo"', 'The Golden Demo Strategy'),
            content: t(
                "أبهر العميل ببناء بوت تجريبي بسيط باسم شركته في 5 دقائق فقط أثناء الاجتماع. لا شيء يقنع العميل أكثر من رؤية عمله مؤتمتاً أمام عينيه.",
                "WOW your client by building a sample bot with their company name in 5 mins during the call. Nothing sells better than seeing automation live."
            ),
            cta: t('جرب بناء بوت الآن', 'Try Building a Bot'),
            ctaLink: '/hire-agent'
        },
        {
            title: t('الرد على الاعتراضات (Objections)', 'Handling Common Objections'),
            content: t(
                "عندما يسأل العميل: 'هل هو آمن؟' أجب: 'نحن نستخدم تشفير طبقي ومعايير أمنية عالمية'. عندما يسأل: 'ماذا لو أخطأ؟' أجب: 'البوت يتعلم من قاعدة بياناتك الخاصة ولا يخترع إجابات'.",
                "When asked: 'Is it safe?' Reply: 'We use enterprise-grade encryption'. When asked: 'What if it fails?' Reply: 'The bot only uses your specific knowledge base'."
            ),
            cta: t('اقرأ المزيد في المدونة', 'Read More in Blog'),
            ctaLink: '/blog'
        }
    ];

    return (
        <AcademyLayout title={t('ماستري التسويق والمبيعات', 'Marketing Mastery')}>
            <div className="container" style={{ paddingBottom: '6rem' }}>
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            background: 'rgba(139, 92, 246, 0.08)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            borderRadius: '30px',
                            color: '#A78BFA',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <Award size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {t('دليل تشغيل الوكالات المعتمد', 'Certified Agency Playbook')}
                        </span>
                    </motion.div>
                    
                    <h1 style={{ 
                        fontSize: fontSize.h1, 
                        fontWeight: 800, 
                        marginBottom: '1rem', 
                        lineHeight: 1.2,
                        color: 'var(--color-text-main)'
                    }}>
                        {t('كيف تبني وتوسّع وكالة ', 'Scale Your ')}
                        <span style={{ color: '#8B5CF6' }}>
                            {t('أتمتة ذكاء اصطناعي', 'AI Automation Agency')}
                        </span>
                    </h1>
                    
                    <p style={{ 
                        fontSize: fontSize.body, 
                        color: 'var(--color-text-secondary)', 
                        maxWidth: '700px', 
                        margin: '0 auto', 
                        lineHeight: 1.6
                    }}>
                        {t('لا تكتفِ بالجانب التقني. هنا ستتعلم كيف تحوّل مهاراتك إلى اشتراكات شهرية متدفقة وعملاء دائمين.', 'Don\'t just focus on tech. Learn how to turn your skills into recurring revenue and permanent clients.')}
                    </p>
                </div>

                {/* Core Curriculum Grid */}
                <div className="grid grid-2" style={{ gap: '2rem', marginBottom: '4rem' }}>
                    {coreSteps.map((step, i) => (
                        <div key={i} className="card" style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                                    {step.icon}
                                </div>
                                <h3 style={{ fontSize: fontSize.h2, fontWeight: 700, color: 'var(--color-text-main)' }}>
                                    {step.title}
                                </h3>
                            </div>
                            <p style={{ fontSize: fontSize.small, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{step.description}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                                {step.bullets.map((bullet, j) => (
                                    <div key={j} style={{ display: 'flex', gap: '10px', fontSize: fontSize.small, color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                                        <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>{bullet}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => navigate(step.link)}
                                className="btn-secondary" 
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {step.linkText} <ChevronRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Sales Tools & Hacks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: fontSize.h2, fontWeight: 800, color: 'var(--color-text-main)', textAlign: 'center' }}>
                        {t('أدوات الإغلاق السريع', 'Rapid Closing Tools')}
                    </h2>
                    <div className="grid grid-2" style={{ gap: '2rem' }}>
                        {salesTools.map((tool, i) => (
                            <div key={i} className="card" style={{ 
                                padding: '2.5rem', 
                                background: i === 0 ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                                border: i === 0 ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <h4 style={{ fontSize: fontSize.h3, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '1rem' }}>{tool.title}</h4>
                                <p style={{ fontSize: fontSize.body, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>{tool.content}</p>
                                <button 
                                    onClick={() => navigate(tool.ctaLink)}
                                    style={{ 
                                        background: 'transparent', 
                                        border: '1px solid var(--color-border-subtle)', 
                                        color: 'var(--color-text-main)', 
                                        padding: '10px 20px', 
                                        borderRadius: '10px', 
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {i === 0 ? <PlayCircle size={16} /> : <FileText size={16} />}
                                    {tool.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action: Start Scaling */}
                <div style={{ 
                    padding: '3.5rem 2rem', 
                    borderRadius: '40px', 
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', 
                    border: '1px solid var(--color-border-subtle)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: fontSize.h2, fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
                        {t('هل أنت جاهز للبدء؟', 'Ready to Start Scaling?')}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: fontSize.body, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        {t('لا تنتظر الكمال. ابدأ بأول عميل اليوم، طبق استراتيجية العرض الذهبي، وشاهد النتائج بنفسك.', 'Don\'t wait for perfection. Start with your first client today, apply the Golden Demo, and see the results.')}
                    </p>
                    <button 
                        onClick={() => navigate('/templates')}
                        className="btn btn-primary" 
                        style={{ padding: '15px 40px', fontSize: '1.1rem', borderRadius: '20px' }}
                    >
                        {t('تصفح قوالب العمل الجاهزة', 'Browse Ready Templates')}
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Footer Badges */}
                <div style={{ marginTop: '5rem', paddingTop: '3rem', borderTop: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                            <ShieldCheck size={16} color="#10B981" /> {t('محتوى حصري للشركاء', 'Partner Exclusive Content')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                            <Rocket size={16} color="#8B5CF6" /> {t('تحديثات تدريبية مستمرة', 'Continuous Training Updates')}
                        </div>
                    </div>
                </div>
            </div>
        </AcademyLayout>
    );
};

export default MarketingMastery;
