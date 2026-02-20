import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, signOut } from '../services/supabaseService';
import { Smartphone, Briefcase, Globe } from 'lucide-react';

const Navbar = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            setUser(user);
        };
        checkUser();
    }, [location]);

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
                <Link to="/" className="nav-logo">
                    <div style={{
                        width: '38px',
                        height: '38px',
                        background: 'linear-gradient(135deg, #FFF 0%, #A1A1AA 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'black',
                        fontSize: '1.2rem',
                        fontWeight: '900'
                    }}>✦</div>
                    <span style={{ fontWeight: 900, fontSize: '1.4rem' }}>{t('brand.name')}</span>
                </Link>

                <ul className="nav-links">
                    <li>
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
                    </li>
                    {user && (
                        <>
                            <li>
                                <Link to="/setup" className={`nav-link ${isActive('/setup') ? 'active' : ''}`}>
                                    <Smartphone size={18} />
                                    <span>{t('nav.templates')}</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/salon-setup" className={`nav-link ${isActive('/salon-setup') ? 'active' : ''}`}>
                                    <Briefcase size={18} />
                                    <span>{t('nav.salonSetup')}</span>
                                </Link>
                            </li>
                        </>
                    )}
                    <li>
                        <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>{t('nav.templates')}</Link>
                    </li>
                    <li>
                        <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>{t('nav.pricing')}</Link>
                    </li>
                    <li>
                        <Link to="/interview" className={`nav-link ${isActive('/interview') ? 'active' : ''}`}>{t('nav.interview')}</Link>
                    </li>

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
