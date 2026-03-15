import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Store, Users, User, Settings, LogOut,
    Bell, Search, Menu, X, ChevronLeft, CreditCard, Calendar,
    BarChart3, Lock, Zap, Bot, UserCheck, HelpCircle, MessageSquare, Puzzle
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { signOut, supabase } from '../services/supabaseService';

const ModernDashboardLayout = ({ children }) => {
    const { t, language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin, isCustomer } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userData, setUserData] = useState({ name: t('loadingFallback'), email: '', business_name: '' });

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch latest salon_config and profile
                const [configRes, profileRes] = await Promise.all([
                    supabase.from('salon_configs').select('business_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                    supabase.from('profiles').select('business_name, business_type').eq('id', user.id).maybeSingle()
                ]);

                const config = configRes.data;
                const profile = profileRes.data;
                const bizType = config?.business_type || profile?.business_type || '';
                const bizName = profile?.business_name || (language === 'ar' ? 'منشأتي' : 'My Business');

                setUserData({
                    name: user.user_metadata?.full_name || user.email.split('@')[0],
                    email: user.email,
                    business_name: bizName,
                    business_type: bizType
                });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // Customer Navigation Items
    const customerNavItems = [
        { icon: LayoutDashboard, label: language === 'ar' ? 'نظرة عامة' : 'Overview', path: '/dashboard' },
        { icon: Bot, label: language === 'ar' ? 'الفريق الرقمي' : 'Digital Team', path: '/agents' },

        { type: 'title', label: language === 'ar' ? 'نظام CRM المتكامل' : 'CRM & Operations' },
        { icon: Calendar, label: language === 'ar' ? 'الحجوزات' : 'Reservations', path: '/bookings' },
        { icon: Zap, label: language === 'ar' ? 'المبيعات والعملاء' : 'Leads & Sales', path: '/sales' },
        { icon: MessageSquare, label: language === 'ar' ? 'مركز الدعم' : 'Support Tickets', path: '/support' },
        { icon: UserCheck, label: language === 'ar' ? 'التوظيف (HR)' : 'Recruitment (HR)', path: '/hr' },
        { icon: Users, label: language === 'ar' ? 'قاعدة العملاء' : 'Customer Base', path: '/customers' },

        { type: 'title', label: language === 'ar' ? 'الحساب والإعدادات' : 'Account & Config' },
        { icon: Settings, label: language === 'ar' ? 'إعداد المنشأة' : 'Entity Setup', path: '/salon-setup' },
        { icon: Puzzle, label: language === 'ar' ? 'أدوات الربط والمنصات' : 'Tools & Connections', path: '/salon-setup?tab=integrations' },
        { icon: CreditCard, label: language === 'ar' ? 'الأسعار والفوترة' : 'Pricing & Billing', path: '/pricing' },
        { icon: HelpCircle, label: language === 'ar' ? 'مركز المساعدة' : 'Help Center', path: '/help' },
    ];

    // Admin Navigation Items
    const adminNavItems = [
        { icon: LayoutDashboard, label: t('dashboardLabel'), path: '/admin' },
        { icon: Users, label: t('usersLabel'), path: '/admin/users' },
        { icon: Store, label: t('storesLabel'), path: '/admin/stores' },
        { icon: BarChart3, label: t('analyticsLabel'), path: '/admin/analytics' },
        { icon: Zap, label: t('automationLabel'), path: '/admin/automation' },
        { icon: Lock, label: t('securityLabel'), path: '/admin/security' },
        { icon: Settings, label: t('settingsLabel'), path: '/admin/settings' },
    ];

    // Select nav items based on role
    const navItems = isAdmin ? adminNavItems : customerNavItems;

    return (
        <div className="dashboard-container" style={{ display: 'flex', height: 'calc(100vh - 74px)', background: '#0B0F19', color: 'white', direction: language === 'ar' ? 'rtl' : 'ltr', flexDirection: 'row', overflow: 'hidden' }}>

            {/* Sidebar */}
            <aside className="n8n-sidebar" style={{ width: isSidebarOpen ? '280px' : '80px', display: 'flex', flexDirection: 'column', background: '#111827', borderRight: language === 'ar' ? 'none' : '1px solid rgba(255,255,255,0.05)', borderLeft: language === 'ar' ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'width 0.3s', overflowY: 'auto', flexShrink: 0 }}>
                {/* Logo Area */}
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: isAdmin ? 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '1.2rem', fontWeight: '900'
                        }}>
                            {isAdmin ? '24' : (userData.business_name ? userData.business_name.substring(0, 2).toUpperCase() : 'C')}
                        </div>
                        {isSidebarOpen && <span style={{ fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(90deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                            {isAdmin ? '24Shift' : (userData.business_name || t('nav.dashboard'))}
                        </span>}
                    </Link>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.5rem' }}>
                        <Menu size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '1rem' }}>
                    {/* Role Section Header */}
                    {isSidebarOpen && (
                        <div style={{ padding: '1rem 0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {isAdmin ? t('adminTools') : t('customerTools')}
                            </span>
                        </div>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {navItems.map((item, idx) => {
                            if (item.type === 'title') {
                                return isSidebarOpen ? (
                                    <li key={`title-${idx}`} style={{ padding: '1.5rem 1rem 0.5rem', marginBottom: '0.5rem', opacity: 0.6 }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 800, letterSpacing: '0.1em' }}>
                                            {item.label}
                                        </span>
                                    </li>
                                ) : (
                                    <li key={`sep-${idx}`} style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1.5rem 1rem' }} />
                                );
                            }

                            const path = item.path || '#';
                            const active = isActive(path);

                            return (
                                <li key={path + idx} style={{ marginBottom: '0.25rem' }}>
                                    <Link to={path} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        color: active ? 'white' : '#9CA3AF',
                                        background: active ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                        borderRight: language === 'ar' ? 'none' : (active ? '3px solid #8B5CF6' : '3px solid transparent'),
                                        borderLeft: language === 'ar' ? (active ? '3px solid #8B5CF6' : '3px solid transparent') : 'none',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none'
                                    }}>
                                        {item.icon && <item.icon size={20} color={active ? '#8B5CF6' : 'currentColor'} />}
                                        {isSidebarOpen && <span style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Profile & Logout */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#374151', overflow: 'hidden' }}>
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop"
                                alt="User"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        {isSidebarOpen && (
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userData.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.25rem' }}>{userData.email}</div>
                                <span style={{
                                    fontSize: '0.65rem',
                                    background: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                    color: isAdmin ? '#FCA5A5' : '#C4B5FD',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    fontWeight: 700
                                }}>
                                    {isAdmin ? t('adminRole') : t('userRole')}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-logout"
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '12px', background: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.1)',
                            borderRadius: '10px', cursor: 'pointer',
                            fontWeight: 600, transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span>{t('logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                /* explicitly shrink the main area so it ends where the sidebar begins; this
                   avoids a visible padding gap while still preventing overlap */
                width: `calc(100% - ${isSidebarOpen ? '280px' : '80px'})`,
                transition: 'width 0.3s ease',
                background: '#0B0F19',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden',
                boxSizing: 'border-box'
            }}>
                {/* Page Content */}
                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default ModernDashboardLayout;
