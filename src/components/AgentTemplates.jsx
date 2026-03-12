import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile, getPublicTemplates } from '../services/supabaseService';
import {
    Stethoscope,
    Activity,
    Search,
    Scissors,
    Building,
    Utensils,
    Zap,
    Headset,
    Smile,
    Briefcase,
    Coffee,
    Sparkles,
    CheckCircle2,
    Bot,
    Lock,
    Users,
    Filter,
    ArrowRight,
    MapPin,
    Building2,
    Headphones,
    Smartphone,
    Globe,
    ShoppingBag,
    Dumbbell as GymIcon
} from 'lucide-react';

const AgentTemplates = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const toneSectionRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedTone, setSelectedTone] = useState('friendly');

    // Initial industry from Home page state or default
    const [industry, setIndustry] = useState(location.state?.industry || 'telecom_it');
    const [isIndustryConfirmed, setIsIndustryConfirmed] = useState(!!location.state?.industry);
    const [showSectorConfirm, setShowSectorConfirm] = useState(false);

    const [dbTemplates, setDbTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    setProfile(profileResult.data);
                    // Only override industry if it wasn't explicitly passed from home
                    if (!location.state?.industry) {
                        const type = profileResult.data.business_type?.toLowerCase();
                        let detectedIndustry = 'telecom_it';
                        if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic') || type === 'medical') detectedIndustry = 'medical';
                        else if (type?.includes('عقار') || type?.includes('estate') || type === 'real_estate') detectedIndustry = 'real_estate';
                        else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty') || type === 'beauty') detectedIndustry = 'beauty';
                        else if (type?.includes('مطعم') || type?.includes('restau') || type === 'restaurant') detectedIndustry = 'restaurant';
                        else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit') || type === 'fitness') detectedIndustry = 'fitness';
                        else if (type?.includes('retail') || type?.includes('ecommerce') || type === 'retail_ecommerce') detectedIndustry = 'retail_ecommerce';
                        else if (type?.includes('bank') || type === 'banking') detectedIndustry = 'banking';
                        else if (type?.includes('call') || type === 'call_center') detectedIndustry = 'call_center';
                        else if (type?.includes('telecom') || type === 'telecom_it') detectedIndustry = 'telecom_it';
                        
                        setIndustry(detectedIndustry);
                        // If we detected it from profile but it wasn't in state, maybe show confirm?
                        if (type) setIsIndustryConfirmed(true);
                    }
                }
            }
        };

        const fetchTemplates = async () => {
            setLoading(true);
            const res = await getPublicTemplates();
            if (res.success) {
                setDbTemplates(res.data || []);
            }
            setLoading(false);
        };

        checkUser();
        fetchTemplates();
        
        // Show confirm popup if industry isn't confirmed after a delay
        if (!location.state?.industry) {
            setTimeout(() => {
                setShowSectorConfirm(true);
            }, 1000);
        }
    }, [location.state]);

    // Helper to map specialty/business_type to icons and generic UI strings
    const getTemplateUI = (template) => {
        const bt = template.business_type || '';
        let icon = <Bot size={24} />;
        let image = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop";
        let cost = 1;
        let creator = 'Admin';

        // Map icons based on business_type
        if (bt === 'medical') { icon = <Stethoscope size={24} />; image = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop"; cost = 3; creator = 'د. مريم صبري'; }
        else if (bt === 'beauty') { icon = <Scissors size={24} />; image = "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'نورة علي'; }
        else if (bt === 'restaurant') { icon = <Utensils size={24} />; image = "https://images.unsplash.com/photo-1577214159280-ca341749e48a?q=80&w=256&h=256&auto=format&fit=crop"; cost = 1; creator = 'أحمد خالد'; }
        else if (bt === 'real_estate') { icon = <Building size={24} />; image = "https://images.unsplash.com/photo-1556157382-97dee2dcbfe5?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'سالم الدوسري'; }
        else if (bt === 'fitness') { icon = <GymIcon size={24} />; image = "https://images.unsplash.com/photo-1599058917233-35835fd4578b?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'كابتن فهد'; }
        else if (bt === 'banking') { icon = <Building2 size={24} />; image = "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=256&h=256&auto=format&fit=crop"; cost = 4; creator = 'Financial Dept'; }
        else if (bt === 'ecommerce' || bt === 'retail_ecommerce') { icon = <ShoppingBag size={24} />; image = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'Smart Retail'; }
        else if (bt === 'call_center') { icon = <Headset size={24} />; image = "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=256&h=256&auto=format&fit=crop"; cost = 1; creator = 'Support Expert'; }
        else if (bt === 'telecom_it') { icon = <Zap size={24} />; image = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'Tech Division'; }

        // If template has an avatar emoji, use it for the icon if it's not a standard one
        if (template.avatar && template.avatar.length <= 2) {
             const emojiIcon = <span style={{ fontSize: '1.2rem' }}>{template.avatar}</span>;
             return { icon: emojiIcon, image, cost, creator };
        }

        return { icon, image, cost, creator };
    };

    const tones = [
        { id: 'friendly', icon: <Smile size={20} />, label: 'ودود', labelEn: 'Friendly', description: 'محادثات دافئة' },
        { id: 'professional', icon: <Briefcase size={20} />, label: 'احترافي', labelEn: 'Professional', description: 'رسمي ومهني' },
        { id: 'casual', icon: <Coffee size={20} />, label: 'غير رسمي', labelEn: 'Casual', description: 'عفوي وبسيط' },
        { id: 'enthusiastic', icon: <Sparkles size={20} />, label: 'متحمس', labelEn: 'Enthusiastic', description: 'مليء بالطاقة' },
    ];

    // Sort templates: matching industry first, then others
    const sortedTemplates = [...dbTemplates].sort((a, b) => {
        if (a.business_type === industry && b.business_type !== industry) return -1;
        if (a.business_type !== industry && b.business_type === industry) return 1;
        return 0;
    });

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        // WOW: Auto scroll to tone selection with smooth behavior
        setTimeout(() => {
            toneSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleHireAgent = () => {
        if (!selectedTemplate) {
            alert(t('templates.alertSelectAgent'));
            return;
        }

        localStorage.setItem('agentTemplate', JSON.stringify({
            ...selectedTemplate,
            tone: selectedTone,
        }));

        navigate('/interview', { state: { fromTemplates: true } });
    };

    return (
        <div className="ai-aura-container">
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '4rem', direction: language === 'en' ? 'ltr' : 'rtl' }}>
                <div className="page-header text-center" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 900 }}>{t('templates.title')}</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{t('templates.subtitle')}</p>
                </div>

                {/* Industry Header & Quick Switch */}
                <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            background: 'rgba(139, 92, 246, 0.1)', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#8B5CF6',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                             <Filter size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
                                {industry === 'general' ? t('templates.availableCadres') : t('templates.recommendedCadres')}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                                <span style={{ color: '#8B5CF6', fontSize: '0.8rem', fontWeight: 700 }}>{t(`home.${industry}`).toUpperCase()}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• {dbTemplates.filter(t => t.business_type === industry).length} {t('templates.candidatesCount')}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowSectorConfirm(true)}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '0.6rem 1.25rem',
                            color: '#A1A1AA',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        {t('templates.changeSector')}
                        <ArrowRight size={16} />
                    </button>
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#8B5CF6' }}>
                            <div className="animate-spin" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}></div>
                            <p>{t('templates.loadingCadres')}</p>
                        </div>
                    ) : (
                        <div className="n8n-card-grid">
                            {sortedTemplates.map((template) => {
                                const ui = getTemplateUI(template);
                                const isEnglish = language === 'en';
                                const displayName = isEnglish ? (template.name_en || template.name) : template.name;
                                const displayDesc = isEnglish ? (template.description_en || template.description) : template.description;
                                const displayRole = t(`roles.${template.specialty}`) || template.specialty;

                                return (
                                    <div
                                        key={template.id}
                                        className={`n8n-card animate-fade-in ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                        style={{ position: 'relative' }}
                                        onClick={() => handleSelectTemplate(template)}
                                    >
                                        {/* Chip Group (n8n style) */}
                                        <div className="chip-group">
                                            <div className="n8n-chip">{ui.icon}</div>
                                            <div className="n8n-chip" style={{ fontSize: '0.8rem' }}>
                                                {displayRole}
                                            </div>
                                        </div>

                                        <h4 className="n8n-card-title">{displayName}</h4>
                                        <p className="n8n-card-desc">{displayDesc}</p>

                                        {/* Creator Footer (n8n style) */}
                                        <div className="card-footer-n8n">
                                            <div className="avatar-n8n" style={{ overflow: 'hidden', padding: 0 }}>
                                                <img src={ui.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <span className="creator-name">
                                                {ui.creator}
                                            </span>
                                            <span className="verified-badge">●</span>
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#A1A1AA' }}>{t('templates.cost')}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>{ui.cost} {t('templates.points')}</span>
                                            </div>
                                        </div>

                                        {/* Recommendation Badge */}
                                        {template.business_type === industry && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '1.25rem',
                                                left: '1.25rem',
                                                padding: '0.2rem 0.5rem',
                                                background: '#8B5CF6',
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '0.6rem',
                                                fontWeight: 900,
                                                zIndex: 10
                                            }}>
                                                {t('templates.featured')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Custom Request CTA */}
                    <div className="animate-fade-in" style={{ marginTop: '2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px', color: '#60A5FA' }}>
                                {t('templates.customTitle')}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', margin: 0 }}>
                                {t('templates.customDesc')}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/custom-request')}
                            style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', transition: 'all 0.3s' }}
                        >
                            {t('templates.customAction')}
                        </button>
                    </div>
                </div>

                {/* Personality/Tone Selection */}
                {selectedTemplate && (
                    <div ref={toneSectionRef} className="animate-fade-in" style={{ marginTop: '6rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5rem', paddingBottom: '6rem' }}>
                        <div className="text-center" style={{ marginBottom: '3.5rem' }}>
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.15)',
                                color: '#A78BFA',
                                display: 'inline-block',
                                padding: '0.4rem 1.25rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                marginBottom: '1.25rem',
                                border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>{t('templates.step2')}</div>
                            <h3 style={{ fontSize: '1.85rem', marginBottom: '1rem', fontWeight: 900, color: 'white' }}>{t('templates.determinePersonality')}</h3>
                            <p style={{ color: '#A1A1AA', fontSize: '1rem' }}>{t('templates.howToTalk').replace('{name}', t.language === 'en' ? (selectedTemplate.name_en || selectedTemplate.name) : selectedTemplate.name)}</p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
                            {tones.map((tone) => (
                                <div
                                    key={tone.id}
                                    className="animate-fade-in"
                                    onClick={() => setSelectedTone(tone.id)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedTone === tone.id ? '#8B5CF6' : 'rgba(255,255,255,0.03)',
                                        border: selectedTone === tone.id ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '100px',
                                        padding: '0.75rem 1.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        transform: selectedTone === tone.id ? 'scale(1.05)' : 'none',
                                    }}
                                >
                                    <div style={{ color: selectedTone === tone.id ? 'white' : '#A1A1AA' }}>
                                        {tone.icon}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{t(`templates.${tone.id}`)}</span>
                                    </div>
                                    {selectedTone === tone.id && <CheckCircle2 size={18} color="white" />}
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                className="btn"
                                onClick={handleHireAgent}
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    color: 'white',
                                    padding: '1.25rem 4rem',
                                    fontSize: '1.15rem',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
                                    fontWeight: 900,
                                    border: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('templates.startInterview')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Sector Confirmation Modal */}
                {showSectorConfirm && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}>
                        <div className="card shadow-premium animate-fade-in" style={{ maxWidth: '600px', width: '100%', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2.5rem' }}>
                            <div className="text-center mb-xl">
                                <div style={{ width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                                    <MapPin size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                    {t('templates.confirmSectorTitle')}
                                </h2>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    {t('templates.confirmSectorDesc')}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
                                {[
                                    { id: 'medical', l: 'طبي وصحي', e: '🩺', c: '#3B82F6' },
                                    { id: 'beauty', l: 'تجميل وعناية', e: '🌸', c: '#EC4899' },
                                    { id: 'real_estate', l: 'عقارات', e: '🏠', c: '#D946EF' },
                                    { id: 'restaurant', l: 'مطاعم', e: '🍽', c: '#F59E0B' },
                                    { id: 'retail_ecommerce', l: 'متاجر', e: '🛍', c: '#10B981' },
                                    { id: 'fitness', l: 'لياقة', e: '🏋️', c: '#10B981' },
                                    { id: 'banking', l: 'مالية', e: '🏦', c: '#8B5CF6' },
                                    { id: 'call_center', l: 'خدمة عملاء', e: '🎧', c: '#06B6D4' },
                                    { id: 'telecom_it', l: 'تقنية', e: '📡', c: '#EF4444' },
                                    { id: 'general', l: 'عام', e: '🏢', c: '#6B7280' }
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => { setIndustry(s.id); setIsIndustryConfirmed(true); setShowSectorConfirm(false); }}
                                        style={{
                                            padding: '0.75rem 0.5rem',
                                            borderRadius: '12px',
                                            border: industry === s.id ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.05)',
                                            background: industry === s.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: industry === s.id ? '#C4B5FD' : 'var(--text-main)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>{s.e}</span>
                                        {t(`home.${s.id}`)}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => { setIsIndustryConfirmed(true); setShowSectorConfirm(false); }}
                                className="btn btn-primary btn-block"
                                style={{ padding: '1rem' }}
                            >
                                {t('templates.confirmAction')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentTemplates;
