import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle, supabase } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { useLanguage } from '../LanguageContext';
import { Sparkles, Mail, CheckCircle, Eye, EyeOff } from 'lucide-react';

// Helper: get role and sector from DB
const getUserDestination = async (userId) => {
    const [{ data: profile }, { data: config }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
        supabase.from('salon_configs').select('business_type').eq('user_id', userId).not('business_type', 'is', null).limit(1).maybeSingle()
    ]);
    const isAdmin = profile?.role === 'admin';
    const hasSector = !!config?.business_type;
    return { isAdmin, hasSector };
};

const Login = () => {
    const { isAuthenticated, userRole, loading: authLoading } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [signUpSuccess, setSignUpSuccess] = useState(false);
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            if (userRole === 'admin') {
                navigate('/admin', { replace: true });
            } else if (userRole === 'customer') {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        supabase.from('salon_configs').select('business_type').eq('user_id', user.id).not('business_type', 'is', null).limit(1).maybeSingle()
                            .then(({ data }) => {
                                navigate(location.state?.redirectTo || (data?.business_type ? '/dashboard' : '/onboarding'), { replace: true });
                            });
                    }
                });
            }
        }
    }, [isAuthenticated, authLoading, userRole, navigate, location.state]);

    if (authLoading || isAuthenticated) {
        return <div className="container py-xl text-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: language === 'ar' ? 'rtl' : 'ltr' }}>{t('redirecting')}</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = isSignUp
            ? await signUp(email, password, fullName)
            : await signIn(email, password);

        if (result.success) {
            if (isSignUp) {
                setSignUpSuccess(true);
                setLoading(false);
                return;
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { isAdmin, hasSector } = await getUserDestination(user.id);
                if (isAdmin) {
                    navigate('/admin');
                } else {
                    navigate(location.state?.redirectTo || (hasSector ? '/dashboard' : '/onboarding'), { state: location.state });
                }
            }
        } else {
            // Handle unconfirmed email error specifically
            if (result.error?.includes('Email not confirmed')) {
                setError(language === 'ar' ? 'يرجى تفعيل بريدك الإلكتروني أولاً. تم إرسال رابط التفعيل مسبقاً.' : 'Please confirm your email first. A confirmation link was sent to your inbox.');
            } else if (result.error?.includes('rate limit exceeded')) {
                setError(language === 'ar' 
                    ? 'تم تجاوز حد إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى بعد ساعة، أو استخدم تسجيل الدخول عبر Google.' 
                    : 'Email rate limit exceeded. Please try again in an hour, or use Google Sign-in to continue immediately.');
            } else {
                setError(result.error);
            }
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const result = await signInWithGoogle();
        if (!result.success) {
            setError(`${t('loginFailGoogle')} ${result.error}`);
            setLoading(false);
        }
    };

    return (
        <div className="container py-xl flex-center" style={{ minHeight: '80vh', maxWidth: '480px', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="card shadow-premium animate-fade-in" style={{ width: '100%', border: '1px solid var(--accent-border)' }}>
                <div className="text-center mb-2xl">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--accent)',
                        borderRadius: '16px',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        boxShadow: '0 0 30px var(--accent-soft)'
                    }}>✦</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{isSignUp ? t('joinElite') : t('leadershipGate')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('loginWelcome')}</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                        {!isSignUp && error.includes('Invalid login credentials') && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                {t('activateEmailNote')}
                            </div>
                        )}
                    </div>
                )}

                {signUpSuccess ? (
                    <div className="animate-fade-in" style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10B981', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        marginBottom: '1.5rem', 
                        textAlign: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <CheckCircle size={40} style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
                            {language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account Created Successfully!'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                            {language === 'ar' 
                                ? 'لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني. يرجى تفعيله لتتمكن من الدخول إلى المنصة.' 
                                : 'We have sent a confirmation link to your email. Please activate it to access the platform.'}
                        </p>
                        <button 
                            onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
                            className="btn btn-primary btn-sm mt-md"
                        >
                            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <button
                                onClick={handleGoogleSignIn}
                                className="btn btn-outline btn-block"
                                style={{
                                    padding: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    background: 'white',
                                    color: '#1F2937',
                                    border: '2px solid var(--accent)',
                                    fontWeight: 800,
                                    borderRadius: '14px',
                                    boxShadow: '0 4px 15px var(--accent-soft)',
                                    transition: 'all 0.3s'
                                }}
                                disabled={loading}
                            >
                                <FcGoogle size={28} />
                                <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                                    <div style={{ fontSize: '1rem', lineHeight: 1.2 }}>{isSignUp ? t('createGoogleAct') : t('loginGoogleAct')}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#6B7280', fontWeight: 500, marginTop: '2px' }}>{t('authentication.googleSignRecommendation')}</div>
                                </div>
                            </button>
                            {/* Recommendation Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                [language === 'ar' ? 'left' : 'right']: '20px',
                                background: 'var(--accent)',
                                color: 'white',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)',
                                zIndex: 2
                            }}>
                                <Sparkles size={10} /> {language === 'ar' ? 'موصى به' : 'RECOMMENDED'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <span style={{ padding: '0 1rem' }}>{t('orViaEmail')}</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {isSignUp && (
                                <div className="mb-md">
                                    <label className="label" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{t('fullName')}</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="mb-md">
                                <label className="label" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{t('workEmail')}</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-2xl">
                                <label className="label" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{t('password')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-field"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ paddingLeft: language === 'ar' ? '3rem' : '1rem', paddingRight: language === 'ar' ? '1rem' : '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            [language === 'ar' ? 'left' : 'right']: '1rem',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 0
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
                                disabled={loading}
                                style={{ padding: '1rem' }}
                            >
                                {loading ? t('verifying') : (isSignUp ? t('createCorpAct') : t('enterCenter'))}
                            </button>
                        </form>
                    </>
                )}

                <div className="text-center mt-xl">
                    <button
                        className="btn-link"
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                        {isSignUp ? t('haveAccountLogin') : t('newAccountJoin')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
