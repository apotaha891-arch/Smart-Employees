import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Bot, CheckCircle2, MessageCircle, Send, Instagram, Phone, Zap, Headphones, Settings, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { createAgent, saveContract } from '../services/supabaseService';

const IntegrationsAddons = () => {
    const { t, language } = useLanguage();
    const isArabic = language === 'ar';
    const location = useLocation();
    const navigate = useNavigate();

    // Data passed from InterviewRoom
    const agentData = location.state?.template || { title: 'Ù.Ù^Ø¸Ù? Ø°ÙƒÙS', specialty: 'ØªØ®ØµØµ Ø¹Ø§Ù.' };
    const agentName = location.state?.businessRules?.businessName || agentData.title;

    const [activeAddons, setActiveAddons] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, loading, success
    const [isCreatingAgent, setIsCreatingAgent] = useState(!location.state?.agentId && location.state?.businessRules);

    useEffect(() => {
        const autoCreateAgent = async () => {
            if (!location.state?.agentId && location.state?.businessRules) {
                try {
                    const rules = location.state.businessRules;
                    const agentResult = await createAgent({
                        name: rules.businessName || agentData.title || 'AI Agent',
                        specialty: rules.businessType || agentData.specialty || 'General',
                    });

                    if (agentResult.success) {
                        await saveContract(agentResult.data.id, rules);
                        localStorage.setItem('currentAgentId', agentResult.data.id);
                        // Optional: we can update location state here if needed, but localStorage is enough
                    }
                } catch (err) {
                    console.error('Auto create agent failed', err);
                } finally {
                    setIsCreatingAgent(false);
                }
            }
        };
        autoCreateAgent();
    }, []);

    const toggleAddon = (addonId) => {
        setActiveAddons(prev =>
            prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
        );
    };

    const handleDeploy = () => {
        setStatus('loading');
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        }, 2000);
    };

    const handleContactAdmin = () => {
        alert(isArabic ? 'Ø³ÙSØªÙ. ØªÙ^Ø¬ÙSÙ╬Ùƒ Ù"Ù?Ø±ÙSÙ' Ø§Ù"Ù.Ø¨ÙSØ¹Ø§Øª Ù^Ø§Ù"Ø¯Ø¹Ù. Ø§Ù"Ù?Ù┼ÙS.' : 'You will be redirected to the sales support team.');
        // Here you would navigate to a Support or WhatsApp link:
        // window.open('https://api.whatsapp.com/send?phone=YOUR_SALES_NUMBER', '_blank');
    };

    const addons = [
        {
            id: 'whatsapp',
            icon: <MessageCircle size={32} color="#25D366" />,
            title: isArabic ? 'ØªÙ?Ø¹ÙSÙ" Ù^Ø§ØªØ³Ø§Ø¨' : 'WhatsApp API',
            desc: isArabic ? 'Ø±Ø¨Ø· Ø§Ù"Ù.Ù^Ø¸Ù? Ø¨Ø±Ù'Ù. Ù^Ø§ØªØ³Ø§Ø¨ Ø§Ù"Ø®Ø§Øµ Ø¨Ù.Ù┼Ø´Ø£ØªÙƒ Ù"Ù"Ø±Ø¯ Ø§Ù"ØªÙ"Ù'Ø§Ø¦ÙS.' : 'Connect agent to your WhatsApp Business number.',
            price: isArabic ? '250 Ù┼Ù'Ø·Ø©/Ø´Ù╬Ø±ÙSØ§Ù<' : '250 Credits/mo',
            color: '#25D366'
        },
        {
            id: 'telegram',
            icon: <Send size={32} color="#0088cc" />,
            title: isArabic ? 'ØªÙ?Ø¹ÙSÙ" ØªÙSÙ"ÙSØ¬Ø±Ø§Ù.' : 'Telegram Bot',
            desc: isArabic ? 'Ø¨Ù┼Ø§Ø¡ Ø¨Ù^Øª ØªÙSÙ"ÙSØ¬Ø±Ø§Ù. Ø±Ø³Ù.ÙS ÙSØ±Ø¯ Ø¹Ù"Ù% Ø§Ù"Ø¹Ù.Ù"Ø§Ø¡ Ù.Ø¨Ø§Ø´Ø±Ø©.' : 'Official Telegram bot for direct customer support.',
            price: isArabic ? '100 Ù┼Ù'Ø·Ø©/Ø´Ù╬Ø±ÙSØ§Ù<' : '100 Credits/mo',
            color: '#0088cc'
        },
        {
            id: 'instagram',
            icon: <Instagram size={32} color="#E1306C" />,
            title: isArabic ? 'Ø±Ø¨Ø· Ø§Ù┼Ø³ØªØ¬Ø±Ø§Ù.' : 'Instagram DMs',
            desc: isArabic ? 'Ø§Ù"Ø±Ø¯ Ø§Ù"ØªÙ"Ù'Ø§Ø¦ÙS Ø¹Ù"Ù% Ø§Ù"Ø±Ø³Ø§Ø¦Ù" Ø§Ù"Ø®Ø§ØµØ© (DMs) Ù^Ø§Ù"ØªØ¹Ù"ÙSÙ'Ø§Øª.' : 'Auto-reply to Direct Messages and Comments.',
            price: isArabic ? '200 Ù┼Ù'Ø·Ø©/Ø´Ù╬Ø±ÙSØ§Ù<' : '200 Credits/mo',
            color: '#E1306C'
        }
    ];

    return (
        <div className="ai-aura-container" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {isCreatingAgent ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                    <Loader2 size={48} color="#8B5CF6" className="animate-spin" style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
                    <h2 style={{ color: 'white', fontWeight: 800 }}>{isArabic ? 'Ø¬Ø§Ø±ÙS Ø¥Ø¹Ø¯Ø§Ø¯ Ø¨ÙSØ¦Ø© Ø§Ù"Ù.Ù^Ø¸Ù?...' : 'Preparing Agent Environment...'}</h2>
                </div>
            ) : (
                <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '4rem', paddingTop: '2rem' }}>

                    {/* Header Section */}
                    <div className="page-header text-center" style={{ marginBottom: '3rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '72px',
                            height: '72px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#10B981',
                            borderRadius: '24px',
                            marginBottom: '1rem',
                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                        }}>
                            <ShieldCheck size={40} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                            {isArabic ? 'ØªÙ. Ø§Ø¹ØªÙ.Ø§Ø¯ Ø§Ù"Ù.Ù^Ø¸Ù? Ø¨Ù┼Ø¬Ø§Ø­! ðYZ%' : 'Agent Hired Successfully! ðYZ%'}
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#A1A1AA', maxWidth: '600px', margin: '0 auto' }}>
                            {isArabic
                                ? `Ø§Ù"Ù┼Ø³Ø®Ø© Ø§Ù"Ø£Ø³Ø§Ø³ÙSØ© Ù.Ù┼ "${agentName}" ØªØ¹Ù.Ù" Ø§Ù"Ø¢Ù┼ Ø¨Ø¯Ø§Ø®Ù" Ø§Ù"Ù┼Ø¸Ø§Ù. Ø¨Ù┼Ø¬Ø§Ø­. Ø§Ù"Ø®Ø·Ù^Ø© Ø§Ù"ØªØ§Ù"ÙSØ© Ù╬ÙS ØªØ­Ø¯ÙSØ¯ Ø§Ù"Ù.Ù┼ØµØ§Øª Ø§Ù"ØªÙS ØªØ±ØºØ¨ Ø¨ØªÙ^ØµÙSÙ"Ù╬ Ø¨Ù╬Ø§.`
                                : `Base model for "${agentName}" is active. Select the channels you want to connect them to.`}
                        </p>
                    </div>

                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                            <Zap size={24} color="#F59E0B" />
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                                {isArabic ? 'Ø§Ù"Ø¥Ø¶Ø§Ù?Ø§Øª Ù^Ø¨Ø§Ù'Ø§Øª Ø§Ù"Ù.Ù┼ØµØ§Øª Ø§Ù"Ù.ØªØ§Ø­Ø©' : 'Available Add-ons & Platforms'}
                            </h3>
                        </div>

                        {/* Addons Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '3rem'
                        }}>
                            {addons.map(addon => {
                                const isActive = activeAddons.includes(addon.id);
                                return (
                                    <div
                                        key={addon.id}
                                        onClick={() => toggleAddon(addon.id)}
                                        className="card"
                                        style={{
                                            background: isActive ? `rgba(${hexToRgb(addon.color)}, 0.05)` : '#18181B',
                                            border: isActive ? `1px solid ${addon.color}` : '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '20px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isActive ? `0 10px 30px rgba(${hexToRgb(addon.color)}, 0.1)` : 'none',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {isActive && (
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: addon.color }}></div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '60px', height: '60px',
                                                background: isActive ? addon.color : '#27272A',
                                                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {React.cloneElement(addon.icon, { color: isActive ? 'white' : addon.color })}
                                            </div>

                                            <div style={{
                                                width: '28px', height: '28px',
                                                borderRadius: '50%',
                                                border: isActive ? `2px solid ${addon.color}` : '2px solid rgba(255,255,255,0.2)',
                                                background: isActive ? addon.color : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {isActive && <CheckCircle2 size={16} color="white" />}
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{addon.title}</h4>
                                        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '40px', marginBottom: '1rem' }}>
                                            {addon.desc}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', width: 'fit-content' }}>
                                            <CreditCard size={16} color="#A1A1AA" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{addon.price}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Custom Request Section */}
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '24px',
                            padding: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#8B5CF6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Settings size={24} color="white" />
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'white' }}>
                                        {isArabic ? 'Ù╬Ù" ØªØ­ØªØ§Ø¬ Ø¥Ù"Ù% Ø¥Ø¶Ø§Ù?Ø© Ù.Ø®ØµØµØ©ØY' : 'Need a Custom Integration?'}
                                    </h3>
                                </div>
                                <p style={{ fontSize: '1rem', color: '#A1A1AA', lineHeight: '1.6', margin: 0 }}>
                                    {isArabic
                                        ? 'Ù┼Ø¸Ø§Ù.Ù┼Ø§ ÙSØ¯Ø¹Ù. Ø±Ø¨Ø· Ø§Ù"Ù.Ù^Ø¸Ù? Ø§Ù"Ø°ÙƒÙS Ø¨Ø£Ù┼Ø¸Ù.Ø© Ø§Ù"Ù? ERP Ø§Ù"Ø®Ø§ØµØ© Ø¨ÙƒØO Ø£Ù^ ØªØ·Ø¨ÙSÙ'Ø§Øª Ø§Ù"Ø¬Ù^Ø§Ù"ØO Ù^Ù.Ø±Ø§ÙƒØ² Ø§Ù"Ø§ØªØµØ§Ù" (Voice AI). ØªÙ^Ø§ØµÙ" Ù.Ø¹ Ø§Ù"Ø¥Ø¯Ø§Ø±Ø© Ù"Ø±Ù?Ø¹ Ø·Ù"Ø¨ Ù╬Ù┼Ø¯Ø³ÙS.'
                                        : 'Connect with ERPs, custom mobile apps, or Voice AI systems. Contact management for custom engineering requests.'}
                                </p>
                            </div>
                            <button
                                onClick={handleContactAdmin}
                                className="btn"
                                style={{
                                    background: 'white',
                                    color: '#7C3AED',
                                    padding: '1rem 2rem',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '1rem',
                                    flexShrink: 0
                                }}
                            >
                                <Headphones size={20} />
                                {isArabic ? 'ØªÙ^Ø§ØµÙ" Ù.Ø¹ Ø§Ù"Ø¥Ø¯Ø§Ø±Ø© Ø§Ù"Ø¢Ù┼' : 'Contact Administration'}
                            </button>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn"
                                disabled={status === 'loading'}
                                style={{
                                    background: 'transparent',
                                    color: '#A1A1AA',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '1rem 2rem',
                                    borderRadius: '14px',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {isArabic ? 'ØªØ®Ø·ÙS Ù"Ù"Ù^Ø­Ø© Ø§Ù"ØªØ­ÙƒÙ.' : 'Skip to Dashboard'}
                            </button>

                            <button
                                onClick={handleDeploy}
                                disabled={status === 'loading' || activeAddons.length === 0}
                                className="btn"
                                style={{
                                    background: activeAddons.length === 0 || status === 'loading' ? '#27272A' : '#8B5CF6',
                                    color: activeAddons.length === 0 || status === 'loading' ? '#71717A' : 'white',
                                    border: 'none',
                                    padding: '1rem 3rem',
                                    borderRadius: '14px',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    cursor: activeAddons.length === 0 || status === 'loading' ? 'not-allowed' : 'pointer',
                                    boxShadow: activeAddons.length > 0 && status !== 'loading' ? '0 10px 25px rgba(139, 92, 246, 0.4)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {status === 'loading'
                                    ? (isArabic ? 'Ø¬Ø§Ø±ÙS Ø§Ù"Ø§Ø¹ØªÙ.Ø§Ø¯...' : 'Deploying...')
                                    : (status === 'success'
                                        ? (isArabic ? 'ØªÙ. Ø¨Ù┼Ø¬Ø§Ø­ âo"' : 'Success âo"')
                                        : (isArabic ? `Ø§Ø¹ØªÙ.Ø§Ø¯ Ù^Ø¥Ø¶Ø§Ù?Ø© (${activeAddons.length})` : `Deploy Add-ons (${activeAddons.length})`)
                                    )
                                }
                            </button>
                        </div>
                    </div>
                </div >
        </div >
