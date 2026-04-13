import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, LayoutDashboard, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBranding } from '../context/BrandingContext';
import { getCurrentUser, signOut, supabase, resendConfirmationEmail } from '../services/supabaseService';

const Navbar = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAgency, isAdmin } = useAuth();
    const { theme, toggleTheme, isDarkMode } = useTheme();
    const branding = useBranding();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false); // Close menu on route change
    }, [location.pathname]);

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
                        style={{ height: '36px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} 
                    />
                    <span style={{
                        fontFamily: "'Montserrat', 'Inter', sans-serif",
                        fontWeight: 900,
                        fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                        textTransform: 'uppercase',
                        color: isDarkMode ? '#FFFFFF' : 'var(--color-text-main)',
                        letterSpacing: '1px',
                        padding: '4px 0',
                        display: 'inline-block',
                        lineHeight: 1
                    }}>
                        {(branding.is_custom ? branding.brand_name : '24SHIFT')}
                    </span>
                </Link>

                <button 
                    className="mobile-toggle" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Menu"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
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
                            <Link to={isAgency ? "/agency" : "/dashboard"} className={`nav-link ${isActive(isAgency ? '/agency' : '/dashboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                <LayoutDashboard size={18} />
                                <span>{isAgency ? (language === 'ar' ? 'مركز الوكالة' : 'Agency Panel') : t('nav.dashboard')}</span>
                            </Link>
                        </li>
                    )}

                    <div className="nav-separator" style={{ width: '1px', height: '20px', background: 'var(--color-border-subtle)', margin: '0 0.5rem' }}></div>

                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                    </div>

                    {user ? (
                        <li>
                            <button
                                onClick={handleLogout}
                                className="nav-logout-btn"
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    color: '#EF4444',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    width: '100%',
                                    textAlign: 'center'
                                }}
                            >
                                {t('nav.logout')}
                            </button>
                        </li>
                    ) : (
                        <li style={{ width: '100%' }}>
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: '100%' }}>{t('authentication.signIn')}</Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
