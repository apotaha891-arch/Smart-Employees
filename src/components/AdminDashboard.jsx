import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseService';
import * as adminService from '../services/adminService';
import {
    LayoutDashboard, Users, Bot, Calendar, Globe, CreditCard,
    Link as LinkIcon, Save, Power, Edit2, Check, X, TrendingUp,
    LogOut, Eye, Key, Plus, Bell, Mail, MessageSquare, Zap, Trash2, RefreshCw,
    Search, Download, Newspaper, Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { signOut } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import AdminBlogManager from './AdminBlogManager';
import { REALISTIC_AVATARS, getRealisticAvatar } from '../utils/avatars';

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
const NewsletterSubscribers = () => {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadSubs = async () => {
            const { data } = await supabase.from('newsletter_subscriptions').select('*').order('created_at', { ascending: false });
            setSubs(data || []);
            setLoading(false);
        };
        loadSubs();
    }, []);
    return (
        <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 1rem' }}>مشتركي النشرة البريدية</h1>
            <Card s={{ padding: 0, overflow: 'hidden' }} c={
                loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div> :
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontSize: '0.77rem' }}>البريد الإلكتروني</th>
                        <th style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontSize: '0.77rem' }}>تاريخ الاشتراك</th>
                    </tr></thead>
                    <tbody>
                        {subs.length === 0 ? <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center' }}>لا يوجد مشتركين حالياً</td></tr> :
                        subs.map(s => <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.75rem 0.9rem', color: 'white' }}>{s.email}</td>
                            <td style={{ padding: '0.75rem 0.9rem', color: '#6B7280' }}>{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>)}
                    </tbody>
                </table>
            } />
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const { isEnglish, t } = useLanguage();
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Dynamic Configs
    const [sectors, setSectors] = useState({
        telecom_it: { l: 'اتصالات وتقنية', e: '📡', c: '#EF4444', on: true },
        banking: { l: 'بنوك ومالية', e: '🏦', c: '#8B5CF6', on: true },
        retail_ecommerce: { l: 'تجزئة ومتاجر', e: '🛍', c: '#10B981', on: true },
        call_center: { l: 'خدمات العملاء', e: '🎧', c: '#06B6D4', on: true },
        medical: { l: 'طبي وصحي', e: '🩺', c: '#3B82F6', on: true },
        beauty: { l: 'تجميل وعناية', e: '🌸', c: '#EC4899', on: true },
        restaurant: { l: 'مطاعم وضيافة', e: '🍽', c: '#F59E0B', on: true },
        real_estate: { l: 'عقارات', e: '🏠', c: '#D946EF', on: true },
        general: { l: 'عام', e: '🏢', c: '#6B7280', on: true }
    });
    const [roles, setRoles] = useState({
        booking: { l: 'منسقة حجوزات', c: '#8B5CF6' },
        support: { l: 'خدمة عملاء', c: '#10B981' },
        sales: { l: 'مبيعات', c: '#F59E0B' },
        hr: { l: 'موارد بشرية', c: '#3B82F6' },
        email: { l: 'منسق بريد', c: '#EC4899' },
        followup: { l: 'متابعة', c: '#06B6D4' }
    });
    console.log('✨ AdminDashboard initialized with roles state');
    const [agentAppsConfig, setAgentAppsConfig] = useState([
        { id: 'email_notify', icon: 'Mail', label: 'إشعار بريد إلكتروني', desc: 'تنبيه للمدير عند الحجوزات أو المحادثات الجديدة' },
        { id: 'sms_notify', icon: 'MessageSquare', label: 'إشعار SMS', desc: 'رسالة نصية للعميل بتأكيد حجزه' },
        { id: 'reminder', icon: 'Bell', label: 'تذكير قبل الموعد', desc: 'تذكير آلي قبل الموعد بساعة' },
        { id: 'followup', icon: 'Zap', label: 'متابعة بعد الخدمة', desc: 'رسالة متابعة بعد 24 ساعة من الموعد' },
    ]);
    const STATUSES = { pending: { bg: '#F59E0B20', t: '#F59E0B', l: 'معلق' }, confirmed: { bg: '#10B98120', t: '#10B981', l: 'مؤكد' }, completed: { bg: '#3B82F620', t: '#3B82F6', l: 'مكتمل' }, cancelled: { bg: '#EF444420', t: '#EF4444', l: 'ملغي' } };
    
    // Data
    const [clients, setClients] = useState([]);
    const [agents, setAgents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [conciergeChats, setConciergeChats] = useState([]);
    const [selChat, setSelChat] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // Generate dynamic PLANS mapping from pricing state
    const PLANS = useMemo(() => {
        const pMap = {
            free: { bg: '#37415120', t: '#9CA3AF', l: 'تجريبي' },
            basic: { bg: '#37415120', t: '#9CA3AF', l: 'تجريبي' }
        };
        (pricing || []).forEach(p => {
            const color = p.id === 'pro' ? '#A78BFA' : (p.id === 'starter' ? '#10B981' : (p.id === 'enterprise' ? '#F59E0B' : '#6B7280'));
            pMap[p.id] = {
                bg: `${color}20`,
                t: color,
                l: p.name
            };
        });
        return pMap;
    }, [pricing]);
    const [clientKeys, setClientKeys] = useState({});
    const [logs, setLogs] = useState([]);
    const [logParams, setLogParams] = useState({ category: '', level: '', limit: 50 });
    const [templates, setTemplates] = useState([]);
    const [endCustomers, setEndCustomers] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ name: '', name_en: '', specialty: 'booking', business_type: 'telecom_it', description: '', description_en: '', avatar: '👩' });
    const [showAddTemplate, setShowAddTemplate] = useState(false);
    
    // ── Interview Room Agents Config ─────────────────────────────────────────
    const DEFAULT_INTERVIEW_AGENTS = [
        { id: 'support-agent',          nameAr: 'عبدالرحمن', nameEn: 'Adam',          gender: 'male',   avatar: '🧑‍💼', tone: 'friendly',     titleAr: 'ممثل خدمة العملاء',  titleEn: 'Customer Support Agent' },
        { id: 'sales-lead-gen',         nameAr: 'أستاذ فهد',  nameEn: 'Mr. James',    gender: 'male',   avatar: '🤵',    tone: 'professional', titleAr: 'أخصائي مبيعات',        titleEn: 'Sales Specialist' },
        { id: 'dental-receptionist',    nameAr: 'د. سارة',   nameEn: 'Dr. Sarah',    gender: 'female', avatar: '👩‍⚕️', tone: 'professional', titleAr: 'موظفة استقبال',        titleEn: 'Receptionist' },
        { id: 'medical-clinic',         nameAr: 'د. هند',    nameEn: 'Dr. Emily',    gender: 'female', avatar: '👩‍⚕️', tone: 'professional', titleAr: 'مستقبِلة عيادة',       titleEn: 'Clinic Receptionist' },
        { id: 'beauty-salon',           nameAr: 'نورة',      nameEn: 'Emma',         gender: 'female', avatar: '💅',    tone: 'luxury',       titleAr: 'منسقة مواعيد',         titleEn: 'Appointment Coordinator' },
        { id: 'real-estate-marketing',  nameAr: 'أستاذ طارق', nameEn: 'Mr. Robert',  gender: 'male',   avatar: '🏢',    tone: 'professional', titleAr: 'مسوّق عقاري',          titleEn: 'Real Estate Marketer' },
        { id: 'restaurant-reservations',nameAr: 'أحمد',      nameEn: 'Alex',         gender: 'male',   avatar: '🍽️',   tone: 'friendly',     titleAr: 'مسؤول حجوزات',         titleEn: 'Reservations Officer' },
        { id: 'gym-coordinator',        nameAr: 'كابتن خالد',nameEn: 'Coach Chris',  gender: 'male',   avatar: '💪',    tone: 'enthusiastic', titleAr: 'منسق اشتراكات',        titleEn: 'Memberships Coordinator' },
    ];
    const [interviewAgents, setInterviewAgents] = useState(() => {
        try {
            const stored = localStorage.getItem('admin_interview_agents');
            return stored ? JSON.parse(stored) : DEFAULT_INTERVIEW_AGENTS;
        } catch { return DEFAULT_INTERVIEW_AGENTS; }
    });
    const [savingInterview, setSavingInterview] = useState(false);
    const saveInterviewAgents = () => {
        setSavingInterview(true);
        localStorage.setItem('admin_interview_agents', JSON.stringify(interviewAgents));
        setTimeout(() => { setSavingInterview(false); flash('✅ تم حفظ إعدادات موظفي المقابلة'); }, 600);
    };
    const resetInterviewAgents = () => {
        if (!confirm('إعادة ضبط جميع موظفي المقابلة للإعدادات الافتراضية؟')) return;
        setInterviewAgents(DEFAULT_INTERVIEW_AGENTS);
        localStorage.removeItem('admin_interview_agents');
        flash('↩️ تم الإعادة للإعدادات الافتراضية');
    };
    // ────────────────────────────────────────────────────────────────────────
    const [cSearch, setCSearch] = useState('');
    const [cFilter, setCFilter] = useState('');
    const [aSearch, setASearch] = useState('');
    const [aFilter, setAFilter] = useState('');
    const [bSearch, setBSearch] = useState('');

    const handleExport = (data, fileName) => {
        if (!data || data.length === 0) return flash('⚠️ لا يوجد بيانات للتصدير');
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `24shift_${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        flash(`✅ تم تصدير ${data.length} سجلات بنجاح`);
    };
    const [aiConfig, setAiConfig] = useState({ knowledge: '', prompt_ar: '', prompt_en: '', max_length: 150 });

    // UI
    const [selClient, setSelClient] = useState(null);
    const [bFilter, setBFilter] = useState('');
    const [editAgent, setEditAgent] = useState(null);
    const [intTab, setIntTab] = useState('platform');
    const [selIntClient, setSelIntClient] = useState(null);
    const [showAddAgent, setShowAddAgent] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', specialty: 'booking', business_type: 'telecom_it', user_id: '' });
    const [agentApps, setAgentApps] = useState({}); // {agentId: {appId: bool}}

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        console.log("AdminDashboard: Starting full data load...");
        try {
            // Use allSettled so one failing RPC doesn't crash the whole load
            const results = await Promise.allSettled([
                adminService.getAllCustomers(),
                adminService.getAllAgents(),
                adminService.getAllBookings(),
                adminService.getAllSalonConfigs(),
                adminService.getAllConciergeConversations(),
                adminService.getAllNotifications(),
                adminService.getAllEndCustomers()
            ]);

            const [profilesRes, agRes, bkRes, keyRes, chatsRes, notifsRes, endCustRes] = results;

            // Debug logging
            results.forEach((res, i) => {
                if (res.status === 'rejected') console.error(`Fetch ${i} failed:`, res.reason);
            });

            if (profilesRes.status === 'rejected') {
                flash('❌ فشل جلب بيانات العملاء: ' + profilesRes.reason.message);
            }

            const profiles = profilesRes.status === 'fulfilled' ? profilesRes.value : [];
            const ag       = agRes.status === 'fulfilled'       ? agRes.value       : [];
            const bk       = bkRes.status === 'fulfilled'       ? bkRes.value       : [];
            const keyData  = keyRes.status === 'fulfilled'      ? keyRes.value      : [];
            const chats    = chatsRes.status === 'fulfilled'    ? chatsRes.value    : [];
            const notifs   = notifsRes.status === 'fulfilled'   ? notifsRes.value   : [];
            const endCust  = endCustRes.status === 'fulfilled'  ? endCustRes.value  : [];

            console.log(`AdminDashboard: Loaded ${profiles.length} profiles, ${ag.length} agents, ${bk.length} bookings`);

            // Merge Profile + SalonConfig data
            const clientMap = {};
            (profiles || []).forEach(p => {
                const uid = p.id || p.user_id; // Support both naming conventions
                if (!uid) return;
                clientMap[uid] = { 
                    ...p, 
                    id: uid,
                    full_name: p.full_name || p.business_name || '—', 
                    email: p.email || '—' 
                };
            });
            (keyData || []).forEach(k => {
                if (clientMap[k.user_id]) {
                    clientMap[k.user_id] = { ...clientMap[k.user_id], salonConfigId: k.id };
                }
            });
            
            const clientList = Object.values(clientMap);
            setClients(clientList);
            setAgents(ag || []);
            setBookings(bk || []);
            setConciergeChats(chats || []);
            setNotifications(notifs || []);
            setEndCustomers(endCust || []);

            // Platform settings & Dynamic Configs
            const [plans, integ, dbSectors, dbRoles, dbApps, dbAiConfig] = await Promise.allSettled([
                adminService.getPlatformSettings('pricing_plans'),
                adminService.getPlatformSettings('external_integrations'),
                adminService.getPlatformSettings('system_sectors'),
                adminService.getPlatformSettings('system_roles'),
                adminService.getPlatformSettings('system_agent_apps'),
                adminService.getPlatformSettings('manager_ai_config'),
            ]).then(res => res.map(r => r.status === 'fulfilled' ? r.value : null));
            
            setPricing(plans || [
                { id: 'starter', name: 'الباقة الأساسية', monthlyPrice: 39, yearlyPrice: 31, trialPrice: 20, credits: 2000, agentsLimit: 1, toolsLimit: 2 },
                { id: 'pro', name: 'الباقة المتقدمة', monthlyPrice: 69, yearlyPrice: 55, trialPrice: 45, credits: 5000, agentsLimit: 2, toolsLimit: 3 },
                { id: 'enterprise', name: 'باقة النخبة', monthlyPrice: 199, yearlyPrice: 159, trialPrice: 0, credits: 99999, agentsLimit: 10, toolsLimit: 10 },
                { id: 'addon_1k', name: 'شحن 1000 نقطة', monthlyPrice: 10, credits: 1000 },
                { id: 'addon_5k', name: 'شحن 5000 نقطة', monthlyPrice: 35, credits: 5000 }
            ]);
            setIntegrations(integ || [
                { id: 'n8n', name: 'n8n Webhook', url: '', key: '', status: 'Disconnected' },
                { id: 'openai', name: 'OpenAI API', url: '', key: '', status: 'Disconnected' },
                { id: 'telegram', name: 'Telegram Platform Bot', url: '', key: '', status: 'Disconnected' }
            ]);

            if (dbSectors) setSectors(dbSectors);
            if (dbRoles) setRoles(dbRoles);
            if (dbApps) setAgentAppsConfig(dbApps);
            if (dbAiConfig) setAiConfig(dbAiConfig);

            const kmap = {};
            (keyData || []).forEach(k => { kmap[k.user_id] = { telegram_token: k.telegram_token || '', whatsapp_number: k.whatsapp_number || '', whatsapp_api_key: k.whatsapp_api_key || '' }; });
            setClientKeys(kmap);

            const appMap = {};
            (ag || []).forEach(a => { if (a.metadata?.apps) appMap[a.id] = a.metadata.apps; });
            setAgentApps(appMap);

            try {
                const channel = supabase.channel('platform_notifications')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_notifications' }, (payload) => {
                        setNotifications(prev => [payload.new, ...prev].slice(0, 50));
                    })
                    .subscribe();
                window.__adminDashboardChannel = channel;
            } catch (rtErr) { console.warn('Realtime failed:', rtErr.message); }

            fetchTemplates();
            adminService.logSystemEvent('info', 'system', 'Admin dashboard loaded successfully');
        } catch (e) {
            console.error('Admin load fatal error:', e);
            flash('❌ خطأ فادح في التحميل: ' + e.message);
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
                business_type: newTemplate.business_type,
                avatar: newTemplate.avatar
            });
            setTemplates(p => [data, ...p]);
            setShowAddTemplate(false);
            setNewTemplate({ name: '', name_en: '', specialty: 'booking', business_type: 'telecom_it', description: '', description_en: '', avatar: '👩' });
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
            const { error } = await supabase.from('agents').update({
                name: a.name,
                specialty: a.specialty,
                business_type: a.business_type,
                telegram_token: a.telegram_token,
                whatsapp_settings: a.whatsapp_settings || {}
            }).eq('id', a.id);

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
            console.log(`AdminDashboard: Updating booking ${id} status to ${status}...`);
            const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
            if (error) throw error;
            
            setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
            flash(status === 'confirmed' ? '✅ تم تأكيد الحجز وإرسال إشعار' : '✅ تم تحديث حالة الحجز');
            
            // Trigger Automated Notification to Customer
            if (status === 'confirmed' || status === 'cancelled') {
                await adminService.sendBookingNotification(id, status);
            }
        } catch (err) { 
            console.error('Update Booking Error:', err);
            flash('❌ فشل تحديث الحجز'); 
        }
    };
    const savePlatformInteg = async () => { setSaving(true); await adminService.updatePlatformSettings('external_integrations', integrations); setSaving(false); flash('✅ تم الحفظ'); };
    const saveClientKey = async (uid) => {
        const k = clientKeys[uid] || {};
        const { error } = await supabase.from('salon_configs').update({ telegram_token: k.telegram_token || null, whatsapp_number: k.whatsapp_number || null, whatsapp_api_key: k.whatsapp_api_key || null }).eq('user_id', uid);
        flash(error ? '❌ خطأ في الحفظ' : '✅ تم حفظ مفاتيح العميل');
    };
    const saveAiConfig = async () => { setSaving(true); await adminService.updatePlatformSettings('manager_ai_config', aiConfig); setSaving(false); flash('✅ تم حفظ إعدادات المستشارة الذكية'); };
    const handleLogout = async () => { await signOut(); navigate('/login'); };

    const remoteLogin = async (email) => {
        if (!email || email === '—') return flash('❌ لا يتوفر بريد إلكتروني صالح لهذا العميل!');
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ targetEmail: email })
            });
            const d = await res.json();
            if (d.error) throw new Error(d.error);
            if (d.magicLink) {
                flash('✅ جاري الدخول لحساب العميل في نافذة جديدة...');
                setTimeout(() => window.open(d.magicLink, '_blank'), 1000);
            }
        } catch (e) {
            flash('❌ حدث خطأ ⛑️ هل فعلت الدالة؟ ' + e.message);
        }
        setSaving(false);
    };

    const cl = (uid) => agents.filter(a => a.user_id === uid || a.salon_config_id === clients.find(c => c.id === uid)?.salonConfigId);
    const bl = (uid) => bookings.filter(b => b.user_id === uid || b.salon_config_id === clients.find(c => c.id === uid)?.salonConfigId);
    
    // Filtering Logic
    const filteredClients = (clients || []).filter(c => {
        const matchesSearch = (c.full_name || '').toLowerCase().includes(cSearch.toLowerCase()) || 
                             (c.email || '').toLowerCase().includes(cSearch.toLowerCase());
        const matchesFilter = !cFilter || c.id === cFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredAgents = (agents || []).filter(a => {
        const client = clients.find(c => c.id === a.user_id);
        const ownerName = client?.full_name || client?.email || '';
        const matchesSearch = (a.name || '').toLowerCase().includes(aSearch.toLowerCase()) || 
                               ownerName.toLowerCase().includes(aSearch.toLowerCase());
        const matchesFilter = !aFilter || a.user_id === aFilter;
        return matchesSearch && matchesFilter;
    });

    const baseBookings = bFilter ? bookings.filter(b => b.user_id === bFilter || b.salon_id === bFilter || b.salon_config_id === bFilter) : bookings;
    const filtBk = baseBookings.filter(b => 
        (b.customer_name || '').toLowerCase().includes(bSearch.toLowerCase()) || 
        (b.customer_phone || '').toLowerCase().includes(bSearch.toLowerCase()) ||
        (b.service_requested || '').toLowerCase().includes(bSearch.toLowerCase())
    );

    const unreadChats = notifications.filter(n => !n.is_read && n.type === 'new_chat').length;

    const NAV = [
        { id: 'overview', i: LayoutDashboard, l: t('admin.overview') },
        { id: 'clients', i: Users, l: t('admin.clients') },
        { id: 'end-customers', i: Users, l: t('admin.endCustomers') },
        { id: 'agents', i: Bot, l: t('admin.agents') },
        { id: 'interview-agents', i: Users, l: t('admin.templates') },
        { id: 'bookings', i: Calendar, l: t('admin.bookings') },
        { id: 'pricing', i: CreditCard, l: t('admin.pricing') },
        { id: 'integrations', i: LinkIcon, l: t('admin.integrations') },
        { id: 'notifications', i: Bell, l: t('admin.notifications'), badge: notifications.filter(n => !n.is_read).length },
        { id: 'concierge-chats', i: MessageSquare, l: t('admin.concierge'), badge: unreadChats },
        { id: 'ai-settings', i: Bot, l: t('admin.aiSettings') },
        { id: 'blog', i: Newspaper, l: t('admin.blog') },
        { id: 'subscribers', i: Mail, l: t('admin.subscribers') },
    ];

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070B14', color: 'white', fontSize: '1rem', gap: '10px' }}><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />{t('admin.loading')}</div>;

    const isRtl = !isEnglish;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#070B14', direction: isRtl ? 'rtl' : 'ltr', color: '#E4E4E7', fontFamily: "'Inter','Tajawal',sans-serif" }}>
            {/* Flash message */}
            {msg && <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#1F2937', border: '1px solid #374151', color: 'white', padding: '10px 20px', borderRadius: '10px', zIndex: 9999, fontWeight: 600, fontSize: '0.9rem' }}>{msg}</div>}

            {/* Sidebar */}
            <aside style={{ 
                width: '230px', 
                background: '#0D1117', 
                borderLeft: isRtl ? '1px solid rgba(255,255,255,0.05)' : 'none',
                borderRight: !isRtl ? '1px solid rgba(255,255,255,0.05)' : 'none',
                display: 'flex', 
                flexDirection: 'column', 
                position: 'fixed', 
                height: '100vh', 
                right: isRtl ? 0 : 'auto',
                left: !isRtl ? 0 : 'auto', 
                zIndex: 50 
            }}>
                <div style={{ padding: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#10B981,#3B82F6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>24</div>
                    <div><div style={{ fontWeight: 900, fontSize: '0.95rem', background: 'linear-gradient(90deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('brand.name')}</div>
                        <div style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 700 }}>⚡ ADMIN</div></div>
                </div>
                <nav style={{ flex: 1, padding: '0.6rem', overflowY: 'auto' }}>
                    {NAV.map(({ id, i: Icon, l, badge }) => {
                        const a = tab === id; return (
                            <button key={id} onClick={() => { setTab(id); if (id === 'concierge-chats' || id === 'notifications') notifications.filter(n => !n.is_read).forEach(n => adminService.markNotificationAsRead(n.id)); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '8px', background: a ? 'rgba(139,92,246,0.12)' : 'transparent', color: a ? '#A78BFA' : '#6B7280', border: 'none', cursor: 'pointer', fontWeight: a ? 700 : 400, fontSize: '0.84rem', marginBottom: '2px', borderRight: (isRtl && a) ? '3px solid #8B5CF6' : '3px solid transparent', borderLeft: (!isRtl && a) ? '3px solid #8B5CF6' : '3px solid transparent', transition: 'all 0.15s', position: 'relative', textAlign: isRtl ? 'right' : 'left' }}>
                                <Icon size={16} />
                                <span>{l}</span>
                                {badge > 0 && <span style={{ position: 'absolute', left: isRtl ? '10px' : 'auto', right: !isRtl ? '10px' : 'auto', top: '50%', transform: 'translateY(-50%)', background: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{badge}</span>}
                            </button>
                        );
                    })}
                </nav>
                <div style={{ padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 11px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '0.83rem', textAlign: isRtl ? 'right' : 'left' }}>
                        <LogOut size={14} />{t('admin.logout')}
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main style={{ flex: 1, marginRight: isRtl ? '230px' : 0, marginLeft: !isRtl ? '230px' : 0, padding: '1.75rem 2rem', overflowX: 'hidden', minWidth: 0 }}>

                {/* ── OVERVIEW ── */}
                {tab === 'overview' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{t('admin.overview')}</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{isEnglish ? 'Comprehensive overview of 24Shift performance' : 'نظرة شاملة على أداء منصة 24Shift'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: '0.9rem', marginBottom: '1.75rem' }}>
                        <StatCard icon={Users} label={t('admin.totalClients')} value={clients.length} color="#10B981" sub={`+${clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 3600 * 1000)).length} ${isEnglish ? 'new clients' : 'عملاء جدد'}`} />
                        <StatCard icon={Bot} label={isEnglish ? 'Active Agents' : 'موظفات نشطة'} value={agents.filter(a => a.status === 'active').length} color="#8B5CF6" />
                        <StatCard icon={Calendar} label={isEnglish ? 'Pending Bookings' : 'حجوزات معلقة'} value={bookings.filter(b => b.status === 'pending').length} color="#F59E0B" sub={isEnglish ? 'Requires review' : 'تحتاج مراجعة'} />
                        {(() => {
                            const avgPrice = pricing.find(p => p.id === 'pro')?.monthlyPrice || 69;
                            const estRev = clients.length * avgPrice;
                            return <StatCard icon={TrendingUp} label={isEnglish ? 'Estimated Revenue' : 'إيراد متوقع'} value={`${estRev.toLocaleString()} $`} color="#3B82F6" sub={isEnglish ? 'Monthly Est.' : 'شهري تقديري'} />;
                        })()}
                    </div>
                    <h3 style={{ color: 'white', marginBottom: '0.9rem', fontSize: '0.9rem', fontWeight: 700 }}>{isEnglish ? 'Client Sector Distribution' : 'توزيع العملاء بالقطاعات'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem' }}>
                        {Object.entries(sectors).map(([k, v]) => {
                            // Normalize business_type to sector key
                            const normalizeSector = (bt) => {
                                if (!bt) return 'general';
                                const map = {
                                    'beauty-salon': 'beauty', 'beauty': 'beauty',
                                    'medical-clinic': 'medical', 'dental-receptionist': 'medical', 'medical': 'medical',
                                    'restaurant-reservations': 'restaurant', 'restaurant': 'restaurant',
                                    'real-estate-marketing': 'real_estate', 'real_estate': 'real_estate',
                                    'gym-coordinator': 'call_center', 'gym': 'call_center',
                                    'support-agent': 'call_center', 'call_center': 'call_center',
                                    'sales-lead-gen': 'retail_ecommerce', 'retail_ecommerce': 'retail_ecommerce',
                                    'telecom_it': 'telecom_it', 'banking': 'banking', 'general': 'general'
                                };
                                return map[bt] || map[bt.toLowerCase()] || 'general';
                            };
                            const cnt = clients.filter(c => normalizeSector(c.business_type) === k).length;
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
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{t('admin.clients')}</h1>
                        <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>{filteredClients.length} {isEnglish ? 'clients matched' : 'عميل مطابق'}</p>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <select value={cFilter} onChange={e => setCFilter(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '8px 11px', fontSize: '0.82rem', minWidth: '200px' }}>
                                <option value="">{isEnglish ? 'All Clients' : 'كل العملاء'}</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                            </select>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                <input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..." style={{ width: '100%', padding: '8px 30px 8px 10px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.82rem' }} />
                            </div>
                            <Btn onClick={() => handleExport(filteredClients, 'clients')} color="#10B981" style={{ fontSize: '0.75rem' }}><Download size={14} />تصدير Excel</Btn>
                        </div>
                        <Card s={{ padding: 0, overflow: 'hidden' }} c={<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {[t('admin.clients'), t('home.sectorTitle'), t('admin.agents'), t('nav.pricing'), t('admin.clientDetails')].map(h => <th key={h} style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontWeight: 600, fontSize: '0.77rem' }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {filteredClients.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>لا يوجد عملاء مطابقين للبحث</td></tr>
                                    : filteredClients.map(c => {
                                        const normalizeSectorKey = (bt) => {
                                            if (!bt) return 'general';
                                            const map = { 'beauty-salon': 'beauty', 'medical-clinic': 'medical', 'dental-receptionist': 'medical', 'restaurant-reservations': 'restaurant', 'real-estate-marketing': 'real_estate', 'gym-coordinator': 'call_center', 'support-agent': 'call_center', 'sales-lead-gen': 'retail_ecommerce' };
                                            return map[bt] || bt;
                                        };
                                        const sec = sectors[normalizeSectorKey(c.business_type)] || { l: c.business_type || '—', e: '🏢' };
                                        const plan = PLANS[c.subscription_tier || 'basic'] || PLANS.basic;
                                        return <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: selClient?.id === c.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><div style={{ fontWeight: 700, color: 'white', fontSize: '0.84rem' }}>{c.full_name || '—'}</div><div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{c.email}</div></td>
                                            <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF', fontSize: '0.82rem' }}>{sec.e} {sec.l}</td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><span style={{ background: '#8B5CF620', color: '#A78BFA', padding: '1px 8px', borderRadius: '99px', fontSize: '0.73rem' }}>{cl(c.id).length} موظفة</span></td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}><select value={c.subscription_tier || 'basic'} onChange={e => updateClientPlan(c.id, e.target.value)} style={{ background: plan.bg, color: plan.t, border: 'none', borderRadius: '6px', padding: '2px 8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                                                {Object.entries(PLANS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                            </select></td>
                                            <td style={{ padding: '0.75rem 0.9rem', display: 'flex', gap: '6px' }}>
                                                <button onClick={() => setSelClient(selClient?.id === c.id ? null : c)} style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: 'none', borderRadius: '6px', padding: '4px 9px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={12} />{isEnglish ? 'View' : 'عرض'}</button>
                                                <button onClick={() => remoteLogin(c.email)} disabled={saving} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'none', borderRadius: '6px', padding: '4px 9px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', opacity: saving ? 0.5 : 1 }}><LogOut size={12} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />{isEnglish ? 'Support Login' : 'دعم المالك'}</button>
                                            </td>
                                        </tr>;
                                    })}
                            </tbody>
                        </table>} />
                    </div>
                    {/* Client panel */}
                    {selClient && <div style={{ width: '300px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>🔍 {t('admin.clientDetails')}</div>
                            <button onClick={() => setSelClient(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <Card s={{ marginBottom: '0.75rem' }} c={<>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.88rem' }}>{selClient.full_name || '—'}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{selClient.email}</div>
                        </>} />
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginBottom: '5px' }}>الموظفات ({cl(selClient.id).length})</div>
                        {cl(selClient.id).slice(0, 4).map(a => {
                            const roleLabel = roles[a.specialty]?.l || a.specialty;
                            return <Card key={a.id} s={{ marginBottom: '5px', padding: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} c={<>
                                <div><div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{a.name}</div><div style={{ color: '#6B7280', fontSize: '0.7rem' }}>{roleLabel}</div></div>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.status === 'active' ? '#10B981' : '#374151' }} />
                            </>} />;
                        })}
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginTop: '0.7rem', marginBottom: '5px' }}>آخر الحجوزات ({bl(selClient.id).length})</div>
                        {bl(selClient.id).slice(0, 3).map(b => {
                            const sc = STATUSES[b.status] || STATUSES.pending; return <Card key={b.id} s={{ marginBottom: '5px', padding: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} c={<>
                                <div><div style={{ color: 'white', fontSize: '0.78rem' }}>{b.customer_name || '—'}</div><div style={{ color: '#6B7280', fontSize: '0.7rem' }}>{b.booking_date}</div></div>
                                <span style={{ background: sc.bg, color: sc.t, padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{sc.l}</span>
                            </>} />;
                        })}
                        <div style={{ color: '#9CA3AF', fontSize: '0.73rem', fontWeight: 600, marginTop: '0.7rem', marginBottom: '5px' }}>🔑 {isEnglish ? 'Integration Keys' : 'مفاتيح الربط'}</div>
                        <Card c={<>
                            {[['telegram_token', 'Telegram Token'], ['whatsapp_number', isEnglish ? 'WhatsApp Number' : 'رقم WhatsApp'], ['whatsapp_api_key', 'WhatsApp Key']].map(([f, l]) => <div key={f} style={{ marginBottom: '0.6rem' }}>
                                <label style={{ display: 'block', color: '#6B7280', fontSize: '0.7rem', marginBottom: '3px' }}>{l}</label>
                                <Input type={f.includes('token') || f.includes('key') ? 'password' : 'text'} value={clientKeys[selClient.id]?.[f] || ''} placeholder="—" onChange={e => setClientKeys(p => ({ ...p, [selClient.id]: { ...(p[selClient.id] || {}), [f]: e.target.value } }))} />
                            </div>)}
                            <Btn onClick={() => saveClientKey(selClient.id)} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}><Key size={13} />{t('admin.saveKeys')}</Btn>
                        </>} />
                    </div>}
                </div>}

                {/* ── END CUSTOMERS (Total Database) ── */}
                {tab === 'end-customers' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{t('admin.endCustomers')}</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>{endCustomers.length} {isEnglish ? 'total registered customers' : 'إجمالي العملاء المسجلين'}</p>
                    
                    <Card s={{ padding: 0, overflow: 'hidden' }} c={<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['ID', t('fullName'), t('phoneLabel'), 'Instagram', 'Telegram', t('lastUpdate')].map(h => <th key={h} style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontWeight: 600, fontSize: '0.77rem' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {endCustomers.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>{isEnglish ? 'No customers found' : 'لا يوجد زبائن مسجلين'}</td></tr>
                                : endCustomers.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '0.75rem 0.9rem', color: '#6B7280', fontSize: '0.65rem' }}>{c.id.slice(0, 8)}</td>
                                        <td style={{ padding: '0.75rem 0.9rem', color: 'white', fontWeight: 600 }}>{c.customer_name || '—'}</td>
                                        <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF' }}>{c.customer_phone || '—'}</td>
                                        <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF' }}>{c.instagram_id || '—'}</td>
                                        <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF' }}>{c.telegram_id || '—'}</td>
                                        <td style={{ padding: '0.75rem 0.9rem', color: '#6B7280', fontSize: '0.75rem' }}>{new Date(c.updated_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG')}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>} />
                </div>}

                {/* ── NOTIFICATIONS ── */}
                {tab === 'notifications' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 1.25rem' }}>{t('admin.notifications')}</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notifications.length === 0 ? <Card c={<div style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>{t('admin.noNotifications')}</div>} />
                        : notifications.map(n => (
                            <Card key={n.id} s={{ background: n.is_read ? '#111827' : 'rgba(139,92,246,0.08)', borderLeft: n.is_read ? '1px solid rgba(255,255,255,0.06)' : '4px solid #8B5CF6' }} c={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={18} color={n.is_read ? '#6B7280' : '#8B5CF6'} /></div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{n.title}</div>
                                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{n.message}</div>
                                        <div style={{ color: '#6B7280', fontSize: '0.7rem', marginTop: '4px' }}>{new Date(n.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}</div>
                                    </div>
                                </div>
                                {!n.is_read && <button onClick={() => adminService.markNotificationAsRead(n.id).then(() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)))} style={{ background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>{t('admin.markRead')}</button>}
                            </div>} />
                        ))}
                    </div>
                </div>}

                {/* ── AGENTS ── */}
                {tab === 'agents' && <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>{t('admin.agents')}</h1>
                            <p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.83rem' }}>{filteredAgents.length} {isEnglish ? 'matching agents' : 'موظفة مطابقة'}</p></div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Btn onClick={() => handleExport(filteredAgents, 'agents')} color="#10B981"><Download size={14} />{isEnglish ? 'Export' : 'تصدير'}</Btn>
                            <Btn onClick={() => setShowAddAgent(!showAddAgent)}><Plus size={15} />{isEnglish ? 'Add Agent' : 'إضافة موظفة'}</Btn>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <select value={aFilter} onChange={e => setAFilter(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: 'white', padding: '9px 11px', fontSize: '0.85rem', minWidth: '200px' }}>
                            <option value="">{isEnglish ? 'All Clients' : 'كل العملاء'} ({agents.length})</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({cl(c.id).length})</option>)}
                        </select>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={14} style={{ position: 'absolute', [isRtl ? 'right' : 'left']: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                            <input value={aSearch} onChange={e => setASearch(e.target.value)} placeholder={isEnglish ? 'Search agent or owner...' : 'بحث باسم الموظفة أو المالك...'} style={{ width: '100%', padding: isRtl ? '9px 30px 9px 10px' : '9px 10px 9px 30px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: 'white', fontSize: '0.85rem' }} />
                        </div>
                    </div>

                    {/* Add agent form */}
                    {showAddAgent && <Card s={{ marginBottom: '1.25rem', border: '1px solid rgba(139,92,246,0.3)' }} c={<div>
                        <div style={{ fontWeight: 700, color: '#A78BFA', marginBottom: '1rem', fontSize: '0.9rem' }}>➕ {isEnglish ? 'Register New Digital Agent' : 'تسجيل موظفة جديدة'}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{isEnglish ? 'Agent Name *' : 'اسم الموظفة *'}</label>
                                <Input value={newAgent.name} onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))} placeholder={isEnglish ? 'e.g. Sarah' : 'مثال: سارة'} /></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{t('specialtyLabel')}</label>
                                <select value={newAgent.specialty} onChange={e => setNewAgent(p => ({ ...p, specialty: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{isEnglish ? k.toUpperCase() : v.l}</option>)}
                                </select></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{t('home.sectorTitle')}</label>
                                <select value={newAgent.business_type} onChange={e => setNewAgent(p => ({ ...p, business_type: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v.e} {isEnglish ? k.toUpperCase() : v.l}</option>)}
                                </select></div>
                            <div><label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{isEnglish ? 'Assign to Client *' : 'أسند للعميل *'}</label>
                                <select value={newAgent.user_id} onChange={e => setNewAgent(p => ({ ...p, user_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', fontSize: '0.82rem' }}>
                                    <option value="">{isEnglish ? 'Select client...' : 'اختر عميل...'}</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                                </select></div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <Btn onClick={addAgent}><Check size={14} />{isEnglish ? 'Create Agent' : 'إنشاء الموظفة'}</Btn>
                            <button onClick={() => setShowAddAgent(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.83rem' }}>{t('templates.cancelBtn')}</button>
                        </div>
                    </div>} />}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                        {filteredAgents.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#6B7280', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>لا توجد موظفات مطابقة لهذا البحث</div>
                            : filteredAgents.map(agent => {
                            const role = roles[agent.specialty || 'booking'] || roles.booking || { l: '—', c: '#6B7280' };
                            const isActive = agent.status === 'active';
                            const isEd = editAgent?.id === agent.id;
                            const apps = agentApps[agent.id] || {};
                            const client = clients.find(c => c.id === agent.user_id);

                            return <Card key={agent.id} s={{ border: `1px solid ${isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}` }} c={<>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
                                    <div style={{ flex: 1 }}>
                                        {isEd ? <input value={editAgent.name} onChange={e => setEditAgent({ ...editAgent, name: e.target.value })} style={{ background: '#1F2937', border: '1px solid #8B5CF6', borderRadius: '5px', color: 'white', padding: '2px 7px', fontWeight: 700, width: '100%', fontSize: '0.85rem', marginBottom: '4px' }} />
                                            : <div style={{ fontWeight: 700, color: 'white', fontSize: '0.87rem' }}>{agent.name}</div>}
                                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>مالك: <span style={{ color: '#A78BFA' }}>{client?.full_name || client?.email || '—'}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '3px' }}>
                                        {isEd ? <><button onClick={() => saveAgentEdit(editAgent)} style={{ background: '#10B98120', color: '#10B981', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Check size={12} /></button><button onClick={() => setEditAgent(null)} style={{ background: '#EF444420', color: '#EF4444', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><X size={12} /></button></>
                                            : <><button onClick={() => setEditAgent({ ...agent })} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                                                <button onClick={() => deleteAgent(agent.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer' }}><Trash2 size={12} /></button></>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    {isEd ? (
                                        <select value={editAgent.specialty} onChange={e => setEditAgent({ ...editAgent, specialty: e.target.value })} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.7rem', padding: '2px' }}>
                                            {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                        </select>
                                    ) : <span style={{ background: `${role.c}20`, color: role.c, padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{role.l}</span>}
                                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem' }}>{sectors[agent.business_type]?.e || '🏢'}</span>
                                </div>

                                {/* Integration Settings */}
                                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '8px', marginBottom: '10px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ marginBottom: '6px' }}>
                                        <label style={{ color: '#0088cc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                            <MessageSquare size={10} /> Telegram Token
                                        </label>
                                        {isEd ? <Input value={editAgent.telegram_token || ''} onChange={e => setEditAgent({ ...editAgent, telegram_token: e.target.value })} placeholder="7434105220:..." />
                                            : <div style={{ color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.telegram_token || '❌ غير مرتبط'}</div>}
                                    </div>
                                    <div>
                                        <label style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                            <Zap size={10} /> WhatsApp Enabled
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: agent.whatsapp_settings?.enabled ? '#10B981' : '#374151' }} />
                                            <span style={{ color: '#9CA3AF' }}>{agent.whatsapp_settings?.enabled ? 'نشط' : 'معطل'}</span>
                                        </div>
                                    </div>
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
                    <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.83rem' }}>{filtBk.length} حجز مطابق</p>
                    <div style={{ marginBottom: '0.9rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <select value={bFilter} onChange={e => setBFilter(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '7px 11px', fontSize: '0.82rem', minWidth: '200px' }}>
                            <option value="">كل العملاء ({bookings.length})</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({bl(c.id).length})</option>)}
                        </select>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                            <input value={bSearch} onChange={e => setBSearch(e.target.value)} placeholder="بحث باسم الزبونة أو الجوال..." style={{ width: '100%', padding: '7px 30px 7px 10px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.82rem' }} />
                        </div>
                        <Btn onClick={() => handleExport(filtBk, 'bookings')} color="#10B981" style={{ fontSize: '0.75rem' }}><Download size={14} />تصدير Excel</Btn>
                        {bFilter && <button onClick={() => setBFilter('')} style={{ background: 'rgba(255,255,255,0.05)', color: '#EF4444', border: 'none', borderRadius: '7px', padding: '6px 11px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>إلغاء فلفر العميل</button>}
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

                {/* ── BLOG ── */}
                {tab === 'blog' && <AdminBlogManager />}

                {/* ── INFRASTRUCTURE ── */}
                {tab === 'infrastructure' && <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>البنية التحتية</h1>
                    <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>إدارة القطاعات والأدوار وسجلات النظام</p>

                    <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', background: '#111827', padding: '3px', borderRadius: '9px', width: 'fit-content' }}>
                        {[['cfg', '⚙️ الإعدادات'], ['logs', '📋 السجلات']].map(([id, lbl]) => <button key={id} onClick={() => setIntTab(id)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: intTab === id ? '#8B5CF6' : 'transparent', color: intTab === id ? 'white' : '#6B7280' }}>
                            {lbl}
                        </button>)}
                    </div>

                    {intTab === 'cfg' && <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 800 }}>تخصيص المنصة</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: 0 }}>تحكم في القطاعات والأدوار الوظيفية المتاحة عبر المنصة</p>
                            </div>
                            <Btn onClick={async () => {
                                setSaving(true);
                                await Promise.all([
                                    adminService.updatePlatformSettings('system_sectors', sectors),
                                    adminService.updatePlatformSettings('system_roles', roles)
                                ]);
                                setSaving(false);
                                flash('✅ تم حفظ كافة إعدادات البنية التحتية');
                            }} disabled={saving}><Save size={14} />{saving ? 'جاري الحفظ...' : 'حفظ التغييرات الشاملة'}</Btn>
                        </div>

                        {/* SECTORS SECTION */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>1. القطاعات المتاحة (Sectors)</h3>
                            <button onClick={() => {
                                const newId = `sec_${Date.now()}`;
                                setSectors(p => ({ ...p, [newId]: { l: 'قطاع جديد', e: '📁', c: '#10B981', on: true } }));
                            }} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>+ إضافة قطاع</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                            {Object.entries(sectors).map(([sk, sec]) => (
                                <Card key={sk} s={{ border: `1px solid ${sec.on ? sec.c + '30' : 'rgba(255,255,255,0.05)'}` }} c={<>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input value={sec.e} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, e: e.target.value } }))} style={{ width: '30px', background: 'transparent', border: 'none', fontSize: '1.3rem', color: 'white', textAlign: 'center' }} />
                                            <div>
                                                <input value={sec.l} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, l: e.target.value } }))} style={{ fontWeight: 700, color: 'white', fontSize: '0.87rem', background: 'transparent', border: 'none' }} />
                                                <input type="color" value={sec.c} onChange={e => setSectors(p => ({ ...p, [sk]: { ...sec, c: e.target.value } }))} style={{ width: '30px', height: '15px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'block' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => setSectors(p => ({ ...p, [sk]: { ...sec, on: !sec.on } }))} style={{ background: sec.on ? '#10B98120' : 'rgba(255,255,255,0.05)', color: sec.on ? '#10B981' : '#6B7280', border: 'none', borderRadius: '99px', padding: '3px 11px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                                                {sec.on ? '✅ نشط' : '⏸ موقوف'}
                                            </button>
                                            <button onClick={() => {
                                                const { [sk]: _, ...rest } = sectors;
                                                setSectors(rest);
                                            }} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </>} />
                            ))}
                        </div>

                        {/* roles SECTION */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>2. الأدوار الوظيفية (Roles)</h3>
                            <button onClick={() => {
                                const newId = `role_${Date.now()}`;
                                setRoles(p => ({ ...p, [newId]: { l: 'دور جديد', c: '#8B5CF6', on: true } }));
                            }} style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>+ إضافة دور</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {Object.entries(roles).map(([rk, rol]) => (
                                <Card key={rk} s={{ border: `1px solid ${rol.on !== false ? rol.c + '30' : 'rgba(255,255,255,0.05)'}` }} c={<>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: rol.c }} />
                                            <div>
                                                <input value={rol.l} onChange={e => setRoles(p => ({ ...p, [rk]: { ...rol, l: e.target.value } }))} style={{ fontWeight: 700, color: 'white', fontSize: '0.87rem', background: 'transparent', border: 'none' }} />
                                                <input type="color" value={rol.c} onChange={e => setRoles(p => ({ ...p, [rk]: { ...rol, c: e.target.value } }))} style={{ width: '30px', height: '15px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'block' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => setRoles(p => ({ ...p, [rk]: { ...rol, on: rol.on === false ? true : false } }))} style={{ background: rol.on !== false ? '#10B98120' : 'rgba(255,255,255,0.05)', color: rol.on !== false ? '#10B981' : '#6B7280', border: 'none', borderRadius: '99px', padding: '3px 11px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                                                {rol.on !== false ? '✅ نشط' : '⏸ موقوف'}
                                            </button>
                                            <button onClick={() => {
                                                const { [rk]: _, ...rest } = roles;
                                                setRoles(rest);
                                            }} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </>} />
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>إدارة تطبيقات الموظفات</h3>
                            <Btn onClick={async () => {
                                setSaving(true);
                                await adminService.updatePlatformSettings('system_agent_apps', agentAppsConfig);
                                setSaving(false);
                                flash('✅ تم حفظ إعدادات التطبيقات');
                            }} disabled={saving}><Save size={14} />حفظ التطبيقات</Btn>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {agentAppsConfig.map((app, idx) => (
                                <Card key={app.id} c={<div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <select value={app.icon} onChange={e => { const u = [...agentAppsConfig]; u[idx].icon = e.target.value; setAgentAppsConfig(u); }} style={{ background: '#1F2937', color: 'white', border: '1px solid #374151', borderRadius: '5px' }}>
                                            {Object.keys(ICON_MAP).map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                        <Input value={app.label} onChange={e => { const u = [...agentAppsConfig]; u[idx].label = e.target.value; setAgentAppsConfig(u); }} />
                                    </div>
                                    <Input value={app.desc} onChange={e => { const u = [...agentAppsConfig]; u[idx].desc = e.target.value; setAgentAppsConfig(u); }} />
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
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>الباقات والأسعار</h1>
                            <p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.83rem' }}>تعديل استراتيجية التسعير والمميزات التقنية لكل فئة</p>
                        </div>
                        <Btn onClick={async () => { 
                            setSaving(true); 
                            await adminService.updatePlatformSettings('pricing_plans', pricing); 
                            setSaving(false); 
                            flash('✅ تم حفظ كافة إعدادات التسعير'); 
                        }} disabled={saving}>
                            <Save size={14} />{saving ? 'جاري الحفظ...' : 'حفظ الكل'}
                        </Btn>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                        {pricing.map((plan, idx) => (
                            <Card key={plan.id} s={{ border: '1px solid rgba(139, 92, 246, 0.2)', position: 'relative' }} c={<>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={16} color="#8B5CF6" />
                                    </div>
                                    <h3 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '1rem' }}>{plan.name}</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '5px' }}>السعر الشهري ($)</label>
                                        <input type="number" value={plan.monthlyPrice} onChange={e => { const u = [...pricing]; u[idx].monthlyPrice = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '5px' }}>السعر السنوي ($/شهر)</label>
                                        <input type="number" value={plan.yearlyPrice} onChange={e => { const u = [...pricing]; u[idx].yearlyPrice = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#A78BFA', fontSize: '0.75rem', marginBottom: '5px' }}>سعر التجربة (3 شهور)</label>
                                        <input type="number" value={plan.trialPrice || 0} onChange={e => { const u = [...pricing]; u[idx].trialPrice = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', color: '#A78BFA', fontWeight: 'bold' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#10B981', fontSize: '0.75rem', marginBottom: '5px' }}>عدد النقاط (شهرياً)</label>
                                        <input type="number" value={plan.credits || 0} onChange={e => { const u = [...pricing]; u[idx].credits = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#10B981' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '5px' }}>أقصى عدد موظفين</label>
                                        <input type="number" value={plan.agentsLimit || 0} onChange={e => { const u = [...pricing]; u[idx].agentsLimit = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '5px' }}>أدوات/قنوات لكل موظف</label>
                                        <input type="number" value={plan.toolsLimit || 0} onChange={e => { const u = [...pricing]; u[idx].toolsLimit = Number(e.target.value); setPricing(u); }} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white' }} />
                                    </div>
                                </div>
                            </>} />
                        ))}
                    </div>

                    {/* Add-ons Section */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>باقات الشحن السريع (Add-ons)</h3>
                        <p style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '1rem' }}>تحكم في أسعار "Refill" التي تظهر للعملاء في لوحة التحكم</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {['addon_1k', 'addon_5k'].map(addonId => {
                                const addon = pricing.find(p => p.id === addonId) || { id: addonId, name: addonId === 'addon_1k' ? '1,000 Credits' : '5,000 Credits', monthlyPrice: addonId === 'addon_1k' ? 10 : 35, credits: addonId === 'addon_1k' ? 1000 : 5000 };
                                const idx = pricing.findIndex(p => p.id === addonId);
                                
                                return (
                                    <Card key={addonId} s={{ background: '#1F293760' }} c={<>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 700, color: '#A78BFA' }}>{addon.name}</div>
                                            <div style={{ fontSize: '0.7rem', background: '#A78BFA20', color: '#A78BFA', padding: '2px 8px', borderRadius: '20px' }}>شحن رصيد</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.7rem', marginBottom: '3px' }}>السعر ($)</label>
                                                <input type="number" value={addon.monthlyPrice} onChange={e => {
                                                    const val = Number(e.target.value);
                                                    if (idx === -1) setPricing(p => [...p, { ...addon, monthlyPrice: val }]);
                                                    else { const u = [...pricing]; u[idx].monthlyPrice = val; setPricing(u); }
                                                }} style={{ width: '100%', padding: '8px', background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.7rem', marginBottom: '3px' }}>النقاط</label>
                                                <input type="number" value={addon.credits} onChange={e => {
                                                    const val = Number(e.target.value);
                                                    if (idx === -1) setPricing(p => [...p, { ...addon, credits: val }]);
                                                    else { const u = [...pricing]; u[idx].credits = val; setPricing(u); }
                                                }} style={{ width: '100%', padding: '8px', background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white' }} />
                                            </div>
                                        </div>
                                    </>} />
                                );
                            })}
                        </div>
                    </div>
                </div>}

                {/* ── INTEGRATIONS ── */}
                {
                    tab === 'integrations' && <div>
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

                    </div>
                }

                {/* ── CONCIERGE CHATS ── */}
                {tab === 'concierge-chats' && <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 4px' }}>محادثات نورة</h1>
                        <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.83rem' }}>سجل المحادثات بين العمال والمنصة والمستشارة الذكية</p>
                        
                        <Card s={{ padding: 0, overflow: 'hidden' }} c={<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['العميل', 'آخر رسالة', 'التحديث', 'الإجراء'].map(h => <th key={h} style={{ padding: '0.8rem 0.9rem', color: '#6B7280', fontWeight: 600, fontSize: '0.77rem' }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {conciergeChats.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>لا يوجد سجل محادثات حالياً</td></tr>
                                    : conciergeChats.map(chat => (
                                        <tr key={chat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: selChat?.id === chat.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem 0.9rem' }}>
                                                <div style={{ fontWeight: 700, color: 'white', fontSize: '0.84rem' }}>{chat.user_name || '—'}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{chat.user_email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.9rem', color: '#9CA3AF', fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {chat.last_message || '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.9rem', color: '#6B7280', fontSize: '0.75rem' }}>
                                                {new Date(chat.updated_at).toLocaleString('ar-EG')}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.9rem' }}>
                                                <button onClick={() => setSelChat(chat)} style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>فتح المحادثة</button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>} />
                    </div>

                    {selChat && <div style={{ width: '400px', flexShrink: 0, height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>💬 تفاصيل المحادثة وتحليل العميل</div>
                            <button onClick={() => setSelChat(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        {/* AI Insights Card */}
                        {selChat.metadata?.insights && (
                            <Card s={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', padding: '1rem' }} c={
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#A78BFA', fontWeight: 800 }}>⚡ تحليل نورة للعميل</div>
                                        <div style={{ 
                                            fontSize: '0.65rem', 
                                            background: selChat.metadata.insights.interest_level === 'high' ? '#10B981' : '#F59E0B',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontWeight: 800
                                        }}>
                                            {selChat.metadata.insights.interest_level === 'high' ? 'اهتمام عالي' : 'اهتمام متوسط'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                        <div style={{ color: '#9CA3AF' }}>النشاط: <span style={{ color: 'white' }}>{selChat.metadata.insights.business_type || 'غير محدد'}</span></div>
                                        <div style={{ color: '#9CA3AF' }}>الحالة: <span style={{ color: 'white' }}>{selChat.metadata.insights.lead_status || 'استفسار'}</span></div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600 }}>
                                        💡 {selChat.metadata.insights.primary_need}
                                    </div>
                                </div>
                            } />
                        )}

                        <Card s={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem' }} c={
                            selChat.messages?.map((m, i) => (
                                <div key={i} style={{ 
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    background: m.role === 'user' ? '#1E293B' : '#8B5CF620',
                                    color: m.role === 'user' ? '#E2E8F0' : '#A78BFA',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    maxWidth: '85%',
                                    fontSize: '0.8rem',
                                    border: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.2)'}`
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.65rem', marginBottom: '3px', opacity: 0.6 }}>{m.role === 'user' ? selChat.user_name : 'نورة (المستشارة)'}</div>
                                    {m.content}
                                </div>
                            ))
                        } />
                        {selChat.ticket_id && (
                            <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Check size={14} /> مرتبطة تذكرة دعم #{selChat.ticket_id.slice(0, 8)}
                            </div>
                        )}
                    </div>}
                </div>}

                {/* ── INTERVIEW AGENTS (TEMPLATES) ── */}
                {tab === 'interview-agents' && <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>🎙️ قوالب موظفي المقابلة (الموصى بهم)</h1>
                            <p style={{ color: '#6B7280', margin: '4px 0 0', fontSize: '0.83rem' }}>قم بإدارة النماذج والشخصيات الجاهزة التي يتم عرضها للعملاء في غرفة المقابلة</p>
                        </div>
                        <Btn onClick={() => setShowAddTemplate(!showAddTemplate)}><Plus size={14} />إضافة قالب شخصية جديد</Btn>
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
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.73rem', marginBottom: '6px' }}>صورة الموظفة (صورة حقيقية)</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
                                    {REALISTIC_AVATARS.map((url, i) => (
                                        <img 
                                            key={i} 
                                            src={url} 
                                            onClick={() => setNewTemplate(p => ({ ...p, avatar: url }))}
                                            style={{ 
                                                cursor: 'pointer',
                                                width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                                                border: newTemplate.avatar === url ? '2px solid #8B5CF6' : '2px solid transparent',
                                                opacity: newTemplate.avatar === url ? 1 : 0.6,
                                                transition: 'all 0.2s'
                                            }} 
                                        />
                                    ))}
                                </div>
                                <Input value={newTemplate.avatar} onChange={e => setNewTemplate(p => ({ ...p, avatar: e.target.value }))} placeholder="أو أدخل رابط صورة مخصصة..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <Btn onClick={addTemplate}><Check size={14} />حفظ القالب الجديد</Btn>
                            <button onClick={() => setShowAddTemplate(false)} style={{ background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer' }}>إلغاء</button>
                        </div>
                    </div>} />}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                        {templates.map(t => (
                            <Card key={t.id} c={<div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={getRealisticAvatar(t.avatar)} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'white', direction: isEnglish ? 'ltr' : 'rtl', textAlign: isEnglish ? 'left' : 'right' }}>
                                                {isEnglish ? (t.name_en || t.name) : t.name}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{t.name_en && !isEnglish ? t.name_en : ''}</div>
                                        </div>
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

                {/* ── AI SETTINGS ── */}
                {
                    tab === 'ai-settings' && <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>المستشارة الذكية</h1><p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.83rem' }}>إعدادات الذكاء الاصطناعي الخاص بنورة</p></div>
                            <Btn onClick={saveAiConfig} disabled={saving}><Save size={14} />{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Btn>
                        </div>
                        <Card c={<div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>1. قاعدة المعرفة (Knowledge Base)</label>
                                <p style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '8px' }}>جميع المعلومات التي تستند إليها المستشارة عن منصة 24Shift (الأسعار، الخدمات، الشروط)</p>
                                <textarea value={aiConfig.knowledge || ''} onChange={e => setAiConfig({ ...aiConfig, knowledge: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', minHeight: '180px', fontFamily: 'inherit', fontSize: '0.85rem' }} placeholder="أدخل بيانات المنصة هنا..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>2. التوجيهات الخاصة (System Prompt) - عربي</label>
                                <p style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '8px' }}>تعليمات الشخصية وأسلوب التحدث بالعربية</p>
                                <textarea value={aiConfig.prompt_ar || ''} onChange={e => setAiConfig({ ...aiConfig, prompt_ar: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', minHeight: '120px', fontFamily: 'inherit', fontSize: '0.85rem' }} placeholder="أنتِ نورة المستشارة..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>2. التوجيهات الخاصة (System Prompt) - إنجليزي</label>
                                <textarea dir="ltr" value={aiConfig.prompt_en || ''} onChange={e => setAiConfig({ ...aiConfig, prompt_en: e.target.value })} style={{ width: '100%', padding: '12px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'white', minHeight: '120px', fontFamily: 'inherit', fontSize: '0.85rem' }} placeholder="You are Noura..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#A78BFA', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>3. الحد الأقصى لطول الرد (حروف)</label>
                                <p style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '8px' }}>لإجبار المستشارة على الردود القصيرة والمباشرة، استخدم قيمة بين 100 و 300</p>
                                <Input type="number" value={aiConfig.max_length || 150} onChange={e => setAiConfig({ ...aiConfig, max_length: Number(e.target.value) })} />
                            </div>
                        </div>} />
                    </div>
                }

                {/* ── BLOG ── */}
                {tab === 'blog' && <AdminBlogManager />}

                {/* ── SUBSCRIBERS ── */}
                {tab === 'subscribers' && <NewsletterSubscribers />}

            </main >
        </div >
    );
}
