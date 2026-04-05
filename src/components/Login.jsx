import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle, sendPasswordResetEmail, supabase } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { useLanguage } from '../LanguageContext';
import { Sparkles, Mail, CheckCircle, Eye, EyeOff, Key } from 'lucide-react';

// Helper: get role and sector from DB
const getUserDestination = async (userId) => {
    const [{ data: profile }, { data: config }] = await Promise.all([
        supabase.from('profiles').select('role, is_agency').eq('id', userId).maybeSingle(),
        supabase.from('entities').select('business_type').eq('user_id', userId).not('business_type', 'is', null).limit(1).maybeSingle()
    ]);
    const isAdmin = profile?.role === 'admin';
    const isAgency = profile?.is_agency === true;
    const hasSector = !!config?.business_type;
    return { isAdmin, isAgency, hasSector };
};

const Login = () => {
    const { isAuthenticated, userRole, loading: authLoading } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoverySuccess, setRecoverySuccess] = useState(false);
    const [fullName, setFullName] = useState('');
    const [accountType, setAccountType] = useState('business'); // 'business' or 'agency'
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
                        supabase.from('profiles').select('is_agency').eq('id', user.id).maybeSingle().then(({ data: profData }) => {
                            if (profData?.is_agency) {
                                navigate('/agency', { replace: true });
                            } else {
                                supabase.from('entities').select('business_type').eq('user_id', user.id).not('business_type', 'is', null).limit(1).maybeSingle()
                                    .then(({ data }) => {
                                        navigate(location.state?.redirectTo || (data?.business_type ? '/dashboard' : '/onboarding'), { replace: true });
                                    });
                            }
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
            ? await signUp(email, password, fullName, accountType === 'agency')
            : await signIn(email, password);

        if (result.success) {
            if (isSignUp) {
                setSignUpSuccess(true);
                setLoading(false);
                return;
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { isAdmin, isAgency, hasSector } = await getUserDestination(user.id);
                if (isAdmin) {
                    navigate('/admin');
                } else if (isAgency) {
                    navigate('/agency');
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

    const handleRecovery = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await sendPasswordResetEmail(recoveryEmail);
        if (result.success) {
            setRecoverySuccess(true);
        } else {
            setError(result.error);
        }
        setLoading(false);
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

                {isRecovery ? (
                    <div className="animate-fade-in">
                        <div className="text-center mb-xl">
                            <Key size={40} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
                            <h3 style={{ fontWeight: 800 }}>{language === 'ar' ? 'استعادة كلمة السر' : 'Recover Password'}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
                                {language === 'ar' ? 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة' : 'Enter your email to receive a reset link'}
                            </p>
                        </div>

                        {recoverySuccess ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px' }}>
                                <CheckCircle size={32} style={{ color: '#10B981', marginBottom: '0.5rem' }} />
                                <p style={{ color: '#E4E4E7' }}>{language === 'ar' ? 'تم إرسال الرابط! تفقد بريدك الإلكتروني.' : 'Reset link sent! Please check your email.'}</p>
                                <button onClick={() => setIsRecovery(false)} className="btn btn-secondary btn-sm mt-md">{t('backToLogin')}</button>
                            </div>
                        ) : (
                            <form onSubmit={handleRecovery}>
                                <div className="mb-lg">
                                    <label className="label">{t('workEmail')}</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                        required
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <button type="submit" className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`} disabled={loading}>
                                    {language === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
                                </button>
                                <button type="button" onClick={() => setIsRecovery(false)} className="btn btn-link btn-block mt-md" style={{ color: '#9CA3AF' }}>
                                    {language === 'ar' ? 'العودة للخلف' : 'Go Back'}
                                </button>
                            </form>
                        )}
                    </div>
                ) : signUpSuccess ? (
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


                        <form onSubmit={handleSubmit}>
                            {isSignUp && (
                                <>
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
                                    <div className="mb-md">
                                        <label className="label" style={{ textAlign: language === 'ar' ? 'right' : 'left', marginBottom: '8px', display: 'block' }}>{language === 'ar' ? 'نوع الحساب' : 'Account Type'}</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: `1px solid ${accountType === 'business' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', background: accountType === 'business' ? 'rgba(139,92,246,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                                                <input type="radio" name="accountType" value="business" checked={accountType === 'business'} onChange={() => setAccountType('business')} style={{ accentColor: 'var(--accent)' }} />
                                                <span style={{ fontSize: '0.85rem' }}>{language === 'ar' ? 'صاحب منشأة' : 'Business Owner'}</span>
                                            </label>
                                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: `1px solid ${accountType === 'agency' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', background: accountType === 'agency' ? 'rgba(139,92,246,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                                                <input type="radio" name="accountType" value="agency" checked={accountType === 'agency'} onChange={() => setAccountType('agency')} style={{ accentColor: 'var(--accent)' }} />
                                                <span style={{ fontSize: '0.85rem' }}>{language === 'ar' ? 'مدير الوكالات' : 'Agency Manager'}</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
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
                                            [language === 'ar' ? 'left' : 'right']: '0.75rem',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '6px',
                                            zIndex: 10,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                            e.currentTarget.style.color = 'var(--accent)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {!isSignUp && (
                                    <div style={{ textAlign: language === 'ar' ? 'left' : 'right', marginTop: '0.5rem' }}>
                                        <button 
                                            type="button"
                                            onClick={() => setIsRecovery(true)}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            {language === 'ar' ? 'نسيت كلمة السر؟' : 'Forgot Password?'}
                                        </button>
                                    </div>
                                )}
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

                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: '#4B5563' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                            <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>{language === 'ar' ? 'أو عبر' : 'OR'}</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="btn btn-secondary btn-block"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '0.875rem'
                            }}
                        >
                            <FcGoogle size={20} />
                            <span>{language === 'ar' ? 'المتابعة عبر Google' : 'Continue with Google'}</span>
                        </button>
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

                {/* Compliance Links for Meta Review */}
                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    fontSize: '0.75rem',
                    color: '#6B7280'
                }}>
                    <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                        {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                    </button>
                    <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                        {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
