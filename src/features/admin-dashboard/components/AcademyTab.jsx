import React from 'react';
import { 
    Users, Zap, Star, RefreshCw, Check 
} from 'lucide-react';
import { Card, Btn, StatCard } from './SharedComponents';

const AcademyTab = ({
    isEnglish, language, academyLeads, affiliates, academyLoading, 
    loadAcademyData, handleGrantAcademyAccess
}) => {
    const isRtl = language === 'ar';

    return (
        <div className="animate-fade-in" style={{ padding: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                        {isEnglish ? 'Academy & Affiliates' : 'الأكاديمية والمسوقين'}
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '0.85rem' }}>
                        {isEnglish ? 'Manage training bag access and partner commissions' : 'إدارة طلبات الحقيبة التدريبية وعمولات شركاء التسويق'}
                    </p>
                </div>
                <Btn onClick={loadAcademyData} disabled={academyLoading}>
                    <RefreshCw size={16} className={academyLoading ? 'animate-spin' : ''} /> 
                    {isEnglish ? 'Refresh Data' : 'تحديث البيانات'}
                </Btn>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard icon={Users} label={isEnglish ? 'Academy Leads' : 'عملاء الأكاديمية'} value={academyLeads.length} color="#8B5CF6" />
                <StatCard icon={Zap} label={isEnglish ? 'Active Affiliates' : 'المسوقين النشطين'} value={affiliates.length} color="#10B981" />
            </div>

            {/* Leads Table */}
            <div style={{ marginBottom: '3.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Star size={20} color="#F59E0B" />
                    </div>
                    {isEnglish ? 'Training Bag Leads' : 'طلبات الحقيبة التدريبية'}
                </h2>
                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Lead Profile' : 'بيانات العميل'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Contact Method' : 'التواصل'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Affiliate Code' : 'المسوق'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Payment Status' : 'حالة الوصول'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Actions' : 'إجراءات'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {academyLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#6B7280', fontStyle: 'italic' }}>
                                            {isEnglish ? 'No training bag requests found' : 'لا يوجد طلبات حالياً'}
                                        </td>
                                    </tr>
                                ) : (
                                    academyLeads.map(l => (
                                        <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{l.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>{l.user_type} • {l.industry}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#A78BFA' }}>{l.whatsapp}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{l.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {l.referrer_code ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ color: '#10B981', fontWeight: 800, fontSize: '0.82rem' }}>{l.referrer_code}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>({l.referrer_name})</div>
                                                    </div>
                                                ) : <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>Direct Visit</span>}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 900,
                                                    background: l.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                                    color: l.status === 'paid' ? '#10B981' : '#F59E0B',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {l.status === 'paid' ? (isEnglish ? 'Active Access' : 'مفعل') : (isEnglish ? 'Pending' : 'قيد الانتظار')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {l.status !== 'paid' && (
                                                    <Btn 
                                                        onClick={() => handleGrantAcademyAccess(l.id)} 
                                                        color="#10B981" 
                                                        style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                                                    >
                                                        <Check size={14} /> 
                                                        {isEnglish ? 'Grant Access' : 'منح الوصول'}
                                                    </Btn>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                } />
            </div>

            {/* Affiliates Table */}
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} color="#10B981" />
                    </div>
                    {isEnglish ? 'Affiliate Partner Network' : 'شركاء التسويق بالعمولة'}
                </h2>
                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Partner Name' : 'الشريك'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Affiliate Code' : 'كود الإحالة'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Fixed Commission' : 'إجمالي المستحقات'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8rem', fontWeight: 700 }}>{isEnglish ? 'Status' : 'الحالة'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {affiliates.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#6B7280', fontStyle: 'italic' }}>
                                            {isEnglish ? 'No affiliates registered yet' : 'لا يوجد مسوقين مسجلين'}
                                        </td>
                                    </tr>
                                ) : (
                                    affiliates.map(a => (
                                        <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{a.profiles?.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>{a.profiles?.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <code style={{ 
                                                    padding: '6px 14px', 
                                                    borderRadius: '8px', 
                                                    background: 'rgba(139, 92, 246, 0.12)', 
                                                    color: '#A78BFA', 
                                                    fontWeight: 900,
                                                    fontSize: '0.9rem',
                                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                                }}>{a.affiliate_code}</code>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 900, color: 'var(--color-text-main)', fontSize: '1rem' }}>
                                                    ${a.commission_rate_fixed || 0}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700,
                                                    color: a.status === 'active' ? '#10B981' : '#EF4444' 
                                                }}>
                                                    <div style={{ 
                                                        width: '8px', height: '8px', borderRadius: '50%', 
                                                        background: a.status === 'active' ? '#10B981' : '#EF4444',
                                                        boxShadow: a.status === 'active' ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                                                    }} />
                                                    {a.status === 'active' ? (isEnglish ? 'Active' : 'نشط') : (isEnglish ? 'Inactive' : 'غير نشط')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                } />
            </div>
        </div>
    );
};

export default AcademyTab;
