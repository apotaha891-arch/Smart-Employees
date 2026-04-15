import React from 'react';
import { 
    ShieldCheck, X, Check, Clock, Globe, 
    Briefcase, AlertCircle, Search, RefreshCw 
} from 'lucide-react';
import { Card, Btn, StatusBadge } from './SharedComponents';

const WhiteLabelTab = ({
    isEnglish, language, whiteLabelRequests, loadWhiteLabelRequests, 
    handleApproveWhiteLabel, handleRejectWhiteLabel, saving, t
}) => {
    const isRtl = language === 'ar';

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                        {isEnglish ? 'White-Label Partners' : 'شركاء العلامة البيضاء'}
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '0.85rem' }}>
                        {isEnglish ? 'Review and manage requests from agencies to customize platform branding' : 'مراجعة وإدارة طلبات الوكالات لتخصيص العلامة التجارية للمنصة'}
                    </p>
                </div>
                <Btn onClick={loadWhiteLabelRequests} disabled={saving} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <RefreshCw size={16} className={saving ? 'animate-spin' : ''} /> {isEnglish ? 'Refresh Requests' : 'تحديث الطلبات'}
                </Btn>
            </div>

            <Card s={{ padding: 0, overflow: 'hidden' }} c={
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Agency Partner' : 'اسم الشريك / الوكالة'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Business Sector' : 'النشاط التجاري'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Request Status' : 'حالة الطلب'}
                                </th>
                                <th style={{ padding: '1.1rem 1.5rem', color: '#6B7280', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Action Center' : 'إجراءات الاعتماد'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {whiteLabelRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <ShieldCheck size={40} style={{ opacity: 0.2 }} />
                                            {isEnglish ? 'No white-label requests at the moment' : 'لا يوجد طلبات اعتماد حالياً'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                whiteLabelRequests.map(req => {
                                    const statusMap = {
                                        pending: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: isEnglish ? 'Pending Review' : 'قيد المراجعة', icon: Clock },
                                        approved: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', label: isEnglish ? 'Approved' : 'تم الاعتماد', icon: Check },
                                        rejected: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', label: isEnglish ? 'Rejected' : 'مرفوض', icon: X }
                                    };
                                    const st = statusMap[req.status] || statusMap.pending;
                                    const StatusIcon = st.icon;

                                    return (
                                        <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Globe size={20} color="#A78BFA" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{req.full_name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>{new Date(req.created_at).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                    <Briefcase size={14} color="#6B7280" />
                                                    {req.business_type}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 900,
                                                    background: st.bg, color: st.color, textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    <StatusIcon size={14} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {req.status !== 'approved' && (
                                                        <Btn 
                                                            disabled={saving}
                                                            onClick={() => handleApproveWhiteLabel(req.id)}
                                                            color="#10B981"
                                                            style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                                                        >
                                                            <Check size={14} /> {isEnglish ? 'Approve' : 'اعتماد'}
                                                        </Btn>
                                                    )}
                                                    {req.status === 'pending' && (
                                                        <Btn 
                                                            disabled={saving}
                                                            onClick={() => {
                                                                const reason = window.prompt(isEnglish ? 'Reason for rejection:' : 'سبب الرفض:');
                                                                if (reason) handleRejectWhiteLabel(req.id, reason);
                                                            }}
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', fontSize: '0.78rem' }}
                                                        >
                                                            <X size={14} /> {isEnglish ? 'Reject' : 'رفض'}
                                                        </Btn>
                                                    )}
                                                    {req.status === 'approved' && (
                                                        <div style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <ShieldCheck size={16} /> {isEnglish ? 'Partner Verified' : 'شريك معتمد'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            } />
        </div>
    );
};

export default WhiteLabelTab;
