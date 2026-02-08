import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile } from '../services/supabaseService';

const AgentTemplates = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

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
            icon: '🦷',
            title: 'موظف استقبال - عيادة أسنان',
            titleEn: 'Dental Clinic Receptionist',
            description: 'يستقبل المرضى، يحجز المواعيد، ويدير جدول الطبيب',
            specialty: 'عيادة أسنان',
            industry: 'medical',
            services: ['فحص روتيني', 'تنظيف', 'حشوات', 'تبييض', 'علاج الجذور'],
            workingHours: { start: '09:00', end: '21:00' },
            appointmentDuration: 30,
        },
        {
            id: 'medical-clinic',
            icon: '🩺',
            title: 'موظف استقبال - عيادة طبية',
            titleEn: 'Medical Clinic Receptionist',
            description: 'يحجز مواعيد المرضى، يستقبل الحالات، ويدير السجلات',
            specialty: 'عيادة تخصصية',
            industry: 'medical',
            services: ['كشف طبي', 'متابعة', 'فحوصات', 'استشارة'],
            workingHours: { start: '08:00', end: '20:00' },
            appointmentDuration: 20,
        },
        {
            id: 'sales-lead-gen',
            icon: '🕵️‍♂️',
            title: 'أخصائي مبيعات وتوليد عملاء (نوره الموصى به)',
            titleEn: 'Sales & Lead Generation Specialist',
            description: 'يستخدم خرائط جوجل لاستخراج قائمة بالعملاء المحتملين وتصنيفهم للتواصل الجاد',
            specialty: 'نمو المبيعات',
            industry: 'general',
            services: ['بحث خرائط جوجل', 'استخراج أرقام التواصل', 'تحليل المنافسين', 'تجهيز قوائم CRM'],
            workingHours: { start: '08:00', end: '18:00' },
            appointmentDuration: 30,
        },
        {
            id: 'beauty-salon',
            icon: '💇',
            title: 'موظفة استقبال - صالون تجميل',
            titleEn: 'Beauty Salon Receptionist',
            description: 'تحجز المواعيد، تستقبل الزبائن، وتنظم جدول المصففات',
            specialty: 'صالون تجميل',
            industry: 'beauty',
            services: ['قص شعر', 'صبغة', 'فرد برازيلي', 'مكياج', 'عناية بالبشرة'],
            workingHours: { start: '10:00', end: '22:00' },
            appointmentDuration: 60,
        },
        {
            id: 'real-estate-marketing',
            icon: '🏢',
            title: 'أخصائي تسويق - عقارات',
            titleEn: 'Real Estate Marketing Specialist',
            description: 'يستقبل استفسارات العملاء، يحدد مواعيد المعاينة، ويجمع البيانات',
            specialty: 'شركة عقارات',
            industry: 'realestate',
            services: ['شقق للبيع', 'فلل للإيجار', 'محلات تجارية', 'أراضي'],
            workingHours: { start: '08:00', end: '20:00' },
            appointmentDuration: 45,
        },
        {
            id: 'restaurant-reservations',
            icon: '🍽️',
            title: 'مسؤول حجوزات - مطعم',
            titleEn: 'Restaurant Reservations Manager',
            description: 'يستقبل طلبات الحجز، يدير الطاولات، ويؤكد المواعيد',
            specialty: 'مطعم فاخر',
            industry: 'general',
            services: ['طاولة 2 أشخاص', 'طاولة 4 أشخاص', 'طاولة 6 أشخاص', 'صالة VIP'],
            workingHours: { start: '12:00', end: '23:00' },
            appointmentDuration: 90,
        },
        {
            id: 'gym-coordinator',
            icon: '💪',
            title: 'منسق - صالة رياضية',
            titleEn: 'Gym Coordinator',
            description: 'يحجز جلسات التدريب، يدير جدول المدربين، ويتابع الأعضاء',
            specialty: 'صالة رياضية',
            industry: 'general',
            services: ['جلسة تدريب شخصي', 'فصل يوغا', 'فصل زومبا', 'استشارة تغذية'],
            workingHours: { start: '06:00', end: '22:00' },
            appointmentDuration: 60,
        },
    ];

    const tones = [
        { id: 'friendly', icon: '😊', label: 'ودود', labelEn: 'Friendly', description: 'محادثات دافئة ومريحة' },
        { id: 'professional', icon: '👔', label: 'احترافي', labelEn: 'Professional', description: 'رسمي ومهني' },
        { id: 'casual', icon: '😎', label: 'غير رسمي', labelEn: 'Casual', description: 'عفوي وبسيط' },
        { id: 'enthusiastic', icon: '🎉', label: 'متحمس', labelEn: 'Enthusiastic', description: 'مليء بالطاقة والحماس' },
    ];

    // Sort templates: matching industry first, then others
    const sortedTemplates = [...templates].sort((a, b) => {
        if (a.industry === industry && b.industry !== industry) return -1;
        if (a.industry !== industry && b.industry === industry) return 1;
        return 0;
    });

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
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
        <div className="container">
            <div className="page-header text-center" style={{ marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>استقطاب نخبة الكوادر الوظيفية</h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>اختر الكفاءة المهنية الأنسب التي تليق بمستوى تطلعات منشأتك</p>
            </div>

            {/* Agent Cadres */}
            <h3 className="mb-xl" style={{ borderBottom: '2px solid var(--accent)', display: 'inline-block', paddingBottom: '0.5rem' }}>
                {industry === 'general' ? 'قاعدة بيانات الكوادر المتاحة' : `الكوادر الموصى بها لقطاعك ✨`}
            </h3>

            <div className="grid grid-3 gap-xl">
                {sortedTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="card animate-fade-in"
                        onClick={() => handleSelectTemplate(template)}
                        style={{
                            cursor: 'pointer',
                            background: 'white',
                            border: selectedTemplate?.id === template.id ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                            borderRadius: '24px',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: 0,
                            boxShadow: selectedTemplate?.id === template.id ? '0 20px 40px rgba(212, 175, 55, 0.15)' : 'var(--shadow-sm)'
                        }}
                    >
                        {/* Status Ribbon */}
                        <div style={{
                            position: 'absolute',
                            top: '1.5rem',
                            left: '1.5rem',
                            padding: '0.4rem 0.8rem',
                            background: template.industry === industry ? 'var(--success-soft)' : '#F3F4F6',
                            color: template.industry === industry ? 'var(--success)' : 'var(--text-muted)',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            border: '1px solid currentColor',
                            zIndex: 10
                        }}>
                            {template.industry === industry ? 'مرشح موصى به 🎯' : 'جاهز للتقييم'}
                        </div>

                        {/* Card Header Background */}
                        <div style={{ height: '100px', background: 'linear-gradient(to bottom, #F8FAFC, white)', borderBottom: '1px solid #F1F5F9' }}></div>

                        <div style={{ padding: '0 1.5rem 2rem', marginTop: '-40px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'white',
                                borderRadius: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                marginBottom: '1.25rem',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                                border: '1px solid #F1F5F9'
                            }}>
                                {template.icon}
                            </div>

                            <h4 style={{ marginBottom: '0.5rem', fontSize: '1.35rem', color: 'var(--primary)', fontWeight: 900 }}>
                                {template.title}
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', minHeight: '3.2rem' }}>
                                {template.description}
                            </p>

                            <div style={{
                                background: '#F9FAFB',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                border: '1px solid #F1F5F9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>الاستحقاق الوظيفي:</span>
                                    <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem' }}>مؤهل جداً ✨</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>العرض المقدم:</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>24 ساعة / 7 أيام</span>
                                </div>
                            </div>
                        </div>

                        {selectedTemplate?.id === template.id && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                border: '3px solid var(--accent)',
                                borderRadius: '24px',
                                pointerEvents: 'none',
                                zIndex: 20
                            }}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Personality/Tone Selection */}
            {selectedTemplate && (
                <div className="animate-fade-in" style={{ marginTop: '8rem', borderTop: '1px solid var(--border-light)', paddingTop: '6rem', paddingBottom: '4rem' }}>
                    <div className="text-center" style={{ marginBottom: '4rem' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.25rem', fontWeight: 900 }}>تحديد الشخصية المهنية</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>بناءً على نبرة {industry === 'medical' ? 'العيادة' : industry === 'realestate' ? 'المكتب العقاري' : 'المنشأة'} المطلوبة</p>
                    </div>

                    <div className="grid grid-4 gap-md mb-2xl">
                        {tones.map((tone) => (
                            <div
                                key={tone.id}
                                className="card p-lg animate-fade-in"
                                onClick={() => setSelectedTone(tone.id)}
                                style={{
                                    cursor: 'pointer',
                                    background: 'white',
                                    textAlign: 'center',
                                    border: selectedTone === tone.id ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all 0.3s ease',
                                    transform: selectedTone === tone.id ? 'translateY(-5px)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                                    {tone.icon}
                                </div>
                                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                    {tone.label}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    {tone.description}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center" style={{ marginTop: '3rem' }}>
                        <button
                            className="btn"
                            onClick={handleHireAgent}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '1.25rem 4rem',
                                fontSize: '1.2rem',
                                borderRadius: 'var(--radius-full)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                fontWeight: 800
                            }}
                        >
                            🤝 ابدأ جلسة المقابلة الشخصية
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentTemplates;
