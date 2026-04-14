import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const NewsletterSignup = ({ source = 'blog' }) => {
    const { isEnglish } = useLanguage();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        
        try {
            // Validate source
            const signupSource = source || 'blog';

            const { error } = await supabase
                .from('newsletter_subscriptions')
                .insert([{ 
                    email: email.toLowerCase().trim(), 
                    source: signupSource 
                }]);

            if (error) {
                if (error.code === '23505') {
                    setStatus('success');
                    setMessage(isEnglish ? "You're already subscribed!" : "أنت مشترك بالفعل!");
                } else {
                    throw error;
                }
            } else {
                setStatus('success');
                setMessage(isEnglish ? "Thanks for subscribing!" : "شكراً لاشتراكك!");
            }
        } catch (err) {
            console.error('Newsletter Error:', err);
            setStatus('error');
            setMessage(isEnglish ? "Something went wrong. Try again." : "حدث خطأ ما. حاول مرة أخرى.");
        }
    };

    if (status === 'success') {
        return (
            <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '24px', 
                padding: '2rem', 
                textAlign: 'center',
                animation: 'fade-in 0.5s ease'
            }}>
                <CheckCircle size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{isEnglish ? 'Success!' : 'تم بنجاح!'}</h4>
                <p style={{ color: '#A7F3D0', fontSize: '0.9rem', margin: 0 }}>{message}</p>
            </div>
        );
    }

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, var(--color-bg-surface), #1E1B4B)', 
            borderRadius: '24px', 
            padding: '2rem', 
            border: '1px solid rgba(139, 92, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle glow effect */}
            <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '100px', height: '100px', background: 'rgba(139, 92, 246, 0.1)', filter: 'blur(40px)', borderRadius: '50%' }}></div>

            <h4 style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: 'var(--color-text-main)', 
                marginBottom: '0.75rem',
                textAlign: isEnglish ? 'left' : 'right'
            }}>
                {isEnglish ? 'Stay Updated' : 'كن على اطلاع'}
            </h4>
            <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--color-text-secondary)', 
                marginBottom: '1.5rem',
                lineHeight: '1.5',
                textAlign: isEnglish ? 'left' : 'right'
            }}>
                {isEnglish 
                    ? 'Get the latest insights on AI agents and automation directly to your inbox.' 
                    : 'احصل على أحدث الرؤى حول وكلاء الذكاء الاصطناعي والأتمتة مباشرة في بريدك.'}
            </p>

            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isEnglish ? "Your email address" : "بريدك الإلكتروني"}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        background: '#0B0F19', 
                        border: '1px solid var(--color-border-subtle)', 
                        borderRadius: '12px', 
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem',
                        marginBottom: '0.75rem',
                        outline: 'none',
                        transition: 'border-color 0.3s',
                        textAlign: isEnglish ? 'left' : 'right'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button 
                    disabled={status === 'loading'}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', 
                        color: 'var(--color-text-main)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s',
                        opacity: status === 'loading' ? 0.7 : 1
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {status === 'loading' ? (
                        <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    ) : (
                        <>
                            {isEnglish ? 'Subscribe' : 'اشترك الآن'} 
                            <Send size={16} style={{ transform: isEnglish ? 'none' : 'rotate(180deg)' }} />
                        </>
                    )}
                </button>
            </form>

            {status === 'error' && (
                <div style={{ marginTop: '0.75rem', color: '#EF4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={14} /> {message}
                </div>
            )}
        </div>
    );
};

export default NewsletterSignup;
