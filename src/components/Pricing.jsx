import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, Star, Crown } from 'lucide-react';

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const location = useLocation();
    const navigate = useNavigate();

    // Check if we are in the middle of the 7-step hiring flow
    const isHiringFlow = location.state?.fromInterview;
    const businessRules = location.state?.businessRules || null;
    const template = location.state?.template || null;

    const handleSelectPlan = (plan) => {
        // Mock checkout logic: in a real app, this goes to Stripe/Payfort.
        // For the 7-step journey, we assume payment success and move to the Contract step.
        vibrate();
        if (isHiringFlow) {
            navigate('/contract', {
                state: {
                    businessRules,
                    template,
                    selectedPlan: plan.id,
                    fromPricing: true
                }
            });
        } else {
            // Normal subscription update flow
            alert(`تم اختيار باقة ${plan.name} بنجاح!`);
        }
    };

    const vibrate = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };

    const plans = [
        {
            id: 'starter',
            name: 'باقة الانطلاق',
            icon: <Zap size={28} color="#06B6D4" />,
            monthlyPrice: 199,
            yearlyPrice: 159,
            trialPrice: 99,
            description: 'مثالية للمشاريع الناشئة التي تبحث عن أتمتة بسيطة وتغطية أساسية.',
            features: [
                'موظف ذكي واحد (تخصص محدد)',
                '500 محادثة / حجز شهرياً',
                'لوحة تحكم أساسية للموظف',
                'تقارير أداء شهرية',
                'دعم فني عبر البريد الإلكتروني'
            ],
            cta: 'اشترك الآن',
            popular: false,
            color: '#06B6D4'
        },
        {
            id: 'pro',
            name: 'باقة الاحتراف',
            icon: <Star size={28} color="#8B5CF6" />,
            monthlyPrice: 399,
            yearlyPrice: 319,
            trialPrice: 199,
            description: 'الخيار الأفضل للمنشآت المتوسطة لرفع الكفاءة التشغيلية بقوة.',
            features: [
                'موظف ذكي متقدم (تخصيص الهوية والنبرة)',
                'استقبال حجوزات لا محدود',
                'أولوية معالجة الاستجابة (Gemini Flash)',
                'استخراج بيانات العملاء كملف Excel',
                'إمكانية ربط واتساب وتيليجرام (تضاف التكلفة)',
                'دعم فني مباشر 24/7'
            ],
            cta: 'ابدأ التجربة المخفضة',
            popular: true,
            color: '#8B5CF6'
        },
        {
            id: 'enterprise',
            name: 'باقة النخبة',
            icon: <Crown size={28} color="#F59E0B" />,
            monthlyPrice: 899,
            yearlyPrice: 719,
            trialPrice: 449,
            description: 'للشركات التي تبحث عن تحكم شامل وحلول هندسية مخصصة بالكامل.',
            features: [
                'عدد غير محدود من الموظفين الذكاء الاصطناعي',
                'صلاحيات وصول متعددة لفريقك',
                'ربط API مخصص مع أنظمة ERP والعيادات',
                'تدريب الموظف على ملفات PDF الخاصة بك',
                'توجيه المحادثات المعقدة لخدمة العملاء',
                'مدير حساب شخصي مخصص'
            ],
            cta: 'تواصل لجدولة اجتماع',
            popular: false,
            color: '#F59E0B'
        }
    ];

    return (
        <div className="bg-light" style={{ paddingTop: '8rem', paddingBottom: '6rem', minHeight: '100vh', direction: 'rtl' }}>
            <div className="container">
                <div className="text-center mb-3xl">
                    <div className="badge badge-success mb-md" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '0.6rem 1.75rem', borderRadius: '20px', fontWeight: 800, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        باقات التوظيف الجريئة ✨
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)', lineHeight: 1.2 }}>
                        استثمر في كادر لا ينام! 🚀
                    </h2>
                    <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.7, fontWeight: 500 }}>
                        تبدأ رحلة الأتمتة معنا بعرض <strong style={{ color: '#10B981' }}>بداية ميسّرة لمدة 3 أشهر</strong>، مما يتيح لك تقييم أداء الموظف الذكي والتأكد من النتائج بتكلفة منخفضة جداً، قبل الانتقال للأسعار الطبيعية والاستثمار طويل الأمد.
                    </p>

                    {/* Billing Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        margin: '0 auto 4rem',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.5rem',
                        borderRadius: '20px',
                        width: 'fit-content',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: billingCycle === 'monthly' ? '#8B5CF6' : 'transparent',
                                color: billingCycle === 'monthly' ? '#FFF' : '#A1A1AA',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            دفع شهري
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: billingCycle === 'yearly' ? '#8B5CF6' : 'transparent',
                                color: billingCycle === 'yearly' ? '#FFF' : '#A1A1AA',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            دفع سنوي
                            <span style={{
                                background: billingCycle === 'yearly' ? 'white' : 'rgba(139, 92, 246, 0.15)',
                                color: billingCycle === 'yearly' ? '#8B5CF6' : '#8B5CF6',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: 900
                            }}>وفر 20%</span>
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {plans.map((plan) => {
                        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                        return (
                            <div
                                key={plan.id}
                                className="card"
                                style={{
                                    background: plan.popular ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(24, 24, 27, 1) 100%)' : '#18181B',
                                    border: plan.popular ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '32px',
                                    padding: '2.5rem',
                                    position: 'relative',
                                    transform: plan.popular ? 'scale(1.03)' : 'none',
                                    boxShadow: plan.popular ? `0 20px 50px rgba(${hexToRgb(plan.color)}, 0.15)` : '0 10px 30px rgba(0,0,0,0.1)',
                                    zIndex: plan.popular ? 2 : 1,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%'
                                }}
                            >
                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-16px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: plan.color,
                                        color: 'white',
                                        padding: '0.5rem 1.5rem',
                                        borderRadius: '20px',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        boxShadow: `0 10px 20px rgba(${hexToRgb(plan.color)}, 0.3)`,
                                        whiteSpace: 'nowrap',
                                        border: '1px solid rgba(255,255,255,0.2)'
                                    }}>
                                        الأكثر اختياراً ✨
                                    </div>
                                )}

                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{
                                        width: '64px', height: '64px',
                                        borderRadius: '18px',
                                        background: `rgba(${hexToRgb(plan.color)}, 0.15)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        border: `1px solid rgba(${hexToRgb(plan.color)}, 0.3)`
                                    }}>
                                        {plan.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.75rem', color: '#FFF' }}>
                                        {plan.name}
                                    </h3>
                                    <p style={{ color: '#A1A1AA', fontSize: '1rem', lineHeight: 1.6, minHeight: '48px' }}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{price}</span>
                                        <span style={{ fontSize: '1.1rem', color: '#71717A', fontWeight: 600 }}>ريال / {billingCycle === 'monthly' ? 'شهر' : 'شهر (يُدفع سنوياً)'}</span>
                                    </div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10B981',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '12px',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                        <Zap size={18} fill="currentColor" />
                                        تجربة 3 شهور: {plan.trialPrice} ريال/شهرياً!
                                    </div>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <div style={{ marginTop: '3px' }}>
                                                <CheckCircle2 size={18} color={plan.color} />
                                            </div>
                                            <span style={{ color: '#E4E4E7', fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        background: plan.popular ? plan.color : '#27272A',
                                        color: plan.popular ? '#FFF' : '#E4E4E7',
                                        textAlign: 'center',
                                        fontWeight: 900,
                                        fontSize: '1.1rem',
                                        border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: plan.popular ? `0 10px 25px rgba(${hexToRgb(plan.color)}, 0.3)` : 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!plan.popular) {
                                            e.currentTarget.style.background = '#3F3F46';
                                        } else {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!plan.popular) {
                                            e.currentTarget.style.background = '#27272A';
                                        } else {
                                            e.currentTarget.style.transform = 'none';
                                        }
                                    }}
                                >
                                    {isHiringFlow ? 'اعتماد الباقة والمتابعة لتوقيع العقد' : plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Helper function to convert hex to rgb for rgba usage
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '139, 92, 246';
}

export default Pricing;
