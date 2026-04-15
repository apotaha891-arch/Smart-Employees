import React, { useMemo } from 'react';
import { 
    LayoutDashboard, Users, Bot, Calendar, Sparkles, 
    Settings, Activity, MessageSquare, Bell, Star, 
    Zap, Globe, ChevronRight, Menu, X, LogOut, 
    Home, CreditCard, PenTool, Database,
    Mail, Target, ShieldCheck, FileText
} from 'lucide-react';

import { useAdminDashboard } from '../features/admin-dashboard/hooks/useAdminDashboard';
import { ICON_MAP } from '../features/admin-dashboard/constants';

// Tab Components
import { Card, Btn, StatCard, StatusBadge } from '../features/admin-dashboard/components/SharedComponents';
import OverviewTab from '../features/admin-dashboard/components/OverviewTab';
import ClientsTab from '../features/admin-dashboard/components/ClientsTab';
import AgentsTab from '../features/admin-dashboard/components/AgentsTab';
import BookingsTab from '../features/admin-dashboard/components/BookingsTab';
import AcademyTab from '../features/admin-dashboard/components/AcademyTab';
import ConfigurationTab from '../features/admin-dashboard/components/ConfigurationTab';
import InfrastructureTab from '../features/admin-dashboard/components/InfrastructureTab';
import ConciergeTab from '../features/admin-dashboard/components/ConciergeTab';
import LeadsTab from '../features/admin-dashboard/components/LeadsTab';
import InterviewAgentsTab from '../features/admin-dashboard/components/InterviewAgentsTab';
import AdvisorTab from '../features/admin-dashboard/components/AdvisorTab';
import MarketingTab from '../features/admin-dashboard/components/MarketingTab';
import NewsletterSubscribersTab from '../features/admin-dashboard/components/NewsletterSubscribersTab';
import WhiteLabelTab from '../features/admin-dashboard/components/WhiteLabelTab';
import AdminBlogManager from './AdminBlogManager';

const AdminDashboard = () => {
    const adminHook = useAdminDashboard();
    const {
        t, isEnglish, language, isRtl, theme,
        tab, setTab, sidebarOpen, setSidebarOpen,
        user, handleLogout, flashMessage, loading,
        // Stats
        stats, 
        // Data
        clients, agents, bookings, endCustomers, customRequests,
        notifications, logParams, logs, conciergeChats, selChat,
        templates, pricing, sectors, roles, agentAppsConfig,
        // Settings
        aiConfig, advisorConfig, platformTelegramToken, academyPriceId, integrations,
        // Actions
        load, refreshData, handleImpersonate, handleExport,
        deleteClient, deleteAgent, updateAgentStatus, updateBookingStatus,
        saveAiConfig, savePlatformInteg, fetchLogs, setSelChat,
        loadNewsletterSubscribers, loadWhiteLabelRequests, 
        handleApproveWhiteLabel, handleRejectWhiteLabel
    } = adminHook;

    const navItems = useMemo(() => [
        { id: 'overview', icon: LayoutDashboard, label: t('admin.overview'), color: '#3B82F6' },
        { id: 'clients', icon: Users, label: t('admin.clients'), color: '#10B981' },
        { id: 'agents', icon: Bot, label: t('admin.agents'), color: '#8B5CF6' },
        { id: 'bookings', icon: Calendar, label: t('admin.bookings'), color: '#F59E0B' },
        { id: 'concierge-chats', icon: MessageSquare, label: isEnglish ? 'Nora Chats' : 'محادثات نورة', color: '#0088cc' },
        { id: 'leads', icon: Database, label: isEnglish ? 'Leads & CRM' : 'قاعدة البيانات', color: '#EC4899' },
        { id: 'academy', icon: Star, label: isEnglish ? 'Academy' : 'الأكاديمية', color: '#F59E0B' },
        { id: 'marketing', icon: Target, label: isEnglish ? 'Marketing' : 'التسويق', color: '#10B981' },
        { id: 'white-label', icon: ShieldCheck, label: isEnglish ? 'White-Label' : 'العلامة البيضاء', color: '#A78BFA' },
        { id: 'blog', icon: FileText, label: isEnglish ? 'Blog' : 'المدونة', color: '#EC4899' },
        { id: 'newsletters', icon: Mail, label: isEnglish ? 'Newsletters' : 'النشرة البريدية', color: '#3B82F6' },
        { id: 'interview-agents', icon: PenTool, label: isEnglish ? 'Templates' : 'قوالب الموظفين', color: '#A78BFA' },
        { id: 'admin-advisor', icon: Sparkles, label: isEnglish ? 'AI Advisor' : 'المستشار الذكي', color: '#8B5CF6' },
        { id: 'notifications', icon: Bell, label: t('admin.notifications'), color: '#EF4444' },
        { id: 'configuration', icon: Settings, label: isEnglish ? 'Configuration' : 'إعدادات النظام', color: '#6B7280' },
        { id: 'infrastructure', icon: Activity, label: isEnglish ? 'Infrastructure' : 'البنية التحتية', color: '#3B82F6' },
    ], [t, isEnglish]);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090B10' }}>
                <div style={{ width: '50px', height: '50px', border: '3px solid rgba(139, 92, 246, 0.1)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: '20px', color: '#6B7280', fontSize: '0.9rem', fontWeight: 700 }}>{isEnglish ? 'Initializing Control Center...' : 'جاري تهيئة مركز التحكم...'}</div>
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', 
            background: '#090B10', 
            color: 'var(--color-text-main)', 
            fontFamily: language === 'ar' ? '"Cairo", sans-serif' : '"Inter", sans-serif',
            direction: isRtl ? 'rtl' : 'ltr'
        }}>
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)} 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }} 
                />
            )}

            {/* Sidebar */}
            <aside style={{ 
                width: '280px', 
                background: '#0D1117', 
                borderRight: isRtl ? 'none' : '1px solid var(--color-border-subtle)', 
                borderLeft: isRtl ? '1px solid var(--color-border-subtle)' : 'none', 
                display: 'flex', 
                flexDirection: 'column', 
                zIndex: 50,
                position: 'fixed',
                height: '100%',
                transform: sidebarOpen ? 'translateX(0)' : (isRtl ? 'translateX(280px)' : 'translateX(-280px)'),
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (min-width: 1024px)': {
                    position: 'static',
                    transform: 'none'
                }
            }} className="sidebar-desktop">
                <style>{`
                    @media (min-width: 1024px) {
                        .sidebar-desktop { position: static !important; transform: none !important; }
                        .menu-btn { display: none !important; }
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                `}</style>
                
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                        }}>
                            <Zap size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.5px' }}>24SHIFT</div>
                            <div style={{ fontSize: '0.65rem', color: '#A78BFA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Control Panel</div>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                                border: 'none', borderRadius: '12px', cursor: 'pointer', 
                                background: tab === item.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                color: tab === item.id ? '#A78BFA' : '#6B7280', 
                                fontWeight: tab === item.id ? 800 : 600,
                                fontSize: '0.88rem', transition: 'all 0.2s', textAlign: isRtl ? 'right' : 'left'
                            }}
                        >
                            <item.icon size={18} color={tab === item.id ? '#A78BFA' : '#4B5563'} strokeWidth={tab === item.id ? 2.5 : 2} />
                            {item.label}
                            {tab === item.id && (
                                <div style={{ 
                                    [isRtl ? 'marginRight' : 'marginLeft']: 'auto', 
                                    width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' 
                                }} />
                            )}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <button 
                        onClick={handleLogout}
                        style={{ 
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', background: 'rgba(239, 68, 68, 0.05)', 
                            color: '#EF4444', border: 'none', borderRadius: '10px', 
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' 
                        }}
                    >
                        <LogOut size={18} /> {isEnglish ? 'Logout' : 'تسجيل الخروج'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden', 
                width: '100%',
                [isRtl ? 'paddingRight' : 'paddingLeft']: '0px',
                '@media (min-width: 1024px)': {
                    [isRtl ? 'paddingRight' : 'paddingLeft']: '280px'
                }
            }}>
                {/* Header */}
                <header style={{ 
                    height: '70px', background: 'rgba(13, 17, 23, 0.8)', 
                    backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border-subtle)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '0 2rem', zIndex: 30 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="menu-btn"
                            onClick={() => setSidebarOpen(true)} 
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer' }}
                        >
                            <Menu size={24} />
                        </button>
                        <div style={{ color: '#6B7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Home size={16} />
                            <ChevronRight size={14} />
                            <span style={{ color: 'var(--color-text-main)', fontWeight: 700, textTransform: 'capitalize' }}>{tab.replace('-', ' ')}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <Btn onClick={refreshData} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 15px' }}>
                            <RefreshCw size={14} /> {isEnglish ? 'Sync' : 'تزامن'}
                        </Btn>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', border: '1px solid var(--color-border-subtle)' }}>
                            <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'white' }}>{user?.email?.split('@')[0]}</div>
                                <div style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 900 }}>SYSTEM ADMIN</div>
                            </div>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'white' }}>
                                {user?.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
                    {flashMessage && (
                        <div style={{ 
                            position: 'fixed', top: '90px', [isRtl ? 'left' : 'right']: '2rem', 
                            background: flashMessage.text.includes('❌') ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)', 
                            color: 'white', padding: '12px 24px', borderRadius: '12px', zIndex: 100, 
                            fontWeight: 800, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
                            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            {flashMessage.text}
                        </div>
                    )}

                    {/* Render Active Tab */}
                    {tab === 'overview' && <OverviewTab t={t} isEnglish={isEnglish} stats={stats} />}
                    {tab === 'clients' && <ClientsTab {...adminHook} />}
                    {tab === 'agents' && <AgentsTab {...adminHook} />}
                    {tab === 'bookings' && <BookingsTab {...adminHook} />}
                    {tab === 'academy' && <AcademyTab {...adminHook} />}
                    {tab === 'marketing' && <MarketingTab {...adminHook} />}
                    {tab === 'white-label' && <WhiteLabelTab {...adminHook} />}
                    {tab === 'blog' && <AdminBlogManager />}
                    {tab === 'newsletters' && <NewsletterSubscribersTab {...adminHook} />}
                    {tab === 'concierge-chats' && <ConciergeTab {...adminHook} />}
                    {tab === 'leads' && <LeadsTab {...adminHook} />}
                    {tab === 'interview-agents' && <InterviewAgentsTab {...adminHook} />}
                    {tab === 'admin-advisor' && <AdvisorTab {...adminHook} />}
                    {tab === 'notifications' && <NotificationsTab {...adminHook} />}
                    {tab === 'configuration' && <ConfigurationTab {...adminHook} />}
                    {tab === 'infrastructure' && <InfrastructureTab {...adminHook} />}
                </div>
            </main>
        </div>
    );
};

// Internal components like RefreshCw used in header
const RefreshCw = ({ size, className }) => (
    <svg 
        width={size} height={size} viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
);

export default AdminDashboard;
