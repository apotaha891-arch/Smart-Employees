import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Footer = () => {
    const { t, language } = useLanguage();
    const { isDarkMode } = useTheme();
    const year = new Date().getFullYear();

    return (
        <footer style={{
            padding: '4rem 0 2rem',
            background: 'var(--color-bg-input)',
            borderTop: '1px solid var(--color-border-subtle)',
            marginTop: 'auto'
        }}>
            <div className="container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/logo.png" alt="Smart Employees" style={{ height: '36px', objectFit: 'contain', borderRadius: '8px' }} />
                        <span style={{
                            fontFamily: "'Montserrat', 'Inter', sans-serif",
                            fontWeight: 900,
                            fontSize: '1.3rem',
                            textTransform: 'uppercase',
                            color: isDarkMode ? '#FFFFFF' : 'var(--color-text-main)',
                            letterSpacing: '1.5px',
                            display: 'inline-block'
                        }}>SMART EMPLOYEES</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)'
                    }}>
                        <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>
                            {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                        </Link>
                        <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>
                            {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                        </Link>
                        <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }}>
                            {t('nav.pricing')}
                        </Link>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        © {year} Smart Employees. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
