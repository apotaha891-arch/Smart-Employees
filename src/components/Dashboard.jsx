import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getTasks, getTaskStats, subscribeToTasks, unsubscribeFromTasks, getCurrentUser, getProfile } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import LowCreditModal from './LowCreditModal';
import AgentManagement from './AgentManagement';
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
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>{t('dashboardTitle')}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('dashboardWelcome')}</p>
                    </div>
                    <button className="btn btn-primary" onClick={exportToExcel} style={{ minWidth: '150px' }}>
                        {t('exportReports')}
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-3" style={{ gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('tasksCompletedToday')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{stats.tasksToday}</div>
                    </div>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('aiAccuracy')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>99.8%</div>
                    </div>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>الرصيد المتبقي (الرموز)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>
                            {/* Assuming we'll fetch wallet_credits.balance and store it in profile soon */}
                            {profile?.wallet_balance || 50000}
                        </div>
                    </div>
                </div>
            </div>

            {/* AGENT MANAGEMENT SECTION */}
            <div style={{ marginTop: '2rem' }}>
                <div className="flex align-center gap-sm mb-lg">
                    <div style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>{t('myAgentsTab')}</h3>
                </div>
                <AgentManagement />
            </div>



            {/* Activity Feed */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="flex align-center gap-sm mb-lg">
                    <div style={{ width: '4px', height: '20px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>{t('recentOperationsLog')}</h3>
                </div>
                <div className="table-container" style={{ border: 'none', padding: 0 }}>
                    {tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                            <p className="text-muted">{t('awaitingFirstTask')}</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{t('operationType')}</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{t('timestamp')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.slice(0, 10).map((task) => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition)' }} className="hover-bg-glass">
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                {task.task_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(task.completed_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
