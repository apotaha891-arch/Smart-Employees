import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, signOut, supabase } from '../services/supabaseService';
import { Smartphone, Briefcase, Globe, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
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
                <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.4rem',
                        fontWeight: '900',
                        boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <span style={{ position: 'relative', zIndex: 2, letterSpacing: '-1px' }}>24</span>
                        {/* Glow effect inside logo */}
                        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)', opacity: 0.5 }}></div>
                    </div>
                    <span style={{
                        fontWeight: 900,
                        fontSize: '1.5rem',
                        background: 'linear-gradient(90deg, #FFFFFF 0%, #A78BFA 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '0.5px'
                    }}>24shift</span>
                </Link>

                <ul className="nav-links">
                    <li>
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
                    </li>
                    <li>
                        <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>{t('nav.templates')}</Link>
                    </li>
                    <li>
                        <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>{t('nav.pricing')}</Link>
                    </li>
                    <li>
                        <Link to="/interview" className={`nav-link ${isActive('/interview') ? 'active' : ''}`}>{t('nav.interview')}</Link>
                    </li>
                    {user && (
                        <li>
                            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LayoutDashboard size={18} />
                                <span>{t('nav.dashboard')}</span>
                            </Link>
                        </li>
                    )}

                    <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 0.5rem' }}></div>

                    {/* Language Toggle */}
                    <li>
                        <button
                            onClick={toggleLanguage}
                            className="nav-link"
                            title={language === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-subtle)',
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
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: '0.8rem' }}>
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
