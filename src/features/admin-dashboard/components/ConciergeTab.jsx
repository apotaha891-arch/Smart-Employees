import React from 'react';
import { 
    X, Check, MessageSquare 
} from 'lucide-react';
import { Card } from './SharedComponents';

const ConciergeTab = ({
    isEnglish, isRtl, conciergeChats, selChat, setSelChat
}) => {
    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }} className="animate-fade-in">
            <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px' }}>
                    {isEnglish ? 'Concierge Conversations' : 'محادثات نورة'}
                </h1>
                <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    {isEnglish ? 'Chat logs between managers and the platform advisor' : 'سجل المحادثات بين العمال والمنصة والمستشارة الذكية'}
                </p>
                
                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Client' : 'العميل'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Last Message' : 'آخر رسالة'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Updated' : 'التحديث'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.78rem' }}>{isEnglish ? 'Action' : 'الإجراء'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conciergeChats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                            {isEnglish ? 'No chat logs found' : 'لا يوجد سجل محادثات حالياً'}
                                        </td>
                                    </tr>
                                ) : conciergeChats.map(chat => (
                                    <tr 
                                        key={chat.id} 
                                        style={{ 
                                            borderBottom: '1px solid var(--color-border-subtle)', 
                                            background: selChat?.id === chat.id ? 'rgba(139,92,246,0.06)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>{chat.user_name || '—'}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{chat.user_email}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.82rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {chat.last_message || '—'}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.78rem' }}>
                                            {new Date(chat.updated_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button 
                                                onClick={() => setSelChat(chat)} 
                                                style={{ 
                                                    background: 'rgba(139,92,246,0.12)', 
                                                    color: '#A78BFA', 
                                                    border: 'none', 
                                                    borderRadius: '8px', 
                                                    padding: '6px 12px', 
                                                    cursor: 'pointer', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800
                                                }}
                                            >
                                                {isEnglish ? 'Open Chat' : 'فتح المحادثة'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                } />
            </div>

            {selChat && (
                <div style={{ width: '420px', flexShrink: 0, height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'slideIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 900, color: 'var(--color-text-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={18} className="text-primary" />
                            {isEnglish ? 'Chat Details & Insights' : 'تفاصيل المحادثة وتحليل العميل'}
                        </div>
                        <button 
                            onClick={() => setSelChat(null)} 
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6B7280', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* AI Insights Card */}
                    {selChat.metadata?.insights && (
                        <Card s={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '1rem' }} c={
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 900 }}>⚡ {isEnglish ? 'Nora AI Insights' : 'تحليل نورة للعميل'}</div>
                                    <div style={{ 
                                        fontSize: '0.68rem', 
                                        background: selChat.metadata.insights.interest_level === 'high' ? '#10B981' : '#F59E0B',
                                        color: 'white',
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase'
                                    }}>
                                        {selChat.metadata.insights.interest_level === 'high' ? (isEnglish ? 'High Interest' : 'اهتمام عالي') : (isEnglish ? 'Medium' : 'اهتمام متوسط')}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem', marginBottom: '8px' }}>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>{isEnglish ? 'Sector:' : 'النشاط:'} <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{selChat.metadata.insights.business_type || '—'}</span></div>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>{isEnglish ? 'Status:' : 'الحالة:'} <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{selChat.metadata.insights.lead_status || '—'}</span></div>
                                </div>
                                <div style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: 700, display: 'flex', gap: '6px' }}>
                                    <span>💡</span>
                                    <span>{selChat.metadata.insights.primary_need}</span>
                                </div>
                            </div>
                        } />
                    )}

                    <Card s={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', background: 'var(--color-bg-input)' }} c={
                        selChat.messages?.map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                background: m.role === 'user' ? '#1E293B' : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
                                color: m.role === 'user' ? '#E2E8F0' : '#A78BFA',
                                padding: '10px 14px',
                                borderRadius: m.role === 'user' ? (isRtl ? '15px 0 15px 15px' : '0 15px 15px 15px') : (isRtl ? '15px 15px 0 15px' : '15px 15px 15px 0'),
                                maxWidth: '85%',
                                fontSize: '0.82rem',
                                border: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.2)'}`,
                                boxShadow: m.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontWeight: 900, fontSize: '0.7rem', marginBottom: '4px', opacity: 0.7, textTransform: 'uppercase' }}>
                                    {m.role === 'user' ? selChat.user_name : (isEnglish ? 'Nora Advisor' : 'نورة المستشارة')}
                                </div>
                                <div style={{ lineHeight: 1.5 }}>{m.content}</div>
                            </div>
                        ))
                    } />
                    
                    {selChat.ticket_id && (
                        <div style={{ padding: '10px 15px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                            <Check size={16} /> 
                            {isEnglish ? `Linked Support Ticket #${selChat.ticket_id.slice(0, 8)}` : `مرتبطة تذكرة دعم #${selChat.ticket_id.slice(0, 8)}`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConciergeTab;
