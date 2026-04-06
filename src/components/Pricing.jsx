import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, Star, Crown, Loader, ShieldCheck } from 'lucide-react';
import { supabase, getProfile } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import ManusHero from './ManusHero';

const Pricing = () => {
    const location = useLocation();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const pricingPlans = t('pricingPlans');

    const isHiringFlow = location.state?.fromInterview;
    const businessRules = location.state?.businessRules || null;
    const template = location.state?.template || null;

    const [billingCycle, setBillingCycle] = useState('monthly');
    const [viewMode, setViewMode] = useState('customer'); // 'customer' or 'agency'
    const [userPlan, setUserPlan] = useState('free');
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const plan = profileResult.data.subscription_tier || profileResult.data.subscription_plan || 'free';
                    setUserPlan(plan.toLowerCase());
                    // If user is already an agency, show agency plans by default
                    if (profileResult.data.is_agency) {
                        setViewMode('agency');
                    }
                }
            }
        };
        fetchUserData();
    }, []);

    const [loadingPlan, setLoadingPlan] = useState(null);

    const handleSelectPlan = async (plan) => {
        // Skip checkout for Enterprise (Contact Sales) - Accessible to both Guests and Users
        if (plan.id === 'enterprise') {
            // Open Noura Chat with special 'elite' context
            window.dispatchEvent(new CustomEvent('open-concierge', { detail: { type: 'elite' } }));
            return;
        }

        if (!currentUserId) {
            navigate('/login');
            return;
        }

        // If it's the current plan and we're not in the hiring flow, just go to dashboard
        if (plan.id === userPlan && !isHiringFlow) {
            navigate('/dashboard');
            return;
        }

        setLoadingPlan(plan.id);

        try {
            // Get user session to authenticate Edge Function
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert(t('loginRequired'));
                navigate('/login');
                return;
            }

            const origin = window.location.origin;
            let successUrl = `${origin}/entity-setup?tab=integrations&session_id={CHECKOUT_SESSION_ID}&success=true`;
            let cancelUrl = `${origin}/pricing?canceled=true`;

            // For add-ons, redirect to dashboard on success
            if (plan.id?.startsWith('addon_')) {
                successUrl = `${origin}/dashboard?refill=success&plan=${plan.id}`;
            } else if (isHiringFlow) {
                successUrl = `${origin}/contract?session_id={CHECKOUT_SESSION_ID}&success=true&plan=${plan.id}`;
            }

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    planId: plan.id,
                    successUrl,
                    cancelUrl
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) {
                console.error("Function invoke error (raw):", error);
                let detailedError = "Unknown error";
                if (error instanceof Error) {
                    detailedError = error.message;
                }

                try {
                    if (error.context) {
                        const ctxText = await error.context.text();
                        detailedError += " | Context: " + ctxText;
                    }
                } catch (e) { }

                // Graceful fallback for 404 (function not deployed)
                if (detailedError.includes('NOT_FOUND') || detailedError.includes('404')) {
                    if (isHiringFlow) {
                        navigate(`/contract?session_id=mock_session_404&success=true&plan=${plan.id}`, {
                            state: { businessRules, template, fromInterview: true }
                        });
                    } else {
                        navigate(`/entity-setup?tab=integrations&session_id=mock_session_404&success=true`, {
                            state: { businessRules, template }
                        });
                    }
                    return;
                }

                alert(`حدث خطأ أثناء تحضير صفحة الدفع:\n${detailedError}`);
                return;
            }

            // Check if the function returned an error payload (e.g. missing Stripe price ID)
            if (data?.error) {
                const errMsg = data.error;
                if (errMsg.includes('not configured') || errMsg.includes('Price ID')) {
                    alert(
                        language === 'ar'
                            ? `⚙️ لم يتم ضبط سعر Stripe لهذه الباقة بعد.\n\nيرجى إضافة المتغير التالي في إعدادات Supabase:\nSTRIPE_PRICE_${plan.id.toUpperCase()}\n\nأو تواصل مع المسؤول.`
                            : `⚙️ Stripe price is not configured for this plan yet.\nPlease add the environment variable:\nSTRIPE_PRICE_${plan.id.toUpperCase()}`
                    );
                } else {
                    alert(`حدث خطأ: ${errMsg}`);
                }
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
            } else {
                alert("حدث خطأ أثناء تحضير صفحة الدفع. رجاءً المحاولة لاحقاً.");
            }

        } catch (error) {
            console.error("Checkout error:", error);
            alert("حدث خطأ في الاتصال بخادم الدفع.");
        } finally {
            setLoadingPlan(null);
        }
    };

    const vibrate = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };

    // Chat Simulation State
    const [visibleMessages, setVisibleMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const messages = [
            { id: 1, role: 'user', contentAr: 'مرحباً! أعتذر عن الإزعاج في هذا الوقت المتأخر، هل يمكنني حجز موعد غداً صباحاً؟', contentEn: 'Hi! Sorry to bother you this late. Can I book an appointment tomorrow morning?' },
            { id: 2, role: 'agent', contentAr: 'أهلاً بك! لا يوجد أي إزعاج أبداً، أنا هنا لخدمتك على مدار الساعة ✨ نعم، يوجد موعد متاح غداً الساعة 10:00 صباحاً. هل أؤكده لك؟', contentEn: 'Welcome! No bother at all, I am here 24/7 ✨ Yes, we have a slot at 10:00 AM tomorrow. Should I confirm it for you?' },
            { id: 3, role: 'user', contentAr: 'واو! شكراً لسرعة الرد. نعم أرجوك أكدي الموعد.', contentEn: 'Wow! Thanks for the fast reply. Yes please, confirm it.' },
            { id: 4, role: 'agent', contentAr: 'تم تأكيد موعدك بنجاح ✅ أرسلت لك تفاصيل الموقع. طابت ليلتك ونتطلع لرؤيتك غداً!', contentEn: 'Your appointment is confirmed ✅ I sent you the location details. Have a good night and see you tomorrow!' }
        ];

        let currentIndex = 0;
        let timeoutIds = [];

        const simulateChat = () => {
            if (currentIndex >= messages.length) {
                // Restart animation after a long pause
                const restartId = setTimeout(() => {
                    setVisibleMessages([]);
                    currentIndex = 0;
                    simulateChat();
                }, 5000);
                timeoutIds.push(restartId);
                return;
            }

            const currentMsg = messages[currentIndex];

            // Show typing indicator if agent
            if (currentMsg.role === 'agent') {
                setIsTyping(true);
                const typingDuration = currentMsg.contentEn.length * 30; // Simulate typing delay based on length

                const showMsgId = setTimeout(() => {
                    setIsTyping(false);
                    setVisibleMessages(prev => [...prev, currentMsg]);
                    currentIndex++;
                    simulateChat();
                }, Math.min(typingDuration, 2000)); // Cap at 2 seconds
                timeoutIds.push(showMsgId);
            } else {
                // User messages appear instantly after a short pause
                const showUserMsgId = setTimeout(() => {
                    setVisibleMessages(prev => [...prev, currentMsg]);
                    currentIndex++;
                    simulateChat();
                }, 1000);
                timeoutIds.push(showUserMsgId);
            }
        };

        // Start animation loop
        const initialStartId = setTimeout(() => {
            simulateChat();
        }, 1000);
        timeoutIds.push(initialStartId);

        return () => {
            timeoutIds.forEach(clearTimeout);
        };
    }, []);

    const [dbPlans, setDbPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const loadPricing = async () => {
            try {
                const { getPlatformSettings } = await import('../services/adminService');
                const data = await getPlatformSettings('pricing_plans');
                if (data) setDbPlans(data);
            } catch (err) {
                console.error('Failed to load pricing from DB:', err);
            } finally {
                setLoadingPlans(false);
            }
        };
        loadPricing();
    }, []);

    const getPlanValue = (id, field, fallback) => {
        const dbPlan = dbPlans.find(p => p.id === id);
        return dbPlan && dbPlan[field] !== undefined ? dbPlan[field] : fallback;
    };

    const plans = [
        {
            id: 'starter',
            name: pricingPlans?.starter?.name || 'Starter',
            icon: <Zap size={28} color="#10B981" />,
            monthlyPrice: getPlanValue('starter', 'monthlyPrice', 39),
            yearlyPrice: getPlanValue('starter', 'yearlyPrice', 31),
            trialPrice: getPlanValue('starter', 'trialPrice', 20),
            description: pricingPlans?.starter?.description || '',
            features: [
                `${getPlanValue('starter', 'credits', 2000)} ${language === 'ar' ? 'نقطة (رصيد عمليات) شهرياً' : 'ops units/month'}`,
                language === 'ar' ? 'توظيف موظفين إضافيين بالنقاط' : 'Hire extra agents with points',
                language === 'ar' ? 'ربط قنوات غير محدودة (WA/TG)' : 'Unlimited integrations (WA/TG)',
                language === 'ar' ? 'استجابة ذكية فائقة السرعة' : 'Lightning fast AI response',
                language === 'ar' ? 'تدريب مخصص لقاعدة البيانات' : 'Custom knowledge training',
                language === 'ar' ? 'تقارير أداء متقدمة' : 'Advanced analytics'
            ],
            cta: pricingPlans?.starter?.cta || '',
            trialText: pricingPlans?.starter?.trialText?.replace(/\d+\$/, `${getPlanValue('starter', 'trialPrice', 20)}$`) || '',
            periodStr: pricingPlans?.starter?.periodStr || '',
            popular: false,
            color: '#10B981'
        },
        {
            id: 'pro',
            name: pricingPlans?.pro?.name || 'Pro',
            icon: <Star size={28} color="#8B5CF6" />,
            monthlyPrice: getPlanValue('pro', 'monthlyPrice', 69),
            yearlyPrice: getPlanValue('pro', 'yearlyPrice', 55),
            trialPrice: getPlanValue('pro', 'trialPrice', 45),
            description: pricingPlans?.pro?.description || '',
            features: [
                `${getPlanValue('pro', 'credits', 5000)} ${language === 'ar' ? 'نقطة (رصيد عمليات) شهرياً' : 'ops units/month'}`,
                language === 'ar' ? 'توسع لا محدود للموظفين والأدوات' : 'Unlimited scaling (Agents & Tools)',
                language === 'ar' ? 'أولوية الدعم والتدريب المتقدم' : 'Priority support & training',
                language === 'ar' ? 'استجابة ذكية فائقة السرعة' : 'Lightning fast AI response',
                language === 'ar' ? 'تحليلات عميقة لنمو الأعمال' : 'Deep growth analytics',
                language === 'ar' ? 'خصومات حصرية على شحن النقاط' : 'Exclusive refill discounts'
            ],
            cta: pricingPlans?.pro?.cta || '',
            trialText: pricingPlans?.pro?.trialText?.replace(/\d+\$/, `${getPlanValue('pro', 'trialPrice', 45)}$`) || '',
            periodStr: pricingPlans?.pro?.periodStr || '',
            popular: true,
            color: '#8B5CF6'
        },
        {
            id: 'enterprise',
            name: pricingPlans?.enterprise?.name || 'Elite',
            icon: <ShieldCheck size={28} color="#F59E0B" />,
            monthlyPrice: getPlanValue('enterprise', 'monthlyPrice', 199),
            yearlyPrice: getPlanValue('enterprise', 'yearlyPrice', 159),
            trialPrice: getPlanValue('enterprise', 'trialPrice', null),
            description: pricingPlans?.enterprise?.description || '',
            features: pricingPlans?.enterprise?.features || [],
            cta: pricingPlans?.enterprise?.cta || '',
            popular: false,
            color: '#F59E0B'
        }
    ];

    const addons = [
        { id: 'addon_1k', credits: getPlanValue('addon_1k', 'credits', 1000), price: getPlanValue('addon_1k', 'monthlyPrice', 10) },
        { id: 'addon_5k', credits: getPlanValue('addon_5k', 'credits', 5000), price: getPlanValue('addon_5k', 'monthlyPrice', 35) }
    ];

    const agencyPlans = [
        {
            id: 'agency_silver',
            name: language === 'ar' ? 'الوكالة الفضية' : 'Silver Agency',
            icon: <Shield size={28} color="#94A3B8" />,
            monthlyPrice: 299,
            yearlyPrice: 239,
            description: language === 'ar' ? 'البداية المثالية للوكالات المتوسطة' : 'Perfect start for mid-sized agencies',
            features: [
                `${language === 'ar' ? 'إدارة حتى 5 حسابات منشآت' : 'Manage up to 5 sub-accounts'}`,
                `50,000 ${language === 'ar' ? 'نقطة رصيد مرنة للحسابات' : 'Flexible Credit Pool'}`,
                language === 'ar' ? 'لوحة تحكم إدارية للوكالة' : 'Master Agency Dashboard',
                language === 'ar' ? 'توزيع الرصيد بحرية كاملة' : 'Free Credit distribution',
                language === 'ar' ? 'دعم فني أولوية للوكلاء' : 'Priority Agent Support'
            ],
            cta: language === 'ar' ? 'اشترك كوكالة فضية' : 'Join as Silver Agency',
            color: '#94A3B8'
        },
        {
            id: 'agency_gold',
            name: language === 'ar' ? 'الوكالة الذهبية' : 'Gold Agency',
            icon: <Crown size={28} color="#F59E0B" />,
            monthlyPrice: 799,
            yearlyPrice: 639,
            description: language === 'ar' ? 'للشركات والمكاتب ذات النمو السريع' : 'For fast-growing agencies & firms',
            features: [
                `${language === 'ar' ? 'إدارة حتى 20 حساب منشأة' : 'Manage up to 20 sub-accounts'}`,
                `250,000 ${language === 'ar' ? 'نقطة رصيد مرنة للنمو' : 'Flexible Growth Credits'}`,
                language === 'ar' ? 'لوحة تحكم كاملة وشاملة' : 'Full Master Dashboard',
                language === 'ar' ? 'توزع ذكي وتلقائي للرصيد' : 'Smart Credit Distribution',
                language === 'ar' ? 'دعم فني مخصص (VIP)' : 'Dedicated VIP Support',
                language === 'ar' ? 'أولوية في تحديثات النظام' : 'Early access to updates'
            ],
            cta: language === 'ar' ? 'اشترك كوكالة ذهبية' : 'Join as Gold Agency',
            popular: true,
            color: '#F59E0B'
        },
        {
            id: 'agency_platinum',
            name: language === 'ar' ? 'الوكالة البلاتينية' : 'Platinum Agency',
            icon: <ShieldCheck size={28} color="#A78BFA" />,
            monthlyPrice: 1499,
            yearlyPrice: 1199,
            description: language === 'ar' ? 'حلول ضخمة للمنظمات التي لا تعرف الحدود' : 'Unlimited solutions for large organizations',
            features: [
                `${language === 'ar' ? '50 حساب منشأة' : '50 Sub-accounts'}`,
                `1,000,000 ${language === 'ar' ? 'نقطة رصيد إجمالية' : 'Total Credit Pool'}`,
                language === 'ar' ? 'لوحة تحكم متفوقة' : 'Enterprise Agency Panel',
                language === 'ar' ? 'API وصول خاص (قريباً)' : 'Private API Access (Soon)',
                language === 'ar' ? 'إدارة حساب مخصص' : 'Dedicated Account Manager'
            ],
            cta: language === 'ar' ? 'تواصل معنا (بلاتينيوم)' : 'Contact Sales (Platinum)',
            color: '#A78BFA'
        }
    ];

    const currentPlans = viewMode === 'agency' ? agencyPlans : plans;

    return (
        <div className="bg-light" style={{ paddingTop: '8rem', paddingBottom: '6rem', minHeight: '100vh', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="container">
                <div className="text-center mb-3xl">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'center', marginBottom: '4rem' }}>
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="badge badge-success mb-md" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '0.6rem 1.75rem', borderRadius: '20px', fontWeight: 800, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                {viewMode === 'agency' ? (language === 'ar' ? 'حلول الوكالات وإعادة البيع' : 'Agency Reseller Solutions') : (language === 'ar' ? 'استثمار ذكي لمستقبل منشأتك' : 'Smart Investment for Your Business')}
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)', lineHeight: 1.2 }}>
                                {viewMode === 'agency' 
                                    ? (language === 'ar' ? 'كن شريكنا، وقدم خدمة AI لعملائك.' : 'Partner with us, Provide AI for your clients.')
                                    : (language === 'ar' ? 'موظف لا ينام، بتكلفة لا تقارن.' : 'An Employee Who Never Sleeps, at an Unbeatable Cost.')}
                            </h2>
                            <p className="text-secondary" style={{ fontSize: '1.25rem', lineHeight: 1.7, fontWeight: 500, margin: '0' }}>
                                {viewMode === 'agency'
                                    ? (language === 'ar' ? 'سواء كنت وكالة تسويق أو شركة تقنية، قم بتوزيع الرصيد وإدارة عملائك من لوحة تحكم واحدة وبسهولة تامة.' : 'Whether you are a marketing agency or a tech firm, distribute credits and manage your clients from a single central dashboard.')
                                    : (language === 'ar' ? 'تخيل موظفاً يرد على عملائك فيตี3 فجراً، يغلق الصفقات، ويحجز المواعيد بلباقة تامة، بدون إجازات أو أخطاء وبجزء بسيط من تكلفة الموظف التقليدي.' : 'Imagine an employee replying to your customers at 3 AM, closing deals, and booking appointments politely, with no days off or errors, at a fraction of the cost.')}
                            </p>
                        </div>

                        {/* Convincing Telegram Chat Mockup */}
                        <div style={{
                            width: '100%',
                            maxWidth: '450px',
                            background: '#0F172A',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            transform: 'rotate(-2deg)',
                            transition: 'transform 0.3s ease',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-2deg)'}
                        >
                            {/* Telegram Header */}
                            <div style={{
                                background: '#1E293B',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <Star size={20} />
                                </div>
                                <div style={{ textAlign: language === 'ar' ? 'right' : 'left', flex: 1 }}>
                                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{language === 'ar' ? 'سارة - موظفة المبيعات' : 'Sarah - Sales Agent'}</div>
                                    <div style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>{language === 'ar' ? 'متصل الآن (3:14 ص)' : 'Online Now (3:14 AM)'}</div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#09090B', minHeight: '300px' }}>
                                {visibleMessages.map((msg) => (
                                    <div key={msg.id} className="animate-fade-in" style={{
                                        alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
                                        background: msg.role === 'user' ? '#27272A' : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: msg.role === 'user' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                                        color: msg.role === 'user' ? '#E4E4E7' : 'white',
                                        fontSize: '0.9rem',
                                        maxWidth: '85%',
                                        border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(139, 92, 246, 0.3)',
                                        boxShadow: msg.role === 'user' ? 'none' : '0 4px 12px rgba(139,92,246,0.1)'
                                    }}>
                                        {language === 'ar' ? msg.contentAr : msg.contentEn}
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="animate-fade-in" style={{
                                        alignSelf: 'flex-end',
                                        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '16px 16px 4px 16px',
                                        maxWidth: '85%',
                                        border: '1px solid rgba(139, 92, 246, 0.3)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '14px' }}>
                                            <div style={{ width: '6px', height: '6px', background: '#A78BFA', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}></div>
                                            <div style={{ width: '6px', height: '6px', background: '#A78BFA', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}></div>
                                            <div style={{ width: '6px', height: '6px', background: '#A78BFA', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add pulsing circle to draw attention */}
                    <div style={{ marginTop: '-2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', fontWeight: 600, fontSize: '0.9rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1.25rem', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.2)', zIndex: 2 }}>
                        <div style={{ width: '8px', height: '8px', background: '#8B5CF6', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                        {language === 'ar' ? 'شاهد المحاكاة الحية أعلاه' : 'Watch Live Simulation Above'}
                    </div>
                </div>

                {/* Manus Inspiration Layout */}
                <ManusHero />

                 {/* Role Toggle & Billing Cycle */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', marginBottom: '4rem' }}>
                    {/* View Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.4rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        width: 'fit-content'
                    }}>
                        <button
                            onClick={() => setViewMode('customer')}
                            style={{
                                padding: '0.8rem 2rem',
                                borderRadius: '18px',
                                border: 'none',
                                background: viewMode === 'customer' ? '#1E293B' : 'transparent',
                                color: viewMode === 'customer' ? 'white' : '#9CA3AF',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                zIndex: 2
                            }}
                        >
                            {language === 'ar' ? 'للمنشآت' : 'Individual Business'}
                        </button>
                        <button
                            onClick={() => setViewMode('agency')}
                            style={{
                                padding: '0.8rem 2rem',
                                borderRadius: '18px',
                                border: 'none',
                                background: viewMode === 'agency' ? 'linear-gradient(135deg, #8B5CF6, #3B82F6)' : 'transparent',
                                color: viewMode === 'agency' ? 'white' : '#9CA3AF',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                zIndex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <ShieldCheck size={18} />
                            {language === 'ar' ? 'للوكالات' : 'For Agencies'}
                        </button>
                    </div>

                    {/* Billing Cycle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
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
                            {t('payMonthly')}
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
                            {t('payYearly')}
                            <span style={{
                                background: billingCycle === 'yearly' ? 'white' : 'rgba(139, 92, 246, 0.15)',
                                color: billingCycle === 'yearly' ? '#8B5CF6' : '#8B5CF6',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: 900
                            }}>{t('save20')}</span>
                        </button>
                    </div>
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
                {currentPlans.map((plan) => {
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
                                    {t('mostPopular')}
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
                                    {plan.id === 'enterprise' ? (
                                        <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>
                                            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                                        </span>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{price}</span>
                                            <span style={{ fontSize: '1.1rem', color: '#71717A', fontWeight: 600 }}>$ / {billingCycle === 'monthly' ? t('month') : t('monthYearly')}</span>
                                        </>
                                    )}
                                </div>
                                {plan.trialPrice && (
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
                                        {t('trialNote').replace('{price}', plan.trialPrice)}
                                    </div>
                                )}
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
                                    background: plan.id === userPlan ? 'rgba(16, 185, 129, 0.1)' : (plan.popular ? plan.color : '#27272A'),
                                    color: plan.id === userPlan ? '#10B981' : (plan.popular ? '#FFF' : '#E4E4E7'),
                                    textAlign: 'center',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    border: plan.id === userPlan ? '1px solid rgba(16, 185, 129, 0.3)' : (plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)'),
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: plan.popular && plan.id !== userPlan ? `0 10px 25px rgba(${hexToRgb(plan.color)}, 0.3)` : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (plan.id === userPlan) return;
                                    if (!plan.popular) {
                                        e.currentTarget.style.background = '#3F3F46';
                                    } else {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (plan.id === userPlan) return;
                                    if (!plan.popular) {
                                        e.currentTarget.style.background = '#27272A';
                                    } else {
                                        e.currentTarget.style.transform = 'none';
                                    }
                                }}
                            >
                                {plan.id === userPlan ? (language === 'ar' ? 'خطتك الحالية' : 'Current Plan') : (isHiringFlow ? t('approvePlanContract') : plan.cta)}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Quick Add-ons Section */}
            <div className="container" style={{ marginTop: '6rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: '#FFF' }}>
                        {language === 'ar' ? '🚀 شحن نقاط إضافية' : '🚀 Quick Points Refill'}
                    </h3>
                    <p style={{ color: '#A1A1AA', fontSize: '1.1rem' }}>
                        {language === 'ar' ? 'هل استنفدت نقاط باقتك؟ اشحن رصيدك الآن لضمان استمرار عمل موظفيك الذكيين.' : 'Out of credits? Top up your wallet now to keep your smart agents working.'}
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    maxWidth: '900px',
                    margin: '0 auto'
                }}>
                    {/* Add-on 1000 Points */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        padding: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s'
                    }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#8B5CF6'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                        <div>
                            <div style={{ color: '#8B5CF6', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{addons[0].credits.toLocaleString()} {t('points')}</div>
                            <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>{language === 'ar' ? 'رصيد محادثات إضافي' : 'Extra conversation credits'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF' }}>${addons[0].price}</div>
                            <button 
                                onClick={() => { vibrate(); handleSelectPlan(addons[0]); }}
                                disabled={loadingPlan === addons[0].id}
                                style={{
                                    background: '#8B5CF6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    marginTop: '0.5rem',
                                    cursor: loadingPlan === addons[0].id ? 'not-allowed' : 'pointer',
                                    opacity: loadingPlan === addons[0].id ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {loadingPlan === addons[0].id ? <Loader size={16} className="animate-spin" /> : null}
                                {loadingPlan === addons[0].id ? (language === 'ar' ? 'جاري التحضير...' : 'Processing...') : (language === 'ar' ? 'اشحن الآن' : 'Buy Now')}
                            </button>
                        </div>
                    </div>

                    {/* Add-on 5000 Points */}
                    <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '24px',
                        padding: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '10px', right: '-35px', background: '#EF4444', color: 'white', padding: '2px 40px', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 900 }}>
                            SAVE 30%
                        </div>
                        <div>
                            <div style={{ color: '#8B5CF6', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{addons[1].credits.toLocaleString()} {t('points')}</div>
                            <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>{language === 'ar' ? 'باقة شحن كبيرة' : 'Bulk refill pack'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF' }}>${addons[1].price}</div>
                            <button 
                                onClick={() => { vibrate(); handleSelectPlan(addons[1]); }}
                                disabled={loadingPlan === addons[1].id}
                                style={{
                                    background: '#FFF',
                                    color: '#8B5CF6',
                                    border: 'none',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    marginTop: '0.5rem',
                                    cursor: loadingPlan === addons[1].id ? 'not-allowed' : 'pointer',
                                    opacity: loadingPlan === addons[1].id ? 0.8 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {loadingPlan === addons[1].id ? <Loader size={16} className="animate-spin" /> : null}
                                {loadingPlan === addons[1].id ? (language === 'ar' ? 'جاري التحضير...' : 'Processing...') : (language === 'ar' ? 'اشحن الآن' : 'Buy Now')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Table Section */}
            <div className="container" style={{ marginTop: '8rem', paddingBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF' }}>
                        {language === 'ar' ? '📊 قارن بين الباقات' : '📊 Compare Plans'}
                    </h3>
                    <p style={{ color: '#A1A1AA', fontSize: '1.2rem' }}>
                        {language === 'ar' ? 'اختر القوة التي تناسب طموح منشأتك' : 'Choose the power that fits your facility\'s ambition'}
                    </p>
                </div>

                <div style={{ overflowX: 'auto', background: '#18181B', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: language === 'ar' ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '2rem', color: '#71717A', fontWeight: 600 }}>{language === 'ar' ? 'الميزة' : 'Feature'}</th>
                                <th style={{ padding: '2rem', color: '#06B6D4', fontWeight: 900, fontSize: '1.2rem' }}>{language === 'ar' ? 'الباقة الأساسية' : 'Starter'}</th>
                                <th style={{ padding: '2rem', color: '#8B5CF6', fontWeight: 900, fontSize: '1.2rem', background: 'rgba(139, 92, 246, 0.05)' }}>{language === 'ar' ? 'الباقة المتقدمة' : 'Pro'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: language === 'ar' ? 'عدد النقاط (المحادثات)' : 'Credits (Messages)', starter: '2,000', pro: '5,000' },
                                { name: language === 'ar' ? 'عدد الموظفين الرقميين' : 'Number of Agents', starter: '1', pro: '2' },
                                { name: language === 'ar' ? 'أدوات الربط لكل موظف' : 'Connections per Agent', starter: '2', pro: '3' },
                                { name: language === 'ar' ? 'تكلفة الموظف الإضافي' : 'Extra Agent Cost', starter: '$25', pro: '$19' },
                                { name: language === 'ar' ? 'سرعة الاستجابة' : 'Response priority', starter: '✅', pro: '✅' },
                                { name: language === 'ar' ? 'تدريب مخصص' : 'Custom Training', starter: '✅', pro: '✅' },
                                { name: language === 'ar' ? 'تقارير متقدمة' : 'Advanced Analytics', starter: '✅', pro: '✅' },
                            ].map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.5rem 2rem', color: '#E4E4E7', fontWeight: 600 }}>{row.name}</td>
                                    <td style={{ padding: '1.5rem 2rem', color: '#A1A1AA' }}>{row.starter}</td>
                                    <td style={{ padding: '1.5rem 2rem', color: '#FFF', fontWeight: 700, background: 'rgba(139, 92, 246, 0.05)' }}>{row.pro}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
