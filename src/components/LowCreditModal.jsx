import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const LowCreditModal = ({ remaining, onClose }) => {
    const { language } = useLanguage();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(8px)',
            padding: '1rem',
            direction: language === 'ar' ? 'rtl' : 'ltr'
        }} className="animate-fade-in">
            <div className="card" style={{ 
                maxWidth: '480px', 
                width: '100%',
                position: 'relative', 
                background: '#18181B',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2.5rem',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: language === 'ar' ? 'auto' : '1.5rem',
                        left: language === 'ar' ? '1.5rem' : 'auto',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#9CA3AF'
                    }}
                >
                    <X size={18} />
                </button>

                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    color: '#EF4444',
                    animation: 'pulse 2s infinite'
                }}>
                    <AlertTriangle size={40} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: '#FFF', textAlign: 'center' }}>
                    {language === 'ar' ? 'تنبيه: رصيد الموظف الرقمي منخفض!' : 'Warning: Digital Agent Credits Low!'}
                </h3>
                
                <p style={{ color: '#A1A1AA', fontSize: '1.1rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '2.5rem' }}>
                    {language === 'ar' 
                        ? `يتبقى للموظف الذكي طاقة تكفي لـ ${remaining} محادثات فقط. يرجى شحن الرصيد لضمان استمرارية الردود الفورية لعملائك.`
                        : `Your smart agent has energy for only ${remaining} conversations left. Please top up your balance to ensure continuous instant replies for your customers.`
                    }
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link
                        to="/pricing"
                        style={{
                            flex: 1,
                            background: '#8B5CF6',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '16px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)'
                        }}
                        onClick={onClose}
                    >
                        <Zap size={18} fill="currentColor" />
                        {language === 'ar' ? 'شحن الرصيد الآن 🚀' : 'Refill Balance Now 🚀'}
                    </Link>
                    <button
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            color: '#E4E4E7',
                            padding: '1rem',
                            borderRadius: '16px',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer'
                        }}
                        onClick={onClose}
                    >
                        {language === 'ar' ? 'لاحقاً' : 'Later'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default LowCreditModal;
