import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Bot, CheckCircle2, MessageCircle, Send, Instagram, Zap, Headphones, Settings, ShieldCheck, CreditCard, Loader2, Globe, X } from 'lucide-react';
import { getAgentApps, submitCustomRequest } from '../services/supabaseService';
import { agentService } from '../services/agentService';

const IntegrationsAddons = () => {
    const { t, language } = useLanguage();
    const isArabic = language === 'ar';
    const location = useLocation();
    const navigate = useNavigate();

    // Data passed from InterviewRoom
    const agentData = location.state?.template || { title: 'موظف ذكي', specialty: 'تخصص عام' };
    const agentName = location.state?.businessRules?.businessName || agentData.title;

    const [activeAddons, setActiveAddons] = useState([]);
    const [dbAddons, setDbAddons] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, loading, success

    // Custom Request Modal State
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customFormData, setCustomFormData] = useState({
        request_type: 'custom_integration',
        description: '',
        contact_preference: 'email'
    });
    const [customFormStatus, setCustomFormStatus] = useState('idle'); // idle, loading, success, error

    // Platform Configuration States
    const [telegramToken, setTelegramToken] = useState('');
    const [whatsappSettings, setWhatsappSettings] = useState({
        token: '',
        phoneNumberId: '',
        verifyToken: ''
    });

    useEffect(() => {
        const fetchAddons = async () => {
            const res = await getAgentApps();
            if (res.success && res.data && res.data.length > 0) {
                setDbAddons(res.data);
            } else {
                // Fallback if DB fetch fails or returns empty
                setDbAddons([
                    { id: 'whatsapp', type: 'whatsapp', name_ar: 'واتساب', name_en: 'WhatsApp', description_ar: 'ربط الموظف برقم واتساب.', description_en: 'Connect to WhatsApp', price: 250 },
                    { id: 'telegram', type: 'telegram', name_ar: 'تيليجرام', name_en: 'Telegram', description_ar: 'بناء بوت تيليجرام.', description_en: 'Telegram Bot', price: 100 },
                    { id: 'instagram', type: 'instagram', name_ar: 'انستجرام', name_en: 'Instagram', description_ar: 'الرد على الرسائل الخاصة.', description_en: 'Instagram DMs', price: 200 }
                ]);
            }
        };
        fetchAddons();
    }, []);


    const toggleAddon = (addonId) => {
        setActiveAddons(prev =>
            prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
        );
    };

    const handleDeploy = async () => {
        setStatus('loading');
        const currentAgentId = location.state?.agentId || localStorage.getItem('currentAgentId');

        try {
            if (currentAgentId) {
                if (activeAddons.includes('telegram') && telegramToken) {
                    await agentService.updateAgentTelegramToken(currentAgentId, telegramToken);
                }
                if (activeAddons.includes('whatsapp') && (whatsappSettings.token || whatsappSettings.phoneNumberId)) {
                    await agentService.updateAgentWhatsAppSettings(currentAgentId, whatsappSettings);
                }
            }
        } catch (error) {
            console.error('Error saving agent configurations:', error);
        }

        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        }, 1500);
    };

    const handleContactAdmin = () => {
        setShowCustomModal(true);
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        if (!customFormData.description.trim()) {
            alert(isArabic ? 'يرجى إدخال وصف لطلبك.' : 'Please enter a description for your request.');
            return;
        }

        setCustomFormStatus('loading');

        // Also add agent info context
        const dataToSubmit = {
            ...customFormData,
            agent_id: location.state?.agentId || null,
            agent_name: agentName,
            status: 'pending'
        };

        const res = await submitCustomRequest(dataToSubmit);
        if (res.success) {
            setCustomFormStatus('success');
            setTimeout(() => {
                setShowCustomModal(false);
                setCustomFormStatus('idle');
                setCustomFormData({ request_type: 'custom_integration', description: '', contact_preference: 'email' });
            }, 3000);
        } else {
            setCustomFormStatus('error');
            alert(res.error);
        }
    };

    const getAppIcon = (type, color) => {
        switch (type) {
            case 'whatsapp': return <MessageCircle size={32} color={color || '#25D366'} />;
            case 'telegram': return <Send size={32} color={color || '#0088cc'} />;
            case 'instagram': return <Instagram size={32} color={color || '#E1306C'} />;
            default: return <Globe size={32} color={color || '#8B5CF6'} />;
        }
    };

    return (
        <div className="ai-aura-container" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
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
                        {isArabic ? 'تم اعتماد الموظف بنجاح! 🎉' : 'Agent Hired Successfully! 🎉'}
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#A1A1AA', maxWidth: '600px', margin: '0 auto' }}>
                        {isArabic
                            ? `النسخة الأساسية من "${agentName}" تعمل الآن بداخل النظام بنجاح. الخطوة التالية هي تحديد المنصات التي ترغب بتوصيله بها.`
                            : `Base model for "${agentName}" is active. Select the channels you want to connect them to.`}
                    </p>
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                        <Zap size={24} color="#F59E0B" />
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                            {isArabic ? 'الإضافات وباقات المنصات المتاحة' : 'Available Add-ons & Platforms'}
                        </h3>
                    </div>

                    {/* Addons Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '3rem'
                    }}>
                        {dbAddons.map(addon => {
                            const isActive = activeAddons.includes(addon.id || addon.type);
                            const addonColor = addon.color || (addon.type === 'whatsapp' ? '#25D366' : addon.type === 'telegram' ? '#0088cc' : addon.type === 'instagram' ? '#E1306C' : '#8B5CF6');
                            const addonIcon = getAppIcon(addon.type, isActive ? 'white' : addonColor);
                            const title = isArabic ? (addon.name_ar || addon.name || addon.type) : (addon.name_en || addon.name || addon.type);
                            const desc = isArabic ? (addon.description_ar || addon.description) : (addon.description_en || addon.description);
                            const priceFormat = isArabic ? `${addon.price || 0} نقطة/شهرياً` : `${addon.price || 0} Credits/mo`;

                            return (
                                <div
                                    key={addon.id || addon.type}
                                    className="card"
                                    style={{
                                        background: isActive ? `rgba(${hexToRgb(addonColor)}, 0.05)` : '#18181B',
                                        border: isActive ? `1px solid ${addonColor}` : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isActive ? `0 10px 30px rgba(${hexToRgb(addonColor)}, 0.1)` : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isActive && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: addonColor }}></div>
                                    )}

                                    <div onClick={() => toggleAddon(addon.id || addon.type)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '60px', height: '60px',
                                                background: isActive ? addonColor : '#27272A',
                                                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {addonIcon}
                                            </div>

                                            <div style={{
                                                width: '28px', height: '28px',
                                                borderRadius: '50%',
                                                border: isActive ? `2px solid ${addonColor}` : '2px solid rgba(255,255,255,0.2)',
                                                background: isActive ? addonColor : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {isActive && <CheckCircle2 size={16} color="white" />}
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h4>
                                        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '40px', marginBottom: '1rem' }}>
                                            {desc}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', width: 'fit-content' }}>
                                            <CreditCard size={16} color="#A1A1AA" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{priceFormat}</span>
                                        </div>
                                    </div>

                                    {/* Configuration Inputs */}
                                    {isActive && addon.type === 'telegram' && (
                                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
                                            <label className="label" style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem', display: 'block' }}>
                                                {isArabic ? 'رمز البوت (Bot Token)' : 'Bot Token'}
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={telegramToken}
                                                onChange={(e) => setTelegramToken(e.target.value)}
                                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                                style={{ background: '#27272A', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
                                                required
                                            />
                                            <p style={{ color: '#A1A1AA', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                                {isArabic ? 'احصل عليه من @BotFather في تيليجرام' : 'Get it from @BotFather on Telegram'}
                                            </p>
                                        </div>
                                    )}

                                    {isActive && addon.type === 'whatsapp' && (
                                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label className="label" style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem', display: 'block' }}>
                                                    {isArabic ? 'رقم الهاتف (Phone Number ID)' : 'Phone Number ID'}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    value={whatsappSettings.phoneNumberId}
                                                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value })}
                                                    placeholder="101234567890"
                                                    style={{ background: '#27272A', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="label" style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem', display: 'block' }}>
                                                    {isArabic ? 'رمز الوصول الدائم (Access Token)' : 'Access Token'}
                                                </label>
                                                <input
                                                    type="password"
                                                    className="input-field"
                                                    value={whatsappSettings.token}
                                                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, token: e.target.value })}
                                                    placeholder="EAABw..."
                                                    style={{ background: '#27272A', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
                                                    required
                                                />
                                            </div>
                                            <p style={{ color: '#A1A1AA', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                                                {isArabic ? 'منصة Meta للمطورين > WhatsApp > API Setup' : 'Meta for Developers > WhatsApp > API Setup'}
                                            </p>
                                        </div>
                                    )}
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
                                    {isArabic ? 'هل تحتاج إلى إضافة مخصصة؟' : 'Need a Custom Integration?'}
                                </h3>
                            </div>
                            <p style={{ fontSize: '1rem', color: '#A1A1AA', lineHeight: '1.6', margin: 0 }}>
                                {isArabic
                                    ? 'نظامنا يدعم ربط الموظف الذكي بأنظمة الـ ERP الخاصة بك، أو تطبيقات الجوال، ومراكز الاتصال (Voice AI). تواصل مع الإدارة لرفع طلب هندسي.'
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
                            {isArabic ? 'تواصل مع الإدارة الآن' : 'Contact Administration'}
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
                            {isArabic ? 'تخطي للوحة التحكم' : 'Skip to Dashboard'}
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
                                ? (isArabic ? 'جاري الاعتماد...' : 'Deploying...')
                                : (status === 'success'
                                    ? (isArabic ? 'تم بنجاح ✓' : 'Success ✓')
                                    : (isArabic ? `اعتماد وإضافة (${activeAddons.length})` : `Deploy Add-ons (${activeAddons.length})`)
                                )
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Request Modal */}
            {showCustomModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '500px', width: '100%',
                        background: '#18181B', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2rem', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowCustomModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: isArabic ? 'auto' : '1rem', left: isArabic ? '1rem' : 'auto', background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>
                            {isArabic ? 'طلب إضافة مخصصة' : 'Custom Request'}
                        </h3>
                        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {isArabic
                                ? 'يرجى كتابة تفاصيل متطلباتك الخاصة بربط الموظف الذكي بأنظمتك، وسيتواصل معك فريق الهندسة قريباً.'
                                : 'Please provide details about your custom integration needs. Our engineering team will contact you shortly.'}
                        </p>

                        {customFormStatus === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <CheckCircle2 size={64} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                                <h4 style={{ color: '#10B981', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {isArabic ? 'تم استلام طلبك بنجاح!' : 'Request submitted successfully!'}
                                </h4>
                                <p style={{ color: '#A1A1AA', marginTop: '0.5rem' }}>
                                    {isArabic ? 'سنتواصل معك في أقرب وقت.' : 'We will get back to you shortly.'}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">{isArabic ? 'نوع الطلب' : 'Request Type'}</label>
                                    <select
                                        className="input-field"
                                        value={customFormData.request_type}
                                        onChange={(e) => setCustomFormData({ ...customFormData, request_type: e.target.value })}
                                        style={{ background: '#27272A', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="custom_integration">{isArabic ? 'ربط بنظام خارجي (ERP/CRM)' : 'External Integration (ERP/CRM)'}</option>
                                        <option value="mobile_app">{isArabic ? 'تطبيق جوال' : 'Mobile App'}</option>
                                        <option value="voice_ai">{isArabic ? 'نظام صوتي (Voice AI)' : 'Voice AI System'}</option>
                                        <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">{isArabic ? 'وصف المتطلبات' : 'Requirements Description'}</label>
                                    <textarea
                                        className="input-field"
                                        rows="4"
                                        placeholder={isArabic ? 'اشرح بالتفصيل ما ترغب في إضافته أو ربطه...' : 'Describe your custom features or integration needs...'}
                                        value={customFormData.description}
                                        onChange={(e) => setCustomFormData({ ...customFormData, description: e.target.value })}
                                        style={{ background: '#27272A', border: '1px solid rgba(255,255,255,0.1)' }}
                                        required
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="label">{isArabic ? 'طريقة التواصل المفضلة' : 'Preferred Contact Method'}</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E4E4E7', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="contact"
                                                value="email"
                                                checked={customFormData.contact_preference === 'email'}
                                                onChange={(e) => setCustomFormData({ ...customFormData, contact_preference: e.target.value })}
                                            />
                                            {isArabic ? 'البريد الإلكتروني' : 'Email'}
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E4E4E7', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="contact"
                                                value="phone"
                                                checked={customFormData.contact_preference === 'phone'}
                                                onChange={(e) => setCustomFormData({ ...customFormData, contact_preference: e.target.value })}
                                            />
                                            {isArabic ? 'رقم الهاتف' : 'Phone'}
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-block"
                                    disabled={customFormStatus === 'loading'}
                                    style={{
                                        background: '#8B5CF6', color: 'white', marginTop: '1rem',
                                        opacity: customFormStatus === 'loading' ? 0.7 : 1
                                    }}
                                >
                                    {customFormStatus === 'loading'
                                        ? (isArabic ? 'جاري الإرسال...' : 'Submitting...')
                                        : (isArabic ? 'إرسال الطلب' : 'Submit Request')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to convert hex to rgb for rgba usage
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '139, 92, 246'; // fallback to primary purple
}

export default IntegrationsAddons;
