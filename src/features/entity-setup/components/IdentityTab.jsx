import React from 'react';
import { Target, Zap, Save, Briefcase } from 'lucide-react';
import { INDUSTRY_OPTIONS } from '../constants';

const IdentityTab = ({
    language,
    formData,
    setFormData,
    services,
    integrationKeys,
    handleSave,
    loading
}) => {
    const inpStyle = {
        width: '100%',
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '10px',
        color: 'var(--color-text-main)',
        padding: '10px 14px',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    };

    const roadmapSteps = [
        { 
            label: language === 'ar' ? 'وصف المنشأة' : 'Entity Description', 
            desc: language === 'ar' ? 'ليعرف من هو' : 'Identity info',
            done: !!formData.businessName 
        },
        { 
            label: language === 'ar' ? 'الخدمات والمنتجات' : 'Services & Products', 
            desc: language === 'ar' ? 'ليعرف ماذا يبيع' : 'Catalog info',
            done: services.length > 0 
        },
        { 
            label: language === 'ar' ? 'قنوات التواصل' : 'Communication Channels', 
            desc: language === 'ar' ? 'ليعرف أين يرد' : 'WhatsApp/Web',
            done: !!integrationKeys.telegram_token || !!integrationKeys.whatsapp_number 
        }
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Mission Checklist Panel */}
            <div style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.05)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Target size={20} color="#F59E0B" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {language === 'ar' ? 'خارطة طريق نجاح الموظف الذكي' : 'Success Roadmap for your AI Agent'}
                    </h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {roadmapSteps.map((step, i) => (
                        <div key={i} style={{ padding: '10px', borderRadius: 8, background: step.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: step.done ? '#10B981' : 'white' }}>
                                {step.done ? <Zap size={14} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />}
                                {step.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{step.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info banner */}
            <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA', fontSize: '0.83rem', lineHeight: 1.6 }}>
                {language === 'ar'
                    ? '💡 هذه المعلومات يقرأها الموظف الذكي ليفهم منشأتك ويتحدث باسمها بشكل صحيح.'
                    : '💡 This profile is read by your AI agents so they can represent your business accurately.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'اسم المنشأة *' : 'Entity / Business Name *'}
                    </label>
                    <input style={inpStyle} value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder={language === 'ar' ? 'مثال: شركة البركة، عيادة الشفاء...' : 'e.g. Al-Baraka Co, Al-Shifa Clinic...'} />
                </div>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'نوع النشاط التجاري' : 'Business Type'}
                    </label>
                    <select style={{ ...inpStyle, cursor: 'pointer' }} value={formData.businessType}
                        onChange={e => setFormData({ ...formData, businessType: e.target.value })}>
                        <option value="">{language === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                        {INDUSTRY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {language === 'ar' ? opt.labelAr : opt.labelEn}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                    {language === 'ar' ? 'وصف المنشأة' : 'Business Description'}
                </label>
                <textarea style={{ ...inpStyle, resize: 'vertical' }} rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'ar'
                        ? 'صف خدماتك ومميزاتك... (سيستخدم هذا الوصف لتعريف الموظف الذكي بنشاطك)'
                        : 'Describe your services and what makes you unique... (used to brief AI agents)'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'رقم التواصل' : 'Contact Number'}
                    </label>
                    <input style={inpStyle} value={formData.phone} type="tel"
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+966 5x xxx xxxx" />
                </div>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'الموقع / العنوان' : 'Location / Address'}
                    </label>
                    <input style={inpStyle} value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder={language === 'ar' ? 'الرياض، حي النخيل...' : 'Riyadh, Al-Nakheel...'} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)'}
                    </label>
                    <input style={inpStyle} value={formData.website} type="url"
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://" />
                </div>
                <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                        {language === 'ar' ? 'منصبك الوظيفي' : 'Your Position'}
                    </label>
                    <input style={inpStyle} value={formData.position} 
                        onChange={e => setFormData({...formData, position: e.target.value})}
                        placeholder={language === 'ar' ? 'مثال: المدير التنفيذي' : 'e.g. CEO, Manager'} />
                </div>
            </div>

            <button onClick={handleSave} disabled={loading || !formData.businessName}
                style={{
                    padding: '12px', borderRadius: 10, border: 'none',
                    background: !formData.businessName ? '#374151' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                    color: 'var(--color-text-main)', fontWeight: 700, cursor: !formData.businessName ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                <Save size={16} />
                {loading
                    ? (language === 'ar' ? '⏳ جاري الحفظ...' : '⏳ Saving...')
                    : (language === 'ar' ? 'حفظ معلومات المنشأة' : 'Save Entity Profile')}
            </button>
        </div>
    );
};

export default IdentityTab;
