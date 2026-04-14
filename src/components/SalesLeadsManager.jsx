import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../services/supabaseService';
import { TrendingUp, Plus, Search, Filter, MoreHorizontal, User, Users, Mail, Phone, Calendar, CheckCircle2, Clock, XCircle, Tag } from 'lucide-react';

const SalesLeadsManager = () => {
    const { t, language } = useLanguage();
    const isAr = language === 'ar';
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // First get the business config to find the right customers
            const { data: config } = await supabase
                .from('entities')
                .select('id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            let query = supabase.from('customers').select('*');

            if (config) {
                query = query.eq('entity_id', config.id);
            } else {
                // Fallback to user_id if config not found (assuming migration run or legacy data)
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.warn('Error fetching leads:', error.message);
                // If column user_id is missing (400), we just return empty
                if (error.code === 'PGRST204') setLeads([]);
            } else {
                setLeads(data || []);
            }
        } catch (err) {
            console.error('Leads Hub Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return { bg: '#3B82F620', text: '#3B82F6', label: isAr ? 'جديد' : 'New' };
            case 'contacted': return { bg: '#F59E0B20', text: '#F59E0B', label: isAr ? 'تم التواصل' : 'Contacted' };
            case 'qualified': return { bg: '#8B5CF620', text: '#8B5CF6', label: isAr ? 'مؤهل' : 'Qualified' };
            case 'closed': return { bg: '#10B98120', text: '#10B981', label: isAr ? 'مغلق (ناجح)' : 'Closed Won' };
            case 'lost': return { bg: '#EF444420', text: '#EF4444', label: isAr ? 'خسارة' : 'Closed Lost' };
            default: return { bg: '#6B728020', text: '#9CA3AF', label: status || (isAr ? 'غير محدد' : 'Unknown') };
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.email || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-fade-in" style={{ padding: '1.5rem', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                        {isAr ? 'إدارة المبيعات والعملاء المحتملين' : 'Sales & Leads Management'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {isAr ? 'تابع رحلة عملائك من الاهتمام الأولي حتى إغلاق الصفقة' : 'Track your customer journey from initial interest to closing deals'}
                    </p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> {isAr ? 'إضافة عميل محتمل' : 'Add New Lead'}
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: isAr ? 'إجمالي المحتملين' : 'Total Leads', value: leads.length, icon: Users, color: '#3B82F6' },
                    { label: isAr ? 'فرص نشطة' : 'Active Deals', value: leads.filter(l => l.status === 'qualified').length, icon: TrendingUp, color: '#F59E0B' },
                    { label: isAr ? 'صفقات مغلقة' : 'Closed Won', value: leads.filter(l => l.status === 'closed').length, icon: CheckCircle2, color: '#10B981' },
                    { label: isAr ? 'معدل التحويل' : 'Conversion Rate', value: leads.length ? Math.round((leads.filter(l => l.status === 'closed').length / leads.length) * 100) + '%' : '0%', icon: Tag, color: '#8B5CF6' },
                ].map((stat, idx) => (
                    <div key={idx} style={{ background: 'var(--color-bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{stat.label}</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', [isAr ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input
                        className="input-field"
                        placeholder={isAr ? 'البحث عن عميل بالاسم أو البريد...' : 'Search by name or email...'}
                        style={{ paddingInlineStart: '40px' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        className="input-field"
                        style={{ width: 'auto', minWidth: '150px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
                        <option value="new">{isAr ? 'جديد' : 'New'}</option>
                        <option value="contacted">{isAr ? 'تم التواصل' : 'Contacted'}</option>
                        <option value="qualified">{isAr ? 'مؤهل' : 'Qualified'}</option>
                        <option value="closed">{isAr ? 'مغلق' : 'Closed'}</option>
                    </select>
                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} /> {isAr ? 'فلترة متقدمة' : 'Filters'}
                    </button>
                </div>
            </div>

            {/* Leads Table */}
            <div style={{ background: 'var(--color-bg-surface)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{isAr ? 'العميل' : 'Lead'}</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{isAr ? 'الحالة' : 'Status'}</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{isAr ? 'تاريخ الإضافة' : 'Date Added'}</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{isAr ? 'المتابعة القادمة' : 'Next Follow-up'}</th>
                            <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : filteredLeads.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{isAr ? 'لا يوجد عملاء محتملون يطابقون البحث' : 'No leads found matching your criteria'}</td></tr>
                        ) : filteredLeads.map((lead) => {
                            const status = getStatusColor(lead.status || 'new');
                            return (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                                                {(lead.full_name || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{lead.full_name || (isAr ? 'غير معروف' : 'Unknown')}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{lead.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '99px', background: status.bg, color: status.text, fontSize: '0.75rem', fontWeight: 700 }}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                        {new Date(lead.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                            <Clock size={14} />
                                            {isAr ? 'غداً، 10:00 ص' : 'Tomorrow, 10:00 AM'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesLeadsManager;
