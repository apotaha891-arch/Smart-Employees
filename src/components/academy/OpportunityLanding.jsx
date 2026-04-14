import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AcademyLayout from '../layouts/AcademyLayout';
import { useLanguage } from '../../LanguageContext';
import { supabase } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';
import { 
    CheckCircle2, ArrowRight, Play, Zap, Phone, User, Users, Mail,
    Building2, Rocket, Star, Quote, ShieldCheck, 
    Clock, Sparkles, Coffee, Briefcase, ChevronRight, AlertCircle,
    Globe, Shield, TrendingUp, Handshake, DollarSign, HelpCircle,
    Info, Lock, Settings, BarChart, ZapOff, Fingerprint, Award
} from 'lucide-react';

const OpportunityLanding = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const location = useLocation();
    const navigate = useNavigate();
    
    // Proactive Segmentation Logic
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get('type');
    const affCode = queryParams.get('ref') || queryParams.get('aff');
    
    const [userType, setUserType] = useState(initialType);
    const [step, setStep] = useState(initialType ? 0 : -1); 
    const [loading, setLoading] = useState(false);
    
    // Localization & Dynamic Messaging Logic
    const country = queryParams.get('country') || 'eg'; // 'gcc' or 'eg'
    const isGCC = country === 'gcc';
    const currency = isGCC ? (isArabic ? 'ريال' : 'SAR') : '$';
    const price = isGCC ? 75 : 20;
    
    const [formData, setFormData] = useState({
        full_name: '',
        whatsapp: '',
        email: '',
        industry: '',
        expected_leads: '',
        ready_for_project: false,
        social_media_skills: false,
        computer_skills: false
    });
    const [config, setConfig] = useState(null);
    const [showExitPopup, setShowExitPopup] = useState(false);
    const [hasSeenExitPopup, setHasSeenExitPopup] = useState(false);
    const [seatsLeft, setSeatsLeft] = useState(7);
    const [paymentError, setPaymentError] = useState(null);
    const formRef = useRef(null);

    const t = (ar, en) => isArabic ? ar : en;

    useEffect(() => {
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !hasSeenExitPopup) {
                setShowExitPopup(true);
                setHasSeenExitPopup(true);
            }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasSeenExitPopup]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    useEffect(() => {
        const savedSeats = localStorage.getItem('academy_seats_v1');
        let currentSeats = 7;
        if (savedSeats) {
            // Decrease seat count on revisit to increase FOMO
            currentSeats = Math.max(2, parseInt(savedSeats) - 1);
        } else {
            // Random start between 7-9 for first-timers
            currentSeats = 7;
        }
        setSeatsLeft(currentSeats);
        localStorage.setItem('academy_seats_v1', currentSeats.toString());
    }, []);





    const selectUserType = (type) => {
        setUserType(type);
        setStep(0);
        navigate(`/start?type=${type}${affCode ? `&ref=${affCode}` : ''}`, { replace: true });
    };

    const scrollToForm = () => {
        setStep(1);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmitClassification = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let referrerId = null;
            if (affCode) {
                const { data: affData } = await supabase
                    .from('academy_affiliates')
                    .select('id')
                    .eq('affiliate_code', affCode)
                    .eq('status', 'active')
                    .maybeSingle();
                if (affData) referrerId = affData.id;
            }

            console.log("Saving lead info for:", formData.email);
            const { error: insertError } = await supabase.from('academy_leads').insert([{
                full_name: formData.full_name,
                whatsapp: formData.whatsapp,
                email: formData.email,
                user_type: userType,
                industry: formData.industry,
                expected_leads: formData.expected_leads,
                ready_for_project: formData.ready_for_project,
                social_media_skills: formData.social_media_skills,
                computer_skills: formData.computer_skills,
                referrer_id: referrerId,
                user_id: user?.id || null, 
                status: 'knockout_viewed'
            }]);

            if (insertError) {
                console.warn("Metadata save failed (Schema mismatch?), continuing flow:", insertError.message);
            }
            
            const segmentKey = `${userType}_${formData.industry}`;
            const { data: configData } = await supabase
                .from('academy_config')
                .select('*')
                .or(`segment_key.eq.${segmentKey},segment_key.eq.${userType},segment_key.eq.generic`)
                .order('segment_key', { ascending: false })
                .limit(1)
                .single();

            setConfig(configData);
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Funnel error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = async () => {
        setLoading(true);
        setPaymentError(null);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    planId: 'academy_access',
                    guestEmail: formData.email, // Passing email for guest checkout
                    successUrl: `${window.location.origin}/academy/success`,
                    cancelUrl: window.location.href
                }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else if (data?.error) {
                // This captures our "fake 200" errors with descriptive messages
                setPaymentError(`${t('فشل إنشاء رابط الدفع:', 'Payment creation failed:')} ${data.error}`);
            } else {
                setPaymentError(t('عذراً، فشل إنشاء رابط الدفع. يرجى التأكد من إعدادات Stripe في لوحة التحكم.', 'Sorry, failed to generate payment link. Please check Stripe settings in the Admin Dashboard.'));
            }
        } catch (e) {
            console.error('Full Payment Error Object:', e);
            let technicalMsg = t('حدث خطأ تقني في الاتصال ببوابة الدفع.', 'A technical error occurred while connecting to the payment gateway.');
            setPaymentError(`${technicalMsg} (${e.message || 'Unknown Error'})`);
        } finally {
            setLoading(false);
        }
    };

    const ExitIntentPopup = () => {
        const [step, setStep] = useState('survey'); // survey, offer_free, offer_chat

        if (!showExitPopup) return null;

        const handleSurvey = (choice) => {
            if (choice === 'price') setStep('offer_free');
            else if (choice === 'info' || choice === 'risk') setStep('offer_chat');
            else setShowExitPopup(false);
        };

        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} className="animate-fade-in">
                <div style={{ background: 'var(--color-bg-surface)', width: '100%', maxWidth: '550px', borderRadius: '40px', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '3rem', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                    <button onClick={() => setShowExitPopup(false)} style={{ position: 'absolute', top: '20px', left: isArabic ? 'auto' : '20px', right: isArabic ? '20px' : 'auto', background: 'transparent', border: 'none', color: '#4B5563', cursor: 'pointer' }}>
                        <ZapOff size={24} />
                    </button>

                    {step === 'survey' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <AlertCircle size={35} color="#8B5CF6" />
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '1.5rem' }}>{t('لحظة واحدة.. لا تضيع فرصة العمر!', 'Wait! Don\'t miss the opportunity of a lifetime!')}</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>{t('أنا مهتم جداً بمعرفة سبب تراجعك الآن، هل يمكننا مساعدتك في شيء معين؟', 'I\'m genuinely curious why you\'re hesitant. Can we help with something?')}</p>
                            
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {[
                                    { id: 'price', label: t('السعر مرتفع بالنسبة لي حالياً', 'The price is too high for now') },
                                    { id: 'info', label: t('أحتاج لمعلومات أكثر قبل القرار', 'I need more info before deciding') },
                                    { id: 'risk', label: t('لست متأكداً من تحقيق النتيجة', 'I\'m not sure about the results') },
                                    { id: 'browsing', label: t('كنت أتصفح فقط (لا شكراً)', 'Just browsing (No thanks)') }
                                ].map(option => (
                                    <button 
                                        key={option.id}
                                        onClick={() => handleSurvey(option.id)}
                                        style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '16px', color: 'var(--color-text-main)', fontWeight: 700, cursor: 'pointer', textAlign: isArabic ? 'right' : 'left', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'offer_free' && (
                        <div style={{ textAlign: 'center' }}>
                            <Star size={60} color="#F59E0B" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))' }} />
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '1.5rem' }}>{t('حسناً.. ماذا عن حساب مجاني؟', 'Okay.. how about a Free Account?')}</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>{t('لا تدع المال يكون عائقاً. سنمنحك حساباً أساسياً لتجربة المنصة واستكشاف الإمكانيات مجاناً.', 'Don\'t let money be an obstacle. We\'ll give you a basic account to test the platform and explore the possibilities for free.')}</p>
                            <button 
                                onClick={() => window.location.href = 'https://t.me/Noura24ShiftBot'}
                                style={{ background: '#F59E0B', color: 'var(--color-text-main)', width: '100%', padding: '1.5rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.2rem', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)' }}
                            >
                                {t('ارسل لي رابط الحساب المجاني (تيليجرام)', 'Send me the Free Account Link (Telegram)')}
                            </button>
                        </div>
                    )}

                    {step === 'offer_chat' && (
                        <div style={{ textAlign: 'center' }}>
                            <Handshake size={60} color="#10B981" style={{ marginBottom: '2rem' }} />
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '1.5rem' }}>{t('دعنا نتحدث بصراحة..', 'Let\'s talk frankly..')}</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>{t('أي مشروع جديد يثير تساؤلات. تحدث معي مباشرة عبر الواتساب للإجابة على أي استفسار تقني أو مهني.', 'Any new venture raises questions. Talk to me directly on WhatsApp to answer any technical or professional inquiries.')}</p>
                            <button 
                                onClick={() => window.location.href = 'https://t.me/Noura24ShiftBot'}
                                style={{ background: '#10B981', color: 'var(--color-text-main)', width: '100%', padding: '1.5rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.2rem', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}
                            >
                                {t('تحدث مع نورة عبر تيليجرام', 'Talk to Noura on Telegram')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const TimerBanner = () => (
        <div style={{ 
            position: 'sticky', top: 0, zIndex: 100, 
            background: 'linear-gradient(to right, #7C3AED, #DB2777)', 
            color: 'var(--color-text-main)', padding: '0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <Users size={18} />
            <span>
                {t(`تنبيه: متبقي فقط ${seatsLeft} مقاعد لهذه المرحلة لضمان جودة الأداء والدعم الفني المكثف.`, `Notice: Only ${seatsLeft} seats remaining for this stage to ensure quality performance and intensive support.`)}
            </span>
        </div>
    );

    const Gatekeeper = () => (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: 950, marginBottom: '1.25rem', lineHeight: 1.15 }}>
                {t('أهلاً بك.. كيف تريد البدء اليوم؟', 'Welcome.. how would you like to start today?')}
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <div 
                    onClick={() => selectUserType('owner')}
                    style={{ padding: '3rem 2rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '32px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#8B5CF6'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                    <Building2 size={50} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{t('صاحب منشأة / عمل', 'Business Owner')}</h3>
                    <p style={{ color: '#6B7280' }}>{t('أريد أتمتة عملياتي بالكامل وتوفير تكاليف التشغيل باستخدام الذكاء الاصطناعي.', 'I want to fully automate my operations and save on costs using AI.')}</p>
                </div>
                <div 
                    onClick={() => selectUserType('agency')}
                    style={{ padding: '3rem 2rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '32px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#EC4899'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                    <Rocket size={50} color="#EC4899" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{t('رائد أعمال / وكالة', 'Entrepreneur / Agency')}</h3>
                    <p style={{ color: '#6B7280' }}>{t('أريد بناء وكالة أتمتة متخصصة وتقديم حلول ذكية للشركات في قطاعي.', 'I want to build a specialized automation agency and offer smart solutions to companies.')}</p>
                </div>
                <div 
                    onClick={() => selectUserType('affiliate')}
                    style={{ padding: '3rem 2rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '32px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#10B981'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                    <Handshake size={50} color="#10B981" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{t('مسوق بالعمولة', 'Affiliate Marketer')}</h3>
                    <p style={{ color: '#6B7280' }}>{t('أريد تحقيق أرباح من خلال ترويج المنصة والحصول على عمولات مجزية.', 'I want to earn commissions by promoting the platform to business owners.')}</p>
                </div>
            </div>
        </div>
    );

    return (
        <AcademyLayout title={t("فرصة الوكلاء الأذكياء", "The Smart Agents Opportunity")}>
            <ExitIntentPopup />
            <TimerBanner />
            <div style={{ maxWidth: '1000px', margin: 'clamp(2rem, 5vh, 4rem) auto', padding: '0 1.5rem' }}>
                {step === -1 && <Gatekeeper />}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                            <div style={{ padding: '8px 20px', borderRadius: '30px', background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)', fontWeight: 700 }}>
                                <Sparkles size={16} />
                                {t(`قيمتها ${price * 10}${currency} - متاحة لك الآن بـ ${price}${currency} فقط`, `${price * 10}${currency} Value - Available to you for ${price}${currency} only`)}
                            </div>
                            <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 3.2rem)', fontWeight: 950, lineHeight: 1.1, marginBottom: '2rem' }}>
                                {t(`الرحلة من "التوهان التقني" لامتلاك أول وكالة ذكاء اصطناعي مخصصة لقطاعك.. في يومين وبـ ${price} ${currency} بس.`, `The journey from "Technical Confusion" to owning your first AI Agency specialized in your sector.. in 2 days and for only ${price}${currency}.`)}
                            </h1>
                            <p style={{ fontSize: '1.4rem', color: 'var(--color-text-secondary)', maxWidth: '850px', margin: '0 auto 3.5rem', lineHeight: 1.6, fontWeight: 500 }}>
                                {t(`امتلاك أدوات خارقة تجعلك سابقاً لخطوات في الأمام هو السر وراء النجاح اليوم. انضم لنخبة شركاء التشغيل الذين بدأوا رحلة التحول الرقمي الحقيقي.`, `Owning superpower tools that put you steps ahead is the secret to success today. Join the elite operation partners who started their true digital transformation journey.`)}
                            </p>

                            {/* WHY US SECTION (NEW) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '6rem', textAlign: isArabic ? 'right' : 'left' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--color-border-subtle)' }}>
                                    <ZapOff size={32} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1rem' }}>{t('مش محتاج كود', 'No Coding Needed')}</h4>
                                    <p style={{ color: '#6B7280', lineHeight: 1.5 }}>{t('لو بتعرف تستخدم واتساب، هتعرف تدير المنصة بالكامل بدون تدخل برمجيات معقدة.', 'If you can use WhatsApp, you can manage the platform fully without complex code.')}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--color-border-subtle)' }}>
                                    <BarChart size={32} color="#EC4899" style={{ marginBottom: '1.5rem' }} />
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1rem' }}>{t('وفرنا عليك الوقت', 'We Saved Your Time')}</h4>
                                    <p style={{ color: '#6B7280', lineHeight: 1.5 }}>{t('جهزنا لك "قوالب جاهزة" لكل قطاع (عقارات، صالونات، مطاعم) تبدأ بها فوراً.', 'We prepared "ready templates" for every sector (Real Estate, Salons, Restaurants) to start immediately.')}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--color-border-subtle)' }}>
                                    <Lock size={32} color="#10B981" style={{ marginBottom: '1.5rem' }} />
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1rem' }}>{t('التكلفة تحت سيطرتك', 'Costs Under Control')}</h4>
                                    <p style={{ color: '#6B7280', lineHeight: 1.5 }}>{t('أنت بتربط بمفاتيح Meta الخاصة بيك، يعني مفيش أي استغلال أو رسوم خفية من مبرمجين.', 'You link your own Meta keys, meaning no developer exploitation or hidden fees.')}</p>
                                </div>
                            </div>

                            {/* ROI CALCULATOR SECTION (NEW) */}
                            {userType === 'owner' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '40px', border: '1px solid var(--color-border-subtle)', marginBottom: '4rem', textAlign: 'right' }}>
                                     <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <TrendingUp /> {t('حاسبة التوفير الذكية', 'Smart Savings Calculator')}
                                     </h3>
                                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#6B7280', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('عدد موظفي خدمة العملاء الحاليين', 'Current CS Employees')}</label>
                                            <input type="number" defaultValue={2} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-main)', fontSize: '1.2rem', fontWeight: 900 }} id="staffCount" onChange={(e) => {
                                                const staff = e.target.value;
                                                const savings = staff * 800; // Average salary saved
                                                document.getElementById('savingsValue').innerText = `$${savings}`;
                                            }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#6B7280', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('التوفير الشهري المقدر ($)', 'Estimated Monthly Savings')}</label>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#10B981' }} id="savingsValue">$1600</div>
                                        </div>
                                     </div>
                                     <p style={{ marginTop: '2rem', color: '#4B5563', fontSize: '0.85rem' }}>* {t('بناءً على متوسط تكلفة التوظيف، التأمين، والمكاتب مقارنة بتكلفة تشغيل الوكيل الذكي.', 'Based on average hiring, insurance, and office costs vs. Smart Agent operational costs.')}</p>
                                </div>
                            )}

                            {/* AFFILIATE PROFIT MATH (NEW) */}
                            {userType === 'affiliate' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '40px', border: '1px solid var(--color-border-subtle)', marginBottom: '4rem', textAlign: 'right' }}>
                                     <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <DollarSign size={24} /> {t('معادلة الربح للمسوقين', 'Affiliate Profit Math')}
                                     </h3>
                                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#6B7280', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('عدد الشركات التي ستدعوهم شهرياً', 'Clients Invited Monthly')}</label>
                                            <input type="number" defaultValue={10} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-main)', fontSize: '1.2rem', fontWeight: 900 }} onChange={(e) => {
                                                const count = e.target.value;
                                                const earnings = count * 10;
                                                document.getElementById('affEarnings').innerText = `$${earnings}`;
                                            }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#6B7280', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('الربح الصافي المتوقع ($)', 'Expected Net Profit')}</label>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#10B981' }} id="affEarnings">$100</div>
                                        </div>
                                     </div>
                                </div>
                            )}

                            <button onClick={scrollToForm} style={{ padding: '1.5rem 4rem', borderRadius: '50px', backgroundColor: '#8B5CF6', color: 'var(--color-text-main)', fontWeight: 950, fontSize: '1.4rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)' }}>
                                {userType === 'affiliate' ? t('انضم لبرنامج العمولة مجاناً', 'Join Affiliate Program Free') : t('ابدأ كورس التدريب المجاني الآن', 'Start FREE Training Course Now')}
                            </button>
                        </div>
                    </div>
                )}
                {step === 1 && (
                    <div ref={formRef} className="animate-fade-in">
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1rem' }}>{t('تأهيل طلبك المجاني', 'Qualify Your FREE Access')}</h2>
                        </div>
                        <form onSubmit={handleSubmitClassification} style={{ background: 'var(--color-bg-surface)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--color-border-subtle)' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('الاسم بالكامل', 'Full Name')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                        <input required type="text" placeholder={t("أحمد محمد", "John Doe")} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('رقم الواتساب', 'WhatsApp Number')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                        <input required type="tel" placeholder="+966..." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('القطاع المستهدف', 'Target Sector')}</label>
                                    <select required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }}>
                                        <option value="" style={{ background: 'var(--color-bg-surface)' }}>{t('-- اختر القطاع --', '-- Choose Sector --')}</option>
                                        <option value="real_estate" style={{ background: 'var(--color-bg-surface)' }}>{t('عقارات 🏠', 'Real Estate 🏠')}</option>
                                        <option value="beauty" style={{ background: 'var(--color-bg-surface)' }}>{t('تجميل وعناية 🌸', 'Beauty & Care 🌸')}</option>
                                        <option value="restaurant" style={{ background: 'var(--color-bg-surface)' }}>{t('مطاعم وضيافة 🍽', 'Restaurants & Hospitality 🍽')}</option>
                                        <option value="retail_ecommerce" style={{ background: 'var(--color-bg-surface)' }}>{t('تجزئة ومتاجر 🛍', 'Retail & E-commerce 🛍')}</option>
                                        <option value="medical" style={{ background: 'var(--color-bg-surface)' }}>{t('طبي وصحي 🩺', 'Medical & Health 🩺')}</option>
                                        <option value="call_center" style={{ background: 'var(--color-bg-surface)' }}>{t('خدمات عملاء وسكرتارية 🎧', 'Customer Service & Secretary 🎧')}</option>
                                        <option value="telecom_it" style={{ background: 'var(--color-bg-surface)' }}>{t('اتصالات وتقنية 📡', 'Telecom & IT 📡')}</option>
                                        <option value="banking" style={{ background: 'var(--color-bg-surface)' }}>{t('بنوك ومالية 🏦', 'Banking & Finance 🏦')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('كم عميل محتمل في منطقتك؟', 'Potential leads in your area?')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Users size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                        <input required type="number" placeholder="50" value={formData.expected_leads || ''} onChange={e => setFormData({...formData, expected_leads: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }} />
                                    </div>
                                </div>
                            </div>
                            {/* SMART REQUIREMENTS (NEW) */}
                            <div style={{ marginBottom: '2.5rem', background: 'rgba(139, 92, 246, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShieldCheck size={20} /> {t('اختبار الجاهزية الذكي (Qualification)', 'Smart Readiness Test')}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {[
                                        { id: 'ready_for_project', label: t('مستعد للعمل على مشروعي الخاص فوراً', 'Ready to work on my project immediately') },
                                        { id: 'social_media_skills', label: t('أمتلك مهارات التعامل مع وسائل التواصل الاجتماعي', 'I have social media skills') },
                                        { id: 'computer_skills', label: t('أجيد التعامل مع جهاز الكمبيوتر والإنترنت', 'I am proficient with computers and the internet') }
                                    ].map(item => (
                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData[item.id]} 
                                                onChange={e => setFormData({...formData, [item.id]: e.target.checked})}
                                                style={{ width: '20px', height: '20px', borderRadius: '6px', accentColor: '#8B5CF6', cursor: 'pointer' }}
                                            />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>
                                    {t('* نطلب هذه المتطلبات لضمان قدرتك على تحقيق النتائج مع دعمنا المكثف.', '* We require these to ensure you can achieve results with our intensive support.')}
                                </p>
                            </div>

                            <div style={{ marginBottom: '3rem' }}>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('البريد الإلكتروني', 'Email Address')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                    <input required type="email" placeholder="example@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', backgroundColor: '#8B5CF6', color: 'var(--color-text-main)', fontWeight: 900, fontSize: '1.2rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                {loading ? <div className="loading-spinner-sm"></div> : t('أنا مستعد لاستكشاف الفرصة', 'I am ready to explore the opportunity')}
                            </button>
                        </form>
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                         <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.5rem)', fontWeight: 950, marginBottom: '1rem', color: '#A78BFA' }}>{t(config?.headline_ar || 'تم تجهيز خطتك!', config?.headline_en || 'Your plan is ready!')}</h2>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '40px', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: isArabic ? 'right' : 'left' }}>
                            <h3 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 950, marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>{t(`بمجرد اشتراكك بـ ${price}${currency}، ستحصل على:`, `Once you subscribe for ${price}${currency}, you get:`)}</h3>
                            
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                                    <Shield size={24} color="#10B981" /> {t('رخصة تشغيل المنصة فوراً وبدء بناء وكالتك.', 'Instant platform operation license and start building your agency.')}
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                                    <Award size={24} color="#10B981" /> {t('الحقيبة التدريبية الكاملة (كيف تجلب أول عميل في 48 ساعة).', 'Full training bag (How to get your first client in 48 hours).')}
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                                    <Handshake size={24} color="#10B981" /> {t('الانضمام لنظام "شركاء النمو" (عمولة 10$ عن كل عميل يسجل من خلالك).', 'Join the "Growth Partners" system ($10 commission for every client who registers through you).')}
                                </li>
                            </ul>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', marginBottom: '3rem', border: '1px dashed var(--color-border-subtle)' }}>
                                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Info size={20} /> {t('ليه 20 دولار؟', 'Why 20 Dollars?')}
                                </h4>
                                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>
                                    {t(`هذا المبلغ هو قيمة اشتراكك في البنية التحتية للمنصة والحصول على الحقيبة التدريبية الكاملة. لا توجد عقود معقدة ولا رسوم إدارية مخفية. أنت بتبدأ بيزنس حقيقي بسعر "عزومة غداء".`, `This amount is the value of your subscription to the platform infrastructure and full training bag. No complex contracts or hidden fees. You are starting a real business for the price of a "lunch treat".`)}
                                </p>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#F87171', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <AlertCircle size={16} />
                                    {t(`متبقي فقط ${seatsLeft} مقاعد لشركاء التشغيل في قطاعك لهذا الشهر لضمان جودة الدعم.`, `Only ${seatsLeft} spots left for operation partners in your sector this month to ensure quality support.`)}
                                </div>

                                {paymentError && (
                                    <div style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        {paymentError}
                                    </div>
                                )}

                                <button onClick={handleStartPayment} disabled={loading} style={{ width: '100%', maxWidth: '500px', padding: '1.5rem 4rem', borderRadius: '50px', backgroundColor: '#3B82F6', color: 'var(--color-text-main)', fontWeight: 950, fontSize: '1.5rem', border: 'none', cursor: 'pointer', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    {loading ? <div className="loading-spinner-sm"></div> : t(`فعل حساب الممارسة الآن (${price}${currency})`, `Activate Practice Account Now (${price}${currency})`)}
                                    <ArrowRight size={24} />
                                </button>
                                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', color: '#6B7280', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle2 size={16} color="#10B981" /> {t('ضمان استرداد الأموال', 'Money-back Guarantee')}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={16} color="#10B981" /> {t('دفع آمن ومشفر', 'Secure Encrypted Payment')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* FAQ SECTION (NEW) */}
                <div style={{ marginTop: '8rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '6rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 950, textAlign: 'center', marginBottom: '4rem' }}>{t('الأسئلة الشائعة', 'Frequently Asked Questions')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', textAlign: isArabic ? 'right' : 'left' }}>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-main)' }}>{t('هل الموضوع محتاج وقت طويل؟', 'Does it take a long time?')}</h4>
                            <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{t('يومين كفاية جداً تفهم كل حاجة وتبدأ الإطلاق الحقيقي، حتى لو عندك دوام كامل.', 'Two days are plenty to understand everything and start the real launch, even if you have a full-time job.')}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-main)' }}>{t('أنا مش تقني، هعرف أتعامل؟', 'I\'m not technical, can I handle it?')}</h4>
                            <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{t('السيستم معمول عشان "الناس الطبيعية" مش المبرمجين. كل حاجة بالسحب والإفلات والتعليمات بالعربي الواضح.', 'The system is made for "normal people", not programmers. Everything is drag-and-drop with clear instructions.')}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-main)' }}>{t('إزاي ببدأ أجيب عملاء؟', 'How do I start getting clients?')}</h4>
                            <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{t('الحقيبة التدريبية فيها "خريطة طريق" كاملة بتعلمك إزاي تقفل أول عميل ليك في أول 48 ساعة بخطوات عملية.', 'The training bag contains a full "roadmap" teaching you how to close your first client in the first 48 hours with practical steps.')}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-main)' }}>{t(`هل الـ ${price}${currency} دي كل حاجة؟`, `Is the ${price}${currency} all I pay?`)}</h4>
                            <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{t('الـ 20 هي قيمة البنية التحتية والتدريب وبداية الرصيد. بعد كدة بتشحن رصيد فقط حسب استهلاك عملاء وكالتك.', 'The $20 is the value of infrastructure, training, and initial credit. After that, you just top up credit based on your agency clients\' consumption.')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AcademyLayout>
    );
};

export default OpportunityLanding;
