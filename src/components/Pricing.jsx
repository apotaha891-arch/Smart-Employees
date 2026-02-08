import React from 'react';
import { Link } from 'react-router-dom';

const Pricing = () => {
    const plans = [
        {
            name: 'باقة الاستقطاب',
            price: '29',
            credits: '500',
            features: [
                '500 موعد مستخرج/شهرياً',
                'لوحة تحكم الموظف الأساسية',
                'تصدير البيانات إلى Excel',
                'دعم عبر البريد الإلكتروني'
            ],
            cta: 'تجديد العقد',
            popular: false
        },
        {
            name: 'باقة الموظف المثالي',
            price: '79',
            credits: '2500',
            features: [
                '2500 موعد مستخرج/شهرياً',
                'أولوية في سرعة معالجة Gemini Flash',
                'دعم فني تقني مباشر',
                'تقارير أداء أسبوعية'
            ],
            cta: 'توظيف الآن',
            popular: true
        },
        {
            name: 'باقة المراكز الطبية',
            price: '199',
            credits: 'غير محدود',
            features: [
                'مواعيد غير محدودة',
                'تخصيص كامل للهوية البصرية',
                'ربط API مع أنظمة العيادة',
                'مدير حساب مخصص'
            ],
            cta: 'تواصل معنا',
            popular: false
        }
    ];

    return (
        <div className="bg-light py-3xl">
            <div className="container text-center">
                <div className="page-header mb-3xl">
                    <div className="badge badge-success mb-md">انتهت الفترة التجريبية 🎁</div>
                    <h2>لقد أثبت موظفك الذكي كفاءته! 🚀</h2>
                    <p className="text-secondary" style={{ fontSize: '1.2rem' }}>
                        اختر باقة "الاستبقاء" المناسبة لمواصلة أتمتة مواعيدك ورفع كفاءة منشأتك.
                    </p>
                </div>

                <div className="grid grid-3 gap-xl">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`card p-2xl text-center ${plan.popular ? 'card-solid' : 'card-light'}`}
                            style={{
                                position: 'relative',
                                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                transform: plan.popular ? 'scale(1.05)' : 'none',
                                zIndex: plan.popular ? 2 : 1,
                                boxShadow: plan.popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                paddingTop: '3.5rem' // Increased top padding to accommodate badge
                            }}
                        >
                            {plan.popular && (
                                <div
                                    className="badge badge-success"
                                    style={{
                                        position: 'absolute',
                                        top: '-15px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '0.5rem 1.5rem',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    الأكثر طلباً
                                </div>
                            )}

                            <h3 className="mb-sm">{plan.name}</h3>
                            <div className="mb-xl">
                                <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)' }}>${plan.price}</span>
                                <span className="text-muted" style={{ fontSize: '1rem' }}>/شهرياً</span>
                            </div>

                            <ul className="text-right mb-2xl" style={{ listStyle: 'none', padding: 0 }}>
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="mb-sm flex align-center gap-sm">
                                        <span style={{ color: 'var(--success)' }}>✅</span>
                                        <span style={{ fontSize: '0.95rem' }}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`btn w-full btn-lg ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-3xl card p-xl" style={{
                    maxWidth: '800px',
                    margin: '6rem auto 0',
                    background: 'white',
                    borderRight: '5px solid var(--accent)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div className="flex align-center gap-md">
                        <span style={{ fontSize: '2rem' }}>💡</span>
                        <div className="text-right">
                            <h4 className="mb-xs">باقة تطوير المهارات ($10 لمرة واحدة)</h4>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                هل تريد تدريب موظفك على خدمات جديدة أو سياسات محدثة؟ ادفع مرة واحدة وسيقوم بدراسة ملفاتك فوراً.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
