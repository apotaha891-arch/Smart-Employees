import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signUp, supabase } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';

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
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
        return <div className="container py-xl text-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحويل...</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = isSignUp
            ? await signUp(email, password, fullName)
            : await signIn(email, password);

        if (result.success) {
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
            setError(result.error);
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/setup`,
                },
            });
            if (error) throw error;
        } catch (error) {
            setError('فشل تسجيل الدخول عبر Google: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="container py-xl flex-center" style={{ minHeight: '80vh', maxWidth: '480px' }}>
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
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{isSignUp ? 'إنضمام للنخبة' : 'بوابة القيادة'}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>أهلاً بك في منصة 24Shift لاستئجار الموظفين الرقميين</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                        {!isSignUp && error.includes('Invalid login credentials') && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                ملاحظة: إذا أنشأت حساباً للتو، يرجى تفعيل بريدك الإلكتروني أولاً.
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    className="btn btn-outline btn-block mb-lg"
                    style={{
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #E5E7EB',
                        fontWeight: 600
                    }}
                    disabled={loading}
                >
                    <FcGoogle size={24} />
                    {isSignUp ? 'أنشئ حسابك عبر Google' : 'تسجيل الدخول عبر Google'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ padding: '0 1rem' }}>أو عبر البريد</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className="mb-md">
                            <label className="label">الاسم الكامل</label>
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
                        <label className="label">بريد العمل</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-2xl">
                        <label className="label">كلمة السر</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
                        disabled={loading}
                        style={{ padding: '1rem' }}
                    >
                        {loading ? 'جاري التحقق...' : (isSignUp ? 'أنشئ حسابك المؤسسي' : 'دخول للمركز ←')}
                    </button>
                </form>

                <div className="text-center mt-xl">
                    <button
                        className="btn-link"
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                        {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'حساب جديد؟ انضم الآن'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
