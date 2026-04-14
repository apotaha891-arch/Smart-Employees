import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, supabase } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    // Verification of recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && !window.location.hash) {
                setError(language === 'ar' ? 'انتهت صلاحية الجلسة أو الرابط غير صحيح' : 'Session expired or invalid link');
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            if (event === "PASSWORD_RECOVERY") {
                console.log("Password recovery session detected");
            }
        });

        return () => subscription.unsubscribe();
    }, [language]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError(language === 'ar' ? 'كلمات السر غير متطابقة' : 'Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError(language === 'ar' ? 'يجب أن تكون كلمة السر 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Attempting to update password...");
            const result = await updatePassword(password);
            console.log("Update result:", result);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(result.error || (language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating password'));
            }
        } catch (err) {
            console.error("Reset Password Error:", err);
            setError(err.message);
        } finally {
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
                    }}><Lock size={32} /></div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                        {language === 'ar' ? 'تعيين كلمة سر جديدة' : 'Reset Password'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {language === 'ar' ? 'أدخل كلمة السر الجديدة للوصول إلى حسابك' : 'Enter your new password to access your account'}
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="animate-fade-in" style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10B981', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        textAlign: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <CheckCircle size={40} style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
                            {language === 'ar' ? 'تم التغيير بنجاح!' : 'Password Reset Successful!'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {language === 'ar' ? 'سيتم توجيهك لصفحة الدخول خلال لحظات...' : 'Redirecting you to login page...'}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-md">
                            <label className="label">{language === 'ar' ? 'كلمة السر الجديدة' : 'New Password'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        [language === 'ar' ? 'left' : 'right']: '0.75rem',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-text-main)',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="mb-2xl">
                            <label className="label">{language === 'ar' ? 'تأكيد كلمة السر' : 'Confirm Password'}</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? t('verifying') : (language === 'ar' ? 'تحديث كلمة السر' : 'Update Password')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
