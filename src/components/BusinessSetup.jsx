import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, updateBusinessProfile, getProfile } from '../services/supabaseService';

const BusinessSetup = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: '',
        working_hours: '',
        description: '',
        services: '',
        branding_tone: 'professional',
        knowledge_base: ''
    });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                navigate('/login');
            } else {
                setUser(user);
                const profile = await getProfile(user.id);
                if (profile.success && profile.data) {
                    setFormData({
                        business_name: profile.data.business_name || '',
                        business_type: profile.data.business_type || '',
                        working_hours: profile.data.working_hours || '',
                        description: profile.data.description || '',
                        services: profile.data.services || '',
                        branding_tone: profile.data.branding_tone || 'professional',
                        knowledge_base: profile.data.knowledge_base || ''
                    });
                }
            }
        };
        checkUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateBusinessProfile(user.id, formData);
        if (result.success) {
            alert(t('settingsSavedSuccess'));
            navigate('/dashboard');
        } else {
            alert(t('errorPrefix') + result.error);
        }
        setLoading(false);
    };

    return (
        <div className="container py-xl animate-fade-in" style={{ paddingBottom: '6rem' }}>
            <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(to bottom, #FFF, #52525B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {t('businessSetupTitle')}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    {t('businessSetupSubtitle')}
                </p>
            </div>

            <div className="grid grid-2" style={{ alignItems: 'start', gridTemplateColumns: '1.3fr 0.7fr' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label className="label"><span>🏢</span> {t('businessNameLabel')}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={t('businessNamePlaceholder')}
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label"><span>🏷️</span> {t('businessTypeLabel')}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={t('businessTypePlaceholder')}
                                    value={formData.business_type}
                                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-md">
                            <label className="label"><span>⏰</span> {t('workingHoursLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('workingHoursPlaceholder')}
                                value={formData.working_hours}
                                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-md">
                            <label className="label"><span></span> {t('coreServicesLabel')}</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                placeholder={t('coreServicesPlaceholder')}
                                value={formData.services}
                                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-md">
                            <label className="label"><span></span> {t('toneLabel')}</label>
                            <select
                                className="input-field"
                                value={formData.branding_tone}
                                onChange={(e) => setFormData({ ...formData, branding_tone: e.target.value })}
                                style={{ 
                                    color: 'white',
                                    background: '#1F2937',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <option value="professional" style={{ color: 'white', background: '#1F2937' }}>{t('professionalTone')}</option>
                                <option value="friendly" style={{ color: 'white', background: '#1F2937' }}>{t('friendlyTone')}</option>
                                <option value="fast" style={{ color: 'white', background: '#1F2937' }}>{t('directTone')}</option>
                                <option value="luxury" style={{ color: 'white', background: '#1F2937' }}>{t('luxuryTone')}</option>
                            </select>
                        </div>

                        <div className="mb-2xl">
                            <label className="label"><span></span> {t('knowledgeBaseLabel')}</label>
                            <textarea
                                className="input-field"
                                rows="12"
                                style={{ background: 'rgba(212, 175, 55, 0.03)', borderColor: 'rgba(212, 175, 55, 0.15)' }}
                                placeholder={t('knowledgeBasePlaceholder')}
                                value={formData.knowledge_base}
                                onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                            ></textarea>
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                <small style={{ color: 'var(--text-secondary)' }}>{t('knowledgeBaseHint')}</small>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? t('syncing') : t('updateProtocolBtn')}
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <div style={{ fontSize: '1.5rem' }}>🦁</div>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem', color: 'white' }}>{t('smartIdentityTitle')}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {t('smartIdentityDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <div style={{ fontSize: '1.5rem' }}>🔐</div>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem', color: 'white' }}>{t('dataSecurityTitle')}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {t('dataSecurityDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(45deg, #18181B, #09090B)', border: '1px solid var(--accent-border)' }}>
                        <h4 style={{ color: 'var(--secondary-accent)', marginBottom: '0.75rem' }}>{t('employeeIntelligence')}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {t('employeeIntelligenceDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessSetup;
