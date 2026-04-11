import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AcademyLayout from '../layouts/AcademyLayout';
import { useLanguage } from '../../LanguageContext';
import { supabase } from '../../services/supabaseService';
import { 
    CheckCircle2, ArrowRight, Play, Zap, Phone, User, Mail,
    Building2, Rocket, Star, Quote, ShieldCheck, 
    Clock, Sparkles, Coffee, Briefcase, ChevronRight, AlertCircle,
    Globe, Shield, TrendingUp, Handshake
} from 'lucide-react';

const OpportunityLanding = () => {
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
    const [formData, setFormData] = useState({
        full_name: '',
        whatsapp: '',
        email: '',
        industry: ''   
    });
    const [config, setConfig] = useState(null);
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
    const formRef = useRef(null);

    const t = (ar, en) => isArabic ? ar : en;

    useEffect(() => {
        const startTime = localStorage.getItem('academy_timer_start');
        const now = Math.floor(Date.now() / 1000);
        let initialSeconds = 1200;
        if (startTime) {
            const elapsed = now - parseInt(startTime);
            initialSeconds = Math.max(0, 1200 - elapsed);
        } else {
            localStorage.setItem('academy_timer_start', now.toString());
        }
        setTimeLeft(initialSeconds);
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const selectUserType = (type) => {
        setUserType(type);
        setStep(0);
        navigate(`/opportunity?type=${type}${affCode ? `&ref=${affCode}` : ''}`, { replace: true });
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

            await supabase.from('academy_leads').insert([{
                full_name: formData.full_name,
                whatsapp: formData.whatsapp,
                email: formData.email,
                user_type: userType,
                industry: formData.industry,
                referrer_id: referrerId,
                status: 'knockout_viewed'
            }]);

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
        try {
            const { data } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    planId: 'academy_access',
                    successUrl: `${window.location.origin}/academy/success`,
                    cancelUrl: window.location.href
                }
            });
            if (data?.url) window.location.href = data.url;
            else window.location.href = '/academy';
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const TimerBanner = () => (
        <div style={{ 
            position: 'sticky', top: 0, zIndex: 100, 
            background: timeLeft > 0 ? 'linear-gradient(to right, #7C3AED, #DB2777)' : '#374151', 
            color: 'white', padding: '0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <Clock size={18} className={timeLeft > 0 ? "animate-pulse" : ""} />
            {timeLeft > 0 ? (
                <span>
                    {t(`عرض خاص: الحقيبة التدريبية مجانية بالكامل للمشتركين الجدد في خلال: `, `Special Offer: Training Bag is FREE for new subscribers within: `)}
                    <span style={{ fontSize: '1.2rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '5px', marginLeft: '5px' }}>{formatTime(timeLeft)}</span>
                </span>
            ) : (
                <span>{t('انتهى وقت العرض الخاص، يمكنك الانضمام بالسعر الأساسي.', 'Special offer time ended. You can still join at the regular rate.')}</span>
            )}
        </div>
    );

    const Gatekeeper = () => (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '1.5rem', lineHeight: 1.1 }}>
                {t('أهلاً بك.. من أنت؟', 'Welcome.. who are you?')}
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div 
                    onClick={() => selectUserType('owner')}
                    style={{ padding: '3rem 2rem', background: '#111827', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#8B5CF6'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                    <Building2 size={50} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{t('صاحب منشأة / عمل', 'Business Owner')}</h3>
                    <p style={{ color: '#6B7280' }}>{t('أريد أتمتة خدمة عملائي وتوفير الرواتب باستخدام الذكاء الاصطناعي.', 'I want to automate my customer service and save on salaries using AI.')}</p>
                </div>
                <div 
                    onClick={() => selectUserType('agency')}
                    style={{ padding: '3rem 2rem', background: '#111827', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#EC4899'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                    <Rocket size={50} color="#EC4899" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{t('وكالة تسويق / مستقل', 'Agency / Freelancer')}</h3>
                    <p style={{ color: '#6B7280' }}>{t('أريد احتراف بيع خدمات الأتمتة للشركات وبناء بيزنس متطور.', 'I want to master selling automation services to companies and build a business.')}</p>
                </div>
            </div>
        </div>
    );

    return (
        <AcademyLayout title={t("فرصة الوكلاء الأذكياء", "The Smart Agents Opportunity")}>
            <TimerBanner />
            <div style={{ maxWidth: '1000px', margin: '4rem auto' }}>
                {step === -1 && <Gatekeeper />}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                            <div style={{ padding: '8px 20px', borderRadius: '30px', background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)', fontWeight: 700 }}>
                                <Sparkles size={16} />
                                {timeLeft > 0 ? t('قيمتها 200$ - مجاناً الآن لفترة محدودة', '$200 Value - FREE for a limited time') : t('فرصة حقيقية للنمو', 'A real opportunity for growth')}
                            </div>
                            <h1 style={{ fontSize: '4.2rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '2rem' }}>
                                {userType === 'owner' ? 
                                    t('استبدل 3 موظفين خدمة عملاء بوكيل ذكي واحد!', 'Replace 3 Customer Agents with 1 Smart Bot!') :
                                    t('كيف تبني وكالة أتمتة ناجحة في 48 ساعة؟', 'How to Build a Successful Automation Agency in 48 Hours?')
                                }
                            </h1>
                            <p style={{ fontSize: '1.3rem', color: '#9CA3AF', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                                {userType === 'owner' ?
                                    t('وفر آلاف الدولارات شهرياً واضمن رداً فورياً على كل عملائك 24/7. تعلم كيف تطلق وكيلك الذكي الأول في دقائق وبدون أي خبرة برمجية.', 'Save thousands monthly and ensure instant response to all customers 24/7. Learn how to launch your first smart agent in minutes with zero coding experience.') :
                                    t('سوق الأتمتة ينمو بجنون. الشركات تبحث عنك! نقدم لك الحقيبة الكاملة لتبدأ بتقديم خدمات الأتمتة المتطورة وتحقيق دخل مستدام.', 'The automation market is growing fast. Companies are looking for you! We provide you with the full kit to start offering advanced automation services and generate sustainable income.')
                                }
                            </p>
                            <button onClick={scrollToForm} style={{ padding: '1.5rem 4rem', borderRadius: '50px', backgroundColor: '#8B5CF6', color: 'white', fontWeight: 950, fontSize: '1.4rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)' }}>
                                {t('ابدأ كورس التدريب المجاني الآن', 'Start FREE Training Course Now')}
                            </button>
                        </div>
                    </div>
                )}
                {step === 1 && (
                    <div ref={formRef} className="animate-fade-in">
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1rem' }}>{t('تأهيل طلبك المجاني', 'Qualify Your FREE Access')}</h2>
                        </div>
                        <form onSubmit={handleSubmitClassification} style={{ background: '#111827', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('الاسم بالكامل', 'Full Name')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                        <input required type="text" placeholder={t("أحمد محمد", "John Doe")} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('رقم الواتساب', 'WhatsApp Number')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                        <input required type="tel" placeholder="+966..." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('البريد الإلكتروني', 'Email Address')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', top: '14px', [isArabic ? 'right' : 'left']: '14px', color: '#4B5563' }} />
                                    <input required type="email" placeholder="example@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '3rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('المجال', 'Industry')}</label>
                                <select required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}>
                                    <option value="" style={{ background: '#111827' }}>{t('-- اختر المجال --', '-- Choose Industry --')}</option>
                                    <option value="real_estate" style={{ background: '#111827' }}>{t('عقارات', 'Real Estate')}</option>
                                    <option value="retail" style={{ background: '#111827' }}>{t('تجارة إلكترونية', 'E-commerce')}</option>
                                    <option value="legal" style={{ background: '#111827' }}>{t('خدمات مهنية', 'Professional Services')}</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', backgroundColor: '#8B5CF6', color: 'white', fontWeight: 900, fontSize: '1.2rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                {loading ? <div className="loading-spinner-sm"></div> : t('ابدأ المشاهدة الآن', 'Start Watching Now')}
                            </button>
                        </form>
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                         <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1rem', color: '#A78BFA' }}>{t(config?.headline_ar || 'تم تجهيز خطتك!', config?.headline_en || 'Your plan is ready!')}</h2>
                        </div>
                        <div style={{ aspectRatio: '16/9', background: '#1F2937', borderRadius: '24px', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                            {config?.video_url ? <iframe width="100%" height="100%" src={config.video_url} frameBorder="0" allowFullScreen></iframe> : <Play size={60} color="#8B5CF6" style={{ margin: 'auto' }} />}
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '3rem', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <h3 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '1.5rem' }}>{t('تفعيل الحساب التجريبي وشحن الرصيد: 20$', 'Activate Practice Account & Load Credits: $20')}</h3>
                            <p style={{ color: '#9CA3AF', marginBottom: '2rem', fontSize: '1.1rem' }}>
                                {t('الكورس التدريبي مجاني بالكامل. الـ 20$ هي تكلفة تشغيل حسابك وشحنه برصيد الممارسة للتطبيق الفوري. (مستردة بالكامل في حال عدم الرضا)', 'Training course is completely FREE. The $20 covers your practice account setup and credits for immediate implementation. (100% Refundable if not satisfied)')}
                            </p>
                            <button onClick={handleStartPayment} disabled={loading} style={{ padding: '1.5rem 4rem', borderRadius: '50px', backgroundColor: '#3B82F6', color: 'white', fontWeight: 950, fontSize: '1.4rem', border: 'none', cursor: 'pointer', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4)' }}>
                                {loading ? <div className="loading-spinner-sm"></div> : t('فعل حساب الممارسة الآن', 'Activate Practice Account Now')}
                            </button>
                            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', color: '#6B7280', fontSize: '0.85rem' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle2 size={16} color="#10B981" /> {t('ضمان استرداد الأموال', 'Money-back Guarantee')}</div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={16} color="#10B981" /> {t('دفع آمن ومشفر', 'Secure Encrypted Payment')}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AcademyLayout>
    );
};

export default OpportunityLanding;
