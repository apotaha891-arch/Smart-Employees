import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile } from '../services/supabaseService';
import { getIndustryContent } from '../utils/industryContent';
import { Stethoscope, CalendarCheck, ShieldCheck, HeartPulse, Sparkles, Building2, UserCheck, Scissors, Utensils, Clock, Dumbbell, Trophy, CheckCircle2, Zap, Target, Star, Smile, TrendingUp, Users } from 'lucide-react';
import Lottie from 'lottie-react';

const AnimatedIcon = ({ animationPath, FallbackIcon, size, color }) => {
    const [animationData, setAnimationData] = useState(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!animationPath) {
            setHasError(true);
            return;
        }

        fetch(animationPath)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => setAnimationData(data))
            .catch(() => setHasError(true));
    }, [animationPath]);

    if (hasError || !animationData) {
        return <FallbackIcon size={size} color={color} strokeWidth={2} />;
    }

    return (
        <div style={{ width: size * 1.5, height: size * 1.5, filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' }}>
            <Lottie animationData={animationData} loop={true} />
        </div>
    );
};

const iconMap = {
    Stethoscope, CalendarCheck, ShieldCheck, HeartPulse, Sparkles, Building2, UserCheck, Scissors, Utensils, Clock, Dumbbell, Trophy, CheckCircle2, Zap, Target, Star, Smile, TrendingUp, Users
};

const VideoPresentation = ({ industry, language }) => {
    const { t } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);

    // Default placeholder video ID. You should replace this with your actual YouTube video ID.
    // E.g., if your link is https://www.youtube.com/watch?v=dQw4w9WgXcQ
    // The videoId is "dQw4w9WgXcQ"
    const videoId = "p_VAbyMt0BY";

    return (
        <section className="container" style={{ paddingTop: '2rem', paddingBottom: '6rem' }}>
            <div className="page-header text-center" style={{ marginBottom: '3.5rem' }}>
                <h2 style={{ marginBottom: '0.75rem', fontSize: '2.5rem', fontWeight: 800 }}>
                    {t('videoTitle')}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    {t('videoSubtitle')}
                </p>
            </div>

            <div className="video-wrapper animate-fade-in" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                {!isPlaying ? (
                    <>
                        {/* High-quality YouTube thumbnail */}
                        <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt="Video Thumbnail"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                // Fallback to standard quality if maxresdefault doesn't exist for the uploaded video
                                e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                        />
                        <div
                            className="video-overlay"
                            onClick={() => setIsPlaying(true)}
                        >
                            <div className="play-button">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </>
                ) : (
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                )}
            </div>
        </section>
    );
};

const Home = () => {
    const { t, language } = useLanguage();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [industry, setIndustry] = useState('telecom_it');

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
                    else if (type?.includes('تجزئة') || type?.includes('متجر') || type?.includes('retail') || type?.includes('ecommerce')) setIndustry('retail_ecommerce');
                    else if (type?.includes('بنك') || type?.includes('مالي') || type?.includes('bank') || type?.includes('finance')) setIndustry('banking');
                    else if (type?.includes('عملاء') || type?.includes('اتصال') || type?.includes('call') || type?.includes('support')) setIndustry('call_center');
                    else if (type?.includes('اتصالات') || type?.includes('تقنية') || type?.includes('telecom') || type?.includes('it')) setIndustry('telecom_it');
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
                <div style={{
                    background: 'linear-gradient(180deg, rgba(139,92,246,0.05) 0%, transparent 100%)',
                    padding: '4rem 0 2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '800px', height: '100%', background: 'radial-gradient(circle at center, rgba(139,92,246,0.1) 0%, transparent 70%)', transform: 'translateX(-50%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }}></div>

                    <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('home.sectorTitle')}
                        </h2>

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            maxWidth: '1000px',
                            margin: '0 auto',
                            padding: '0.5rem'
                        }}>
                            {[
                                'general', 'medical', 'realestate', 'beauty', 'restaurant',
                                'fitness', 'retail_ecommerce', 'banking', 'call_center', 'telecom_it'
                            ].map(type => {
                                const isActive = industry === type;
                                const label = t(`home.${type}`);

                                return (
                                    <button
                                        key={type}
                                        onClick={() => { setIndustry(type); setImgLoaded(false); }}
                                        className="industry-pill"
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '30px',
                                            border: '1px solid',
                                            borderColor: isActive ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                                            background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                            fontSize: '0.88rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: isActive ? '0 4px 20px rgba(139, 92, 246, 0.2)' : 'none',
                                            transform: isActive ? 'translateY(-2px)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                                            boxShadow: isActive ? '0 0 10px var(--accent)' : 'none'
                                        }} />
                                        {label && label !== `home.${type}` ? label : (
                                            // Fallback to stylized name if translation fails
                                            type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                        )}
                                    </button>
                                );
                            })}
                        </div>
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
                textAlign: language === 'en' ? 'left' : 'right',
                direction: language === 'en' ? 'ltr' : 'rtl'
            }}>
                <div className="animate-fade-in">
                    <div style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {industry === 'general' ? t('home.platformName') : t('home.eliteSolutionsFor').replace('{industry}', t(`home.${industry}`))}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--primary)', lineHeight: '1.15' }}>
                        {content.heroTitle}
                    </h1>
                    <p className="text-secondary mb-2xl" style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '3.5rem', lineHeight: '1.7' }}>
                        {content.heroDescription}
                    </p>

                    <div className="flex gap-md">
                        <Link
                            to="/templates"
                            state={{ industry }}
                            className="btn btn-primary"
                            style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}
                        >
                            {t('home.startInterview')}
                        </Link>
                        {user ? (
                            <Link
                                to="/templates"
                                state={{ industry }}
                                className="btn btn-secondary"
                                style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}
                            >
                                {t('nav.templates')}
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
                    {content.recommendations.map((rec, i) => {
                        const IconComponent = iconMap[rec.iconName] || Star;
                        return (
                            <div key={i} className="flip-card animate-fade-in" style={{ animationDelay: `${i * 0.2}s` }}>
                                <div className="flip-card-inner">
                                    <div className="flip-card-front">
                                        <span style={{ background: 'rgba(139,92,246,0.08)', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px' }}>
                                            <AnimatedIcon animationPath={rec.animationPath} FallbackIcon={IconComponent} size={42} color="#8B5CF6" />
                                        </span>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{rec.title}</h4>
                                    </div>
                                    <div className="flip-card-back">
                                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.5rem' }}>{rec.title}</h4>
                                        <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.7', color: 'rgba(255,255,255,0.85)' }}>{rec.desc}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Features Stats */}
            <section style={{
                paddingTop: '6rem',
                paddingBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(168, 85, 247, 0.05) 100%)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', width: '600px', height: '100%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', transform: 'translateX(-50%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="grid gap-lg text-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        {content.stats && content.stats.map((stat, idx) => (
                            <div key={idx} className="stat-card">
                                <h3 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', fontWeight: 900, background: stat.gradient || 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stat.value}</h3>
                                <p style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{stat.label}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 500, margin: 0 }}>{stat.subLabel}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Custom Request Banner */}
            <section className="container" style={{ paddingBottom: '3rem' }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    textAlign: language === 'ar' ? 'right' : 'left',
                    direction: language === 'ar' ? 'rtl' : 'ltr'
                }}>
                    <div style={{ flex: '1 1 500px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60A5FA', marginBottom: '0.75rem' }}>
                            {language === 'ar' ? 'هل تبحث عن خدمات ذكية متخصصة غير مدرجة؟' : 'Looking for specialized smart services not listed?'}
                        </h3>
                        <p style={{ color: '#9CA3AF', fontSize: '1.05rem', margin: 0, lineHeight: '1.6' }}>
                            {language === 'ar'
                                ? 'يسعدنا جداً تلقي طلباتكم لتخصيص موظفين رقميين لخدمات أو قطاعات غير متوفرة حالياً. فريقنا الهندسي مستعد لتطوير حلول استثنائية لمنشأتك.'
                                : 'We are very happy to receive your requests to customize digital employees for services or sectors not currently available. Our engineering team is ready to develop exceptional solutions for your facility.'}
                        </p>
                    </div>
                    <Link to="/custom-request" className="btn" style={{ background: '#3B82F6', color: 'white', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '14px', fontWeight: 700, border: 'none', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>
                        {language === 'ar' ? 'اطلب موظف مخصص الآن' : 'Request Custom Agent Now'}
                    </Link>
                </div>
            </section>

            {/* Video Presentation Section */}
            <VideoPresentation industry={industry} language={language} />

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
                                                : industry === 'retail_ecommerce'
                                                    ? t('home.ctaRetail')
                                                    : industry === 'banking'
                                                        ? t('home.ctaBanking')
                                                        : industry === 'call_center'
                                                            ? t('home.ctaCallCenter')
                                                            : industry === 'telecom_it'
                                                                ? t('home.ctaTelecom')
                                                                : t('home.ctaGeneral')}
                        </p>
                        <Link to="/templates" className="btn btn-lg" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #06B6D4 100%)', color: 'var(--primary)', padding: '1.25rem 3rem', fontSize: '1.2rem', borderRadius: '18px', fontWeight: 800, border: 'none', boxShadow: '0 15px 40px rgba(139, 92, 246, 0.3)' }}>
                            {t('home.ctaButton')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
