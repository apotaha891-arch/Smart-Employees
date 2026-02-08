import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile } from '../services/supabaseService';
import { getIndustryContent } from '../utils/industryContent';

const Home = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [industry, setIndustry] = useState('general');

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            setUser(user);

            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    setProfile(profileResult.data);
                    // Match business_type to industry key
                    const type = profileResult.data.business_type?.toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic')) setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate')) setIndustry('realestate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty')) setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau')) setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit')) setIndustry('fitness');
                }
            }
        };
        checkUser();
    }, []);

    const content = getIndustryContent(industry);

    return (
        <div className="animate-fade-in">
            {/* Industry Switcher (Only if not logged in or during exploration) */}
            {!profile && (
                <div style={{ background: '#f9fafb', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div className="container flex justify-center gap-md align-center" style={{ overflowX: 'auto', padding: '0.5rem 1rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>حلول مخصصة حسب قطاعك:</span>
                        {['general', 'medical', 'realestate', 'beauty', 'restaurant', 'fitness'].map(type => (
                            <button
                                key={type}
                                onClick={() => { setIndustry(type); setImgLoaded(false); }}
                                style={{
                                    padding: '0.4rem 1.25rem',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: industry === type ? 'var(--accent)' : 'var(--border-light)',
                                    background: industry === type ? 'var(--accent-soft)' : 'white',
                                    color: industry === type ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {type === 'general' ? 'عام' :
                                    type === 'medical' ? 'عيادات' :
                                        type === 'realestate' ? 'عقارات' :
                                            type === 'beauty' ? 'تجميل' :
                                                type === 'restaurant' ? 'مطاعم' : 'نوادي رياضية'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header className="hero container" style={{
                padding: '5rem 0 6rem',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                gap: '4rem',
                alignItems: 'center',
                textAlign: 'right'
            }}>
                <div className="animate-fade-in">
                    <div style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {industry === 'general' ? 'Elite Agents Platform' : `Elite Solutions for ${industry.charAt(0).toUpperCase() + industry.slice(1)}`}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1.5rem', color: 'var(--primary)', lineHeight: '1.15' }}>
                        {content.heroTitle}
                    </h1>
                    <p className="text-secondary mb-2xl" style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '3rem', lineHeight: '1.7' }}>
                        {content.heroDescription}
                    </p>

                    <div className="flex gap-md">
                        <Link to="/templates" className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                            {t('startInterview')}
                        </Link>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                {t('viewDashboard')}
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                انضم لنخبة الأعمال
                            </Link>
                        )}
                    </div>
                </div>

                <div className="animate-fade-in" style={{ position: 'relative' }}>
                    <div style={{
                        width: '100%',
                        height: '520px',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-premium)',
                        position: 'relative',
                        zIndex: 2,
                        border: '1px solid var(--border-light)',
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                    }}>
                        {!imgLoaded && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                        <img
                            key={content.img}
                            src={content.img}
                            alt={industry}
                            onLoad={() => setImgLoaded(true)}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: imgLoaded ? 1 : 0,
                                transition: 'opacity 0.8s ease'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '2.5rem',
                            right: '2rem',
                            left: '2rem',
                            background: 'rgba(255,255,255,0.96)',
                            backdropFilter: 'blur(15px)',
                            padding: '1.75rem',
                            borderRadius: '24px',
                            border: '1px solid white',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
                        }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--primary)', lineHeight: '1.5' }}>"{content.quote}"</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.75rem', fontWeight: 900 }}>فريق Elite Agents الاستراتيجي</p>
                        </div>
                    </div>
                    {/* Decorative backdrop */}
                    <div style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '-30px',
                        width: '250px',
                        height: '250px',
                        background: 'var(--accent-soft)',
                        borderRadius: '50%',
                        zIndex: 1,
                        filter: 'blur(60px)',
                        opacity: 0.5
                    }}></div>
                </div>
            </header>

            {/* Recommendations Section */}
            <section className="container mb-3xl">
                <div className="page-header text-center mb-xl">
                    <h2 style={{ marginBottom: '0.5rem' }}>رؤى مخصصة لنمو قطاع {
                        industry === 'medical' ? 'العيادات' :
                            industry === 'realestate' ? 'العقارات' :
                                industry === 'beauty' ? 'التجميل' :
                                    industry === 'restaurant' ? 'المطاعم' :
                                        industry === 'fitness' ? 'النوادي الرياضية' : 'الأعمال'
                    }</h2>
                    <p style={{ color: 'var(--text-muted)' }}>حلول استراتيجية صُممت خصيصاً لتناسب احتياجات عملائك</p>
                </div>

                <div className="grid grid-2 gap-xl">
                    {content.recommendations.map((rec, i) => (
                        <div key={i} className="card p-xl animate-fade-in" style={{
                            animationDelay: `${i * 0.2}s`,
                            background: 'white',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'center',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <span style={{ fontSize: '2.5rem', background: '#F9FAFB', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}>{rec.icon}</span>
                            <div>
                                <h4 style={{ marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>{rec.title}</h4>
                                <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{rec.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Stats */}
            <section className="py-3xl" style={{ background: '#F9FAFB', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                <div className="container">
                    <div className="grid grid-3 gap-2xl text-center">
                        <div>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900 }}>🎯 99%</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>دقة في {industry === 'medical' ? 'التشخيص الرقمي للطلبات' : 'فهم متطلبات العملاء'}</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900 }}>🤝 24/7</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>تغطية مهنية لا تتوقف</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900 }}>⚡ 0.5s</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>سرعة استجابة فائقة</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marketing CTA */}
            <section className="container py-3xl">
                <div style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '5rem 4rem',
                    borderRadius: '40px',
                    textAlign: 'center',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '2.5rem' }}>هل أنت مستعد لنقل {profile?.business_name || 'منشأتك'} إلى العصر الذكي؟</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '3rem', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.8' }}>
                            {industry === 'medical'
                                ? 'انضم لمئات العيادات التي وفرت ملايين الساعات من الانتظار لمرضاها.'
                                : industry === 'realestate'
                                    ? 'لا تدع أي عميل عقاري ينتظر رداً بعد الآن، ضاعف مبيعاتك مع فريقنا الرقمي.'
                                    : 'اجعلي صالونك يعمل بذكاء يضاهي جمال الخدمات التي تقدمينها.'}
                        </p>
                        <Link to="/templates" className="btn btn-lg" style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '1.25rem 3rem', fontSize: '1.2rem', borderRadius: '18px' }}>
                            تحدث مع مرشحك الأول الآن ✨
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
