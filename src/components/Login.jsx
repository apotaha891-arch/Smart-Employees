import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/supabaseService';

const Login = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = isSignUp
            ? await signUp(email, password, fullName)
            : await signIn(email, password);

        if (result.success) {
            navigate('/templates');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="container py-2xl" style={{ maxWidth: '450px' }}>
            <div className="card card-solid p-2xl">
                <div className="text-center mb-xl">
                    <h2 className="mb-sm">{isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
                    <p className="text-secondary">انضم لمنصة Elite Agents لإدارة موظفيك الرقميين</p>
                </div>

                {error && (
                    <div className="badge badge-danger mb-xl w-full p-md text-center">
                        {error}
                    </div>
                )}

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
                        <label className="label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-xl">
                        <label className="label">كلمة المرور</label>
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
                        className={`btn btn-primary btn-block btn-lg ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'جاري التحميل...' : (isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول')}
                    </button>
                </form>

                <div className="text-center mt-xl">
                    <button
                        className="btn-link"
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                    >
                        {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ واحداً الآن'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
