import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseService';
import { Bot, Plus, Calendar, MessageCircle, TrendingUp, Users, Mail, Power, Settings, Link as LinkIcon, X, AlertCircle, CheckCircle2, Box, ArrowRight, Trash2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const SECTOR_LABELS = {
    beauty: { emoji: '🌸', color: '#EC4899' },
    medical: { emoji: '🩺', color: '#3B82F6' },
    restaurant: { emoji: '🍽', color: '#F59E0B' },
    fitness: { emoji: '🏋', color: '#10B981' },
    real_estate: { emoji: '🏠', color: '#8B5CF6' },
    retail_ecommerce: { emoji: '🛍', color: '#10B981' },
    commerce: { emoji: '🛍', color: '#10B981' },
    banking: { emoji: '🏦', color: '#8B5CF6' },
    call_center: { emoji: '🎧', color: '#06B6D4' },
    telecom_it: { emoji: '📡', color: '#EF4444' },
    retail: { emoji: '🛍', color: '#10B981' },
    general: { emoji: '🏢', color: '#6B7280' },
};

const ROLE_LABELS = {
    booking: { icon: Calendar, color: '#8B5CF6' },
    sales: { icon: TrendingUp, color: '#F59E0B' },
    support: { icon: MessageCircle, color: '#10B981' },
    hr: { icon: Users, color: '#3B82F6' },
    email: { icon: Mail, color: '#EC4899' },
    // Template IDs mapping
    'beauty-salon': { icon: Calendar, color: '#EC4899' },
    'medical-clinic': { icon: Calendar, color: '#3B82F6' },
    'dental-receptionist': { icon: Calendar, color: '#10B981' },
    'sales-lead-gen': { icon: TrendingUp, color: '#F59E0B' },
    'real-estate-marketing': { icon: Calendar, color: '#8B5CF6' },
    'restaurant-reservations': { icon: Calendar, color: '#F59E0B' },
    'gym-coordinator': { icon: Calendar, color: '#10B981' },
    'support-agent': { icon: MessageCircle, color: '#10B981' },
};

const Employees = () => {
    // console.log("Employees.jsx v2-banner-fix: Loaded. Status Banner ready.");
    const { t, language } = useLanguage();
    const isAr = language === 'ar';
    const navigate = useNavigate();
    const { user: contextUser } = useAuth(); // Use AuthContext — respects impersonation
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userSector, setUserSector] = useState('general');
    const [filterRole, setFilterRole] = useState('');
    const [entityConfig, setEntityConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);

    // Modal states
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkingAgent, setLinkingAgent] = useState(null);
    const [linkToken, setLinkToken] = useState('');
    const [savingLink, setSavingLink] = useState(false);
    const [userTier, setUserTier] = useState('starter');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // Re-run when impersonated user changes
    useEffect(() => { 
        if (contextUser?.id) loadSectorAndAgents(); 
    }, [contextUser?.id]);

    const loadSectorAndAgents = async () => {
        setLoading(true);
        try {
            // Use contextUser — correctly reflects impersonated client
            const user = contextUser;
            if (user) {
                // Fetch Sector and Config
                const [configRes, profileRes] = await Promise.all([
                    supabase.from('entities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                    supabase.from('profiles').select('business_type, subscription_tier').eq('id', user.id).maybeSingle()
                ]);

                const config = configRes.data;
                const profile = profileRes.data;

                if (profile?.subscription_tier) setUserTier(profile.subscription_tier);
                if (config) setEntityConfig(config);
                
                // Robust sector detection: handle case sensitivity and Arabic values
                let rawSector = (config?.business_type || config?.specialty || profile?.business_type || 'general').toLowerCase();
                
                // Prioritize exact matches if they exist
                if (SECTOR_LABELS[rawSector]) {
                    setUserSector(rawSector);
                } else {
                    // Fuzzy matching for Arabic or partial English strings
                    if (rawSector.includes('طبي') || rawSector.includes('medical') || rawSector.includes('عيادة')) rawSector = 'medical';
                    else if (rawSector.includes('عقار') || rawSector.includes('real')) rawSector = 'real_estate';
                    else if (rawSector.includes('تجميل') || rawSector.includes('beauty') || rawSector.includes('صالون')) rawSector = 'beauty';
                    else if (rawSector.includes('مطعم') || rawSector.includes('restau')) rawSector = 'restaurant';
                    else if (rawSector.includes('رياض') || rawSector.includes('gym') || rawSector.includes('fit')) rawSector = 'fitness';
                    else if (rawSector.includes('اتصال') || rawSector.includes('telecom') || rawSector.includes('it') || rawSector.includes('تقني')) rawSector = 'telecom_it';
                    else if (rawSector.includes('تجارة') || rawSector.includes('retail') || rawSector.includes('shop')) rawSector = 'retail_ecommerce';
                    
                    setUserSector(SECTOR_LABELS[rawSector] ? rawSector : 'general');
                }

                // Fetch Agents
                const { data: userAgentsData, error: agentsError } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (agentsError) throw agentsError;
                const userAgents = userAgentsData || [];
                setAgents(userAgents);

                // Fetch templates (Safe fetch to avoid 400 errors if table is missing)
                if (userAgents.length === 0) {
                    setFetchingTemplates(true);
                    try {
                        const { data: tmpls, error: tmplError } = await supabase.from('agent_templates').select('*');
                        
                        if (!tmplError && tmpls) {
                            const currentSector = rawSector;
                            const sectorTmpls = tmpls.filter(t => 
                                (t.is_public !== false) && 
                                (t.business_type === currentSector || t.business_type === 'general')
                            );
                            setTemplates(sectorTmpls);
                        }
                    } catch (e) {
                        console.error("Templates fetch failed:", e);
                    }
                    setFetchingTemplates(false);
                }
            }
        } catch (err) {
            console.error("Error loading sector/agents:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgent = async (agent) => {
        const isTelegram = (agent.platform || '').includes('telegram');
        const hasToken = agent.telegram_token || entityConfig?.telegram_token;

        if (agent.status !== 'active' && isTelegram && !hasToken) {
            setLinkingAgent(agent);
            setShowLinkModal(true);
            return;
        }

        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id);
        loadSectorAndAgents();
    };

    const handleSaveLink = async () => {
        if (!linkingAgent) {
            console.error("No linkingAgent selected!");
            return;
        }
        if (!linkToken) {
            setStatusMsg({ type: 'error', text: isAr ? 'يرجى إدخال التوكن أولاً' : 'Please enter token first' });
            return;
        }
        
        setSavingLink(true);
        setStatusMsg({ type: '', text: '' }); 

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // TOOL LIMIT ENFORCEMENT (Starter Plan)
            if (userTier === 'starter') {
                const TOOL_KEYS = ['telegram_token', 'whatsapp_token', 'whatsapp_num', 'google_sheets_id', 'google_calendar_id', 'instagram_token'];
                let currentToolsCount = 0;
                TOOL_KEYS.forEach(k => {
                   if (linkingAgent[k] || entityConfig?.[k]) currentToolsCount++;
                });

                if (currentToolsCount >= 2 && !linkingAgent.telegram_token && !entityConfig?.telegram_token) {
                    setStatusMsg({
                        type: 'error',
                        text: isAr 
                            ? '⚠️ لقد وصلت للحد الأقصى للأدوات في الباقة المجانية (أداتين فقط). يرجى الترقية لإضافة المزيد.' 
                            : '⚠️ Tool limit reached for Starter plan (max 2). Please upgrade for more.'
                    });
                    setSavingLink(false);
                    return;
                }
            }

            console.log("Employees: Saving link for agent", linkingAgent.id, "with token length:", linkToken.length);

            // 1. Update the agent's token and name in the 'agents' table
            let updatedName = linkingAgent.name || 'موظف';
            const platformTag = isAr ? '(تيليجرام)' : '(Telegram)';
            if (!updatedName.includes('(')) {
                updatedName = `${updatedName} ${platformTag}`;
            }

            const { error: agentUpdateError } = await supabase
                .from('agents')
                .update({
                    name: updatedName,
                    telegram_token: linkToken,
                    platform: linkingAgent.platform ? (linkingAgent.platform.includes('telegram') ? linkingAgent.platform : `${linkingAgent.platform},telegram`) : 'telegram',
                    status: 'active'
                })
                .eq('id', linkingAgent.id);

            if (agentUpdateError) throw agentUpdateError;

            // 2. Also keep it in entities for backward compatibility
            if (entityConfig) {
                await supabase.from('entities')
                    .update({ telegram_token: linkToken })
                    .eq('id', entityConfig.id);
            }

            // 3. Register the Webhook with Telegram
            const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
            const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook?agent_id=${linkingAgent.id}`;

            console.log("Employees: Setting up Webhook ->", webhookUrl);
            
            const telegramRes = await fetch(`https://api.telegram.org/bot${linkToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
            const telegramData = await telegramRes.json();

            if (!telegramRes.ok || !telegramData.ok) {
                const errorDetail = telegramData.description || 'Unknown error';
                console.error('Employees: Telegram setWebhook failed:', errorDetail);
                setStatusMsg({ 
                    type: 'error', 
                    text: isAr 
                        ? `⚠️ تم حفظ البيانات ولكن فشل ربط التيليجرام: ${errorDetail}` 
                        : `⚠️ Data saved, but Telegram linking failed: ${errorDetail}` 
                });
                return;
            }

            setStatusMsg({ 
                type: 'success', 
                text: isAr ? '✅ تم حفظ وربط وتفعيل الموظف بنجاح!' : '✅ Agent saved, linked, and activated successfully!' 
            });
            
            setTimeout(() => {
                setShowLinkModal(false);
                setLinkToken('');
                setLinkingAgent(null);
                setStatusMsg({ type: '', text: '' });
                loadSectorAndAgents();
            }, 2500);

        } catch (error) {
            console.error('Employees: Error saving link:', error);
            const errorMsg = error.message || String(error);
            const userText = isAr ? `❌ فشل الحفظ: ${errorMsg}` : `❌ Save failed: ${errorMsg}`;
            
            setStatusMsg({ 
                type: 'error', 
                text: userText
            });
            
            // Fallback to alert if banner fails to show
            setTimeout(() => {
                if (!document.querySelector('.animate-fade-in')) {
                    alert(userText);
                }
            }, 500);
        } finally {
            setSavingLink(false);
        }
    };

    const handleDeleteAgent = async (agent) => {
        const confirmMsg = isAr 
            ? `هل أنت متأكد من رغبتك في حذف الموظف "${agent.name}"؟` 
            : `Are you sure you want to delete "${agent.name}"?`;
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const { error } = await supabase.from('agents').delete().eq('id', agent.id);
            if (error) throw error;
            loadSectorAndAgents();
        } catch (err) {
            console.error("Error deleting agent:", err);
            alert(isAr ? "فشل حذف الموظف." : "Failed to delete agent.");
        }
    };

    const sector = SECTOR_LABELS[userSector] || SECTOR_LABELS.general;
    
    // Safety check for specialty labels to avoid "Translation missing" or UUIDs
    const getRoleLabel = (specialty) => {
        if (!specialty) return isAr ? 'موظف' : 'Agent';
        
        let key = specialty.toLowerCase().replace('roles.', '');
        if (ROLE_LABELS[key]) return t(`roles.${key}`);
        
        if (key.includes('-') || key.length > 20) {
            return isAr ? 'موظف مخصص' : 'Custom Agent';
        }
        
        return specialty;
    };

    const uniqueRoles = [...new Set(agents.map(a => a.specialty || 'booking'))];
    const filtered = agents.filter(a => !filterRole || (a.specialty || 'booking') === filterRole);

    return (
        <div style={{ color: 'var(--color-text-main)', minHeight: '100%', padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <Bot size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--color-text-main)' }}>{t('employeesTitle')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '6px 0 0' }}>
                            {t('employeesSector')} <span style={{ color: sector.color, fontWeight: 700 }}>{sector.emoji} {t(`sectors.${userSector}`)}</span>
                        </p>
                    </div>
                </div>

                {/* Global Status Banner - TOP of component (Sticky) */}
                {statusMsg.text && (
                    <div className="status-banner" style={{
                        position: 'fixed',
                        top: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        width: '90%',
                        maxWidth: '550px',
                        background: statusMsg.type === 'success' ? '#059669' : '#DC2626',
                        color: 'var(--color-text-main)',
                        padding: '1.25rem 2rem',
                        borderRadius: '24px',
                        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 1), 0 0 30px rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '15px',
                        border: '2px solid var(--color-border-subtle)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
                            <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{statusMsg.type === 'success' ? 'نجاح ✅' : 'خطأ ⚠️'}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>{statusMsg.text}</div>
                            </div>
                        </div>
                        <button onClick={() => setStatusMsg({ type: '', text: '' })} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} />
                        </button>
                    </div>
                )}
                <button
                    onClick={() => navigate('/hire-agent')}
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'var(--color-text-main)', border: 'none', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Plus size={20} /> {t('hireEmployeeBtn')}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {[
                    { label: t('totalEmployees'), value: agents.length, color: '#8B5CF6' },
                    { label: t('activeNow'), value: agents.filter(a => a.status === 'active').length, color: '#10B981' },
                    { label: t('differentRoles'), value: [...new Set(agents.map(a => a.specialty || 'booking'))].length, color: '#F59E0B' },
                ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--color-bg-surface)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 500 }}>{s.label}</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters - Only show if there are agents and multiple roles */}
            {agents.length > 0 && uniqueRoles.length > 1 && (
                <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem' }}>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                        style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)', padding: '12px 20px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', minWidth: '200px', boxShadow: 'var(--shadow-sm)' }}>
                        <option value="">{t('allRolesFilter')}</option>
                        {uniqueRoles.map(roleKey => (
                            <option key={roleKey} value={roleKey}>{getRoleLabel(roleKey)}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Agents Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--color-accent-soft)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    {t('loadingFallback')}
                </div>
            ) : agents.length === 0 ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', padding: '3rem', background: 'var(--color-bg-glass)', borderRadius: '24px', border: '1px dashed var(--color-border-subtle)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--color-accent-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Bot size={40} color="var(--color-accent)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--color-text-main)' }}>{isAr ? 'ابتدئ فريقك الرقمي الآن' : 'Start Your Digital Team'}</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                            {isAr 
                                ? 'لم تقم بتوظيف أي موظف بعد. اختر من القوالب الجاهزة أدناه والمدربة خصيصاً لقطاعك لبدء أتمتة أعمالك.' 
                                : 'You haven’t hired any agents yet. Choose from our pre-trained templates below to start automating your business.'}
                        </p>
                    </div>

                    <div style={{ textAlign: 'start', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Box size={22} color="#8B5CF6" />
                            {isAr ? 'قوالب مقترحة لقطاعك' : 'Suggested Templates for Your Sector'}
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {templates.map(tmpl => (
                            <div key={tmpl.id} className="card shadow-premium" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        {tmpl.avatar || '🤖'}
                                    </div>
                                    <div style={{ textAlign: 'start' }}>
                                        <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                                            {isAr ? (tmpl.name_ar || tmpl.name) : tmpl.name}
                                        </h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                                            {t(`roles.${tmpl.specialty || 'booking'}`)}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, textAlign: 'start', flex: 1 }}>
                                    {isAr ? (tmpl.description_ar || tmpl.description) : tmpl.description}
                                </p>
                                <button 
                                    onClick={() => navigate('/interview', { state: { template: tmpl } })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'var(--color-accent-soft)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {isAr ? 'مقابلة وتوظيف' : 'Interview & Hire'}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {filtered.map(agent => {
                        const role = ROLE_LABELS[agent.specialty || 'booking'] || ROLE_LABELS.booking;
                        const RoleIcon = role.icon;
                        const isActive = agent.status === 'active';
                        const isTelegram = (agent.platform || '').includes('telegram');
                        const hasToken = agent.telegram_token || entityConfig?.telegram_token;
                        const needsLink = isTelegram && !hasToken;

                        return (
                            <div key={agent.id} style={{ background: 'var(--color-bg-surface)', borderRadius: '20px', border: `1px solid ${isActive ? 'var(--color-accent-border)' : 'var(--color-border-subtle)'}`, overflow: 'hidden', boxShadow: 'var(--shadow-premium)', transition: 'transform 0.3s ease' }}>
                                {/* Card Header */}
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${role.color}15`, border: `1px solid ${role.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                                            {agent.avatar || '👩'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: '4px' }}>{agent.name}</div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <span style={{ fontSize: '0.7rem', background: `${role.color}15`, color: role.color, padding: '2px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <RoleIcon size={10} />{getRoleLabel(agent.specialty)}
                                                </span>
                                                {isTelegram && hasToken && (
                                                    <span style={{ fontSize: '0.7rem', background: '#0088cc20', color: '#0088cc', padding: '2px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                        <MessageCircle size={10} /> {isAr ? 'تيليجرام' : 'Telegram'}
                                                    </span>
                                                )}
                                                {(agent.whatsapp_token || agent.whatsapp_api_key) && (
                                                    <span style={{ fontSize: '0.7rem', background: '#25D36620', color: '#25D366', padding: '2px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                        <MessageCircle size={10} /> {isAr ? 'واتساب' : 'WhatsApp'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(31,41,55,0.6)', padding: '4px 10px', borderRadius: '99px', border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'transparent'}` }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10B981' : '#4B5563' }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? '#10B981' : '#6B7280' }}>
                                            {isActive ? t('activeStatusBg').toUpperCase() : t('stoppedStatusBg').toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Link Warning */}
                                {needsLink && (
                                    <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <AlertCircle size={16} color="#F59E0B" />
                                        <div style={{ fontSize: '0.75rem', color: '#FBBF24', flex: 1 }}>{t('awaitingFirstTask') || 'بانتظار الربط لتفعيل العمل'}</div>
                                        <button
                                            onClick={() => { setLinkingAgent(agent); setShowLinkModal(true); }}
                                            style={{ background: '#F59E0B', color: '#000', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            {t('linkTelegramAction') || 'ربط الآن'}
                                        </button>
                                    </div>
                                )}

                                <div style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, minHeight: '80px' }}>
                                    {agent.description || (isAr ? `موظف ذكي مخصص لدعم قطاع ${t(`sectors.${userSector}`)}` : `AI Agent specialized in ${t(`sectors.${userSector}`)}`)}
                                </div>

                                {/* Footer Actions */}
                                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.1)' }}>
                                    <button onClick={() => navigate(`/entity-setup?agent=${agent.id}`)}
                                        style={{ flex: 1, background: 'var(--color-bg-input)', color: 'var(--color-text-main)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-glass)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-input)'}
                                    >
                                        <Settings size={16} /> {t('settingsBtn')}
                                    </button>
                                    <button onClick={() => navigate('/interview', { state: { template: agent, fromTemplates: true, isOwnerSession: true } })}
                                        style={{ flex: 1, background: 'var(--color-accent-soft)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)', borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent-soft)'}
                                    >
                                        <MessageCircle size={16} /> {t('testChatBtn')}
                                    </button>
                                    <button onClick={() => toggleAgent(agent)}
                                        style={{
                                            flex: 1,
                                            background: isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                                            color: isActive ? '#EF4444' : '#10B981',
                                            border: `1px solid ${isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}`,
                                            borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = isActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'}
                                    >
                                        <Power size={16} /> {isActive ? t('stopBtn') : t('activateBtn')}
                                    </button>
                                    <button onClick={() => handleDeleteAgent(agent)}
                                        style={{
                                            width: '44px',
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            color: '#EF4444',
                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        title={isAr ? "حذف" : "Delete"}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Link Telegram Modal */}
            {showLinkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
                    <div style={{ background: 'var(--color-bg-base)', width: '100%', maxWidth: '440px', borderRadius: '24px', border: '1px solid var(--color-border-subtle)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow-premium)' }}>
                        <button onClick={() => setShowLinkModal(false)} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'var(--color-accent-soft)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', margin: '0 auto 1rem' }}>
                                <MessageCircle size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('telegramModalTitle') || 'ربط بوت تيليجرام'}</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {t('telegramModalDesc').replace('{name}', linkingAgent?.name || '') || `أدخل Bot Token الخاص بهذا الموظف لربطه وتفعيله للحديث نيابة عن ${linkingAgent?.name}.`}
                            </p>
                        </div>

                        {/* Status Banner Inside Modal */}
                        {statusMsg.text && (
                            <div className="animate-fade-in" style={{
                                marginBottom: '1.5rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                color: statusMsg.type === 'success' ? '#10B981' : '#EF4444',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <div style={{ flex: 1 }}>{statusMsg.text}</div>
                                <button onClick={() => setStatusMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6 }}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>{t('telegramBotTokenLabel') || 'Telegram Bot Token'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={linkToken}
                                    onChange={e => setLinkToken(e.target.value)}
                                    placeholder={t('telegramPlaceholder') || '7434105220:AAFvW...'}
                                    style={{ width: '100%', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', padding: '12px 16px', color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                                />
                                {linkToken && (
                                    <button 
                                        onClick={async () => {
                                            if (savingLink) return;
                                            setSavingLink(true);
                                            try {
                                                const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '') + '/functions/v1/telegram-webhook?agent_id=' + linkingAgent.id;
                                                const res = await fetch(`https://api.telegram.org/bot${linkToken}/setWebhook?url=${encodeURIComponent(url)}`);
                                                const data = await res.json();
                                                if (data.ok) setStatusMsg({ type: 'success', text: isAr ? '✅ اختبار ناجح: البوت مربوط الآن!' : '✅ Test Success: Bot is linked!' });
                                                else setStatusMsg({ type: 'error', text: isAr ? `❌ فشل الاختبار: ${data.description}` : `❌ Test Failed: ${data.description}` });
                                            } catch (e) {
                                                setStatusMsg({ type: 'error', text: String(e.message) });
                                            } finally { setSavingLink(false); }
                                        }}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {isAr ? 'اختبار' : 'Test'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                style={{ flex: 1, background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', padding: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {t('cancelBtn')}
                            </button>
                            <button
                                onClick={handleSaveLink}
                                disabled={!linkToken || savingLink}
                                style={{ flex: 2, background: 'linear-gradient(135deg, #0088cc, #006699)', color: 'var(--color-text-main)', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 700, cursor: (linkToken && !savingLink) ? 'pointer' : 'not-allowed', opacity: (linkToken && !savingLink) ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {savingLink ? '...' : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        {t('saveAndActivateTelegram') || 'حفظ وتفعيل الموظف'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Animations */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .loader { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default Employees;
