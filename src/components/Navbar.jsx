import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, signOut, supabase, resendConfirmationEmail } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Briefcase, Globe, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAgency, isAdmin } = useAuth();
    const { theme, toggleTheme, isDarkMode } = useTheme();
    const branding = useBranding();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get initial user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        // React to login/logout in real-time
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        navigate('/');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
                    <img 
                        src="/logo.png" 
                        alt="24shift" 
                        style={{ height: '42px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} 
                    />
                    <span style={{
                        fontFamily: "'Montserrat', 'Inter', sans-serif",
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        textTransform: 'uppercase',
                        color: isDarkMode ? '#FFFFFF' : 'var(--color-text-main)',
                        letterSpacing: '1.5px',
                        padding: '4px 0',
                        display: 'inline-block',
                        lineHeight: 1
                    }}>
                        {(branding.is_custom ? branding.brand_name : '24SHIFT')}
                    </span>
                </Link>

                <ul className="nav-links">
                    {!branding.is_custom && (
                        <>
                            <li>
                                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
                            </li>
                            <li>
                                <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>{t('nav.pricing')}</Link>
                            </li>
                            <li>
                                <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>{t('nav.blog')}</Link>
                            </li>
                        </>
                    )}
                    {user && (
                        <li>
                            <Link to={isAgency ? "/agency" : "/dashboard"} className={`nav-link ${isActive(isAgency ? '/agency' : '/dashboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LayoutDashboard size={18} />
                                <span>{isAgency ? (language === 'ar' ? 'مركز الوكالة' : 'Agency Panel') : t('nav.dashboard')}</span>
                            </Link>
                        </li>
                    )}

                    <div style={{ width: '1px', height: '20px', background: 'var(--color-border-subtle)', margin: '0 0.5rem' }}></div>

                    {/* Theme Toggle */}
                    <li>
                        <button
                            onClick={toggleTheme}
                            className="nav-link"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '0.5rem 0.6rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </li>

                    {/* Language Toggle */}
                    <li>
                        <button
                            onClick={toggleLanguage}
                            className="nav-link"
                            title={language === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '0.5rem 0.8rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            <Globe size={16} />
                            <span>{language === 'ar' ? 'EN' : 'العربية'}</span>
                        </button>
                    </li>

                    {user ? (
                        <li>
                            <button
                                onClick={handleLogout}
                                className="nav-logout-btn"
                                style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    color: '#EF4444',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                            >
                                {t('nav.logout')}
                            </button>
                        </li>
                    ) : (
                        <li>
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '10px' }}>{t('authentication.signIn')}</Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
