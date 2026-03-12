import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getTasks, getTaskStats, subscribeToTasks, unsubscribeFromTasks, getCurrentUser, getProfile, getWalletBalance } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import LowCreditModal from './LowCreditModal';
import * as XLSX from 'xlsx';
import { Bot, Zap, BookOpen, Activity, Wallet, Target, ChevronLeft, ChevronRight, MessageSquare, TrendingUp, Calendar, Users } from 'lucide-react';

const Dashboard = () => {
    const { t, language } = useLanguage();

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
            // Get User and Profile
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success) {
                    const profileData = profileResult.data || { total_credits: 0, credits_used: 0, subscription_tier: '' };

                    const balanceResult = await getWalletBalance(user.id);
                    if (balanceResult.success) {
                        profileData.wallet_balance = balanceResult.balance;
                    }

                    setProfile(profileData);

                    // Show modal if credits are low (< 10) and not unlimited
                    const remaining = (profileData.total_credits || 0) - (profileData.credits_used || 0);
                    if (remaining < 10 && remaining > 0 && profileData.subscription_tier !== 'enterprise') {
                        // Check if we already showed it this session
                        if (!sessionStorage.getItem('lowCreditAlertShown')) {
                            setShowLowCreditModal(true);
                        }
                    }
                }
            }

            // Load tasks
            const tasksResult = await getTasks(agentId, 50);
            if (tasksResult.success) {
                setTasks(tasksResult.data);
            }

            // Load stats
            if (agentId) {
                const statsResult = await getTaskStats(agentId);
                if (statsResult.success) {
                    setStats(statsResult.data);
                }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                                {profile?.business_name || (profile?.business_type ? t(`sectors.${profile.business_type}`) : t('nav.dashboard'))}
                            </h1>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c59e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c59e', boxShadow: '0 0 8px #22c59e' }}></div>
                                {agentStatus === 'active' ? t('agentStatusActive') : t('agentStatusPaused')}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>
                            {t('dashboardSlogan')}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={exportToExcel} style={{ minWidth: '150px' }}>
                        {t('exportReports')}
                    </button>
                </div>

                {/* Dashboard Smart Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

                    {/* Real Stat: Balance */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.05), transparent)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <div style={{ padding: '12px', background: 'rgba(34,197,94,0.15)', borderRadius: '12px', color: '#22c59e', flexShrink: 0 }}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>{language === 'ar' ? 'رصيد الذكاء الاصطناعي' : 'AI Credit Balance'}</div>
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

                    {/* Instruction Guide */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <div style={{ padding: '12px', background: 'rgba(59,130,246,0.15)', borderRadius: '12px', color: '#3B82F6', flexShrink: 0 }}>
                            <Target size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>{language === 'ar' ? 'نصيحة للإعداد المثالي' : 'Best Practice Setup'}</div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: '4px 0', lineHeight: 1.3 }}>{language === 'ar' ? 'زيادة وعي الموظف' : 'Enhance Agent Knowledge'}</h4>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                                {language === 'ar' ? 'تأكد من إدراج كافة خدماتك وأسعارك في "إعداد المنشأة" ليرد على عملائك بذكاء.' : 'Ensure all your services and prices are added in Entity Setup for intelligent AI replies.'}
                            </p>
                            <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.85rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>
                                {language === 'ar' ? 'إعداد المنشأة والخدمات' : 'Go to Setup'}
                                {language === 'ar' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                            </Link>
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
