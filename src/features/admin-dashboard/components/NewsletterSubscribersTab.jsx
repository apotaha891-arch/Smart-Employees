import React from 'react';
import { 
    Mail, Calendar, Download, Search, Trash2, Filter, 
    CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { Card, Btn, StatCard } from './SharedComponents';

const NewsletterSubscribersTab = ({
    isEnglish, language, newsletterSubscribers, loadNewsletterSubscribers, 
    handleExport, t
}) => {
    const isRtl = language === 'ar';

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                        {isEnglish ? 'Newsletter Audience' : 'جمهور النشرة الإخبارية'}
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '0.85rem' }}>
                        {isEnglish ? 'Monitor and manage the list of platform subscribers' : 'متابعة وإدارة قائمة المشتركين في النشرة الإخبارية للمنصة'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Btn onClick={loadNewsletterSubscribers} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <RefreshCw size={16} /> {isEnglish ? 'Refresh' : 'تحديث'}
                    </Btn>
                    <Btn onClick={() => handleExport(newsletterSubscribers, 'subscribers')} color="#10B981">
                        <Download size={16} /> {isEnglish ? 'Export CSV' : 'تصدير البيانات'}
                    </Btn>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={Mail} label={isEnglish ? 'Total Subscribers' : 'إجمالي المشتركين'} value={newsletterSubscribers.length} color="#8B5CF6" />
                <StatCard icon={CheckCircle} label={isEnglish ? 'Active Emails' : 'إيميلات موثقة'} value={newsletterSubscribers.length} color="#10B981" />
            </div>

            <Card s={{ padding: 0, overflow: 'hidden' }} c={
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {isEnglish ? 'Subscriber Details' : 'بيانات المشترك'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {isEnglish ? 'Joined Date' : 'تاريخ الاشتراك'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {isEnglish ? 'Status' : 'الحالة'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {isEnglish ? 'Actions' : 'إجراءات'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsletterSubscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Mail size={40} style={{ opacity: 0.2 }} />
                                            {isEnglish ? 'No subscribers found yet' : 'لا يوجد مشتركون حالياً'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                newsletterSubscribers.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.01)' } }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
                                                    {s.email?.[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.92rem' }}>{s.email}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>ID: {s.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                <Calendar size={14} color="#6B7280" />
                                                {new Date(s.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800
                                            }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                                                {isEnglish ? 'Subscribed' : 'مشترك نشط'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <button style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', transition: '0.2s', ':hover': { color: '#EF4444' } }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            } />
        </div>
    );
};

export default NewsletterSubscribersTab;
