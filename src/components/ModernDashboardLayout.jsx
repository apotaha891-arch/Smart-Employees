import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Store, Users, User, Settings, LogOut,
    Bell, Search, Menu, X, ChevronLeft, CreditCard, Calendar,
    BarChart3, Lock, Zap, Bot
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
    const [userData, setUserData] = useState({ name: 'جاري التحميل...', email: '' });

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData({
                    name: user.user_metadata?.full_name || user.email.split('@')[0],
                    email: user.email
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
        { icon: LayoutDashboard, label: t('dashboardLabel'), path: '/dashboard' },
        { icon: Bot, label: t('deployAgentLabel') || 'Deploy Agent', path: '/deploy-agent' },
        { icon: User, label: t('myEmployeesLabel'), path: '/salon-setup' },
        { icon: Calendar, label: t('bookingsLabel'), path: '/bookings' },
        { icon: Users, label: t('customersLabel'), path: '/customers' },
        { icon: Settings, label: t('settingsLabel'), path: '/setup' },
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
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#0B0F19', color: 'white', direction: language === 'ar' ? 'rtl' : 'ltr', flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>

            {/* Sidebar */}
            <aside className="n8n-sidebar" style={{ width: isSidebarOpen ? '280px' : '80px' }}>
                {/* Logo Area */}
                <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: 'linear-gradient(135deg, #FFF 0%, #A1A1AA 100%)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'black', fontSize: '1.2rem', fontWeight: '900'
                    }}>
                        ✦
                    </div>
                    {isSidebarOpen && <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{t('brand.name')}</span>}
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
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                                <Link to={item.path} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    color: isActive(item.path) ? 'white' : '#9CA3AF',
                                    background: isActive(item.path) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                    borderRight: language === 'ar' ? 'none' : (isActive(item.path) ? '3px solid #8B5CF6' : '3px solid transparent'),
                                    borderLeft: language === 'ar' ? (isActive(item.path) ? '3px solid #8B5CF6' : '3px solid transparent') : 'none',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                }}>
                                    <item.icon size={22} color={isActive(item.path) ? '#8B5CF6' : 'currentColor'} />
                                    {isSidebarOpen && <span style={{ fontSize: '0.95rem' }}>{item.label}</span>}
                                </Link>
                            </li>
                        ))}
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
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '10px', background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer'
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
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'auto',
                boxSizing: 'border-box'
            }}>
                {/* Topbar */}
                <header style={{
                    height: '80px',
                    padding: '0 2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(11, 15, 25, 0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 40
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                            <Menu size={24} />
                        </button>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', [language === 'ar' ? 'left' : 'right']: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                            <input
                                type="text"
                                placeholder={t('search')}
                                style={{
                                    background: '#1F2937', border: 'none', borderRadius: '8px',
                                    padding: `10px ${language === 'ar' ? '16px 40px' : '40px 16px'}`, color: 'white', outline: 'none', width: '300px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                            <Bell size={22} color="#9CA3AF" />
                            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default ModernDashboardLayout;
