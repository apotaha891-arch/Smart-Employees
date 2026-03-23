import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const Footer = () => {
    const { t, language } = useLanguage();
    const year = new Date().getFullYear();

    return (
        <footer style={{
            padding: '4rem 0 2rem',
            background: 'rgba(139, 92, 246, 0.02)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                         <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '900'
                        }}>
                            24
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>24shift</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)'
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

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        © {year} 24Shift. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
