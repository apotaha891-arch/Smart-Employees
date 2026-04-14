import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../LanguageContext';
import * as academyService from '../../services/academyService';
import AcademyLayout from '../layouts/AcademyLayout';
import { 
    Users, TrendingUp, DollarSign, Link as LinkIcon, 
    CheckCircle2, Clock, Copy, ExternalLink, Award
} from 'lucide-react';

const PartnerDashboard = () => {
    const { user } = useAuth();
    const { t, isArabic } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState(null);
    const [leads, setLeads] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        const data = await academyService.getMyPartnerData(user.id);
        if (data) {
            setPartner(data);
            const partnerLeads = await academyService.getPartnerLeads(data.id);
            setLeads(partnerLeads);
        }
        setLoading(false);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/start?ref=${partner?.affiliate_code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <AcademyLayout>
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        </AcademyLayout>
    );

    if (!partner) return (
        <AcademyLayout>
            <div style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                <Award size={80} color="#8B5CF6" style={{ marginBottom: '2rem', opacity: 0.5 }} />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1.5rem' }}>{t('انضم لشركاء النمو', 'Join Growth Partners')}</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    {t('هذه الصفحة مخصصة لشركاء النجاح في الأكاديمية. إذا كنت ترغب في التسويق للمنصة والحصول على عمولات، يرجى التواصل مع الدعم الفني لتفعيل حساب الشريك الخاص بك.', 'This page is for Academy success partners. If you want to market the platform and earn commissions, please contact support to activate your partner account.')}
                </p>
                <button 
                    onClick={() => window.location.href = 'https://t.me/Noura24ShiftBot'}
                    style={{ background: '#8B5CF6', color: 'var(--color-text-main)', padding: '1.25rem 3rem', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
                >
                    {t('تحدث مع نورة لتنشيط حسابك', 'Talk to Noura to activate your account')}
                </button>
            </div>
        </AcademyLayout>
    );

    const conversions = leads.filter(l => l.status === 'paid' || l.status === 'training').length;
    const pending = leads.filter(l => l.status === 'knockout_viewed' || l.status === 'new').length;
    const totalEarnings = conversions * 10; // $10 per conversion

    return (
        <AcademyLayout>
            <div style={{ padding: '4rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '2.8rem', fontWeight: 950, marginBottom: '0.5rem' }}>{t('لوحة تحكم الشريك', 'Partner Dashboard')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>{t('أهلاً بك مجدداً.. تابع نمو أرباحك وتأثيرك هنا.', 'Welcome back.. track your earnings and impact here.')}</p>
                    </div>
                    
                    <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', minWidth: '350px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '10px', fontWeight: 700 }}>{t('رابط الإحالة الخاص بك', 'Your Referral Link')}</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', color: '#A78BFA', fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {window.location.origin}/start?ref={partner.affiliate_code}
                            </div>
                            <button onClick={copyLink} style={{ background: copied ? '#10B981' : '#8B5CF6', color: 'var(--color-text-main)', border: 'none', borderRadius: '12px', width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Users size={24} color="#8B5CF6" />
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>{t('إجمالي المهتمين (Leads)', 'Total Leads')}</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950 }}>{leads.length}</div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <TrendingUp size={24} color="#10B981" />
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>{t('التحويلات الناجحة', 'Conversions')}</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950 }}>{conversions}</div>
                    </div>

                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <DollarSign size={24} color="#3B82F6" />
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>{t('إجمالي الأرباح المستحقة', 'Total Earnings')}</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: '#60A5FA' }}>${totalEarnings}</div>
                    </div>
                </div>

                {/* Recent Activity */}
                <h2 style={{ fontSize: '1.8rem', fontWeight: 950, marginBottom: '2rem' }}>{t('آخر التحويلات', 'Recent Conversions')}</h2>
                <div style={{ background: 'var(--color-bg-surface)', borderRadius: '24px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isArabic ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <th style={{ padding: '1.25rem', color: '#6B7280', fontWeight: 600, fontSize: '0.9rem' }}>{t('الاسم بالكامل', 'Full Name')}</th>
                                <th style={{ padding: '1.25rem', color: '#6B7280', fontWeight: 600, fontSize: '0.9rem' }}>{t('القطاع', 'Sector')}</th>
                                <th style={{ padding: '1.25rem', color: '#6B7280', fontWeight: 600, fontSize: '0.9rem' }}>{t('الحالة', 'Status')}</th>
                                <th style={{ padding: '1.25rem', color: '#6B7280', fontWeight: 600, fontSize: '0.9rem' }}>{t('التاريخ', 'Date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
                                        {t('لا توجد تحويلات مسجلة بعد. ابدأ بمشاركة رابطك!', 'No conversions recorded yet. Start sharing your link!')}
                                    </td>
                                </tr>
                            ) : leads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: '0.2s' }}>
                                    <td style={{ padding: '1.25rem', fontWeight: 700 }}>{lead.full_name}</td>
                                    <td style={{ padding: '1.25rem', color: 'var(--color-text-secondary)' }}>{lead.industry}</td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '99px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 800,
                                            background: lead.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: lead.status === 'paid' ? '#10B981' : '#F59E0B'
                                        }}>
                                            {lead.status === 'paid' ? t('تم الدفع', 'Paid') : t('قيد المراجعة', 'Review')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem', color: '#4B5563', fontSize: '0.85rem' }}>
                                        {new Date(lead.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AcademyLayout>
    );
};

export default PartnerDashboard;
