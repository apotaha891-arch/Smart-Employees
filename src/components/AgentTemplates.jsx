import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Users
} from 'lucide-react';

const AgentTemplates = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const toneSectionRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedTone, setSelectedTone] = useState('friendly');
    const [industry, setIndustry] = useState('general');
    const [clientSector, setClientSector] = useState('business'); // 'business' or 'individual'

    const [dbTemplates, setDbTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const type = profileResult.data.business_type?.toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic') || type === 'medical') setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate') || type === 'real_estate') setIndustry('real_estate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty') || type === 'beauty') setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau') || type === 'restaurant') setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit') || type === 'fitness') setIndustry('fitness');
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
    }, []);

    // Helper to map specialty/business_type to icons and generic UI strings
    const getTemplateUI = (t) => {
        const bt = t.business_type || '';
        let icon = <Bot size={24} />;
        let image = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop";
        let cost = 1;
        let creator = 'Admin';

        if (bt === 'medical') { icon = <Stethoscope size={24} />; image = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop"; cost = 3; creator = 'د. مريم صبري'; }
        if (bt === 'beauty') { icon = <Scissors size={24} />; image = "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'نورة علي'; }
        if (bt === 'restaurant') { icon = <Utensils size={24} />; image = "https://images.unsplash.com/photo-1577214159280-ca341749e48a?q=80&w=256&h=256&auto=format&fit=crop"; cost = 1; creator = 'أحمد خالد'; }
        if (bt === 'real_estate') { icon = <Building size={24} />; image = "https://images.unsplash.com/photo-1556157382-97dee2dcbfe5?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'سالم الدوسري'; }
        if (bt === 'fitness') { icon = <Zap size={24} />; image = "https://images.unsplash.com/photo-1599058917233-35835fd4578b?q=80&w=256&h=256&auto=format&fit=crop"; cost = 2; creator = 'كابتن فهد'; }

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

                {/* Agent Cadres */}
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {/* Sector Selection (Business vs Individual) */}
                    <div className="flex justify-center mb-xl">
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '0.5rem',
                            gap: '0.5rem'
                        }}>
                            <button
                                onClick={() => setClientSector('business')}
                                style={{
                                    padding: '0.75rem 2rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: clientSector === 'business' ? '#8B5CF6' : 'transparent',
                                    color: clientSector === 'business' ? 'white' : '#A1A1AA',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            >
                                <Building size={18} /> {t('templates.businessClient')}
                            </button>

                            <button
                                style={{
                                    padding: '0.75rem 2rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'transparent',
                                    color: '#71717A',
                                    fontWeight: 700,
                                    cursor: 'not-allowed', // Locked
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem',
                                    position: 'relative'
                                }}
                            >
                                <Users size={18} /> {t('templates.individualClient')}
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    background: '#EF4444',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontWeight: 900
                                }}>
                                    <Lock size={10} style={{ display: 'inline', marginRight: '2px' }} /> {t('templates.comingSoon')}
                                </div>
                            </button>
                        </div>
                    </div>

                    <h3 className="mb-xl" style={{ borderBottom: '2px solid #8B5CF6', display: 'inline-block', paddingBottom: '0.5rem', fontSize: '1.25rem' }}>
                        {industry === 'general' ? t('templates.availableCadres') : t('templates.recommendedCadres')}
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#8B5CF6' }}>
                            <div className="animate-spin" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}></div>
                            <p>{t('templates.loadingCadres')}</p>
                        </div>
                    ) : (
                        <div className="n8n-card-grid">
                            {sortedTemplates.map((template) => {
                                const ui = getTemplateUI(template);
                                const isEnglish = t.language === 'en';
                                const displayName = isEnglish ? (template.name_en || template.name) : template.name;
                                const displayDesc = isEnglish ? (template.description_en || template.description) : template.description;

                                return (
                                    <div
                                        key={template.id}
                                        className={`n8n-card animate-fade-in ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectTemplate(template)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* Chip Group (n8n style) */}
                                        <div className="chip-group">
                                            <div className="n8n-chip">{ui.icon}</div>
                                            <div className="n8n-chip" style={{ fontSize: '0.8rem' }}>
                                                {template.specialty}
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
            </div>
        </div>
    );
};

export default AgentTemplates;
