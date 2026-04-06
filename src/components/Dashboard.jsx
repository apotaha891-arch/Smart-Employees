import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getTasks, getTaskStats, subscribeToTasks, unsubscribeFromTasks, getProfile, getWalletBalance, getServices, getIntegrations, getUserEntities } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import LowCreditModal from './LowCreditModal';
import * as XLSX from 'xlsx';
import { Bot, Zap, BookOpen, Activity, Wallet, Target, ChevronLeft, ChevronRight, MessageSquare, TrendingUp, Calendar, Users } from 'lucide-react';

const Dashboard = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { user: contextUser, isImpersonating, isAgency } = useAuth(); // Use context user (supports impersonation)

    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        totalTasks: 0,
        tasksToday: 0,
        tasksThisWeek: 0,
        tasksByType: {},
    });
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [agentStatus, setAgentStatus] = useState('active');
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [showLowCreditModal, setShowLowCreditModal] = useState(false);

    const agentId = localStorage.getItem('currentAgentId');

    useEffect(() => {
        loadDashboardData();

        // Subscribe to real-time updates
        const channel = subscribeToTasks(agentId, (payload) => {
            console.log('Real-time update:', payload);
            loadDashboardData();
            setLastUpdate(new Date());
        });

        return () => {
            unsubscribeFromTasks(channel);
        };
    }, [agentId]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Use AuthContext user — supports impersonation correctly
            const user = contextUser;
            if (!user?.id) { navigate('/login'); return; }

            const profileResult = await getProfile(user.id);
            if (profileResult.success) {
                const profileData = profileResult.data || { total_credits: 0, credits_used: 0, subscription_tier: '' };

                const balanceResult = await getWalletBalance(user.id);
                if (balanceResult.success) profileData.wallet_balance = balanceResult.balance;

                setProfile(profileData);

                const entitiesResult = await getUserEntities(user.id);

                // Redirect to setup only if not an agency and not impersonating
                if (entitiesResult.success && (!entitiesResult.data || entitiesResult.data.length === 0)) {
                    if (!isAgency && !isImpersonating) {
                        navigate('/entity-setup');
                        return;
                    }
                }

                const entityId = entitiesResult.success && entitiesResult.data?.[0]?.id;
                if (entityId) {
                    const servicesResult = await getServices(entityId);
                    if (servicesResult.success) setServices(servicesResult.data);
                }

                const integrationsResult = await getIntegrations(user.id);
                if (integrationsResult.success) setIntegrations(integrationsResult.data);

                const remaining = (profileData.total_credits || 0) - (profileData.credits_used || 0);
                if (remaining < 10 && remaining > 0 && profileData.subscription_tier !== 'enterprise') {
                    if (!sessionStorage.getItem('lowCreditAlertShown')) setShowLowCreditModal(true);
                }
            }

            const tasksResult = await getTasks(agentId, 50);
            if (tasksResult.success) setTasks(tasksResult.data);

            if (agentId) {
                const statsResult = await getTaskStats(agentId);
                if (statsResult.success) setStats(statsResult.data);
            }
        } catch (error) {
            console.error('Load dashboard data error:', error);
        } finally {
            setIsLoading(false);
        }

    };

    const exportToExcel = () => {
        const exportData = tasks.map(task => ({
            [t('exportHeaderType')]: task.task_type,
            [t('exportHeaderData')]: JSON.stringify(task.task_data, null, 2),
            [t('exportHeaderDate')]: new Date(task.completed_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

        XLSX.writeFile(workbook, `24shift-tasks-${Date.now()}.xlsx`);
    };

    const exportToCSV = () => {
        const exportData = tasks.map(task => ({
            [t('exportHeaderType')]: task.task_type,
            [t('exportHeaderData')]: JSON.stringify(task.task_data, null, 2),
            [t('exportHeaderDate')]: new Date(task.completed_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `24shift-tasks-${Date.now()}.csv`;
        link.click();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="container flex-center" style={{ minHeight: '400px' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="container py-xl animate-fade-in">
            {showLowCreditModal && profile && (
                <LowCreditModal
                    remaining={profile.total_credits - profile.credits_used}
                    onClose={() => {
                        setShowLowCreditModal(false);
                        sessionStorage.setItem('lowCreditAlertShown', 'true');
                    }}
                />
            )}

            {/* Header Area */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1 1 500px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                                {profile?.business_name || (profile?.business_type ? t(`sectors.${profile.business_type}`) : t('nav.dashboard'))}
                            </h1>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c59e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c59e', boxShadow: '0 0 8px #22c59e' }}></div>
                                {agentStatus === 'active' ? t('agentStatusActive') : t('agentStatusPaused')}
                            </div>
                        </div>

                        {/* Customer Info Bar */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <Users size={16} color="#8B5CF6" />
                                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{profile?.full_name || (language === 'ar' ? 'ضيف' : 'Guest')}</span>
                                {profile?.position && <span style={{ color: '#9CA3AF', fontSize: '0.8rem', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{profile.position}</span>}
                            </div>
                            {profile?.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#9CA3AF' }}>
                                    <BookOpen size={16} />
                                    <span>{profile.email}</span>
                                </div>
                            )}
                            {profile?.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#9CA3AF' }}>
                                    <Bot size={16} />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                            {t('dashboardSlogan')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" onClick={exportToExcel} style={{ minWidth: '150px' }}>
                            {t('exportReports')}
                        </button>
                    </div>
                </div>

                {/* Dashboard Smart Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

                    {/* Real Stat: Balance */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.05), transparent)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <div style={{ padding: '12px', background: 'rgba(34,197,94,0.15)', borderRadius: '12px', color: '#22c59e', flexShrink: 0 }}>
                            <Wallet size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{language === 'ar' ? 'رصيد الذكاء الاصطناعي' : 'AI Credit Balance'}</div>
                                <Link to="/pricing" style={{ textDecoration: 'none' }}>
                                    <button style={{ background: 'rgba(34,197,94,0.1)', color: '#22c59e', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                        {language === 'ar' ? 'شحن رصيد' : 'Refill'}
                                    </button>
                                </Link>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{profile?.wallet_balance?.toLocaleString() || 0}</div>
                            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                                {language === 'ar' ? 'يُستخدم للمحادثات والردود التلقائية ورسائل الواتساب الواردة.' : 'Used for chats, automated replies and WhatsApp messages.'}
                            </p>
                        </div>
                    </div>

                    {/* Real Stat: Tasks */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), transparent)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <div style={{ padding: '12px', background: 'rgba(139,92,246,0.15)', borderRadius: '12px', color: '#8B5CF6', flexShrink: 0 }}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>{language === 'ar' ? 'مهام أُنجزت اليوم' : 'Tasks Completed Today'}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{stats.tasksToday || 0}</div>
                            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                                {language === 'ar' ? 'محادثات وعمليات تعامل معها الموظف الرقمي بالكامل دون تدخل بشري.' : 'Operations handled entirely by your AI agent without expected intervention.'}
                            </p>
                        </div>
                    </div>

                    {/* Mission Checklist */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <div style={{ padding: '12px', background: 'rgba(245,158,11,0.15)', borderRadius: '12px', color: '#F59E0B', flexShrink: 0 }}>
                            <ChevronRight size={24} />
                        </div>
                        <div style={{ width: '100%' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>{language === 'ar' ? 'مهام تفعيل الموظف' : 'Agent Mission Checklist'}</div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: '4px 0', lineHeight: 1.3 }}>{language === 'ar' ? 'متطلبات النجاح' : 'Success Requirements'}</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                {[
                                    { label: language === 'ar' ? 'إضافة قائمة الخدمات والأسعار' : 'Add Services & Pricing', checked: services?.length > 0, path: '/entity-setup?tab=services' },
                                    { label: language === 'ar' ? 'تحديد ساعات العمل الرسمية' : 'Set Working Hours', checked: profile?.business_name ? true : false, path: '/entity-setup?tab=identity' },
                                    { label: language === 'ar' ? 'ربط التقويم أو الواتساب' : 'Link Calendar or WhatsApp', checked: integrations?.some(i => i.status === 'connected'), path: '/entity-setup?tab=integrations' },
                                    { label: language === 'ar' ? 'تدريب الموظف على الأسئلة الشائعة' : 'Train Agent on FAQs', checked: profile?.faq_data?.length > 0, path: '/entity-setup?tab=identity' },
                                ].map((item, idx) => (
                                    <Link key={idx} to={item.path} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: item.checked ? '#10B981' : '#9CA3AF', transition: 'transform 0.2s' }} onMouseOver={e => !item.checked && (e.currentTarget.style.transform = 'translateX(5px)')} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${item.checked ? '#22c59e' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.checked ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                                            {item.checked && <Zap size={10} />}
                                        </div>
                                        <span style={{ fontWeight: item.checked ? 600 : 400 }}>{item.label}</span>
                                        {!item.checked && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Promotional / Comparison Section */}
                <div style={{ marginTop: '2.5rem' }}>
                    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #1E1B4B 0%, #0B0F19 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', zIndex: 0 }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
                                    {language === 'ar' ? '🚀 ضاعف إنتاجيتك مع الباقة المتقدمة' : '🚀 Maximize Productivity with Pro Plan'}
                                </h2>
                                <p style={{ color: '#A1A1AA', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                    {language === 'ar' ? 'انتقل إلى عالم الاحتراف واحصل على سعة محادثات أكبر، موظفين إثنين، ودعم فني متقدم بأفضل قيمة مقابل سعر.' : 'Go professional and get higher credit limits, two agents, and advanced support at the best value.'}
                                </p>
                                <Link to="/pricing" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', borderRadius: '12px' }}>
                                    {language === 'ar' ? 'ترقية حسابي الآن' : 'Upgrade My Account Now'}
                                </Link>
                            </div>
                            
                            <div style={{ flex: '1 1 400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: '#06B6D4', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>{language === 'ar' ? 'الأساسية' : 'Starter'}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>2,000 pts</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>1 {language === 'ar' ? 'موظف' : 'Agent'} | 2 {language === 'ar' ? 'أدوات' : 'Tools'}</div>
                                </div>
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                    <div style={{ color: '#A78BFA', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>{language === 'ar' ? 'المتقدمة' : 'Pro'}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>5,000 pts</div>
                                    <div style={{ fontSize: '0.8rem', color: '#A78BFA', marginTop: '4px', fontWeight: 600 }}>2 {language === 'ar' ? 'موظف' : 'Agents'} | 3 {language === 'ar' ? 'أدوات' : 'Tools'}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '4px', fontWeight: 800 }}>+ {language === 'ar' ? 'تدريب مخصص' : 'Custom Training'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CRM Operations Hub */}
                <div style={{ marginTop: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Zap size={20} color="#8B5CF6" />
                        {language === 'ar' ? 'مركز العمليات والنظام المتكامل' : 'CRM & Operations Hub'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        {[
                            { label: language === 'ar' ? 'إدارة الحجوزات' : 'Reservations', icon: Calendar, path: '/bookings', color: '#8B5CF6', desc: language === 'ar' ? 'تنظيم المواعيد والجلسات' : 'Manage schedules' },
                            { label: language === 'ar' ? 'المبيعات والعملاء' : 'Leads & Sales', icon: TrendingUp, path: '/sales', color: '#10B981', desc: language === 'ar' ? 'تتبع الصفقات والمبيعات' : 'Track deals' },
                            { label: language === 'ar' ? 'تذاكر الدعم' : 'Support Tickets', icon: MessageSquare, path: '/support', color: '#3B82F6', desc: language === 'ar' ? 'حل استفسارات العملاء' : 'Resolve inquiries' },
                            { label: language === 'ar' ? 'التوظيف (HR)' : 'Recruitment (HR)', icon: Users, path: '/hr', color: '#F59E0B', desc: language === 'ar' ? 'إدارة المتقدمين والمقابلات' : 'Manage hiring' },
                        ].map((hub, i) => (
                            <Link key={i} to={hub.path} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{ padding: '1.25rem', height: '100%', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${hub.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hub.color }}>
                                        <hub.icon size={22} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{hub.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>{hub.desc}</div>
                                    </div>
                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: hub.color, fontWeight: 700 }}>
                                        {language === 'ar' ? 'دخول المركز' : 'Access Center'}
                                        {language === 'ar' ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>





            {/* Customer Support Integration */}
            <div className="card" style={{ marginTop: '2rem', padding: '0', overflow: 'hidden', border: '1px solid rgba(37,211,102,0.15)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>

                    {/* Visual Section */}
                    <div style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(37,211,102,0.02) 100%)', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: language === 'en' ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: language === 'ar' ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}>
                            <MessageSquare size={32} color="#FFF" />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, fontSize: '1.5rem', color: '#FFF' }}>
                            {language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help'}
                        </h3>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '1rem', lineHeight: 1.6 }}>
                            {language === 'ar' ? 'فريق الدعم الفني في 24Shift متواجد للرد على استفساراتك ومساعدتك في تحسين موظفك الذكي.' : 'The 24Shift support team is available to answer your questions and help you optimize your digital agent.'}
                        </p>
                    </div>

                    {/* Action Section */}
                    <div style={{ flex: '1 1 400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#25D366', boxShadow: '0 0 10px #25D366', animation: 'pulse 2s infinite' }}></div>
                                <span style={{ color: '#25D366', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {language === 'ar' ? 'متصلون الآن' : 'Online Now'}
                                </span>
                            </div>

                            <div style={{ background: '#18181B', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#E4E4E7', fontWeight: 600, marginBottom: '0.25rem' }}>{language === 'ar' ? 'استفسارات فنية أو مبيعات؟' : 'Technical or Sales inquiries?'}</div>
                                <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>{language === 'ar' ? 'تحدث مع فريقنا مباشرة عبر الواتساب للحصول على استجابة سريعة.' : 'Chat with our team directly via WhatsApp for a quick response.'}</div>
                            </div>

                            <a
                                href="https://wa.me/966530916299"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    background: '#25D366',
                                    color: '#FFF',
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    textDecoration: 'none',
                                    marginTop: '0.5rem',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(37,211,102,0.2)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <MessageSquare size={20} />
                                {language === 'ar' ? 'تحدث إلى خدمة العملاء' : 'Chat with Customer Support'}
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
