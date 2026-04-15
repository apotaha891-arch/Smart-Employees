import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseService';
import { signOut } from '../../../services/supabaseService';
import * as adminService from '../../../services/adminService';
import { useLanguage } from '../../../LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import * as XLSX from 'xlsx';
import { 
    DEFAULT_SECTORS, 
    DEFAULT_ROLES, 
    DEFAULT_AGENT_APPS, 
    DEFAULT_INTERVIEW_AGENTS 
} from '../constants';

export const useAdminDashboard = () => {
    const navigate = useNavigate();
    const { isEnglish, t, language } = useLanguage();
    const { 
        user: authUser, 
        userRole, 
        isAdmin, 
        isAuthenticated, 
        impersonateUser 
    } = useAuth();

    // --- State Management ---
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Dynamic Configs
    const [sectors, setSectors] = useState(DEFAULT_SECTORS);
    const [roles, setRoles] = useState(DEFAULT_ROLES);
    const [agentAppsConfig, setAgentAppsConfig] = useState(DEFAULT_AGENT_APPS);
    
    // Data Tables
    const [clients, setClients] = useState([]);
    const [agents, setAgents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [platformTelegramToken, setPlatformTelegramToken] = useState('');
    const [academyPriceId, setAcademyPriceId] = useState('');
    const [conciergeChats, setConciergeChats] = useState([]);
    const [selChat, setSelChat] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [customRequests, setCustomRequests] = useState([]);
    
    // Academy & Affiliates
    const [academyLeads, setAcademyLeads] = useState([]);
    const [affiliates, setAffiliates] = useState([]);
    const [academyLoading, setAcademyLoading] = useState(false);

    // Logs & Stats
    const [clientKeys, setClientKeys] = useState({});
    const [logs, setLogs] = useState([]);
    const [logParams, setLogParams] = useState({ category: '', level: '', limit: 50 });
    const [loadProgress, setLoadProgress] = useState({ clients: 0, agents: 0, bookings: 0, chats: 0 });

    // Templates
    const [templates, setTemplates] = useState([]);
    const [endCustomers, setEndCustomers] = useState([]);
    const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
    const [whiteLabelRequests, setWhiteLabelRequests] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ 
        name: '', name_en: '', specialty: 'booking', 
        business_type: 'telecom_it', description: '', 
        description_en: '', avatar: '👩' 
    });
    const [showAddTemplate, setShowAddTemplate] = useState(false);
    
    // Interview Agents
    const [interviewAgents, setInterviewAgents] = useState(() => {
        try {
            const stored = localStorage.getItem('admin_interview_agents');
            return stored ? JSON.parse(stored) : DEFAULT_INTERVIEW_AGENTS;
        } catch { return DEFAULT_INTERVIEW_AGENTS; }
    });
    const [savingInterview, setSavingInterview] = useState(false);

    // Search & Filters
    const [cSearch, setCSearch] = useState('');
    const [cFilter, setCFilter] = useState('');
    const [aSearch, setASearch] = useState('');
    const [aFilter, setAFilter] = useState('');
    const [bSearch, setBSearch] = useState('');
    const [bFilter, setBFilter] = useState('');
    const [notifTypeFilter, setNotifTypeFilter] = useState('');
    const [notifClientFilter, setNotifClientFilter] = useState('');

    // AI Configuration
    const [aiConfig, setAiConfig] = useState({ knowledge: '', prompt_ar: '', prompt_en: '', max_length: 150 });
    const [advisorMessages, setAdvisorMessages] = useState([
        { 
            role: 'assistant', 
            content: isEnglish 
                ? 'Hello Admin, I am your smart consultant. How can I help you manage the platform today?' 
                : 'أهلاً بك أيها المدير، أنا مستشارك الذكي. كيف يمكنني مساعدتك في إدارة المنصة اليوم؟' 
        }
    ]);
    const [advisorInput, setAdvisorInput] = useState('');
    const [advisorConfig, setAdvisorConfig] = useState({ prompt: '', knowledge: '' });

    // Modals & UI Selection
    const [selClient, setSelClient] = useState(null);
    const [editAgent, setEditAgent] = useState(null);
    const [intTab, setIntTab] = useState('platform');
    const [selIntClient, setSelIntClient] = useState(null);
    const [showAddAgent, setShowAddAgent] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', specialty: 'booking', business_type: 'telecom_it', user_id: '' });
    const [agentApps, setAgentApps] = useState({});

    // --- Memoized Values ---
    const PLANS = useMemo(() => {
        const pMap = {
            free: { bg: 'rgba(107, 114, 128, 0.1)', t: '#9CA3AF', l: 'تجريبي' },
            basic: { bg: 'rgba(107, 114, 128, 0.1)', t: '#9CA3AF', l: 'تجريبي' }
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

    // --- Helper Functions ---
    const flash = useCallback((m) => { 
        setMsg(m); 
        setTimeout(() => setMsg(''), 3000); 
    }, []);

    const handleExport = useCallback((data, fileName) => {
        if (!data || data.length === 0) return flash(isEnglish ? '⚠️ No data to export' : '⚠️ لا يوجد بيانات للتصدير');
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `24shift_${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        flash(isEnglish ? `✅ Successfully exported ${data.length} records` : `✅ تم تصدير ${data.length} سجلات بنجاح`);
    }, [flash, isEnglish]);

    // --- Core Data Loading ---
    const load = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Meta-data & Configs
            const [plans, integ, dbSectors, dbRoles, dbApps, dbAiConfig, advCfg] = await Promise.allSettled([
                adminService.getPlatformSettings('pricing_plans'),
                adminService.getPlatformSettings('external_integrations'),
                adminService.getPlatformSettings('system_sectors'),
                adminService.getPlatformSettings('system_roles'),
                adminService.getPlatformSettings('system_agent_apps'),
                adminService.getPlatformSettings('manager_ai_config'),
                adminService.getPlatformSettings('admin_advisor_config'),
            ]).then(res => res.map(r => r.status === 'fulfilled' ? r.value : null));

            setPricing(plans || []);
            setIntegrations(integ || []);
            if (dbSectors) setSectors(dbSectors);
            if (dbRoles) setRoles(dbRoles);
            if (dbApps) setAgentAppsConfig(dbApps);
            if (dbAiConfig) setAiConfig(dbAiConfig);
            if (advCfg) setAdvisorConfig(advCfg);

            // 2. Platform settings
            const [tgToken, priceId] = await Promise.all([
                adminService.getPlatformSettings('platform_telegram_token'),
                adminService.getPlatformSettings('academy_price_id')
            ]);
            if (tgToken) setPlatformTelegramToken(tgToken);
            if (priceId) setAcademyPriceId(priceId);

            // 3. Core Business Data
            const results = await Promise.allSettled([
                adminService.getAllCustomers(),
                adminService.getAllAgents(),
                adminService.getAllBookings(),
                adminService.getAllEntities(),
                adminService.getAllConciergeConversations(),
                adminService.getAllNotifications(),
                adminService.getAllEndCustomers(),
                adminService.getAllCustomRequests()
            ]);

            const [profilesRes, agRes, bkRes, keyRes, chatsRes, notifsRes, endCustRes, custReqRes] = results;

            const profiles = profilesRes.status === 'fulfilled' ? profilesRes.value : [];
            const ag       = agRes.status === 'fulfilled'       ? agRes.value       : [];
            const bk       = bkRes.status === 'fulfilled'       ? bkRes.value       : [];
            const keyData  = keyRes.status === 'fulfilled'      ? keyRes.value      : [];
            const chats    = chatsRes.status === 'fulfilled'    ? chatsRes.value    : [];
            const notifs   = notifsRes.status === 'fulfilled'   ? notifsRes.value   : [];
            const endCust  = endCustRes.status === 'fulfilled'  ? endCustRes.value  : [];
            const custReq  = custReqRes.status === 'fulfilled'  ? custReqRes.value  : [];

            setLoadProgress({ 
                clients: profiles.length, 
                agents: ag.length, 
                bookings: bk.length, 
                chats: chats.length 
            });

            // Merge Profile + SalonConfig data
            const clientMap = {};
            (profiles || []).forEach(p => {
                const uid = p.id || p.user_id;
                if (!uid) return;
                clientMap[uid] = { 
                    ...p, 
                    id: uid,
                    full_name: p.full_name || p.business_name || '—', 
                    email: p.email || '—' 
                };
            });
            (keyData || []).forEach(k => {
                if (clientMap[k.user_id]) clientMap[k.user_id] = { ...clientMap[k.user_id], entityId: k.id };
            });
            
            setClients(Object.values(clientMap));
            setAgents(ag || []);
            setBookings(bk || []);
            setConciergeChats(chats || []);
            setNotifications(notifs || []);
            setEndCustomers(endCust || []);
            setCustomRequests(custReq || []);

            // Setup keys & apps mapping
            const kmap = {};
            (keyData || []).forEach(k => { 
                kmap[k.user_id] = { 
                    telegram_token: k.telegram_token || '', 
                    whatsapp_number: k.whatsapp_number || '', 
                    whatsapp_api_key: k.whatsapp_api_key || '' 
                }; 
            });
            setClientKeys(kmap);

            const appMap = {};
            (ag || []).forEach(a => { if (a.metadata?.apps) appMap[a.id] = a.metadata.apps; });
            setAgentApps(appMap);

            // Templates 
            const tData = await adminService.getTemplates();
            setTemplates(tData || []);

            adminService.logSystemEvent('info', 'system', 'Admin dashboard loaded successfully');
        } catch (e) {
            console.error('Admin load fatal error:', e);
            flash('❌ خطأ في التحميل: ' + e.message);
        } finally {
            setLoading(false);
        }
    }, [flash]);

    const loadWhiteLabelRequests = useCallback(async () => {
        try {
            const data = await adminService.getAllWhiteLabelRequests();
            setWhiteLabelRequests(data || []);
        } catch (e) { console.error('Error loading white label requests:', e); }
    }, []);

    const loadNewsletterSubscribers = useCallback(async () => {
        try {
            const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
            setNewsletterSubscribers(data || []);
        } catch (e) { console.error('Error loading subscribers:', e); }
    }, []);

    useEffect(() => { 
        load();
        loadWhiteLabelRequests();
        loadNewsletterSubscribers();
    }, [load, loadWhiteLabelRequests, loadNewsletterSubscribers]);

    // Real-time notifications
    useEffect(() => {
        try {
            const channel = supabase.channel('platform_notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_notifications' }, (payload) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 50));
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        } catch (rtErr) { console.warn('Realtime failed:', rtErr.message); }
    }, []);

    // Other specific data loading
    const fetchLogs = useCallback(async () => {
        let q = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(logParams.limit);
        if (logParams.category) q = q.eq('category', logParams.category);
        if (logParams.level) q = q.eq('level', logParams.level);
        const { data, error } = await q;
        if (!error) setLogs(data || []);
    }, [logParams]);

    useEffect(() => {
        if (tab === 'infrastructure') fetchLogs();
    }, [tab, fetchLogs]);

    const loadAcademyData = useCallback(async () => {
        setAcademyLoading(true);
        try {
            const [leadsData, affsData] = await Promise.all([
                adminService.getAllAcademyLeads(),
                adminService.getAllAffiliates()
            ]);
            setAcademyLeads(leadsData);
            setAffiliates(affsData);
        } catch (e) {
            console.error('Error loading academy data:', e);
        } finally {
            setAcademyLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'academy') loadAcademyData();
    }, [tab, loadAcademyData]);

    // --- Handlers ---

    // Auth
    const handleLogout = async () => { await signOut(); navigate('/login'); };

    // Customers
    const updateClientPlan = async (id, plan) => {
        try {
            await adminService.updateClientPlan(id, plan);
            setClients(p => p.map(c => c.id === id ? { ...c, subscription_tier: plan } : c));
            flash(isEnglish ? '✅ Subscription updated' : '✅ تم تحديث الاشتراك');
        } catch (err) {
            flash('❌ ' + err.message);
        }
    };

    const remoteLogin = async (targetClient) => {
        if (!targetClient || !targetClient.id) return flash(isEnglish ? '❌ Client profile not found' : '❌ تعذر العثور على بروفايل العميل');
        setSaving(true);
        try {
            impersonateUser(targetClient);
            flash(isEnglish 
                ? `🚀 Logged in as support for: ${targetClient.full_name}` 
                : `🚀 تم الدخول كدعم فني لـ: ${targetClient.full_name}`);
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (e) {
            flash('❌ ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // Agents
    const toggleAgent = async (a) => {
        const s = a.status === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase.from('agents').update({ status: s }).eq('id', a.id);
            if (error) throw error;
            setAgents(p => p.map(x => x.id === a.id ? { ...x, status: s } : x));
            flash(isEnglish ? '✅ Status updated' : '✅ تم تحديث حالة الموظفة');
        } catch (err) {
            flash('❌ ' + err.message);
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
            flash(isEnglish ? '✅ Changes saved' : '✅ تم حفظ التعديلات');
        } catch (err) {
            flash('❌ ' + err.message);
        }
    };

    const deleteAgent = async (id) => {
        if (!window.confirm(isEnglish ? 'Delete this agent?' : 'حذف هذه الموظفة؟')) return;
        try {
            const { error } = await supabase.from('agents').delete().eq('id', id);
            if (error) throw error;
            setAgents(p => p.filter(a => a.id !== id));
            flash(isEnglish ? '✅ Deleted' : '✅ تم الحذف');
        } catch (err) {
            flash('❌ ' + err.message);
        }
    };

    const addAgent = async () => {
        if (!newAgent.name || !newAgent.user_id) return flash(isEnglish ? '❌ Select client and enter name' : '❌ اختر العميل وأدخل الاسم');
        const client = clients.find(c => c.id === newAgent.user_id);
        const { data, error } = await supabase.from('agents').insert({
            name: newAgent.name,
            specialty: newAgent.specialty,
            business_type: newAgent.business_type,
            user_id: newAgent.user_id,
            entity_id: client?.entityId || null,
            status: 'active',
            created_at: new Date().toISOString()
        }).select().single();

        if (error) return flash('❌ ' + error.message);
        setAgents(p => [data, ...p]);
        setShowAddAgent(false);
        setNewAgent({ name: '', specialty: 'booking', business_type: 'beauty', user_id: '' });
        flash(isEnglish ? '✅ Agent added' : '✅ تمت إضافة الموظفة');
    };

    const toggleApp = async (agentId, appId) => {
        const current = agentApps[agentId] || {};
        const updated = { ...current, [appId]: !current[appId] };
        setAgentApps(p => ({ ...p, [agentId]: updated }));
        await supabase.from('agents').update({ metadata: { apps: updated } }).eq('id', agentId);
    };

    // Bookings
    const updateBookingStatus = async (id, status) => {
        try {
            const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
            if (error) throw error;
            
            setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
            flash(status === 'confirmed' ? (isEnglish ? '✅ Confirmed' : '✅ تم تأكيد الحجز') : (isEnglish ? '✅ Updated' : '✅ تم التحديث'));
            
            if (status === 'confirmed' || status === 'cancelled') {
                await adminService.sendBookingNotification(id, status);
            }
        } catch (err) { 
            flash('❌ ' + err.message); 
        }
    };

    // Platform Keys & Configs
    const savePlatformInteg = async () => { 
        setSaving(true); 
        try {
            await Promise.all([
                adminService.updatePlatformSettings('external_integrations', integrations),
                adminService.updatePlatformSettings('platform_telegram_token', platformTelegramToken),
                adminService.updatePlatformSettings('academy_price_id', academyPriceId)
            ]);
            flash(isEnglish ? '✅ Platform keys saved' : '✅ تم حفظ مفاتيح المنصة'); 
        } finally {
            setSaving(false); 
        }
    };

    const saveClientKey = async (uid) => {
        setSaving(true);
        try {
            const k = clientKeys[uid] || {};
            const { data: config, error } = await supabase.from('entities').update({ 
                telegram_token: k.telegram_token || null, 
                whatsapp_number: k.whatsapp_number || null, 
                whatsapp_api_key: k.whatsapp_api_key || null 
            }).eq('user_id', uid).select('id').single();

            if (error) throw error;

            if (k.telegram_token) {
                const { data: ag } = await supabase.from('agents').select('id').eq('user_id', uid).limit(1).maybeSingle();
                if (ag) {
                    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook?agent_id=${ag.id}`;
                    await fetch(`https://api.telegram.org/bot${k.telegram_token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
                }
            }
            flash(isEnglish ? '✅ Client keys saved' : '✅ تم حفظ مفاتيح العميل');
        } catch (e) {
            flash('❌ ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const saveAiConfig = async () => { 
        setSaving(true); 
        try {
            await adminService.updatePlatformSettings('manager_ai_config', aiConfig); 
            flash(isEnglish ? '✅ AI Config saved' : '✅ تم حفظ إعدادات المستشارة الذكية'); 
        } finally {
            setSaving(false); 
        }
    };

    // Academy
    const handleGrantAcademyAccess = async (leadId) => {
        if (!window.confirm(isEnglish ? 'Grant full access to this lead?' : 'هل تريد منح الوصول الكامل لهذا العميل؟')) return;
        const ok = await adminService.updateAcademyLeadStatus(leadId, 'paid');
        if (ok) {
            setAcademyLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'paid' } : l));
            flash(isEnglish ? '✅ Access granted!' : '✅ تم منح الوصول بنجاح!');
        }
    };

    // Interview Agents
    const saveInterviewAgentsData = () => {
        setSavingInterview(true);
        localStorage.setItem('admin_interview_agents', JSON.stringify(interviewAgents));
        setTimeout(() => { 
            setSavingInterview(false); 
            flash(isEnglish ? '✅ Interview settings saved' : '✅ تم حفظ إعدادات موظفي المقابلة'); 
        }, 600);
    };

    const resetInterviewAgentsData = () => {
        if (!window.confirm(isEnglish ? 'Reset to defaults?' : 'إعادة ضبط جميع موظفي المقابلة للإعدادات الافتراضية؟')) return;
        setInterviewAgents(DEFAULT_INTERVIEW_AGENTS);
        localStorage.removeItem('admin_interview_agents');
        flash(isEnglish ? '↩️ Reset successfully' : '↩️ تم الإعادة للإعدادات الافتراضية');
    };

    // White Label Handlers
    const handleApproveWhiteLabel = async (id) => {
        setSaving(true);
        try {
            await adminService.approveWhiteLabelRequest(id);
            flash(isEnglish ? '✅ White-label approved!' : '✅ تم اعتماد الطلب بنجاح!');
            loadWhiteLabelRequests();
        } catch (e) {
            flash('❌ ' + e.message);
        } finally { setSaving(false); }
    };

    const handleRejectWhiteLabel = async (id, reason) => {
        setSaving(true);
        try {
            await adminService.rejectWhiteLabelRequest(id, reason);
            flash(isEnglish ? '✅ Request rejected' : '✅ تم رفض الطلب');
            loadWhiteLabelRequests();
        } catch (e) {
            flash('❌ ' + e.message);
        } finally { setSaving(false); }
    };

    return {
        // State
        tab, setTab, loading, saving, msg, setMsg, flash,
        sectors, setSectors, roles, setRoles, agentAppsConfig, setAgentAppsConfig,
        clients, setClients, agents, setAgents, bookings, setBookings, pricing, setPricing,
        integrations, setIntegrations, platformTelegramToken, setPlatformTelegramToken,
        academyPriceId, setAcademyPriceId, conciergeChats, setConciergeChats, selChat, setSelChat,
        notifications, setNotifications, customRequests, setCustomRequests,
        academyLeads, setAcademyLeads, affiliates, setAffiliates, academyLoading,
        clientKeys, setClientKeys, logs, setLogs, logParams, setLogParams, loadProgress,
        templates, setTemplates, endCustomers, setEndCustomers, 
        newsletterSubscribers, setNewsletterSubscribers, whiteLabelRequests, setWhiteLabelRequests,
        newTemplate, setNewTemplate, showAddTemplate, setShowAddTemplate,
        interviewAgents, setInterviewAgents, savingInterview,
        cSearch, setCSearch, cFilter, setCFilter, aSearch, setASearch, aFilter, setAFilter, bSearch, setBSearch, bFilter, setBFilter,
        notifTypeFilter, setNotifTypeFilter, notifClientFilter, setNotifClientFilter,
        aiConfig, setAiConfig, advisorMessages, setAdvisorMessages, advisorInput, setAdvisorInput, advisorConfig, setAdvisorConfig,
        selClient, setSelClient, editAgent, setEditAgent, intTab, setIntTab, selIntClient, setSelIntClient,
        showAddAgent, setShowAddAgent, newAgent, setNewAgent, agentApps, setAgentApps,
        
        // Memos
        PLANS,
        
        // Context/Helper
        isEnglish, t, language, isAdmin, impersonateUser, handleExport,
        
        // Handlers
        load, handleLogout, updateClientPlan, remoteLogin, toggleAgent, saveAgentEdit, deleteAgent, addAgent, toggleApp,
        updateBookingStatus, savePlatformInteg, saveClientKey, saveAiConfig, handleGrantAcademyAccess,
        saveInterviewAgentsData, resetInterviewAgentsData,
        handleApproveWhiteLabel, handleRejectWhiteLabel, loadNewsletterSubscribers, loadWhiteLabelRequests
    };
};
