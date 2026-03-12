import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../services/supabaseService';
import { MessageSquare, Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Inbox, Reply, ExternalLink } from 'lucide-react';

const SupportTicketManager = () => {
    const { t, language } = useLanguage();
    const isAr = language === 'ar';
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('open'); // open, closed, all

    useEffect(() => {
        fetchTickets();
    }, [tab]);

    const fetchTickets = async () => {
        setLoading(true);
        // Placeholder data to simulate a ticketing system
        // In a real app, this would query a 'tickets' table
        setTimeout(() => {
            const mockTickets = [
                { id: 1, title: isAr ? 'مشكلة في تفعيل الحساب' : 'Account Activation Issue', customer: 'Ahmed Khalid', status: 'open', priority: 'high', date: '2026-03-08T10:00:00Z', category: 'Technical' },
                { id: 2, title: isAr ? 'استفسار عن الفوترة' : 'Billing Inquiry', customer: 'Sarah Johnson', status: 'open', priority: 'medium', date: '2026-03-09T14:30:00Z', category: 'Billing' },
                { id: 3, title: isAr ? 'طلب تحديث بيانات' : 'Info Update Request', customer: 'Mohamed Ali', status: 'closed', priority: 'low', date: '2026-03-05T09:15:00Z', category: 'General' },
                { id: 4, title: isAr ? 'عطل في البوابة الإلكترونية' : 'Portal Downtime', customer: 'Elite Corp', status: 'open', priority: 'urgent', date: '2026-03-09T22:10:00Z', category: 'Bug' },
            ];

            let filtered = mockTickets;
            if (tab === 'open') filtered = mockTickets.filter(t => t.status === 'open');
            else if (tab === 'closed') filtered = mockTickets.filter(t => t.status === 'closed');

            setTickets(filtered);
            setLoading(false);
        }, 800);
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'urgent': return { bg: '#EF444420', text: '#EF4444', label: isAr ? 'عاجل جداً' : 'Urgent' };
            case 'high': return { bg: '#F59E0B20', text: '#F59E0B', label: isAr ? 'مرتفع' : 'High' };
            case 'medium': return { bg: '#3B82F620', text: '#3B82F6', label: isAr ? 'متوسط' : 'Medium' };
            default: return { bg: '#6B728020', text: '#9CA3AF', label: isAr ? 'منخفض' : 'Low' };
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '1.5rem', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                        {isAr ? 'مركز الدعم والتذاكر' : 'Support Center & Tickets'}
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                        {isAr ? 'تابع استفسارات عملائك وحل مشاكلهم بكفاءة عالية' : 'Manage customer inquiries and resolve issues efficiently'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Inbox size={18} /> {isAr ? 'أرشفة' : 'Archive'}
                    </button>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {isAr ? 'تذكرة جديدة' : 'New Ticket'}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ color: '#3B82F6', fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>12</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{isAr ? 'تذاكر مفتوحة' : 'Open Tickets'}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ color: '#F59E0B', fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>4</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{isAr ? 'بانتظار الرد' : 'Pending Response'}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ color: '#10B981', fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>142</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{isAr ? 'حلت هذا الشهر' : 'Resolved this month'}</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', gap: '2rem' }}>
                {['open', 'closed', 'all'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '0.75rem 0',
                            background: 'none',
                            border: 'none',
                            color: tab === t ? 'var(--accent)' : '#9CA3AF',
                            fontWeight: 700,
                            position: 'relative',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        {t === 'open' ? (isAr ? 'المفتوحة' : 'Open') : t === 'closed' ? (isAr ? 'المغلقة' : 'Closed') : (isAr ? 'الكل' : 'All')}
                        {tab === t && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
                    </button>
                ))}
            </div>

            {/* Main Content: Tickets & Sidebar */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Ticket List (Left/Main) */}
                <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>{isAr ? 'جاري جلب التذاكر...' : 'Loading tickets...'}</div>
                    ) : tickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <CheckCircle2 size={48} style={{ color: '#10B981', marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{isAr ? 'جميع التذاكر مغلقة!' : 'All tickets resolved!'}</h3>
                            <p style={{ color: '#6B7280' }}>{isAr ? 'فريق الدعم الرقمي قام بعمل رائع اليوم.' : 'Your digital support team has done a great job today.'}</p>
                        </div>
                    ) : tickets.map(ticket => {
                        const priority = getPriorityStyle(ticket.priority);
                        return (
                            <div key={ticket.id} className="card shadow-premium" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.03)', background: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h4 style={{ fontWeight: 700, color: 'white' }}>{ticket.title}</h4>
                                            <span style={{ fontSize: '0.7rem', color: '#6B7280', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>#{ticket.id}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                            <span>{ticket.customer}</span>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(ticket.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                                            <span style={{ color: '#8B5CF6' }}>{ticket.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '6px', background: priority.bg, color: priority.text, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {priority.label}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title={isAr ? 'رد' : 'Reply'}><Reply size={16} /></button>
                                        <button style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3B82F6', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ExternalLink size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar Quick Help (Right) */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: '20px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={20} color="#8B5CF6" />
                            {isAr ? 'مساعدة سريعة' : 'Quick Help'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div 
                                onClick={() => window.location.href='/help/integrations'}
                                style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#C4B5FD', marginBottom: '4px' }}>
                                    {isAr ? 'كيفية تضمين الموظف في موقعك' : 'How to embed the agent'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    {isAr ? 'دليل خطوة بخطوة لربط المحادثة بموقعك الإلكتروني.' : 'Step-by-step guide to connect the chat to your site.'}
                                </div>
                            </div>
                            <div 
                                onClick={() => window.location.href='/salon-setup'}
                                style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#C4B5FD', marginBottom: '4px' }}>
                                    {isAr ? 'تحديث بيانات المنشأة' : 'Update Entity Profile'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    {isAr ? 'تأكد من أن الموظف لديه أحدث المعلومات.' : 'Ensure your agent has the latest information.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                        <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{isAr ? 'هل تحتاج لمساعدة فورية؟' : 'Need instant help?'}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5, marginBottom: '1rem' }}>
                            {isAr ? 'فريقنا متاح للرد على أي استفسارات تقنية عبر الواتساب.' : 'Our team is available to answer any technical queries via WhatsApp.'}
                        </p>
                        <a 
                            href="https://wa.me/966530916299" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#22C55E', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                            <MessageCircle size={18} /> {isAr ? 'واتساب الدعم' : 'WhatsApp Support'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketManager;
