import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { Bot, Plus, Calendar, MessageCircle, TrendingUp, Users, Mail, Power, Settings } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const SECTOR_LABELS = {
    beauty: { emoji: '🌸', color: '#EC4899' },
    medical: { emoji: '🩺', color: '#3B82F6' },
    restaurant: { emoji: '🍽', color: '#F59E0B' },
    fitness: { emoji: '🏋', color: '#10B981' },
    real_estate: { emoji: '🏠', color: '#8B5CF6' },
    retail_ecommerce: { emoji: '🛍', color: '#10B981' },
    banking: { emoji: '🏦', color: '#8B5CF6' },
    call_center: { emoji: '🎧', color: '#06B6D4' },
    telecom_it: { emoji: '📡', color: '#EF4444' },
    general: { emoji: '🏢', color: '#6B7280' },
};

const ROLE_LABELS = {
    booking: { icon: Calendar, color: '#8B5CF6' },
    sales: { icon: TrendingUp, color: '#F59E0B' },
    support: { icon: MessageCircle, color: '#10B981' },
    hr: { icon: Users, color: '#3B82F6' },
    email: { icon: Mail, color: '#EC4899' },
};

// Maps UI role → specialty keyword stored in DB (must match agent-handler detection)
const ROLE_TO_SPECIALTY = {
    booking: 'booking',
    sales: 'sales',
    support: 'support',
    hr: 'hr',
    email: 'email',
};

// Rich persona cards shown in hire modal
const ROLE_META = {
    booking: {
        emoji: '📅',
        titleAr: 'منسق الحجوزات', titleEn: 'Booking Coordinator',
        descAr: 'يستقبل طلبات الحجز ويدير الجداول تلقائياً.',
        descEn: 'Collects booking details and manages schedules automatically.',
        skills: ['حجوزات تلقائية', 'إدارة جداول', 'رسائل تأكيد'],
        skillsEn: ['Auto Bookings', 'Schedule Mgmt', 'Confirmations'],
    },
    sales: {
        emoji: '🏆',
        titleAr: 'موظف مبيعات', titleEn: 'Sales Agent',
        descAr: 'يحوّل المحادثات إلى صفقات مغلقة بأسلوب استشاري.',
        descEn: 'Converts conversations into closed deals with consultative selling.',
        skills: ['إغلاق صفقات', 'معالجة اعتراضات', 'عروض مخصصة'],
        skillsEn: ['Deal Closing', 'Objection Handling', 'Custom Offers'],
    },
    support: {
        emoji: '🎧',
        titleAr: 'موظف دعم العملاء', titleEn: 'Customer Support',
        descAr: 'يحل مشكلات العملاء بتعاطف وسرعة.',
        descEn: 'Resolves issues empathetically and follows up to ensure satisfaction.',
        skills: ['حل الشكاوى', 'متابعة العملاء', 'رفع التقارير'],
        skillsEn: ['Issue Resolution', 'Follow-up', 'Reporting'],
    },
    hr: {
        emoji: '👥',
        titleAr: 'مساعد الموارد البشرية', titleEn: 'HR Assistant',
        descAr: 'يُجري مقابلات أولية ويصنّف المتقدمين.',
        descEn: 'Conducts initial interviews and screens candidates.',
        skills: ['مقابلات أولية', 'تصنيف السير الذاتية', 'جدولة مقابلات'],
        skillsEn: ['Screening', 'CV Review', 'Interview Scheduling'],
    },
    email: {
        emoji: '📧',
        titleAr: 'منسق البريد الإلكتروني', titleEn: 'Email Coordinator',
        descAr: 'يصيغ رسائل احترافية وينسق المواعيد.',
        descEn: 'Drafts professional emails and coordinates meetings via mail.',
        skills: ['صياغة رسائل', 'تلخيص مراسلات', 'تنسيق اجتماعات'],
        skillsEn: ['Email Drafts', 'Thread Summary', 'Meeting Coordination'],
    },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Employees = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userSector, setUserSector] = useState('beauty');
    const [filterRole, setFilterRole] = useState('');

    useEffect(() => { loadSectorAndAgents(); }, []);

    const loadSectorAndAgents = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: config } = await supabase
                .from('salon_configs')
                .select('business_type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (config?.business_type) setUserSector(config.business_type);
        }
        const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
        setAgents(data || []);
        setLoading(false);
    };

    const toggleAgent = async (agent) => {
        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id);
        loadSectorAndAgents();
    };

    const sector = SECTOR_LABELS[userSector] || SECTOR_LABELS.beauty;
    const filtered = agents.filter(a => !filterRole || (a.specialty || 'booking') === filterRole);

    return (
        <div style={{ color: 'white', minHeight: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('employeesTitle')}</h1>
                        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '4px 0 0' }}>
                            {t('employeesSector')} <span style={{ color: sector.color, fontWeight: 600 }}>{sector.emoji} {t(`sectors.${userSector}`)}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/hire-agent')}
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    <Plus size={18} /> {t('hireEmployeeBtn')}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: t('totalEmployees'), value: agents.length, color: '#8B5CF6' },
                    { label: t('activeNow'), value: agents.filter(a => a.status === 'active').length, color: '#10B981' },
                    { label: t('differentRoles'), value: [...new Set(agents.map(a => a.specialty || 'booking'))].length, color: '#F59E0B' },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Role Filter only — sector is determined globally from onboarding */}
            <div style={{ marginBottom: '1.5rem' }}>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '0.9rem' }}>
                    <option value="">{t('allRolesFilter')}</option>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{t(`roles.${k}`)}</option>)}
                </select>
            </div>

            {/* Agents Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>{t('loadingFallback')}</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#111827', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Bot size={48} color="#374151" style={{ marginBottom: '1rem' }} />
                    <div style={{ color: '#9CA3AF', marginBottom: '1rem' }}>{t('noEmployeesYet')}</div>
                    <button onClick={() => navigate('/hire-agent')} style={{ background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                        {t('hireFirstEmployeeBtn')}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filtered.map(agent => {
                        const role = ROLE_LABELS[agent.specialty || 'booking'] || ROLE_LABELS.booking;
                        const RoleIcon = role.icon;
                        const isActive = agent.status === 'active';
                        return (
                            <div key={agent.id} style={{ background: '#111827', borderRadius: '16px', border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`, overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${role.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                            {agent.avatar || '👩'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#E5E7EB' }}>{agent.name}</div>
                                            <span style={{ fontSize: '0.75rem', background: `${role.color}20`, color: role.color, padding: '2px 8px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <RoleIcon size={10} />{t(`roles.${agent.specialty || 'booking'}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#10B981' : '#374151' }} />
                                        <span style={{ fontSize: '0.75rem', color: isActive ? '#10B981' : '#6B7280' }}>{isActive ? t('activeStatusBg') : t('stoppedStatusBg')}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5 }}>
                                    {agent.description || `${t('empDescPrefix')} ${t(`roles.${agent.specialty || 'booking'}`)} ${t('empDescInSector')} ${t(`sectors.${userSector}`)}`}
                                </div>
                                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
                                    <button onClick={() => navigate(`/salon-setup?agent=${agent.id}`)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Settings size={14} /> {t('settingsBtn')}
                                    </button>
                                    <button onClick={() => toggleAgent(agent)}
                                        style={{ flex: 1, background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isActive ? '#EF4444' : '#10B981', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Power size={14} /> {isActive ? t('stopBtn') : t('activateBtn')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Employees;
