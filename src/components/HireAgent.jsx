import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getProfile, getUserAgentCount, deductCredits, getBillingRates } from '../services/supabaseService';
import { getPlatformSettings } from '../services/adminService';
import {
    Bot, ArrowRight, ArrowLeft, Check,
    Calendar, TrendingUp, MessageCircle, Users, Mail
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';

// ── Data ──────────────────────────────────────────────────────────────────────
const ROLE_LABELS = {
    booking: { icon: Calendar, color: '#8B5CF6' },
    sales: { icon: TrendingUp, color: '#F59E0B' },
    support: { icon: MessageCircle, color: '#10B981' },
    hr: { icon: Users, color: '#3B82F6' },
    email: { icon: Mail, color: '#EC4899' },
};

const ROLE_META = {
    booking: {
        emoji: '📅',
        titleAr: 'منسق الحجوزات', titleEn: 'Booking Coordinator',
        descAr: 'يستقبل طلبات الحجز ويدير الجداول تلقائياً.',
        descEn: 'Collects booking details and manages schedules automatically.',
        skills: ['حجوزات تلقائية', 'إدارة جداول', 'رسائل تأكيد'],
        skillsEn: ['Auto Bookings', 'Schedule Mgmt', 'Confirmations'],
    },
    sales: {
        emoji: '🏆',
        titleAr: 'موظف مبيعات', titleEn: 'Sales Agent',
        descAr: 'يحوّل المحادثات إلى صفقات مغلقة بأسلوب استشاري.',
        descEn: 'Converts conversations into closed deals with consultative selling.',
        skills: ['إغلاق صفقات', 'معالجة اعتراضات', 'عروض مخصصة'],
        skillsEn: ['Deal Closing', 'Objection Handling', 'Custom Offers'],
    },
    support: {
        emoji: '🎧',
        titleAr: 'موظف دعم العملاء', titleEn: 'Customer Support',
        descAr: 'يحل مشكلات العملاء بتعاطف وسرعة.',
        descEn: 'Resolves issues empathetically and follows up to ensure satisfaction.',
        skills: ['حل الشكاوى', 'متابعة العملاء', 'رفع التقارير'],
        skillsEn: ['Issue Resolution', 'Follow-up', 'Reporting'],
    },
    hr: {
        emoji: '👥',
        titleAr: 'مساعد الموارد البشرية', titleEn: 'HR Assistant',
        descAr: 'يُجري مقابلات أولية ويصنّف المتقدمين.',
        descEn: 'Conducts initial interviews and screens candidates.',
        skills: ['مقابلات أولية', 'تصنيف السير الذاتية', 'جدولة مقابلات'],
        skillsEn: ['Screening', 'CV Review', 'Interview Scheduling'],
    },
    email: {
        emoji: '📧',
        titleAr: 'منسق البريد الإلكتروني', titleEn: 'Email Coordinator',
        descEn: 'Drafts professional emails and coordinates meetings via mail.',
        skills: ['صياغة رسائل', 'تلخيص مراسلات', 'تنسيق اجتماعات'],
        skillsEn: ['Email Drafts', 'Thread Summary', 'Meeting Coordination'],
    },
};

// ── Component ─────────────────────────────────────────────────────────────────
const HireAgent = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { user: contextUser } = useAuth(); // Impersonation-aware user
    const isAr = language === 'ar';

    const [step, setStep] = useState(1); // 1=pick role, 2=fill details
    const [selected, setSelected] = useState('');
    const [form, setForm] = useState({ name: '', description: '', platforms: ['telegram'] });
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [sector, setSector] = useState('telecom_it');
    const [entityReady, setEntityReady] = useState(null); // null=checking, true=ready, false=not set
    const [maxTools, setMaxTools] = useState(2); 
    const [agentsLimit, setAgentsLimit] = useState(1); 
    const [currentAgents, setCurrentAgents] = useState(0);
    const [billingRates, setBillingRates] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        const init = async () => {
            if (!contextUser?.id) return;

            try {
                // 1. Fetch Billing Rates
                const ratesRes = await getBillingRates();
                if (ratesRes.success) setBillingRates(ratesRes.data);

                // 2. Check if Entity exists for this user
                const { data: entityData } = await supabase
                    .from('entities')
                    .select('agent_name, business_type')
                    .eq('user_id', contextUser.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (entityData?.agent_name) {
                    setSector(entityData.business_type || 'general');
                    setEntityReady(true);
                } else {
                    setEntityReady(false);
                }

                // 3. Check user tier and set limits (Soft limits for UI)
                const profileResult = await getProfile(contextUser.id);
                const tier = profileResult.data?.subscription_plan || 'starter';

                try {
                    const pricingData = await getPlatformSettings('pricing_plans');
                    if (pricingData) {
                        const planConfig = pricingData.find(p => p.id === tier);
                        if (planConfig) {
                            setAgentsLimit(planConfig.agentsLimit || (tier === 'pro' ? 2 : tier === 'enterprise' ? 10 : 1));
                            setMaxTools(planConfig.toolsLimit || (tier === 'pro' ? 3 : tier === 'enterprise' ? 5 : 2));
                        }
                    }
                } catch (err) {
                    console.error('Error fetching dynamic limits:', err);
                    // Fallback to defaults
                    if (tier === 'enterprise') { setMaxTools(5); setAgentsLimit(10); }
                    else if (tier === 'pro') { setMaxTools(3); setAgentsLimit(2); }
                    else { setMaxTools(2); setAgentsLimit(1); }
                }

                // 4. Count existing agents
                const countRes = await getUserAgentCount(contextUser.id);
                if (countRes.success) {
                    setCurrentAgents(countRes.count);
                }

                // 5. Fetch Wallet Balance
                const { getWalletBalance } = await import('../services/supabaseService');
                const walletRes = await getWalletBalance(contextUser.id);
                if (walletRes.success) {
                    setWalletBalance(walletRes.balance);
                }
            } catch (err) {
                console.error("HireAgent: Initialization error:", err);
                setEntityReady(false);
            }
        };

        init();
    }, [contextUser?.id]);

    const handleSave = async () => {
        if (!form.name || !selected || form.platforms.length === 0) return;
        setSaving(true);
        try {
            const user = contextUser;
            if (!user?.id) throw new Error(isAr ? 'يجب تسجيل الدخول أولاً' : 'Auth required');

            // 1. Credit Check & Deduction
            const hireFee = billingRates?.agent_provision_fee || 1000;
            const deduction = await deductCredits(
                user.id, 
                hireFee, 
                'إضافة موظف رقمي جديد', 
                'internal', 
                { agent_role: selected, agent_name: form.name }
            );

            if (!deduction.success) {
                alert(isAr 
                    ? `عذراً! رصيدك غير كافٍ لتوظيف هذا الموظف. يتطلب الأمر ${hireFee} نقطة ورصيدك الحالي هو ${deduction.current_balance || 0} نقطة.` 
                    : `Insufficient credits! This hire costs ${hireFee} and you have ${deduction.current_balance || 0} points.`);
                setSaving(false);
                navigate('/pricing');
                return;
            }

            const agentData = {
                name: form.name,
                business_type: sector,
                specialty: selected,           
                platform: form.platforms.join(','), 
                status: 'active', 
                plan: 'basic',
                avatar: ROLE_META[selected]?.emoji || '🤖',
                user_id: user.id,
            };

            // Only add description if it's not empty to be safe
            if (form.description) {
                agentData.description = form.description;
            }

            const { error } = await supabase.from('agents').insert([agentData]);

            if (error) throw error;

            setSaving(false);
            setDone(true);
            setTimeout(() => navigate('/agents'), 1800);
        } catch (error) {
            console.error('Error hiring agent:', error);
            alert(isAr ? 'حدث خطأ أثناء التوظيف: ' + error.message : 'Error hiring agent: ' + error.message);
            setSaving(false);
        }
    };

    // ── Styles ──────────────────────────────────────────────────────────────
    const page = {
        minHeight: '100%',
        color: 'white',
        padding: '2rem',
        fontFamily: 'Inter, Tajawal, sans-serif',
        direction: isAr ? 'rtl' : 'ltr',
    };

    const card = (isActive, color) => ({
        padding: '1.1rem 1.25rem',
        borderRadius: '14px',
        border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
        background: isActive ? `${color}12` : 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: isAr ? 'right' : 'left',
        boxSizing: 'border-box',
        color: 'white',
    });

    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        background: '#1F2937',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        outline: 'none',
    };

    // ── Entity Setup Gate ────────────────────────────────────────────────────────
    if (entityReady === null) {
        return (
            <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ color: '#9CA3AF', fontSize: '0.95rem' }}>
                    {isAr ? '⏳ جارٍ التحقق...' : '⏳ Checking setup...'}
                </div>
            </div>
        );
    }

    if (entityReady === false) {
        return (
            <div style={{ ...page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    🏢
                </div>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#E5E7EB' }}>
                        {isAr ? 'أكمل إعداد المنشأة أولاً' : 'Complete Entity Setup First'}
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
                        {isAr
                            ? 'قبل توظيف موظف ذكي، يحتاج موظفنا أن يعرف منشأتك — ارفع ملفاتك أو أضف بياناتها الأساسية في صفحة إعداد المنشأة.'
                            : 'Before hiring an AI agent, they need to know your business. Please complete your entity profile so they can represent you accurately.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate('/entity-setup')}
                        style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                        {isAr ? '🏢 إعداد المنشأة الآن' : '🏢 Set Up Entity Now'}
                    </button>
                    <button
                        onClick={() => navigate('/agents')}
                        style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        {isAr ? 'رجوع' : 'Go Back'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Done screen ──────────────────────────────────────────────────────────
    if (done) {
        return (
            <div style={{ ...page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={36} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{isAr ? 'تم تعيين الموظف بنجاح! 🎉' : 'Agent hired successfully! 🎉'}</h2>
                <p style={{ color: '#9CA3AF' }}>{isAr ? 'جاري التوجيه...' : 'Redirecting...'}</p>
            </div>
        );
    }

    return (
        <div style={page}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => step === 1 ? navigate('/agents') : setStep(1)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: '10px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                    {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                        {isAr ? 'توظيف موظف ذكي جديد' : 'Hire a New AI Agent'}
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '4px 0 0' }}>
                        {isAr ? `الخطوة ${step} من 2` : `Step ${step} of 2`}
                    </p>
                </div>
                {/* Progress */}
                <div style={{ flex: 1, height: 4, background: '#1F2937', borderRadius: 99, overflow: 'hidden', marginInlineStart: '1rem' }}>
                    <div style={{ height: '100%', width: `${step * 50}%`, background: 'linear-gradient(90deg,#8B5CF6,#6D28D9)', borderRadius: 99, transition: 'width 0.35s' }} />
                </div>
            </div>

            {/* ── Limit Info Banner (Soft Warning) ── */}
            {currentAgents >= agentsLimit && (
                <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1.25rem', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px solid rgba(139, 92, 246, 0.2)', 
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                            💡
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#DDD6FE', fontSize: '0.95rem' }}>
                                {isAr ? 'توظيف خارج الباقة (نظام النقاط)' : 'Off-Plan Hiring (Points System)'}
                            </div>
                            <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '2px' }}>
                                {isAr 
                                    ? `لقد استهلكت حصة باقتك الموفرة (${agentsLimit} موظفين). يمكنك توظيف المزيد الآن مقابل خصم النقاط من محفظتك مباشرة.` 
                                    : `You have used your plan quota (${agentsLimit} agents). You can hire more now by deducting points from your wallet.`}
                                <span style={{ display: 'block', marginTop: '4px', color: '#10B981', fontWeight: 600 }}>
                                    {isAr ? `رصيدك الحالي: ${walletBalance} نقطة` : `Your Current Balance: ${walletBalance} Pts`}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {walletBalance < (billingRates?.agent_provision_fee || 1000) && (
                        <button 
                            onClick={() => navigate('/pricing')}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#8B5CF6', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            {isAr ? 'اشحن رصيدك' : 'Top up Wallet'}
                        </button>
                    )}
                </div>
            )}

            {/* ── Step 1: Choose Role ── */}
            {step === 1 && (
                <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: '#D1D5DB' }}>
                        {isAr ? 'اختر دور الموظف' : 'Choose Agent Role'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {Object.entries(ROLE_META).map(([key, meta]) => {
                            const v = ROLE_LABELS[key];
                            const Icon = v?.icon;
                            const isActive = selected === key;
                            const skills = isAr ? meta.skills : meta.skillsEn;
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setSelected(key); setStep(2); }}
                                    style={card(isActive, v?.color)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        {/* Emoji avatar */}
                                        <div style={{ width: 50, height: 50, borderRadius: 12, background: `${v?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                            {meta.emoji}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                    {isAr ? meta.titleAr : meta.titleEn}
                                                </span>
                                                {Icon && <Icon size={14} color={v?.color} />}
                                                {/* Price Tag */}
                                                <div style={{ marginLeft: isAr ? 0 : 'auto', marginRight: isAr ? 'auto' : 0, padding: '4px 8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    {billingRates?.agent_provision_fee || 1000} {isAr ? 'نقطة' : 'Pts'}
                                                </div>
                                            </div>
                                            <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 10, lineHeight: 1.5 }}>
                                                {isAr ? meta.descAr : meta.descEn}
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {skills.map(s => (
                                                    <span key={s} style={{ fontSize: '0.7rem', padding: '3px 10px', background: `${v?.color}20`, color: v?.color, borderRadius: 99, fontWeight: 600 }}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Arrow indicator */}
                                        <div style={{ color: isActive ? v?.color : '#4B5563', flexShrink: 0, alignSelf: 'center' }}>
                                            {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Request CTA */}
                    <div style={{ marginTop: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed rgba(59, 130, 246, 0.3)', borderRadius: '14px', padding: '1.25rem', textAlign: isAr ? 'right' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', margin: '0 0 4px', color: '#60A5FA' }}>
                                    {isAr ? 'لم تجد دور الموظف المطلوب؟' : 'Cannot find the required role?'}
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: 0 }}>
                                    {isAr
                                        ? 'يسعدنا تلقي طلبات الموظفين المخصصين لمهام متخصصة غير مدرجة هنا.'
                                        : 'We are happy to receive requests for custom employees for specialized tasks not listed here.'}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/custom-request')}
                                style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                            >
                                {isAr ? 'طلب موظف مخصص' : 'Request Custom Agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 2: Details ── */}
            {step === 2 && selected && (() => {
                const meta = ROLE_META[selected];
                const v = ROLE_LABELS[selected];
                return (
                    <div>
                        {/* Selected role banner */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', borderRadius: 14, background: `${v?.color}15`, border: `1px solid ${v?.color}40`, marginBottom: '1.75rem' }}>
                            <span style={{ fontSize: '1.6rem' }}>{meta.emoji}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: '#E5E7EB' }}>{isAr ? meta.titleAr : meta.titleEn}</div>
                                <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{isAr ? meta.descAr : meta.descEn}</div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: '#D1D5DB' }}>
                            {isAr ? 'تفاصيل الموظف' : 'Agent Details'}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: 6 }}>
                                    {isAr ? 'اسم الموظف *' : 'Agent Name *'}
                                </label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder={isAr ? 'مثال: سارة، أحمد، نورة...' : 'e.g. Sara, Ahmed, Nora...'}
                                    style={inputStyle}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: 6 }}>
                                    {isAr ? 'وصف مختصر (اختياري)' : 'Short Description (optional)'}
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: 6 }}>
                                    {isAr ? 'المنصات والأدوات المدعومة' : 'Platforms & Integrations'}
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginInlineStart: '0.5rem', color: form.platforms.length >= maxTools ? '#F87171' : '#10B981' }}>
                                        ({form.platforms.length} / {maxTools})
                                    </span>
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                                    {[
                                        { id: 'telegram', icon: '✈️', label: isAr ? 'تيليجرام' : 'Telegram' },
                                        { id: 'whatsapp', icon: '💬', label: isAr ? 'واتساب' : 'WhatsApp' },
                                        { id: 'website', icon: '🌐', label: isAr ? 'شات بوت موقع' : 'Website Chatbot' },
                                        { id: 'sheets', icon: '📊', label: isAr ? 'جداول جوجل' : 'Google Sheets' },
                                        { id: 'calendar', icon: '📅', label: isAr ? 'تقويم جوجل' : 'Google Calendar' },
                                    ].map(tool => {
                                        const isSelected = form.platforms.includes(tool.id);
                                        const isDisabled = false;
                                        return (
                                            <div
                                                key={tool.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setForm({ ...form, platforms: form.platforms.filter(p => p !== tool.id) });
                                                    } else if (!isDisabled) {
                                                        setForm({ ...form, platforms: [...form.platforms, tool.id] });
                                                    }
                                                }}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#1F2937',
                                                    border: isSelected ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.05)',
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    opacity: isDisabled ? 0.5 : 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: isSelected ? '#C4B5FD' : '#9CA3AF',
                                                    fontSize: '0.9rem',
                                                    transition: 'all 0.2s',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <span>{tool.icon}</span>
                                                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{tool.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#8B5CF6', marginTop: '6px', fontWeight: 600 }}>
                                     {isAr 
                                        ? `ملاحظة: الأدوات الإضافية (أكثر من ${maxTools}) قد تتطلب رسوم نقاط إضافية عند التأسيس.` 
                                        : `Note: Extra tools (beyond ${maxTools}) may require additional point fees during setup.`}
                                 </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!form.name || saving}
                                style={{
                                    padding: '14px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: !form.name ? '#374151' : `linear-gradient(135deg, ${v?.color}, ${v?.color}cc)`,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: !form.name ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    transition: 'all 0.2s',
                                    marginTop: 8,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {saving
                                        ? <div style={{ width: 14, height: 14, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                        : (isAr ? 'تأكيد التوظيف' : 'Confirm Hire')}
                                </div>
                                {!saving && form.name && (
                                    <div style={{ fontSize: '0.65rem', opacity: 0.9, fontWeight: 500 }}>
                                        {isAr ? `سيتم خصم ${billingRates?.agent_provision_fee || 1000} نقطة من محفظتك` : `Costs ${billingRates?.agent_provision_fee || 1000} credits`}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default HireAgent;
