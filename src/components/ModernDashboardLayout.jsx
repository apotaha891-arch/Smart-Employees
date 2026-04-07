import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Store, Users, User, Settings, LogOut,
    Bell, Search, Menu, X, ChevronLeft, CreditCard, Calendar,
    BarChart3, Lock, Zap, Bot, UserCheck, HelpCircle, MessageSquare, Puzzle, ShieldCheck, ArrowLeft, Plus
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { signOut, supabase, getProfile } from '../services/supabaseService';
import NotificationCenter from './shared/NotificationCenter';
import { Globe } from 'lucide-react';

const ModernDashboardLayout = ({ children }) => {
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, realUser, isAdmin, isCustomer, isAgency, isImpersonating, stopImpersonating } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userData, setUserData] = useState({ name: t('loadingFallback'), email: '', business_name: '' });
    const [balance, setBalance] = useState(0);
    const [packageBalance, setPackageBalance] = useState(0);
    const [topupBalance, setTopupBalance] = useState(0);
    const [renewalDate, setRenewalDate] = useState(null);
    const [showBreakdown, setShowBreakdown] = useState(false);

    useEffect(() => {
        fetchUser();
        fetchBalance();

        // Subscribe to balance changes
        if (user?.id) {
            const channel = supabase
                .channel(`wallet_changes_${user.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'wallet_credits',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    if (payload.new) {
                        if (typeof payload.new.balance === 'number') setBalance(payload.new.balance);
                        if (typeof payload.new.package_balance === 'number') setPackageBalance(payload.new.package_balance);
                        if (typeof payload.new.topup_balance === 'number') setTopupBalance(payload.new.topup_balance);
                    }
                })
                .subscribe();
            
            return () => { supabase.removeChannel(channel); };
        }
    }, [user?.id]); // Re-fetch when user changes (supports impersonation switching)

    const fetchBalance = async () => {
        if (!user?.id) return;
        try {
            // 1. Try unified wallet first (Fetch buckets)
            const { data: walletData, error: walletError } = await supabase
                .from('wallet_credits')
                .select('balance, package_balance, topup_balance')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (walletData) {
                setBalance(walletData.balance || 0);
                setPackageBalance(walletData.package_balance || 0);
                setTopupBalance(walletData.topup_balance || 0);
            }

            // 2. Fetch Renewal Date from profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('subscription_period_end, total_credits')
                .eq('id', user.id)
                .maybeSingle();

            if (profileData) {
                setRenewalDate(profileData.subscription_period_end);
                // Fallback for legacy balance if wallet record is missing entirely
                if (!walletData && profileData.total_credits !== undefined) {
                    setBalance(profileData.total_credits);
                }
            }
        } catch (err) {
            console.error('Error fetching balance:', err);
            setBalance(0);
        }
    };

    const fetchUser = async () => {
        try {
            // Use user from AuthContext — correctly reflects impersonated client
            const activeUserId = user?.id;
            if (!activeUserId) return;

            const [configRes, profileRes] = await Promise.all([
                supabase.from('entities').select('business_type, business_name').eq('user_id', activeUserId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                getProfile(activeUserId)
            ]);

            const config = configRes.data;
            const profile = profileRes.data;
            const bizName = config?.business_name || profile?.business_name || (language === 'ar' ? 'منشأتي' : 'My Business');

            setUserData({
                name: user.user_metadata?.full_name || user.full_name || user.email?.split('@')[0] || 'مستخدم',
                email: user.email || '',
                business_name: bizName,
                business_type: config?.business_type || profile?.business_type || ''
            });
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
        ...(isAgency ? [{ 
            icon: ShieldCheck, 
            label: language === 'ar' ? 'لوحة الوكالة' : 'Agency Panel', 
            path: '/agency',
            style: { borderBottom: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '0.5rem', paddingBottom: '1rem' }
        }] : []),
        { icon: LayoutDashboard, label: language === 'ar' ? 'نظرة عامة' : 'Overview', path: '/dashboard' },
        { icon: Bot, label: language === 'ar' ? 'الفريق الرقمي' : 'Digital Team', path: '/agents' },

        { type: 'title', label: language === 'ar' ? 'نظام CRM المتكامل' : 'CRM & Operations' },
        { icon: Calendar, label: language === 'ar' ? 'الحجوزات' : 'Reservations', path: '/bookings' },
        { icon: Zap, label: language === 'ar' ? 'المبيعات والعملاء' : 'Leads & Sales', path: '/sales' },
        { icon: MessageSquare, label: language === 'ar' ? 'مركز الدعم' : 'Support Tickets', path: '/support' },
        { icon: UserCheck, label: language === 'ar' ? 'التوظيف (HR)' : 'Recruitment (HR)', path: '/hr' },
        { icon: Users, label: language === 'ar' ? 'قاعدة العملاء' : 'Customer Base', path: '/customers' },

        { type: 'title', label: language === 'ar' ? 'الحساب والإعدادات' : 'Account & Config' },
        { icon: Settings, label: language === 'ar' ? 'إعداد المنشأة' : 'Entity Setup', path: '/entity-setup' },
        { icon: Puzzle, label: language === 'ar' ? 'أدوات الربط والمنصات' : 'Tools & Connections', path: '/entity-setup?tab=integrations' },
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

    // Select nav items based on role (AuthContext now swaps this during impersonation)
    const navItems = isAdmin ? adminNavItems : customerNavItems;

    return (
        <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 74px)', background: '#0B0F19', color: 'white', direction: language === 'ar' ? 'rtl' : 'ltr', overflow: 'hidden' }}>

            {/* ── Impersonation Banner ── */}
            {isImpersonating && (
                <div style={{
                    background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                    color: 'white',
                    padding: '8px 20px',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    zIndex: 9999,
                    position: 'sticky',
                    top: 0,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                    <span>{language === 'ar' ? `⚠️ أنت تتصفح كدعم فني للحساب: ${userData.business_name || user?.email}` : `⚠️ You are browsing as support for: ${userData.business_name || user?.email}`}</span>
                    <button 
                        onClick={() => {
                            stopImpersonating();
                            window.location.href = '/admin';
                        }}
                        style={{
                            background: 'white',
                            color: '#8B5CF6',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        {language === 'ar' ? 'الخروج والعودة للأدمن' : 'Exit and return to Admin'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <aside className="shift-sidebar" style={{ width: isSidebarOpen ? '280px' : '80px', display: 'flex', flexDirection: 'column', background: '#111827', borderRight: language === 'ar' ? 'none' : '1px solid rgba(255,255,255,0.05)', borderLeft: language === 'ar' ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'width 0.3s', overflowY: 'auto', flexShrink: 0 }}>
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
                                <li key={path + idx} style={{ marginBottom: '0.25rem', ...(item.style || {}) }}>
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
                {/* Top Header Bar */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 2rem',
                    background: '#111827',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', top: '50%', [language === 'ar' ? 'right' : 'left']: '12px', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input 
                                type="text" 
                                placeholder={language === 'ar' ? 'بحث...' : 'Search...'} 
                                style={{ width: '100%', padding: language === 'ar' ? '8px 36px 8px 12px' : '8px 12px 8px 36px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '0.85rem' }} 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        {/* Compact Balance Display */}
                        {!isAdmin && (
                            <div style={{ position: 'relative' }}>
                                <div 
                                    onClick={() => navigate('/pricing')}
                                    onMouseEnter={() => setShowBreakdown(true)}
                                    onMouseLeave={() => setShowBreakdown(false)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        background: 'rgba(139, 92, 246, 0.1)', 
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        padding: '6px 14px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        zIndex: 10
                                    }}
                                >
                                    <Zap size={16} color="#8B5CF6" fill="#8B5CF6" />
                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{balance.toLocaleString()}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase' }}>{language === 'ar' ? 'نقطة' : 'Credits'}</span>
                                    </div>
                                    <div style={{ marginLeft: language === 'ar' ? 0 : 4, marginRight: language === 'ar' ? 4 : 0, padding: 4, background: '#8B5CF6', borderRadius: 6, display: 'flex' }}>
                                        <Plus size={12} color="white" strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Credit Breakdown Tooltip */}
                                {showBreakdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '110%',
                                        [language === 'ar' ? 'right' : 'left']: 0,
                                        width: '240px',
                                        background: '#1F2937',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                        zIndex: 1000,
                                        fontSize: '0.8rem'
                                    }}>
                                        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 700, color: '#A78BFA' }}>
                                            {language === 'ar' ? 'تفاصيل الرصيد' : 'Credits Breakdown'}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#9CA3AF' }}>{language === 'ar' ? 'رصيد الباقة:' : 'Package Plan:'}</span>
                                            <span style={{ fontWeight: 600 }}>{packageBalance.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#9CA3AF' }}>{language === 'ar' ? 'رصيد الشحن:' : 'Top-up Credits:'}</span>
                                            <span style={{ fontWeight: 600, color: '#10B981' }}>{topupBalance.toLocaleString()}</span>
                                        </div>
                                        {renewalDate && (
                                            <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#8B5CF6', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={12} />
                                                <span>{language === 'ar' ? `التجديد القادم: ${new Date(renewalDate).toLocaleDateString('ar-EG')}` : `Next Renewal: ${new Date(renewalDate).toLocaleDateString()}`}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <NotificationCenter userId={user?.id} />

                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                padding: '10px',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700
                            }}
                        >
                            <Globe size={18} />
                            <span>{language === 'ar' ? 'EN' : 'AR'}</span>
                        </button>

                        {/* Notifications */}
                        <NotificationCenter userId={supabase.auth.at_current_user_id || userData?.id} />
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
            </div>
        </div>
    );
};

export default ModernDashboardLayout;
