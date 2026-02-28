import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import * as adminService from '../services/adminService';
import {
    LayoutDashboard, Users, Bot, Calendar, Globe, CreditCard,
    Link as LinkIcon, Save, Power, Edit2, Check, X, TrendingUp,
    LogOut, Eye, Key, Plus, Bell, Mail, MessageSquare, Zap, Trash2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';

// ── Icon Mapping for Dynamic Configs ──────────────────────────────────────────
const ICON_MAP = { Mail, MessageSquare, Bell, Zap, Globe, Bot, Users, Calendar };

// ── Tiny UI helpers ───────────────────────────────────────────────────────────
const Card = ({ c, s = {} }) => <div style={{ background: '#111827', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.1rem', ...s }}>{c}</div>;
const Btn = ({ onClick, disabled, children, color = '#8B5CF6', style = {} }) => (
    <button onClick={onClick} disabled={disabled} style={{ background: `linear-gradient(135deg,${color},${color}cc)`, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.83rem', opacity: disabled ? 0.6 : 1, ...style }}>{children}</button>
);
const Input = ({ value, onChange, placeholder, type = 'text' }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', boxSizing: 'border-box', fontSize: '0.82rem', fontFamily: type === 'password' ? 'monospace' : 'inherit' }} />
);
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <Card c={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'white' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.73rem', color, marginTop: '3px' }}>{sub}</div>}
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '9px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></div>
    </div>} />
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const { isEnglish, t } = useLanguage();
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Dynamic Configs
    const [sectors, setSectors] = useState({ beauty: { l: 'تجميل', e: '🌸', c: '#EC4899', on: true }, medical: { l: 'طبي', e: '🩺', c: '#3B82F6', on: true }, restaurant: { l: 'مطاعم', e: '🍽', c: '#F59E0B', on: true }, fitness: { l: 'رياضة', e: '🏋', c: '#10B981', on: false }, real_estate: { l: 'عقارات', e: '🏠', c: '#8B5CF6', on: false }, general: { l: 'عام', e: '🏢', c: '#6B7280', on: true } });
    const [roles, setRoles] = useState({ booking: { l: 'منسقة حجوزات', c: '#8B5CF6' }, support: { l: 'خدمة عملاء', c: '#10B981' }, sales: { l: 'مبيعات', c: '#F59E0B' }, followup: { l: 'متابعة', c: '#3B82F6' } });
    const [agentAppsConfig, setAgentAppsConfig] = useState([
        { id: 'email_notify', icon: 'Mail', label: 'إشعار بريد إلكتروني', desc: 'رسالة للمدير عند كل حجز جديد' },
        { id: 'sms_notify', icon: 'MessageSquare', label: 'إشعار SMS', desc: 'رسالة نصية للعميل بتأكيد حجزه' },
        { id: 'reminder', icon: 'Bell', label: 'تذكير قبل الموعد', desc: 'تذكير آلي قبل الموعد بساعة' },
        { id: 'followup', icon: 'Zap', label: 'متابعة بعد الخدمة', desc: 'رسالة متابعة بعد 24 ساعة من الموعد' },
    ]);
    const STATUSES = { pending: { bg: '#F59E0B20', t: '#F59E0B', l: 'معلق' }, confirmed: { bg: '#10B98120', t: '#10B981', l: 'مؤكد' }, completed: { bg: '#3B82F620', t: '#3B82F6', l: 'مكتمل' }, cancelled: { bg: '#EF444420', t: '#EF4444', l: 'ملغي' } };
    const PLANS = { basic: { bg: '#6B728020', t: '#9CA3AF', l: 'مجاني' }, starter: { bg: '#10B98120', t: '#10B981', l: 'انطلاق' }, pro: { bg: '#8B5CF620', t: '#A78BFA', l: 'احتراف' }, enterprise: { bg: '#F59E0B20', t: '#F59E0B', l: 'نخبة' } };

    // Data
    const [clients, setClients] = useState([]);
    const [agents, setAgents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [clientKeys, setClientKeys] = useState({});
    const [logs, setLogs] = useState([]);
    const [logParams, setLogParams] = useState({ category: '', level: '', limit: 50 });
    const [templates, setTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ name: '', name_en: '', specialty: 'booking', business_type: 'beauty', description: '', description_en: '' });
    const [showAddTemplate, setShowAddTemplate] = useState(false);

    // UI
    const [selClient, setSelClient] = useState(null);
    const [bFilter, setBFilter] = useState('');
    const [editAgent, setEditAgent] = useState(null);
    const [intTab, setIntTab] = useState('platform');
    const [selIntClient, setSelIntClient] = useState(null);
    const [showAddAgent, setShowAddAgent] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', specialty: 'booking', business_type: 'beauty', user_id: '' });
    const [agentApps, setAgentApps] = useState({}); // {agentId: {appId: bool}}

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            // Load data via RPC-backed adminService (bypasses RLS)
            const [profiles, ag, bk, keyData] = await Promise.all([
                adminService.getAllCustomers(),
                adminService.getAllAgents(),
                adminService.getAllBookings(),
                adminService.getAllSalonConfigs()
            ]);

            // Merge Profile + SalonConfig data
            const clientMap = {};
            (keyData || []).forEach(k => {
                clientMap[k.user_id] = {
                    ...k,
                    id: k.user_id,
                    salonConfigId: k.id,
                    full_name: k.agent_name || '—',
                    email: '—'
                };
            });
            (profiles || []).forEach(p => {
                if (clientMap[p.id]) {
                    clientMap[p.id] = { ...clientMap[p.id], ...p };
                } else {
                    clientMap[p.id] = { ...p };
                }
            });

            const mergedClients = Object.values(clientMap);
            setClients(mergedClients);
            setAgents(ag || []);
            setBookings(bk || []);

            // Platform settings & Dynamic Configs
            const [plans, integ, dbSectors, dbRoles, dbApps] = await Promise.all([
                adminService.getPlatformSettings('pricing_plans'),
                adminService.getPlatformSettings('external_integrations'),
                adminService.getPlatformSettings('system_sectors'),
                adminService.getPlatformSettings('system_roles'),
                adminService.getPlatformSettings('system_agent_apps'),
            ]);
            setPricing(plans || [{ id: 'starter', name: 'باقة الانطلاق', monthlyPrice: 199, yearlyPrice: 159 }, { id: 'pro', name: 'باقة الاحتراف', monthlyPrice: 399, yearlyPrice: 319 }, { id: 'enterprise', name: 'باقة النخبة', monthlyPrice: 899, yearlyPrice: 719 }]);
            setIntegrations(integ || [{ id: 'n8n', name: 'n8n Webhook', url: '', key: '', status: 'Disconnected' }, { id: 'openai', name: 'OpenAI API', url: '', key: '', status: 'Disconnected' }, { id: 'telegram', name: 'Telegram Platform Bot', url: '', key: '', status: 'Disconnected' }]);

            if (dbSectors) setSectors(dbSectors);
            if (dbRoles) setRoles(dbRoles);
            if (dbApps) setAgentAppsConfig(dbApps);

            // Per-client keys (already fetched in keyData at line 83)
            const kmap = {}; (keyData || []).forEach(k => { kmap[k.user_id] = { telegram_token: k.telegram_token || '', whatsapp_number: k.whatsapp_number || '', whatsapp_api_key: k.whatsapp_api_key || '' }; });
            setClientKeys(kmap);

            // Agent apps (stored in agents.metadata jsonb)
            const appMap = {};
            (ag || []).forEach(a => { if (a.metadata?.apps) appMap[a.id] = a.metadata.apps; });
            setAgentApps(appMap);

            fetchTemplates();

            adminService.logSystemEvent('info', 'system', 'Admin dashboard loaded successfully');
        } catch (e) {
            console.error('Admin load error:', e);
            flash('❌ خطأ في تحميل البيانات: ' + e.message);
        }
        setLoading(false);
    };

    const fetchLogs = async () => {
        let q = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(logParams.limit);
        if (logParams.category) q = q.eq('category', logParams.category);
        if (logParams.level) q = q.eq('level', logParams.level);
        const { data, error } = await q;
        if (!error) setLogs(data || []);
    };

    const fetchTemplates = async () => {
        try {
            const data = await adminService.getTemplates();
            setTemplates(data || []);
        } catch (e) {
            console.warn('Templates fetch failed:', e.message);
        }
    };

    const addTemplate = async () => {
        if (!newTemplate.name || !newTemplate.name_en) return flash('❌ أدخل اسم القالب باللغتين');
        try {
            const data = await adminService.saveTemplate({
                name: newTemplate.name,
                name_en: newTemplate.name_en,
                description: newTemplate.description,
                description_en: newTemplate.description_en,
                specialty: newTemplate.specialty,
                business_type: newTemplate.business_type
            });
            setTemplates(p => [data, ...p]);
            setShowAddTemplate(false);
            setNewTemplate({ name: '', name_en: '', specialty: 'booking', business_type: 'beauty', description: '', description_en: '' });
            flash('✅ تم إنشاء قالب الموظفة');
        } catch (err) { flash('❌ فشل إنشاء القالب: ' + err.message); }
    };

    const deleteTemplate = async (id) => {
        if (!confirm('حذف هذا القالب؟')) return;
        try {
            await adminService.deleteTemplate(id);
            setTemplates(p => p.filter(t => t.id !== id));
            flash('✅ تم حذف القالب');
        } catch (err) { flash('❌ فشل الحذف'); }
    };

    useEffect(() => {
        if (tab === 'infrastructure') fetchLogs();
    }, [tab, logParams.category, logParams.level]);

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
    const updateClientPlan = async (id, plan) => {
        try {
            await adminService.updateClientPlan(id, plan);
            setClients(p => p.map(c => c.id === id ? { ...c, subscription_tier: plan } : c));
            flash('✅ تم تحديث الاشتراك');
        } catch (err) {
            flash('❌ فشل تحديث الاشتراك: ' + err.message);
        }
    };

    const toggleAgent = async (a) => {
        const s = a.status === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase.from('agents').update({ status: s }).eq('id', a.id);
            if (error) throw error;
            setAgents(p => p.map(x => x.id === a.id ? { ...x, status: s } : x));
            flash('✅ تم تحديث حالة الموظفة');
        } catch (err) {
            flash('❌ فشل التحديث: ' + err.message);
        }
    };

    const saveAgentEdit = async (a) => {
        try {
            // Removed 'description' as it doesn't exist in DB
            const { error } = await supabase.from('agents').update({ name: a.name, specialty: a.specialty }).eq('id', a.id);
            if (error) throw error;
            setAgents(p => p.map(x => x.id === a.id ? a : x));
            setEditAgent(null);
            flash('✅ تم حفظ التعديلات');
        } catch (err) {
            flash('❌ فشل الحفظ: ' + err.message);
        }
    };

    const deleteAgent = async (id) => {
        if (!confirm('حذف هذه الموظفة؟')) return;
        try {
            const { error } = await supabase.from('agents').delete().eq('id', id);
            if (error) throw error;
            setAgents(p => p.filter(a => a.id !== id));
            flash('✅ تم الحذف');
        } catch (err) {
            flash('❌ فشل الحذف: ' + err.message);
        }
    };
    const addAgent = async () => {
        if (!newAgent.name || !newAgent.user_id) return flash('❌ اختر العميل وأدخل الاسم');
        const client = clients.find(c => c.id === newAgent.user_id);
        const { data, error } = await supabase.from('agents').insert({
            name: newAgent.name,
            specialty: newAgent.specialty,
            business_type: newAgent.business_type,
            user_id: newAgent.user_id,
            salon_config_id: client?.salonConfigId || null,
            status: 'active',
            created_at: new Date().toISOString()
        }).select().single();

        if (error) return flash('❌ خطأ: ' + error.message);
        setAgents(p => [data, ...p]);
        setShowAddAgent(false);
        setNewAgent({ name: '', specialty: 'booking', business_type: 'beauty', user_id: '' });
        flash('✅ تمت إضافة الموظفة');
    };
    const toggleApp = async (agentId, appId) => {
        const current = agentApps[agentId] || {};
        const updated = { ...current, [appId]: !current[appId] };
        setAgentApps(p => ({ ...p, [agentId]: updated }));
        await supabase.from('agents').update({ metadata: { apps: updated } }).eq('id', agentId);
    };
    const updateBookingStatus = async (id, status) => {
        try {
            const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
            if (error) throw error;
            setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
            flash('✅ تم تحديث حالة الحجز');
        } catch (err) { flash('❌ فشل تحديث الحجز'); }
    };
    const savePlatformInteg = async () => { setSaving(true); await adminService.updatePlatformSettings('external_integrations', integrations); setSaving(false); flash('✅ تم الحفظ'); };
    const saveClientKey = async (uid) => {
        const k = clientKeys[uid] || {};
        const { error } = await supabase.from('salon_configs').update({ telegram_token: k.telegram_token || null, whatsapp_number: k.whatsapp_number || null, whatsapp_api_key: k.whatsapp_api_key || null }).eq('user_id', uid);
        flash(error ? '❌ خطأ في الحفظ' : '✅ تم حفظ مفاتيح العميل');
    };
    const handleLogout = async () => { await signOut(); navigate('/login'); };

    const cl = (uid) => agents.filter(a => a.user_id === uid || a.salon_config_id === clients.find(c => c.id === uid)?.salonConfigId);
    const bl = (uid) => bookings.filter(b => b.user_id === uid || b.salon_config_id === clients.find(c => c.id === uid)?.salonConfigId);
    const filtBk = bFilter ? bookings.filter(b => b.user_id === bFilter || b.salon_id === bFilter || b.salon_config_id === bFilter) : bookings;

    const NAV = [
        { id: 'overview', i: LayoutDashboard, l: 'نظرة عامة' },
        { id: 'clients', i: Users, l: 'العملاء' },
        { id: 'agents', i: Bot, l: 'الموظفات' },
        { id: 'bookings', i: Calendar, l: 'الحجوزات' },
        { id: 'pricing', i: CreditCard, l: 'الباقات والأسعار' },
        { id: 'infrastructure', i: Globe, l: 'البنية التحتية' },
        { id: 'integrations', i: LinkIcon, l: 'الربط التقني' },
    ];

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070B14', color: 'white', fontSize: '1rem', gap: '10px' }}><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />جاري تحميل بيانات المنصة...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#070B14', direction: 'rtl', color: '#E4E4E7', fontFamily: "'Inter','Tajawal',sans-serif" }}>
            {/* Flash message */}
            {msg && <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#1F2937', border: '1px solid #374151', color: 'white', padding: '10px 20px', borderRadius: '10px', zIndex: 9999, fontWeight: 600, fontSize: '0.9rem' }}>{msg}</div>}

            {/* Sidebar */}
            <aside style={{ width: '230px', background: '#0D1117', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', right: 0, zIndex: 50 }}>
                <div style={{ padding: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#10B981,#3B82F6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>24</div>
                    <div><div style={{ fontWeight: 900, fontSize: '0.95rem', background: 'linear-gradient(90deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>24Shift</div>
                        <div style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 700 }}>⚡ ADMIN</div></div>
                </div>
                <nav style={{ flex: 1, padding: '0.6rem', overflowY: 'auto' }}>
                    {NAV.map(({ id, i: Icon, l }) => {
                        const a = tab === id; return (
                            <button key={id} onClick={() => setTab(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '8px', background: a ? 'rgba(139,92,246,0.12)' : 'transparent', color: a ? '#A78BFA' : '#6B7280', border: 'none', cursor: 'pointer', fontWeight: a ? 700 : 400, fontSize: '0.84rem', marginBottom: '2px', borderRight: a ? '3px solid #8B5CF6' : '3px solid transparent', transition: 'all 0.15s' }}>
                                <Icon size={16} /><span>{l}</span>
                            </button>
                        );
                    })}
                </nav>
                <div style={{ padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 11px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '0.83rem' }}>
                        <LogOut size={14} />تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main style={{ flex: 1, marginRight: '230px', padding: '1.75rem 2rem', overflowX: 'hidden', minWidth: 0 }}>

                {/* ── OVERVIEW ── */}
                {tab === 'overview' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>لوحة القيادة</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.85rem' }}>نظرة شاملة على أداء منصة 24Shift</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: '0.9rem', marginBottom: '1.75rem' }}>
                        <StatCard icon={Users} label="إجمالي العملاء" value={clients.length} color="#10B981" sub={`+${Math.max(0, Math.round(clients.length * 0.12))} هذا الشهر`} />
                        <StatCard icon={Bot} label="موظفات نشطة" value={agents.filter(a => a.status === 'active').length} color="#8B5CF6" />
                        <StatCard icon={Calendar} label="حجوزات معلقة" value={bookings.filter(b => b.status === 'pending').length} color="#F59E0B" sub="تحتاج مراجعة" />
                        <StatCard icon={TrendingUp} label="إيراد متوقع" value={`${(clients.length * 399).toLocaleString()} ر`} color="#3B82F6" sub="شهري تقديري" />
                    </div>
                    <h3 style={{ color: 'white', marginBottom: '0.9rem', fontSize: '0.9rem', fontWeight: 700 }}>توزيع العملاء بالقطاعات</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem' }}>
                        {Object.entries(sectors).map(([k, v]) => {
                            const cnt = clients.filter(c => c.business_type === k).length;
                            return <Card key={k} s={{ padding: '0.9rem', border: `1px solid ${v.c}25`, opacity: v.on ? 1 : 0.5 }} c={<>
                                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{v.e}</div>
                                <div style={{ color: v.c, fontWeight: 700, fontSize: '0.77rem' }}>{v.l}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{cnt}</div>
                            </>} />;
                        })}
                    </div>
                </div>}

                {/* ── CLIENTS ── */}
                {tab === 'clients' && <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>العملاء</h1>
                        <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>{clients.length} عميل مسجل</p>
                        <Card s={{ padding: 0, overflow: 'hidden' }} c={<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['العميل', 'القطاع', 'الموظفات', 'الاشتراك', 'تفاصيل'].map(h => <th key={h} style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontWeight: 600, fontSize: '0.77rem' }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {clients.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>لا يوجد عملاء — تحقق من صلاحيات RLS في Supabase</td></tr>
                                    : clients.map(c => {
                                        const sec = sectors[c.business_type] || { l: '—', e: '🏢' };
                                        const plan = PLANS[c.subscription_tier || 'basic'] || PLANS.basic;
                                        return <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: selClient?.id === c.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><div style={{ fontWeight: 700, color: 'white', fontSize: '0.84rem' }}>{c.full_name || '—'}</div><div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{c.email}</div></td>
                                            <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF', fontSize: '0.82rem' }}>{sec.e} {sec.l}</td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><span style={{ background: '#8B5CF620', color: '#A78BFA', padding: '1px 8px', borderRadius: '99px', fontSize: '0.73rem' }}>{cl(c.id).length} موظفة</span></td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><select value={c.subscription_tier || 'basic'} onChange={e => updateClientPlan(c.id, e.target.value)} style={{ background: plan.bg, color: plan.t, border: 'none', borderRadius: '6px', padding: '2px 8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                                                {Object.entries(PLANS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                            </select></td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><button onClick={() => setSelClient(selClient?.id === c.id ? null : c)} style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: 'none', borderRadius: '6px', padding: '3px 9px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={12} />عرض</button></td>
                                        </tr>;
                                    })}
                            </tbody>
                        </table>} />
                    </div>
                    {/* Client panel */}
                    {selClient && <div style={{ width: '300px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>تفاصيل العميل</div>
                            <button onClick={() => setSelClient(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <Card s={{ marginBottom: '0.75rem' }} c={<>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.88rem' }}>{selClient.full_name || '—'}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{selClient.email}</div>
                        </>} />
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginBottom: '5px' }}>الموظفات ({cl(selClient.id).length})</div>
                        {cl(selClient.id).slice(0, 4).map(a => <Card key={a.id} s={{ marginBottom: '5px', padding: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} c={<>
                            <div><div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{a.name}</div><div style={{ color: '#6B7280', fontSize: '0.7rem' }}>{ROLES[a.specialty]?.l || a.specialty}</div></div>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.status === 'active' ? '#10B981' : '#374151' }} />
                        </>} />)}
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginTop: '0.7rem', marginBottom: '5px' }}>آخر الحجوزات ({bl(selClient.id).length})</div>
                        {bl(selClient.id).slice(0, 3).map(b => {
                            const sc = STATUSES[b.status] || STATUSES.pending; return <Card key={b.id} s={{ marginBottom: '5px', padding: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} c={<>
                                <div><div style={{ color: 'white', fontSize: '0.78rem' }}>{b.customer_name || '—'}</div><div style={{ color: '#6B7280', fontSize: '0.7rem' }}>{b.booking_date}</div></div>
                                <span style={{ background: sc.bg, color: sc.t, padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{sc.l}</span>
                            </>} />;
                        })}
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginTop: '0.7rem', marginBottom: '5px' }}>🔑 مفاتيح الربط</div>
                        <Card c={<>
                            {[['telegram_token', 'Telegram Token'], ['whatsapp_number', 'رقم WhatsApp'], ['whatsapp_api_key', 'WhatsApp Key']].map(([f, l]) => <div key={f} style={{ marginBottom: '0.6rem' }}>
                                <label style={{ display: 'block', color: '#6B7280', fontSize: '0.7rem', marginBottom: '3px' }}>{l}</label>
                                <Input type={f.includes('token') || f.includes('key') ? 'password' : 'text'} value={clientKeys[selClient.id]?.[f] || ''} placeholder="—" onChange={e => setClientKeys(p => ({ ...p, [selClient.id]: { ...(p[selClient.id] || {}), [f]: e.target.value } }))} />
                            </div>)}
                            <Btn onClick={() => saveClientKey(selClient.id)} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}><Key size={13} />حفظ المفاتيح</Btn>
                        </>} />
                    </div>}
                </div>}

                {/* ── AGENTS ── */}
                {tab === 'agents' && <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>الموظفات</h1>
                            <p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.83rem' }}>{agents.length} موظفة — {agents.filter(a => a.status === 'active').length} نشطة</p></div>
                        <Btn onClick={() => setShowAddAgent(!showAddAgent)}><Plus size={15} />إضافة موظفة</Btn>
                    </div>

                    {/* Add agent form */}
                    {showAddAgent && <Card s={{ marginBottom: '1.25rem', border: '1px solid rgba(139,92,246,0.3)' }} c={<div>
                        <div style={{ fontWeight: 700, color: '#A78BFA', marginBottom: '1rem', fontSize: '0.9rem' }}>➕ إضافة موظفة جديدة</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>اسم الموظفة *</label>
                                <Input value={newAgent.name} onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))} placeholder="مثال: سارة" /></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>التخصص</label>
                                <select value={newAgent.specialty} onChange={e => setNewAgent(p => ({ ...p, specialty: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                </select></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>القطاع</label>
                                <select value={newAgent.business_type} onChange={e => setNewAgent(p => ({ ...p, business_type: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v.e} {v.l}</option>)}
                                </select></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>أسند للعميل *</label>
                                <select value={newAgent.user_id} onChange={e => setNewAgent(p => ({ ...p, user_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    <option value="">اختر عميل...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                                </select></div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <Btn onClick={addAgent}><Check size={14} />إنشاء الموظفة</Btn>
                            <button onClick={() => setShowAddAgent(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.83rem' }}>إلغاء</button>
                        </div>
                    </div>} />}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                        {agents.map(agent => {
                            const role = roles[agent.specialty || 'booking'] || roles.booking || { l: '—', c: '#6B7280' };
                            const isActive = agent.status === 'active';
                            const isEd = editAgent?.id === agent.id;
                            const apps = agentApps[agent.id] || {};
                            return <Card key={agent.id} s={{ border: `1px solid ${isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}` }} c={<>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
                                    {isEd ? <input value={editAgent.name} onChange={e => setEditAgent({ ...editAgent, name: e.target.value })} style={{ background: '#1F2937', border: '1px solid #8B5CF6', borderRadius: '5px', color: 'white', padding: '2px 7px', fontWeight: 700, flex: 1, marginLeft: '5px', fontSize: '0.85rem' }} />
                                        : <div style={{ fontWeight: 700, color: 'white', fontSize: '0.87rem' }}>{agent.name}</div>}
                                    <div style={{ display: 'flex', gap: '3px' }}>
                                        {isEd ? <><button onClick={() => saveAgentEdit(editAgent)} style={{ background: '#10B98120', color: '#10B981', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Check size={12} /></button><button onClick={() => setEditAgent(null)} style={{ background: '#EF444420', color: '#EF4444', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><X size={12} /></button></>
                                            : <><button onClick={() => setEditAgent({ ...agent })} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                                                <button onClick={() => deleteAgent(agent.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Trash2 size={12} /></button></>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ background: `${role.c}20`, color: role.c, padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{role.l}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{sectors[agent.business_type]?.e || '🏢'}</span>
                                </div>
                                {/* Agent Apps */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '5px', fontWeight: 600 }}>التطبيقات والإضافات:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                        {agentAppsConfig.map(app => {
                                            const Icon = ICON_MAP[app.icon] || Bot; const on = !!apps[app.id];
                                            return <button key={app.id} onClick={() => toggleApp(agent.id, app.id)} title={app.desc}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 7px', borderRadius: '6px', background: on ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`, color: on ? '#A78BFA' : '#4B5563', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600 }}>
                                                <Icon size={11} />{app.label}
                                            </button>;
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10B981' : '#374151' }} /><span style={{ fontSize: '0.72rem', color: isActive ? '#10B981' : '#6B7280' }}>{isActive ? 'نشطة' : 'متوقفة'}</span></div>
                                    <button onClick={() => toggleAgent(agent)} style={{ background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isActive ? '#EF4444' : '#10B981', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Power size={11} />{isActive ? 'إيقاف' : 'تفعيل'}
                                    </button>
                                </div>
                            </>} />;
                        })}
                    </div>
                </div>}

                {/* ── BOOKINGS ── */}
                {tab === 'bookings' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>الحجوزات</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.83rem' }}>{bookings.length} حجز إجمالي</p>
                    <div style={{ marginBottom: '0.9rem', display: 'flex', gap: '0.75rem' }}>
                        <select value={bFilter} onChange={e => setBFilter(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '7px 11px', fontSize: '0.82rem', minWidth: '220px' }}>
                            <option value="">كل العملاء ({bookings.length})</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({bl(c.id).length})</option>)}
                        </select>
                        {bFilter && <button onClick={() => setBFilter('')} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '7px', padding: '6px 11px', cursor: 'pointer', fontSize: '0.8rem' }}>إلغاء الفلتر</button>}
                    </div>
                    <Card s={{ padding: 0, overflow: 'hidden' }} c={<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['العميل', 'الخدمة', 'التاريخ', 'الوقت', 'الحالة'].map(h => <th key={h} style={{ padding: '0.75rem 0.9rem', color: '#6B7280', fontWeight: 600, fontSize: '0.77rem' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtBk.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>لا توجد حجوزات</td></tr>
                                : filtBk.map(b => {
                                    const sc = STATUSES[b.status] || STATUSES.pending; return <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '0.7rem 0.9rem' }}><div style={{ fontWeight: 600, color: 'white', fontSize: '0.82rem' }}>{b.customer_name || '—'}</div><div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{b.customer_phone}</div></td>
                                        <td style={{ padding: '0.7rem 0.9rem', color: '#9CA3AF', fontSize: '0.8rem' }}>{b.service_requested || '—'}</td>
                                        <td style={{ padding: '0.7rem 0.9rem', color: '#9CA3AF', fontSize: '0.79rem' }}>{b.booking_date}</td>
                                        <td style={{ padding: '0.7rem 0.9rem', color: '#9CA3AF', fontSize: '0.79rem' }}>{b.booking_time?.slice(0, 5)}</td>
                                        <td style={{ padding: '0.7rem 0.9rem' }}><select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)} style={{ background: sc.bg, color: sc.t, border: 'none', borderRadius: '6px', padding: '2px 8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                                            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                        </select></td>
                                    </tr>;
                                })}
                        </tbody>
                    </table>} />
                </div>}

                {/* ── INFRASTRUCTURE ── */}
                {tab === 'infrastructure' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>البنية التحتية</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>إدارة القطاعات والأدوار وسجلات النظام</p>

                    <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', background: '#111827', padding: '3px', borderRadius: '9px', width: 'fit-content' }}>
                        {[['cfg', '⚙️ الإعدادات'], ['tmpl', '🎭 القوالب'], ['logs', '📋 السجلات']].map(([id, lbl]) => <button key={id} onClick={() => setIntTab(id)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: intTab === id ? '#8B5CF6' : 'transparent', color: intTab === id ? 'white' : '#6B7280' }}>
                            {lbl}
                        </button>)}
                    </div>

                    {intTab === 'cfg' && <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>القطاعات المتاحة</h3>
                            <Btn onClick={async () => {
                                setSaving(true);
                                await Promise.all([
                                    adminService.updatePlatformSettings('system_sectors', sectors),
                                    adminService.updatePlatformSettings('system_roles', roles)
                                ]);
                                setSaving(false);
                                flash('✅ تم حفظ إعدادات البنية التحتية');
                            }} disabled={saving}><Save size={14} />حفظ التغييرات</Btn>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1rem' }}>
                            {Object.entries(sectors).map(([sk, sec]) => {
                                return <Card key={sk} s={{ border: `1px solid ${sec.on ? sec.c + '30' : 'rgba(255,255,255,0.05)'}` }} c={<>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input value={sec.e} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, e: e.target.value } }))} style={{ width: '30px', background: 'transparent', border: 'none', fontSize: '1.3rem', color: 'white', textAlign: 'center' }} />
                                            <div>
                                                <input value={sec.l} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, l: e.target.value } }))} style={{ fontWeight: 700, color: 'white', fontSize: '0.87rem', background: 'transparent', border: 'none' }} />
                                                <input type="color" value={sec.c} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, c: e.target.value } }))} style={{ width: '30px', height: '15px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'block' }} />
                                            </div>
                                        </div>
                                        <button onClick={() => setSectors(p => ({ ...p, [sk]: { ...sec, on: !sec.on } }))} style={{ background: sec.on ? '#10B98120' : 'rgba(255,255,255,0.05)', color: sec.on ? '#10B981' : '#6B7280', border: 'none', borderRadius: '99px', padding: '3px 11px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                                            {sec.on ? '✅ نشط' : '⏸ موقوف'}
                                        </button>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.7rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '5px' }}>الأدوار المفعلة لهذا القطاع (Coming Soon)</div>
                                    </div>
                                </>} />;
                            })}
                        </div>
                    </div>}

                    {intTab === 'tmpl' && <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>قوالب الموظفات (جاهزة للعملاء)</h3>
                            <Btn onClick={() => setShowAddTemplate(!showAddTemplate)}><Plus size={14} />إضافة قالب</Btn>
                        </div>

                        {showAddTemplate && <Card s={{ marginBottom: '1rem', border: '1px solid #8B5CF640' }} c={<div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>اسم القالب (عربي)</label>
                                    <Input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} placeholder="مثال: منسقة حجوزات ذكية" /></div>
                                <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>اسم القالب (إنجليزي)</label>
                                    <Input value={newTemplate.name_en} onChange={e => setNewTemplate(p => ({ ...p, name_en: e.target.value }))} placeholder="e.g. Smart Booking Coordinator" dir="ltr" /></div>

                                <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>التخصص</label>
                                    <select value={newTemplate.specialty} onChange={e => setNewTemplate(p => ({ ...p, specialty: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#1F2937', color: 'white', borderRadius: '7px', border: '1px solid #374151' }}>
                                        {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                    </select></div>
                                <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>القطاع</label>
                                    <select value={newTemplate.business_type} onChange={e => setNewTemplate(p => ({ ...p, business_type: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#1F2937', color: 'white', borderRadius: '7px', border: '1px solid #374151' }}>
                                        {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v.e} {v.l}</option>)}
                                    </select></div>

                                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>الوصف (عربي)</label>
                                    <textarea value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#1F2937', color: 'white', borderRadius: '7px', border: '1px solid #374151', minHeight: '60px' }} placeholder="اشرح مهام هذه الموظفة بالعربية..." /></div>
                                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>الوصف (إنجليزي)</label>
                                    <textarea value={newTemplate.description_en} onChange={e => setNewTemplate(p => ({ ...p, description_en: e.target.value }))} style={{ width: '100%', padding: '8px', background: '#1F2937', color: 'white', borderRadius: '7px', border: '1px solid #374151', minHeight: '60px' }} placeholder="Explain this agent's tasks in English..." dir="ltr" /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Btn onClick={addTemplate}><Check size={14} />حفظ القالب</Btn>
                                <button onClick={() => setShowAddTemplate(false)} style={{ background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer' }}>إلغاء</button>
                            </div>
                        </div>} />}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                            {templates.map(t => (
                                <Card key={t.id} c={<div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 700, color: 'white', direction: isEnglish ? 'ltr' : 'rtl', textAlign: isEnglish ? 'left' : 'right' }}>
                                            {isEnglish ? (t.name_en || t.name) : t.name}
                                        </div>
                                        <button onClick={() => deleteTemplate(t.id)} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: '#3B82F620', color: '#3B82F6' }}>{roles[t.specialty]?.l || t.specialty}</span>
                                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>{sectors[t.business_type]?.l || t.business_type}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '4px', direction: isEnglish ? 'ltr' : 'rtl', textAlign: isEnglish ? 'left' : 'right' }}>
                                        {isEnglish ? (t.description_en || t.description) : t.description}
                                    </div>
                                </div>} />
                            ))}
                        </div>
                    </div>}

                    {intTab === 'logs' && <div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                            <select value={logParams.category} onChange={e => setLogParams(p => ({ ...p, category: e.target.value }))} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '7px', padding: '6px' }}>
                                <option value="">كل التصنيفات</option>
                                <option value="system">نظام</option>
                                <option value="auth">هوية</option>
                                <option value="agent">ذكاء اصطناعي</option>
                            </select>
                            <Btn onClick={fetchLogs}><RefreshCw size={13} />تحديث</Btn>
                        </div>
                        <Card s={{ padding: 0 }} c={<div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'right' }}>
                                <thead><tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '0.6rem' }}>الوقت</th>
                                    <th style={{ padding: '0.6rem' }}>المستوى</th>
                                    <th style={{ padding: '0.6rem' }}>التصنيف</th>
                                    <th style={{ padding: '0.6rem' }}>الرسالة</th>
                                </tr></thead>
                                <tbody>
                                    {logs.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد سجلات</td></tr>
                                        : logs.map(l => (
                                            <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '0.6rem', color: '#6B7280' }}>{new Date(l.created_at).toLocaleString('ar-EG')}</td>
                                                <td style={{ padding: '0.6rem' }}><span style={{ color: l.level === 'error' ? '#EF4444' : l.level === 'warn' ? '#F59E0B' : '#3B82F6' }}>{l.level}</span></td>
                                                <td style={{ padding: '0.6rem', color: '#9CA3AF' }}>{l.category}</td>
                                                <td style={{ padding: '0.6rem', color: 'white' }}>{l.message}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>} />
                    </div>}
                </div>}

                {/* ── PRICING ── */}
                {tab === 'pricing' && <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>الباقات والأسعار</h1><p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.83rem' }}>تعديل أسعار اشتراكات المنصة</p></div>
                        <Btn onClick={async () => { setSaving(true); await adminService.updatePlatformSettings('pricing_plans', pricing); setSaving(false); flash('✅ تم الحفظ'); }} disabled={saving}><Save size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}</Btn>
                    </div>
                    <div style={{ display: 'grid', gap: '0.9rem' }}>
                        {pricing.map((plan, idx) => <Card key={plan.id} c={<>
                            <h3 style={{ color: '#A78BFA', fontWeight: 800, marginBottom: '0.9rem', fontSize: '0.9rem' }}>{plan.name}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                {[['monthlyPrice', 'السعر الشهري (ريال)'], ['yearlyPrice', 'السعر السنوي/شهر (ريال)']].map(([f, l]) => <div key={f}>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{l}</label>
                                    <input type="number" value={plan[f]} onChange={e => { const u = [...pricing]; u[idx][f] = e.target.value; setPricing(u); }} style={{ width: '100%', padding: '8px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', boxSizing: 'border-box' }} />
                                </div>)}
                            </div>
                        </>} />)}
                    </div>
                </div>}

                {/* ── INTEGRATIONS ── */}
                {tab === 'integrations' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 1.1rem' }}>الربط التقني</h1>
                    <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', background: '#111827', padding: '3px', borderRadius: '9px', width: 'fit-content' }}>
                        {[['platform', '⚙️ مفاتيح المنصة'], ['client', '👤 مفاتيح العملاء']].map(([id, lbl]) => <button key={id} onClick={() => setIntTab(id)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: intTab === id ? '#8B5CF6' : 'transparent', color: intTab === id ? 'white' : '#6B7280' }}>
                            {lbl}
                        </button>)}
                    </div>

                    {intTab === 'platform' && <div>
                        <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.82rem' }}>هذه المفاتيح تخدم المنصة بأكملها — OpenAI لتشغيل الذكاء الاصطناعي، n8n لأتمتة العمليات. تُخزَّن في جدول <code style={{ background: '#1F2937', padding: '1px 5px', borderRadius: '4px' }}>platform_settings</code>.</p>
                        {integrations.map((integ, idx) => {
                            const conn = integ.status === 'Connected';
                            return (
                                <div key={integ.id} style={{ marginBottom: '0.9rem', background: '#111827', borderRadius: '13px', border: `1px solid ${conn ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, padding: '1.1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <h3 style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>{integ.name}</h3>
                                        <select value={integ.status} onChange={e => { const u = [...integrations]; u[idx].status = e.target.value; setIntegrations(u); }} style={{ background: conn ? '#10B98120' : '#EF444420', color: conn ? '#10B981' : '#EF4444', border: 'none', borderRadius: '6px', padding: '2px 9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>
                                            <option value="Disconnected">غير متصل ❌</option>
                                            <option value="Connected">متصل ✅</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                        <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>Webhook URL</label>
                                            <Input value={integ.url} placeholder="https://..." onChange={e => { const u = [...integrations]; u[idx].url = e.target.value; setIntegrations(u); }} /></div>
                                        <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '4px' }}>API Key / Token</label>
                                            <Input type="password" value={integ.key} placeholder="sk-..." onChange={e => { const u = [...integrations]; u[idx].key = e.target.value; setIntegrations(u); }} /></div>
                                    </div>
                                </div>
                            );
                        })}

                        <Btn onClick={savePlatformInteg} disabled={saving} style={{ marginTop: '0.75rem' }}><Save size={14} />{saving ? 'جاري الحفظ...' : 'حفظ مفاتيح المنصة'}</Btn>
                        <p style={{ color: '#4B5563', fontSize: '0.72rem', marginTop: '0.6rem' }}>💡 إذا ظهر خطأ: تأكد من وجود جدول <code style={{ background: '#1F2937', padding: '1px 4px', borderRadius: '3px' }}>platform_settings</code> في Supabase.</p>
                    </div>}

                    {intTab === 'client' && <div>
                        <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.82rem' }}>أضف مفاتيح الربط لعميل معين — تُخزَّن في <code style={{ background: '#1F2937', padding: '1px 5px', borderRadius: '4px' }}>salon_configs</code></p>
                        <select value={selIntClient || ''} onChange={e => setSelIntClient(e.target.value || null)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '0.83rem', minWidth: '260px', marginBottom: '1rem' }}>
                            <option value="">اختر عميلاً...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                        </select>
                        {selIntClient && <div style={{ maxWidth: '500px', background: '#111827', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.1rem' }}>
                            {[['telegram_token', '🤖 Telegram Bot Token', 'توكن البوت من @BotFather'], ['whatsapp_number', '📱 رقم WhatsApp', 'مثال: 966501234567'], ['whatsapp_api_key', '🔑 WhatsApp API Key', 'مفتاح الوصول لـ API']].map(([f, l, hint]) => <div key={f} style={{ marginBottom: '0.9rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', marginBottom: '3px' }}>{l}</label>
                                <div style={{ fontSize: '0.7rem', color: '#4B5563', marginBottom: '5px' }}>{hint}</div>
                                <Input type={f.includes('key') || f.includes('token') ? 'password' : 'text'} value={clientKeys[selIntClient]?.[f] || ''} placeholder="—" onChange={e => setClientKeys(p => ({ ...p, [selIntClient]: { ...(p[selIntClient] || {}), [f]: e.target.value } }))} />
                            </div>)}
                            <Btn onClick={() => saveClientKey(selIntClient)} style={{ width: '100%', justifyContent: 'center' }}><Key size={14} />حفظ مفاتيح العميل</Btn>
                        </div>}

                    </div>}
                </div>}

            </main>
        </div>
    );
}
