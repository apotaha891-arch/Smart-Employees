import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { LogOut, BookOpen, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/supabaseService';
import { useNavigate } from 'react-router-dom';

const AcademyLayout = ({ children, title = "Smart Agent Academy" }) => {
    const { language, t, toggleLanguage } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const isArabic = language === 'ar';

    const handleLogout = async () => {
        await signOut();
        navigate('/opportunity');
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#050505', 
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            direction: isArabic ? 'rtl' : 'ltr'
        }}>
            {/* Minimal Header */}
            <header style={{
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(5,5,5,0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BookOpen size={20} color="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', tracking: '-0.02em' }}>
                        {title}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button 
                        onClick={() => toggleLanguage()}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Globe size={16} />
                        {isArabic ? 'English' : 'العربية'}
                    </button>

                    {isAuthenticated && (
                        <button 
                            onClick={handleLogout}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#9CA3AF', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}
                        >
                            <LogOut size={18} />
                            {isArabic ? 'خروج' : 'Logout'}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ 
                maxWidth: '1600px', 
                margin: '0 auto', 
                padding: '4rem 2rem'
            }}>
                {children}
            </main>

            {/* Subtle Footer */}
            <footer style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: '4rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#4B5563', fontSize: '0.85rem' }}>
                    <Sparkles size={14} />
                    <span>{isArabic ? 'بواسطة 24شفت - الأتمتة للجميع' : 'Powered by 24Shift - Automation for Everyone'}</span>
                </div>
            </footer>
        </div>
    );
};

export default AcademyLayout;
