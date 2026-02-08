import React from 'react';
import { Link } from 'react-router-dom';

const LowCreditModal = ({ remaining, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '1rem'
        }} className="animate-fade-in">
            <div className="card card-solid p-2xl text-center" style={{ maxWidth: '450px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    &times;
                </button>

                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    animation: 'pulse 2s infinite'
                }}>🪫</div>

                <h3 className="mb-md">موظفك الذكي يشعر بالإرهاق الرقمي!</h3>
                <p className="text-secondary mb-xl" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    طاقته الحالية تكفي لـ <span className="text-primary font-bold">{remaining}</span> عملاء فقط.
                    هل تريد تجديد عقده الآن لضمان استمرارية الردود المذهلة لعملائك؟
                </p>

                <div className="flex gap-md">
                    <Link
                        to="/pricing"
                        className="btn btn-primary w-full"
                        onClick={onClose}
                    >
                        تجديد العقد الآن 🚀
                    </Link>
                    <button
                        className="btn btn-secondary w-full"
                        onClick={onClose}
                    >
                        لاحقاً
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
