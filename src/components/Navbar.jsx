import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, signOut } from '../services/supabaseService';

const Navbar = () => {
    const { t, language, setLanguage } = useLanguage();
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
                        width: '32px',
                        height: '32px',
                        background: 'var(--accent)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        fontSize: '1rem'
                    }}>✦</div>
                    Elite Agents
                </Link>

                <ul className="nav-links">
                    <li>
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>الرئيسية</Link>
                    </li>
                    {user && (
                        <li>
                            <Link to="/setup" className={`nav-link ${isActive('/setup') ? 'active' : ''}`}>⚙️ إعدادات المنشأة</Link>
                        </li>
                    )}
                    <li>
                        <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>💼 الكوادر</Link>
                    </li>
                    <li>
                        <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>💰 الباقات</Link>
                    </li>
                    <li>
                        <Link to="/interview" className={`nav-link ${isActive('/interview') ? 'active' : ''}`}>🤝 المقابلة</Link>
                    </li>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 0.5rem' }}></div>

                    {user ? (
                        <li>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ border: 'none', background: '#FEE2E2', color: '#B91C1C' }}>
                                تسجيل الخروج
                            </button>
                        </li>
                    ) : (
                        <li>
                            <Link to="/login" className="btn btn-primary btn-sm">تسجيل الدخول</Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
