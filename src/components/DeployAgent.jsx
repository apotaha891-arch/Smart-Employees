import React, { useState } from 'react';
import { Bot, Send, User, Briefcase, MessageSquare, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const DeployAgent = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const [status, setStatus] = useState('idle'); // idle, loading, success
    const [formData, setFormData] = useState({
        phone: '',
        agentName: '',
        industry: '',
        tone: 'professional' // default tone
    });

    // Arabic Translations
    const translations = {
        title: isArabic ? 'تفعيل الموظف الرقمي الجديد' : 'Deploy New Digital Agent',
        subtitle: isArabic ? 'أدخل معلومات بسيطة لبدء تشغيل موظفك الرقمي فوراً 🚀' : 'Enter basic info to get your digital agent running instantly 🚀',
        phoneLabel: isArabic ? 'رقم الهاتف (واتساب / تليجرام)' : 'Phone Number (WhatsApp / Telegram)',
        phonePlaceholder: isArabic ? 'مثال: +966500000000' : 'e.g. +966500000000',
        nameLabel: isArabic ? 'اسم الموظف الرقمي' : 'Digital Agent Name',
        namePlaceholder: isArabic ? 'مثال: نورة، سارة...' : 'e.g. Noura, Sarah...',
        industryLabel: isArabic ? 'نوع النشاط أو الصناعة' : 'Industry Type',
        industryPlaceholder: isArabic ? 'مثال: صالون تجميل، مطعم، عقارات...' : 'e.g. Salon, Restaurant, Real Estate...',
        toneLabel: isArabic ? 'نبرة التحدث والملاحظات' : 'Tone & Basic Notes',
        toneProfessional: isArabic ? 'رسمي واحترافي' : 'Professional',
        toneFriendly: isArabic ? 'ودود ومرح' : 'Friendly & Welcoming',
        toneSales: isArabic ? 'مبيعات وإقناع' : 'Sales & Persuasive',
        deployButton: isArabic ? 'تفعيل الموظف الآن 🚀' : 'Deploy Agent Now 🚀',
        deploying: isArabic ? 'جاري التفعيل وبناء الذكاء الاصطناعي...' : 'Deploying AI Agent...',
        successTitle: isArabic ? 'تم التفعيل بنجاح! 🎉' : 'Agent Deployed Successfully! 🎉',
        successMessage: isArabic ? 'موظفك الرقمي جاهز الآن للعمل واستقبال الرسائل.' : 'Your digital agent is now ready to work and receive messages.',
        backButton: isArabic ? 'تفعيل موظف آخر' : 'Deploy Another Agent'
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phone || !formData.agentName || !formData.industry) return;

        setStatus('loading');

        // Simulate API call to n8n webhook
        setTimeout(() => {
            console.log('Sending data to n8n Webhook:', formData);
            // Example fetch: 
            // fetch('https://your-n8n-domain/webhook/deploy-agent', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            setStatus('success');
        }, 3000);
    };

    return (
        <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '2rem',
            background: 'rgba(17, 24, 39, 0.7)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            direction: isArabic ? 'rtl' : 'ltr'
        }}>
            {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 1.5rem auto' }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>{translations.successTitle}</h2>
                    <p style={{ color: '#9CA3AF', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        {translations.successMessage}
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'inline-block', textAlign: isArabic ? 'right' : 'left' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#D1D5DB' }}><strong>{translations.nameLabel}:</strong> {formData.agentName}</p>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#D1D5DB' }}><strong>{translations.phoneLabel}:</strong> {formData.phone}</p>
                        <p style={{ margin: 0, color: '#D1D5DB' }}><strong>{translations.industryLabel}:</strong> {formData.industry}</p>
                    </div>
                    <br />
                    <button
                        onClick={() => { setStatus('idle'); setFormData({ phone: '', agentName: '', industry: '', tone: 'professional' }); }}
                        style={{
                            background: 'transparent',
                            color: '#8B5CF6',
                            border: '1px solid #8B5CF6',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {translations.backButton}
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '64px', height: '64px', background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem auto', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
                        }}>
                            <Bot size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{translations.title}</h1>
                        <p style={{ color: '#9CA3AF', margin: 0 }}>{translations.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Phone Number Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E5E7EB' }}>
                                {translations.phoneLabel}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} color="#9CA3AF" style={{ position: 'absolute', [isArabic ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder={translations.phonePlaceholder}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: `14px ${isArabic ? '46px 16px' : '16px 46px'}`,
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                                    }}
                                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Agent Name Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E5E7EB' }}>
                                {translations.nameLabel}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} color="#9CA3AF" style={{ position: 'absolute', [isArabic ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    name="agentName"
                                    value={formData.agentName}
                                    onChange={handleChange}
                                    placeholder={translations.namePlaceholder}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: `14px ${isArabic ? '46px 16px' : '16px 46px'}`,
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                                    }}
                                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Industry Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E5E7EB' }}>
                                {translations.industryLabel}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={20} color="#9CA3AF" style={{ position: 'absolute', [isArabic ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    placeholder={translations.industryPlaceholder}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: `14px ${isArabic ? '46px 16px' : '16px 46px'}`,
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                                    }}
                                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Tone Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#E5E7EB' }}>
                                {translations.toneLabel}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <MessageSquare size={20} color="#9CA3AF" style={{ position: 'absolute', [isArabic ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <select
                                    name="tone"
                                    value={formData.tone}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: `14px ${isArabic ? '46px 16px' : '16px 46px'}`,
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                                appearance: 'none',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                                    }}
                                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                >
                                <option value="professional">{translations.toneProfessional}</option>
                                <option value="friendly">{translations.toneFriendly}</option>
                                <option value="sales">{translations.toneSales}</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        style={{
                            background: status === 'loading' ? '#4C1D95' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '1rem',
                            transition: 'all 0.2s',
                            boxShadow: status === 'loading' ? 'none' : '0 10px 20px rgba(139, 92, 246, 0.4)'
                        }}
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
                                {translations.deploying}
                            </>
                        ) : (
                            <>
                                <Send size={24} />
                                {translations.deployButton}
                            </>
                        )}
                    </button>
                </form>

            <style>
                {`
                @keyframes spin {
                    0 % { transform: rotate(0deg); }
                                100% {transform: rotate(360deg); }
                            }
                        `}
            </style>
        </>
    )
}
        </div >
    );
};

export default DeployAgent;
