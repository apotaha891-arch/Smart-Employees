import React, { useState } from 'react';
import { 
    Users, Zap, Check, ExternalLink, MessageSquare, Download 
} from 'lucide-react';
import { Card, Btn } from './SharedComponents';
import * as adminService from '../../../services/adminService';

const LeadsTab = ({
    isEnglish, isRtl, endCustomers, customRequests, load, t, handleExport
}) => {
    const [subTab, setSubTab] = useState('custom');

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                        {isEnglish ? 'Leads & Inquiries' : 'الطلبات والعملاء المحتملين'}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn 
                        onClick={() => handleExport(subTab === 'custom' ? customRequests : endCustomers, subTab)} 
                        color="#10B981"
                    >
                        <Download size={16} /> {isEnglish ? 'Export' : 'تصدير'}
                    </Btn>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setSubTab('custom')}
                    style={{ 
                        padding: '10px 15px', borderRadius: '10px', 
                        background: subTab === 'custom' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        color: subTab === 'custom' ? '#A78BFA' : '#6B7280', 
                        border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 
                    }}
                >
                    {isEnglish ? 'Custom Requests' : 'طلبات التوظيف الخاصة'}
                    {customRequests.filter(r => r.status === 'pending').length > 0 && 
                        <span style={{ marginLeft: '8px', background: '#EF4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.65rem' }}>
                            {customRequests.filter(r => r.status === 'pending').length}
                        </span>
                    }
                </button>
                <button 
                    onClick={() => setSubTab('end-customers')}
                    style={{ 
                        padding: '10px 15px', borderRadius: '10px', 
                        background: subTab === 'end-customers' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        color: subTab === 'end-customers' ? '#A78BFA' : '#6B7280', 
                        border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 
                    }}
                >
                    {isEnglish ? 'Registered Customers (CRM)' : 'إجمالي قاعدة عملاء النظام'}
                </button>
            </div>

            {subTab === 'custom' && (
                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Date' : 'التاريخ'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Contact' : 'بيانات التواصل'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Requirements' : 'المتطلبات'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Status' : 'الحالة'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Actions' : 'إجراءات'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customRequests.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>لا يوجد طلبات حالياً</td></tr>
                                ) : customRequests.map(r => {
                                    const st = r.status === 'completed' ? { c: '#10B981', bg: '#10B98120', l: (isEnglish ? 'Done' : 'مكتمل') } : { c: '#F59E0B', bg: '#F59E0B20', l: (isEnglish ? 'Pending' : 'قيد المراجعة') };
                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.75rem' }}>
                                                {new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>{r.contact_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#A78BFA', fontWeight: 700 }}>{r.contact_phone}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{r.contact_email}</div>
                                            </td>
                                            <td style={{ padding: '1rem', maxWidth: '350px' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                                                    <span style={{ color: '#8B5CF6', fontWeight: 800 }}>{r.business_type}</span>: {r.required_tasks}
                                                </div>
                                                {r.integrations && <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '6px' }}>⚙️ {r.integrations}</div>}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ background: st.bg, color: st.c, padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 900 }}>{st.l}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => window.open(`https://wa.me/${r.contact_phone.replace(/\D/g,'')}`, '_blank')} 
                                                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                                                    >
                                                        WhatsApp
                                                    </button>
                                                    <button 
                                                        onClick={() => adminService.updateCustomRequestStatus(r.id, r.status === 'completed' ? 'pending' : 'completed').then(load)} 
                                                        style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                                                    >
                                                        {r.status === 'completed' ? (isEnglish ? 'Undo' : 'تراجع') : (isEnglish ? 'Mark Done' : 'تم التواصل')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                } />
            )}

            {subTab === 'end-customers' && (
                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Registry ID' : 'معرف السجل'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{t('fullName')}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{t('phoneLabel')}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>Social Identifiers</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Registered' : 'تاريخ التسجيل'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {endCustomers.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>لا يوجد سجلات حالياً</td></tr>
                                ) : endCustomers.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.72rem' }}>#{c.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-main)', fontWeight: 800, fontSize: '0.88rem' }}>{c.customer_name || '—'}</td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>{c.customer_phone || '—'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {c.instagram_id && <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>IG: {c.instagram_id}</span>}
                                                {c.telegram_id && <span style={{ background: 'rgba(0, 136, 204, 0.1)', color: '#0088cc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>TG: {c.telegram_id}</span>}
                                                {!c.instagram_id && !c.telegram_id && <span style={{ color: '#4B5563', fontSize: '0.75rem' }}>—</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.78rem' }}>
                                            {new Date(c.updated_at || c.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                } />
            )}
        </div>
    );
};

export default LeadsTab;
