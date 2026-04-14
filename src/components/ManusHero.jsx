import React from 'react';
import { useLanguage } from '../LanguageContext';
import { MessageCircle, BrainCircuit, Monitor, Fingerprint, ShieldCheck } from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiMessenger, SiLine } from 'react-icons/si';

const ManusHero = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';

    const features = [
        {
            icon: <MessageCircle size={24} color="#8B5CF6" />,
            title: isArabic ? 'متصل بقنوات عملائك المفضلة' : 'Connected to Favorite Channels',
            description: isArabic ? 'يستقبل ويدير المحادثات عبر تيليجرام، واتساب، والمزيد لضمان رد فوري.' : 'Manages chats across Telegram, WhatsApp, and more for instant replies.'
        },
        {
            icon: <BrainCircuit size={24} color="#8B5CF6" />,
            title: isArabic ? 'خبرة مخصصة لأعمالك' : 'Expertise Tailored for You',
            description: isArabic ? 'قم بتدريبه على سياساتك، منتجاتك، وأسلوبك البيعي في دقائق معدودة.' : 'Train it on your policies, products, and sales style in minutes.'
        },
        {
            icon: <Monitor size={24} color="#8B5CF6" />,
            title: isArabic ? 'ذاكرة مؤسسية لا تنسى' : 'Unforgettable Corporate Memory',
            description: isArabic ? 'يحتفظ بسياق جميع المحادثات السابقة لتقديم تجربة شخصية لكل عميل.' : 'Retains the context of all previous chats to offer a personalized experience.'
        },
        {
            icon: <Fingerprint size={24} color="#8B5CF6" />,
            title: isArabic ? 'صوت واحد يمثل علامتك' : 'One Voice for Your Brand',
            description: isArabic ? 'يتحدث بلباقة واحترافية تعكس قيم علامتك التجارية في كل تفاعل.' : 'Speaks with politeness and professionalism reflecting your brand values.'
        }
    ];

    return (
        <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '6rem', direction: isArabic ? 'rtl' : 'ltr' }}>

            {/* The Visual Representation */}
            <div style={{ position: 'relative', height: '280px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem' }}>

                {/* Abstract Phone Outline */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    height: '250px',
                    border: '3px solid rgba(139, 92, 246, 0.1)',
                    borderRadius: '40px 40px 0 0',
                    borderBottom: 'none',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 0
                }}>
                    <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '4px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '2px' }}></div>
                </div>

                {/* Central Agent Pill */}
                <div style={{
                    background: '#FFFFFF', // Light card
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    zIndex: 2,
                    width: '360px',
                    position: 'relative'
                }}>
                    <div style={{
                        width: '44px', height: '44px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ShieldCheck size={24} color="#8B5CF6" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>
                            {isArabic ? 'سارة (موظف المبيعات)' : 'Sarah (Sales Agent)'}
                            <div style={{ width: '18px', height: '18px', background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                        {/* Placeholder lines for text */}
                        <div style={{ width: '85%', height: '5px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '2px', marginTop: '6px' }}></div>
                        <div style={{ width: '50%', height: '5px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '2px', marginTop: '6px' }}></div>
                    </div>
                </div>

                {/* Orbiting Icons */}
                <div style={{ position: 'absolute', top: '10%', left: 'calc(50% - 130px)', animation: 'float 4s ease-in-out infinite' }}>
                    <div style={{ width: '50px', height: '50px', background: '#229ED9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(34,158,217,0.3)', border: '2px solid var(--color-border-subtle)' }}>
                        <SiTelegram size={26} color="white" />
                    </div>
                </div>

                <div style={{ position: 'absolute', top: '25%', left: 'calc(50% + 100px)', animation: 'float 5s ease-in-out infinite 1s' }}>
                    <div style={{ width: '50px', height: '50px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(37,211,102,0.3)', border: '2px solid var(--color-border-subtle)' }}>
                        <SiWhatsapp size={26} color="white" />
                    </div>
                </div>

                <div style={{ position: 'absolute', top: '0%', left: 'calc(50% + 15px)', animation: 'float 4.5s ease-in-out infinite 0.5s' }}>
                    <div style={{ width: '50px', height: '50px', background: '#00B2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,178,255,0.3)', border: '2px solid var(--color-border-subtle)' }}>
                        <SiMessenger size={26} color="white" />
                    </div>
                </div>

                <div style={{ position: 'absolute', top: '-15%', left: 'calc(50% - 30px)', animation: 'float 5.5s ease-in-out infinite 1.5s' }}>
                    <div style={{ width: '50px', height: '50px', background: '#00C300', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,195,0,0.3)', border: '2px solid var(--color-border-subtle)' }}>
                        <SiLine size={26} color="white" />
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1E293B', marginBottom: '3rem', textAlign: 'center' }}>
                {isArabic ? 'أطلق العنان لموظف المبيعات الذكي' : 'Unleash Your Smart Sales Employee'}
            </h3>

            {/* Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                width: '100%',
                padding: '0 1rem'
            }}>
                {features.map((feature, idx) => (
                    <div key={idx} style={{
                        background: '#FFFFFF', // Light grey bg matching theme
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                        borderRadius: '24px',
                        padding: '1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isArabic ? 'flex-end' : 'flex-start',
                        textAlign: isArabic ? 'right' : 'left',
                        transition: 'transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'default',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(139, 92, 246, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                        }}
                    >
                        <div style={{ marginBottom: '1.25rem' }}>
                            {feature.icon}
                        </div>
                        <h4 style={{ color: '#1E293B', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                            {feature.title}
                        </h4>
                        <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-12px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `}</style>
        </div>
    );
};

export default ManusHero;
