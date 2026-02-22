import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile } from '../services/supabaseService';
import { getIndustryContent } from '../utils/industryContent';

const Home = () => {
    const { t, language } = useLanguage();
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

    const content = getIndustryContent(industry, language);

    return (
        <div className="animate-fade-in">
            {/* Industry Switcher (Only if not logged in or during exploration) */}
            {!profile && (
                <div style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.03) 0%, rgba(59,130,246,0.03) 50%, rgba(168,85,247,0.03) 100%)', backdropFilter: 'blur(8px)', padding: '2.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '500px', height: '100%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', transform: 'translateX(-50%)', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
                    <div className="container flex justify-center gap-md align-center" style={{ overflowX: 'auto', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('home.sectorTitle')}</span>
                        {['general', 'medical', 'realestate', 'beauty', 'restaurant', 'fitness'].map(type => (
                            <button
                                key={type}
                                onClick={() => { setIndustry(type); setImgLoaded(false); }}
                                style={{
                                    padding: '0.65rem 1.5rem',
                                    ...(language === 'ar' ? { marginLeft: '1rem' } : { marginRight: '1rem' }),
                                    borderRadius: '22px',
                                    border: '1px solid',
                                    borderColor: industry === type ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255, 255, 255, 0.12)',
                                    background: industry === type ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                    color: industry === type ? 'var(--accent)' : 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    whiteSpace: 'nowrap',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: industry === type ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                                }}
                            >
                                {t(`home.${type}`)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header className="hero container" style={{
                padding: '8rem 0 7rem',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                gap: '4rem',
                alignItems: 'center',
                textAlign: 'right'
            }}>
                <div className="animate-fade-in">
                    <div style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {industry === 'general' ? t('home.platformName') : `Elite Solutions for ${industry.charAt(0).toUpperCase() + industry.slice(1)}`}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--primary)', lineHeight: '1.15' }}>
                        {content.heroTitle}
                    </h1>
                    <p className="text-secondary mb-2xl" style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '3.5rem', lineHeight: '1.7' }}>
                        {content.heroDescription}
                    </p>

                    <div className="flex gap-md">
                        <Link to="/interview" className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                            {t('home.startInterview')}
                        </Link>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                {t('home.viewDashboard')}
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                {t('authentication.createAccount')}
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
                        boxShadow: '0 25px 60px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                        position: 'relative',
                        zIndex: 2,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 100%)'
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
                            background: 'rgba(15, 15, 30, 0.85)',
                            backdropFilter: 'blur(15px)',
                            padding: '1.75rem',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 15px 40px rgba(139, 92, 246, 0.15)'
                        }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--primary)', lineHeight: '1.5' }}>"{content.quote}"</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.75rem', fontWeight: 900 }}>{t('home.strategicTeam')}</p>
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
            <section className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                <div className="page-header text-center" style={{ marginBottom: '3.5rem' }}>
                    <h2 style={{ marginBottom: '0.75rem', fontSize: '2.5rem', fontWeight: 800 }}>{t('home.insightsTitle')}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{t('home.insightsSubtitle')}</p>
                </div>

                <div className="grid grid-2 gap-2xl" style={{ marginTop: '2rem' }}>
                    {content.recommendations.map((rec, i) => (
                        <div key={i} className="n8n-card animate-fade-in" style={{
                            animationDelay: `${i * 0.2}s`,
                            display: 'flex',
                            gap: '2.5rem',
                            alignItems: 'center',
                            minHeight: '140px',
                            padding: '2.5rem',
                            boxShadow: 'var(--shadow-glow)',
                        }}>
                            <span style={{ fontSize: '2.5rem', background: 'rgba(139,92,246,0.08)', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', flexShrink: 0 }}>{rec.icon}</span>
                            <div>
                                <h4 style={{ marginBottom: '0.6rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{rec.title}</h4>
                                <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{rec.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Stats */}
            <section style={{
                paddingTop: '6rem',
                paddingBottom: '6rem',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(168, 85, 247, 0.05) 100%)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', width: '600px', height: '100%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', transform: 'translateX(-50%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="grid grid-3 gap-2xl text-center">
                        <div style={{ padding: '3rem 2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>99%</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{industry === 'medical' ? t('home.accuracyDiagnosis') : t('home.accuracyLabel')}</p>
                        </div>
                        <div style={{ padding: '3rem 2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>24/7</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t('home.supportLabel')}</p>
                        </div>
                        <div style={{ padding: '3rem 2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <h3 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #10B981 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>0.5s</h3>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t('home.speedLabel')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marketing CTA */}
            <section className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(168, 85, 247, 0.15) 100%)',
                    color: 'white',
                    padding: '6rem 5rem',
                    borderRadius: '40px',
                    textAlign: 'center',
                    boxShadow: '0 30px 70px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ color: 'white', marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 900, lineHeight: '1.3' }}>
                            {language === 'ar'
                                ? `هل أنت مستعد لنقل ${profile?.business_name || 'منشأتك'} إلى العصر الذكي؟`
                                : `Ready to take ${profile?.business_name || 'your business'} into the smart era?`}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '3.5rem', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto 3.5rem', lineHeight: '1.8', fontWeight: 500 }}>
                            {industry === 'medical'
                                ? t('home.ctaMedical')
                                : industry === 'realestate'
                                    ? t('home.ctaRealEstate')
                                    : industry === 'beauty'
                                        ? t('home.ctaBeauty')
                                        : industry === 'restaurant'
                                            ? t('home.ctaRestaurant')
                                            : industry === 'fitness'
                                                ? t('home.ctaFitness')
                                                : t('home.ctaGeneral')}
                        </p>
                        <Link to="/interview" className="btn btn-lg" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #06B6D4 100%)', color: 'var(--primary)', padding: '1.25rem 3rem', fontSize: '1.2rem', borderRadius: '18px', fontWeight: 800, border: 'none', boxShadow: '0 15px 40px rgba(139, 92, 246, 0.3)' }}>
                            {t('home.ctaButton')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
