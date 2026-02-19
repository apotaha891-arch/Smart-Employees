import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getTasks, getTaskStats, subscribeToTasks, unsubscribeFromTasks, getCurrentUser, getProfile } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import LowCreditModal from './LowCreditModal';
import SalesLeadsManager from './SalesLeadsManager';
import ExecutiveReports from './NouraReports';
import * as XLSX from 'xlsx';

const Dashboard = () => {
    const { t } = useLanguage();

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
    const [dashImgLoaded, setDashImgLoaded] = useState(false);

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
                    setProfile(profileResult.data);

                    // Show modal if credits are low (< 10) and not unlimited
                    const remaining = profileResult.data.total_credits - profileResult.data.credits_used;
                    if (remaining < 10 && remaining > 0 && profileResult.data.subscription_tier !== 'enterprise') {
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
            'نوع المهمة': task.task_type,
            'البيانات': JSON.stringify(task.task_data, null, 2),
            'تاريخ الإنجاز': new Date(task.completed_at).toLocaleString('ar-SA'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

        XLSX.writeFile(workbook, `elite-agents-tasks-${Date.now()}.xlsx`);
    };

    const exportToCSV = () => {
        const exportData = tasks.map(task => ({
            'نوع المهمة': task.task_type,
            'البيانات': JSON.stringify(task.task_data, null, 2),
            'تاريخ الإنجاز': new Date(task.completed_at).toLocaleString('ar-SA'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `elite-agents-tasks-${Date.now()}.csv`;
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
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>مركز القيادة العملياتية</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>مرحباً بك مجدداً. إليك تفاصيل أداء كوادرك الرقمية اليوم.</p>
                </div>
                <div className="flex gap-md" style={{ marginBottom: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'white' }} onClick={loadDashboardData}>
                        🔄 تحديث البيانات
                    </button>
                    <button className="btn btn-primary" onClick={exportToExcel}>
                        📊 تصدير التقارير
                    </button>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr', gridAutoRows: 'auto' }}>

                {/* Executive Command Bento Card */}
                <div className="card shadow-premium" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, #09090B 0%, #18181B 100%)', border: '1px solid var(--accent-border)' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ padding: '1.5rem', background: 'var(--accent-soft)', borderRadius: '24px', border: '1px solid var(--accent-border)' }}>
                            <span style={{ fontSize: '3rem' }}>🤵‍♂️</span>
                        </div>
                        <div>
                            <div className="flex align-center gap-sm mb-xs">
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>مكتب المدير التنفيذي (CEO Suite)</h2>
                                <span style={{ background: 'var(--accent)', color: 'black', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>ENTERPRISE CLASS</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', lineHeight: '1.6' }}>
                                التحكم الكامل في العمليات، أتمتة جلب العملاء، وإصدار التقارير الاستراتيجية لـ <b>{profile?.business_name}</b>.
                                <span style={{ color: 'white', display: 'block', marginTop: '0.5rem' }}>نظام "نورا" يعمل حالياً بكفاءة 100% في خدمة عملائك.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Usage Bento Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="label"><span>📊</span> طاقة العمل المخصصة</label>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="flex justify-between align-end mb-sm">
                            <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{Math.round((profile?.credits_used / profile?.total_credits) * 100)}%</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{profile?.credits_used?.toLocaleString()} / {profile?.total_credits?.toLocaleString()} نقطة التزام</span>
                        </div>
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, (profile?.credits_used / profile?.total_credits) * 100)}%`,
                                height: '100%',
                                background: 'var(--accent)',
                                boxShadow: '0 0 15px var(--accent)',
                                transition: 'width 2s cubic-bezier(0.1, 0, 0, 1)'
                            }}></div>
                        </div>
                    </div>
                    <div className="flex gap-xl">
                        <div>
                            <p className="text-muted">الوقت المستثمر</p>
                            <h4 style={{ color: 'white' }}>⏳ {Math.round((profile?.credits_used * 5) / 60)} ساعة</h4>
                        </div>
                        <div>
                            <p className="text-muted">دقة الذكاء</p>
                            <h4 style={{ color: 'var(--success)' }}>✨ 99.8%</h4>
                        </div>
                    </div>
                </div>

                {/* Stats Grid Bento */}
                <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>{stats.tasksToday}</div>
                        <div className="text-muted">مهام تم إنجازها اليوم</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.25rem', color: '#10B981' }}>{t(agentStatus)}</div>
                        <div className="text-muted">حالة الموظف الرقمي</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: 'span 2' }}>
                        <div className="text-muted" style={{ marginBottom: '0.5rem' }}>آخر تحديث للنظام</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{formatDate(lastUpdate)}</div>
                    </div>
                </div>

                {/* Integration Tools Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                    <div className="flex align-center gap-sm mb-lg">
                        <div style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>أدوات النمو الاستراتيجي</h3>
                    </div>
                    <div className="grid grid-2">
                        <SalesLeadsManager />
                        <ExecutiveReports />
                    </div>
                </div>

                {/* Activity Feed Bento Card */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>سجل العمليات الأخير</h3>
                    <div className="table-container" style={{ border: 'none', padding: 0 }}>
                        {tasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                                <h4 style={{ color: 'white' }}>بانتظار المهمة الأولى</h4>
                                <p className="text-muted">سيبدأ ذكاء الموظف بالظهور هنا فور تفعيل رقم الواتساب.</p>
                                <Link to="/setup" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>ضبط البروتوكول ←</Link>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>نوع العملية</th>
                                        <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>البيانات الذكية</th>
                                        <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>طابع الوقت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition)' }} className="hover-bg-glass">
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    {task.task_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <details>
                                                    <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>معاينة المخرجات</summary>
                                                    <pre style={{ marginTop: '1rem', padding: '1rem', background: 'black', borderRadius: '12px', fontSize: '0.8rem', color: '#10B981', border: '1px solid #10B98122' }}>
                                                        {JSON.stringify(task.task_data, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(task.completed_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
