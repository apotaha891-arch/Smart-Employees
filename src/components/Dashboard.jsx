import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getTasks, getTaskStats, subscribeToTasks, unsubscribeFromTasks, getCurrentUser, getProfile } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import LowCreditModal from './LowCreditModal';
import SalesLeadsManager from './SalesLeadsManager';
import NouraReports from './NouraReports';
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
        <div className="container py-xl">
            {showLowCreditModal && profile && (
                <LowCreditModal
                    remaining={profile.total_credits - profile.credits_used}
                    onClose={() => {
                        setShowLowCreditModal(false);
                        sessionStorage.setItem('lowCreditAlertShown', 'true');
                    }}
                />
            )}

            {/* Usage Monitoring Panel - Humanized & Premium */}
            {profile && (
                <div className="card p-xl mb-xl animate-fade-in" style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-premium)'
                }}>
                    <div className="flex justify-between align-center mb-md">
                        <div className="flex align-center gap-md">
                            <div style={{
                                background: 'var(--accent-soft)',
                                padding: '0.75rem',
                                borderRadius: '12px',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>سعة العمل والالتزام المهني</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>نظام المتابعة الذكي لضمان جودة الأداء</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                                {profile.credits_used?.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> / {profile.total_credits?.toLocaleString()} نقطة التزام</span>
                        </div>
                    </div>

                    <div style={{
                        width: '100%',
                        background: '#F3F4F6',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{
                            width: `${Math.min(100, (profile.credits_used / profile.total_credits) * 100)}%`,
                            height: '100%',
                            background: (profile.credits_used / profile.total_credits) >= 0.9 ? '#F87171' : 'var(--primary)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 1.5s cubic-bezier(0.1, 0, 0, 1)'
                        }}></div>
                    </div>

                    <div className="flex justify-between align-center mb-lg">
                        <p style={{ fontSize: '0.9rem', color: (profile.credits_used / profile.total_credits) >= 0.9 ? '#B91C1C' : 'var(--text-secondary)', margin: 0 }}>
                            {(profile.credits_used / profile.total_credits) >= 1 ? (
                                <strong>⚠️ تم استنفاد سعة العمل المتاحة لهذا الشهر. يرجى تجديد الاتفاقية لمواصلة النمو.</strong>
                            ) : (profile.credits_used / profile.total_credits) >= 0.8 ? (
                                <strong>💡 يقترب الزميل من حدود السعة القصوى. نوصي بترقية الباقة لضمان استمرارية الخدمة.</strong>
                            ) : (
                                `تم استثمار ${Math.round((profile.credits_used / profile.total_credits) * 100)}% من طاقة العمل المخصصة`
                            )}
                        </p>
                        <Link to="/pricing" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', borderBottom: '1px solid var(--accent)' }}>
                            توسيع سعة العمل ←
                        </Link>
                    </div>

                    {/* ROI Section (Humanized) */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', gap: '3rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>القيمة المضافة (وقت):</p>
                            <h4 style={{ fontSize: '1.1rem' }}>⏳ {Math.round((profile.credits_used * 5) / 60)} ساعة مستثمرة</h4>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>معيار الدقة المهنية:</p>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--success)' }}>✨ 99.8%</h4>
                        </div>
                    </div>
                </div>
            )}

            {/* Executive Suite - CEO Command Center */}
            <div className="card mb-2xl animate-fade-in" style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: 'white',
                border: 'none',
                padding: '2.5rem',
                borderRadius: '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
            }}>
                {/* Visual "Authority" Accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'var(--accent)' }}></div>
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'var(--accent)', opacity: 0.05, borderRadius: '50%', filter: 'blur(80px)' }}></div>

                <div className="flex align-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="flex align-center gap-xl">
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(to bottom, #D4AF37, #AA8A2E)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>🤵‍♂️</div>
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, border: '2px solid #0F172A' }}>CHIEF</div>
                        </div>
                        <div>
                            <div className="flex align-center gap-sm mb-xs">
                                <h3 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>مكتب المدير التنفيذي (CEO Suite)</h3>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, border: '1px solid rgba(212,175,55,0.3)' }}>وضع الصلاحيات الكاملة</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: 0, maxWidth: '700px', lineHeight: '1.7' }}>
                                مرحباً أيها المالك. بصفتي <b>المدير التنفيذي الرقمي</b> لمنشأتك، أتولى هنا التحكم الكامل في العمليات، أتمتة جلب العملاء، وإصدار التقارير الاستراتيجية لـ <b>{profile?.business_name}</b>. "نورا" متوفرة في الأسفل لخدمة عملائك واستفساراتهم العامة.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Command Tools */}
            <div className="section-header flex align-center gap-sm mb-xl">
                <span style={{ fontSize: '1.5rem' }}>🛠️</span>
                <h3 style={{ margin: 0, fontWeight: 900 }}>أدوات التحكم والنمو الاستراتيجي</h3>
            </div>

            <div className="grid grid-2 gap-xl mb-3xl">
                <SalesLeadsManager />
                <NouraReports />
            </div>

            <div className="page-header">
                <h2>{t('dashboardTitle')}</h2>
                <p>{t('dashboardSubtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-value">{stats.tasksToday}</div>
                    <div className="stat-label">{t('tasksCompleted')} (اليوم)</div>
                </div>

                <div className="stat-card success">
                    <div className="stat-value">
                        <span className="badge badge-success">
                            <span className="status-dot"></span>
                            {t(agentStatus)}
                        </span>
                    </div>
                    <div className="stat-label">{t('agentStatus')}</div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {formatDate(lastUpdate)}
                    </div>
                    <div className="stat-label">{t('lastUpdate')}</div>
                </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-md mb-lg">
                <button className="btn btn-primary" onClick={exportToExcel}>
                    📊 {t('exportExcel')}
                </button>
                <button className="btn btn-secondary" onClick={exportToCSV}>
                    📄 {t('exportCSV')}
                </button>
                <button className="btn btn-secondary" onClick={loadDashboardData}>
                    🔄 تحديث
                </button>
            </div>

            {/* Tasks Table & Empty State */}
            <div className="table-container">
                {tasks.length === 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem', marginTop: '2rem' }}>
                        <div className="card p-2xl" style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎯</div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>بانتظار المهمة الأولى</h3>
                                <p className="text-secondary" style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                                    سيظهر هنا سجل العمليات التي يقوم بها موظفك الرقمي فور بدئه في استقبال طلبات عملائك.
                                </p>
                                <div style={{ padding: '1.25rem', background: 'var(--bg-main)', borderRadius: '16px', textAlign: 'right', border: '1px solid var(--border-light)' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary)' }}>💡 كيف يبدأ العمل؟</p>
                                    <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingRight: '1rem', lineHeight: '1.8' }}>
                                        <li style={{ marginBottom: '0.5rem' }}>قم بإكمال إعدادات المنشأة بدقة لتدريب الموظف.</li>
                                        <li style={{ marginBottom: '0.5rem' }}>أكمل المقابلة الوظيفية واعتمد التوظيف الرسمي.</li>
                                        <li>اربط رقم الواتساب لتبدأ الكفاءة بالعمل فوراً.</li>
                                    </ul>
                                </div>
                            </div>
                            {/* Decorative soft element */}
                            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'var(--accent-soft)', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.3 }}></div>
                        </div>

                        <div className="card" style={{ background: 'var(--primary)', padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ height: '200px', width: '100%', position: 'relative', background: '#1a1a1a' }}>
                                <img
                                    src="https://images.pexels.com/photos/5439444/pexels-photo-5439444.jpeg?auto=compress&cs=tinysrgb&w=800"
                                    alt="Satisfied Client"
                                    onLoad={() => setDashImgLoaded(true)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: dashImgLoaded ? 0.7 : 0,
                                        transition: 'opacity 0.5s ease'
                                    }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, var(--primary))' }}></div>
                                {!dashImgLoaded && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="loading-spinner"></div>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '2rem', textAlign: 'center', marginTop: '-1rem', position: 'relative', zIndex: 2 }}>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>ابدأ قصة نجاحك</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    انضم لأكثر من 500 رائد أعمال استعادوا وقتهم الثمين من خلال توظيف كفاءاتنا الرقمية.
                                </p>
                                <Link to="/templates" className="btn" style={{ background: 'var(--accent)', color: 'var(--primary)', width: '100%', fontWeight: 800, padding: '1rem' }}>
                                    تصفح المرشحين المتاحين ←
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('taskType')}</th>
                                <th>{t('taskData')}</th>
                                <th>{t('completedAt')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>
                                        <span className="badge badge-primary">
                                            {task.task_type}
                                        </span>
                                    </td>
                                    <td>
                                        <details>
                                            <summary style={{ cursor: 'pointer', color: 'var(--accent-blue)' }}>
                                                عرض البيانات
                                            </summary>
                                            <pre style={{
                                                marginTop: 'var(--spacing-sm)',
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--bg-primary)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.875rem',
                                                overflow: 'auto',
                                                maxHeight: '300px'
                                            }}>
                                                {JSON.stringify(task.task_data, null, 2)}
                                            </pre>
                                        </details>
                                    </td>
                                    <td>{formatDate(task.completed_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary Stats */}
            {tasks.length > 0 && (
                <div className="card card-gradient mt-xl">
                    <h3 className="mb-md">📈 ملخص الإحصائيات</h3>
                    <div className="stats-grid">
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)' }}>
                                {stats.totalTasks}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                إجمالي المهام
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-green)' }}>
                                {stats.tasksThisWeek}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                مهام هذا الأسبوع
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning-amber)' }}>
                                {Object.keys(stats.tasksByType).length}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                أنواع المهام
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
