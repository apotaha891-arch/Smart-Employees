import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile } from '../services/supabaseService';
import {
    Stethoscope,
    Activity,
    Search,
    Scissors,
    Building,
    Utensils,
    Zap,
    Headset,
    Smile,
    Briefcase,
    Coffee,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

const AgentTemplates = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toneSectionRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedTone, setSelectedTone] = useState('friendly');
    const [industry, setIndustry] = useState('general');

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const type = profileResult.data.business_type?.toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic')) setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate')) setIndustry('realestate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty')) setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau')) setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit')) setIndustry('fitness');
                }
            }
        };
        checkUser();
    }, []);

    const templates = [
        {
            id: 'dental-receptionist',
            icon: <Stethoscope size={24} />,
            image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'استقبال - عيادة أسنان',
            titleEn: 'Dental Receptionist',
            description: 'حجز المواعيد وإدارة جدول المرضى بدقة عالية.',
            specialty: 'عيادة أسنان',
            industry: 'medical',
            services: ['فحص روتيني', 'تنظيف', 'حشوات', 'تبييض', 'علاج الجذور'],
            workingHours: { start: '09:00', end: '21:00' },
            appointmentDuration: 30,
            costPerMessage: 3, // High complexity
        },
        {
            id: 'medical-clinic',
            icon: <Activity size={24} />,
            image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'استقبال - عيادة طبية',
            titleEn: 'Clinic Receptionist',
            description: 'إدارة السجلات الطبية وتنظيم مواعيد المراجعين.',
            specialty: 'عيادة تخصصية',
            industry: 'medical',
            services: ['كشف طبي', 'متابعة', 'فحوصات', 'استشارة'],
            workingHours: { start: '08:00', end: '20:00' },
            appointmentDuration: 20,
            costPerMessage: 3,
        },
        {
            id: 'sales-lead-gen',
            icon: <Search size={24} />,
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'أخصائي نمو ومبيعات',
            titleEn: 'Sales Specialist',
            description: 'البحث عن عملاء محتملين عبر خرائط جوجل وتصنيفهم.',
            specialty: 'نمو المبيعات',
            industry: 'general',
            services: ['بحث خرائط جوجل', 'استخراج أرقام التواصل', 'تحليل المنافسين', 'تجهيز قوائم CRM'],
            workingHours: { start: '08:00', end: '18:00' },
            appointmentDuration: 30,
            costPerMessage: 2, // Medium complexity
        },
        {
            id: 'beauty-salon',
            icon: <Scissors size={24} />,
            image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'استقبال - صالون تجميل',
            titleEn: 'Beauty Receptionist',
            description: 'تنظيم مواعيد التجميل وإدارة جدول العاملات بالمشغل.',
            specialty: 'صالون تجميل',
            industry: 'beauty',
            services: ['قص شعر', 'صبغة', 'فرد برازيلي', 'مكياج', 'عناية بالبشرة'],
            workingHours: { start: '10:00', end: '22:00' },
            appointmentDuration: 60,
            costPerMessage: 2,
        },
        {
            id: 'real-estate-marketing',
            icon: <Building size={24} />,
            image: "https://images.unsplash.com/photo-1556157382-97dee2dcbfe5?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'تسويق عقاري',
            titleEn: 'Real Estate Marketing',
            description: 'استجابة سريعة لاستفسارات العقارات ومعاينة الوحدات.',
            specialty: 'شركة عقارات',
            industry: 'realestate',
            services: ['شقق للبيع', 'فلل للإيجار', 'محلات تجارية', 'أراضي'],
            workingHours: { start: '08:00', end: '20:00' },
            appointmentDuration: 45,
            costPerMessage: 2,
        },
        {
            id: 'restaurant-reservations',
            icon: <Utensils size={24} />,
            image: "https://images.unsplash.com/photo-1577214159280-ca341749e48a?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'مدير حجوزات مطاعم',
            titleEn: 'Restaurant Manager',
            description: 'تأكيد الحجوزات وإدارة الطاولات لضمان أفضل تجربة.',
            specialty: 'مطعم فاخر',
            industry: 'general',
            services: ['طاولة 2 أشخاص', 'طاولة 4 أشخاص', 'طاولة 6 أشخاص', 'صالة VIP'],
            workingHours: { start: '12:00', end: '23:00' },
            appointmentDuration: 90,
            costPerMessage: 1, // Simple task
        },
        {
            id: 'gym-coordinator',
            icon: <Zap size={24} />,
            image: "https://images.unsplash.com/photo-1599058917233-35835fd4578b?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'منسق صالة رياضية',
            titleEn: 'Gym Coordinator',
            description: 'متابعة نفقات الأعضاء وتنسيق حصص التدريب الشخصي.',
            specialty: 'صالة رياضية',
            industry: 'general',
            services: ['جلسة تدريب شخصي', 'فصل يوغا', 'فصل زومبا', 'استشارة تغذية'],
            workingHours: { start: '06:00', end: '22:00' },
            appointmentDuration: 60,
            costPerMessage: 1,
        },
        {
            id: 'support-agent',
            icon: <Headset size={24} />,
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop",
            title: 'خبير دعم فني معتمد',
            titleEn: 'Support Expert',
            description: 'الرد على الاستفسارات بناءً على قاعدة المعرفة الخاصة بك.',
            specialty: 'الدعم الفني والرد الآلي',
            industry: 'general',
            services: ['إجابة الاستفسارات', 'استرجاع المعلومات', 'الدعم الفني', 'توجيه العملاء'],
            workingHours: { start: '00:00', end: '23:59' },
            appointmentDuration: 0,
            costPerMessage: 1,
        },
    ];

    const tones = [
        { id: 'friendly', icon: <Smile size={20} />, label: 'ودود', labelEn: 'Friendly', description: 'محادثات دافئة' },
        { id: 'professional', icon: <Briefcase size={20} />, label: 'احترافي', labelEn: 'Professional', description: 'رسمي ومهني' },
        { id: 'casual', icon: <Coffee size={20} />, label: 'غير رسمي', labelEn: 'Casual', description: 'عفوي وبسيط' },
        { id: 'enthusiastic', icon: <Sparkles size={20} />, label: 'متحمس', labelEn: 'Enthusiastic', description: 'مليء بالطاقة' },
    ];

    // Sort templates: matching industry first, then others
    const sortedTemplates = [...templates].sort((a, b) => {
        if (a.industry === industry && b.industry !== industry) return -1;
        if (a.industry !== industry && b.industry === industry) return 1;
        return 0;
    });

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        // WOW: Auto scroll to tone selection with smooth behavior
        setTimeout(() => {
            toneSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleHireAgent = () => {
        if (!selectedTemplate) {
            alert('يرجى اختيار نوع الوكيل أولاً');
            return;
        }

        localStorage.setItem('agentTemplate', JSON.stringify({
            ...selectedTemplate,
            tone: selectedTone,
        }));

        navigate('/interview');
    };

    return (
        <div className="ai-aura-container">
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '4rem' }}>
                <div className="page-header text-center" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 900 }}>استقطاب نخبة الكوادر الوظيفية</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>اختر الكفاءة المهنية الأنسب التي تليق بمستوى تطلعات منشأتك</p>
                </div>

                {/* Agent Cadres */}
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h3 className="mb-xl" style={{ borderBottom: '2px solid #8B5CF6', display: 'inline-block', paddingBottom: '0.5rem', fontSize: '1.25rem' }}>
                        {industry === 'general' ? 'قاعدة بيانات الكوادر المتاحة' : `الكوادر الموصى بها لقطاعك ✨`}
                    </h3>

                    <div className="n8n-card-grid">
                        {sortedTemplates.map((template) => (
                            <div
                                key={template.id}
                                className={`n8n-card animate-fade-in ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                onClick={() => handleSelectTemplate(template)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Chip Group (n8n style) */}
                                <div className="chip-group">
                                    <div className="n8n-chip">{template.icon}</div>
                                    {template.services?.slice(0, 3).map((s, idx) => (
                                        <div key={idx} className="n8n-chip" style={{ fontSize: '0.8rem' }}>
                                            {s.includes('بحث') ? '🌐' : s.includes('حجز') || s.includes('حشوات') ? '🦷' : '📄'}
                                        </div>
                                    ))}
                                </div>

                                <h4 className="n8n-card-title">{template.title}</h4>
                                <p className="n8n-card-desc">{template.description}</p>

                                {/* Creator Footer (n8n style) */}
                                <div className="card-footer-n8n">
                                    <div className="avatar-n8n" style={{ overflow: 'hidden', padding: 0 }}>
                                        <img src={template.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <span className="creator-name">
                                        {template.industry === 'medical' ? 'د. مريم صبري' : template.industry === 'beauty' ? 'نورة علي' : 'أحمد خالد'}
                                    </span>
                                    <span className="verified-badge">●</span>
                                    <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#A1A1AA' }}>التكلفة:</span>
                                        <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>{template.costPerMessage} نقطة</span>
                                    </div>
                                </div>

                                {/* Recommendation Badge */}
                                {template.industry === industry && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '1.25rem',
                                        left: '1.25rem',
                                        padding: '0.2rem 0.5rem',
                                        background: '#8B5CF6',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        fontWeight: 900,
                                        zIndex: 10
                                    }}>
                                        FEATURED
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personality/Tone Selection */}
                {selectedTemplate && (
                    <div ref={toneSectionRef} className="animate-fade-in" style={{ marginTop: '6rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5rem', paddingBottom: '6rem' }}>
                        <div className="text-center" style={{ marginBottom: '3.5rem' }}>
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.15)',
                                color: '#A78BFA',
                                display: 'inline-block',
                                padding: '0.4rem 1.25rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                marginBottom: '1.25rem',
                                border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>الخطوة الثانية: تخصيص النبرة</div>
                            <h3 style={{ fontSize: '1.85rem', marginBottom: '1rem', fontWeight: 900, color: 'white' }}>تحديد الشخصية المهنية</h3>
                            <p style={{ color: '#A1A1AA', fontSize: '1rem' }}>كيف تفضل أن يتحدث {selectedTemplate.title} مع عملائك؟</p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
                            {tones.map((tone) => (
                                <div
                                    key={tone.id}
                                    className="animate-fade-in"
                                    onClick={() => setSelectedTone(tone.id)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedTone === tone.id ? '#8B5CF6' : 'rgba(255,255,255,0.03)',
                                        border: selectedTone === tone.id ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '100px',
                                        padding: '0.75rem 1.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        transform: selectedTone === tone.id ? 'scale(1.05)' : 'none',
                                    }}
                                >
                                    <div style={{ color: selectedTone === tone.id ? 'white' : '#A1A1AA' }}>
                                        {tone.icon}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{tone.label}</span>
                                    </div>
                                    {selectedTone === tone.id && <CheckCircle2 size={18} color="white" />}
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                className="btn"
                                onClick={handleHireAgent}
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    color: 'white',
                                    padding: '1.25rem 4rem',
                                    fontSize: '1.15rem',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
                                    fontWeight: 900,
                                    border: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                🤝 ابدأ جلسة المقابلة الشخصية
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentTemplates;
