import React, { useState } from 'react';
import { submitCustomRequest } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';

const CustomRequest = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';

    const [formData, setFormData] = useState({
        business_type: '',
        required_tasks: '',
        preferred_language: 'both',
        integrations: '',
        contact_name: '',
        contact_phone: '',
        contact_email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await submitCustomRequest({
            business_type: formData.business_type,
            required_tasks: formData.required_tasks,
            preferred_language: formData.preferred_language,
            integrations: formData.integrations,
            contact_name: formData.contact_name,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,
            status: 'pending'
        });

        if (result.success) {
            setSubmitted(true);
        } else {
            alert((isArabic ? 'حدث خطأ أثناء إرسال الطلب: ' : 'Error submitting request: ') + result.error);
        }
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="container py-2xl text-center">
                <div className="card card-gradient p-2xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2 className="mb-md">
                        {isArabic ? 'تم استلام طلبك بنجاح!' : 'Request Received Successfully!'}
                    </h2>
                    <p className="mb-xl">
                        {isArabic
                            ? 'سيقوم فريقنا بتحليل متطلباتك والتواصل معك خلال 24 ساعة.'
                            : 'Our team will analyze your requirements and contact you within 24 hours.'}
                    </p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                        {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-xl" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="text-center mb-2xl">
                <h1 className="mb-md">
                    {isArabic ? 'طلب موظف بمواصفات خاصة' : 'Request a Custom AI Employee'}
                </h1>
                <p className="text-secondary">
                    {isArabic
                        ? 'أخبرنا بما تطلبه، وسنقوم بتصميم موظف ذكي خصيصاً لعملك'
                        : 'Tell us what you need, and we will design an AI employee tailored specifically for your business.'}
                </p>
            </div>

            <div className="card card-solid p-2xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>

                    {/* Business Type */}
                    <div className="mb-xl">
                        <label className="label">
                            {isArabic ? 'نوع العمل / التخصص' : 'Business Type / Specialty'}
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={isArabic ? 'مثال: مكتب محاماة، شركة شحن، صيدلية...' : 'e.g. Law firm, logistics company, pharmacy...'}
                            required
                            value={formData.business_type}
                            onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                        />
                    </div>

                    {/* Required Tasks */}
                    <div className="mb-xl">
                        <label className="label">
                            {isArabic ? 'ما هي المهام التي تريد من الموظف القيام بها؟' : 'What tasks do you want the AI employee to perform?'}
                        </label>
                        <textarea
                            className="input-field"
                            rows="5"
                            placeholder={isArabic ? 'اشرح بالتفصيل المهام التي تهدف لأتمتتها...' : 'Describe in detail the tasks you want to automate...'}
                            required
                            value={formData.required_tasks}
                            onChange={(e) => setFormData({ ...formData, required_tasks: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-2 gap-xl mb-xl">
                        {/* Preferred Language */}
                        <div>
                            <label className="label">
                                {isArabic ? 'اللغة المفضلة' : 'Preferred Language'}
                            </label>
                            <select
                                className="input-field"
                                value={formData.preferred_language}
                                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                style={{ color: 'white', background: '#1F2937' }}
                            >
                                <option value="ar" style={{ color: 'white', background: '#1F2937' }}>
                                    {isArabic ? 'العربية' : 'Arabic'}
                                </option>
                                <option value="en" style={{ color: 'white', background: '#1F2937' }}>
                                    {isArabic ? 'الإنجليزية' : 'English'}
                                </option>
                                <option value="both" style={{ color: 'white', background: '#1F2937' }}>
                                    {isArabic ? 'كلتا اللغتين' : 'Both Languages'}
                                </option>
                            </select>
                        </div>

                        {/* Integrations */}
                        <div>
                            <label className="label">
                                {isArabic ? 'الأنظمة المطلوب الربط معها (إن وجدت)' : 'Systems to Integrate With (if any)'}
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={isArabic ? 'مثال: WhatsApp, Google Calendar, CRM...' : 'e.g. WhatsApp, Google Calendar, CRM...'}
                                value={formData.integrations}
                                onChange={(e) => setFormData({ ...formData, integrations: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#A78BFA' }}>
                            {isArabic ? '📞 بيانات التواصل' : '📞 Contact Information'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '1rem' }}>
                            {isArabic
                                ? 'سيتواصل معك فريقنا عبر هذه البيانات لمناقشة تفاصيل طلبك'
                                : 'Our team will contact you via these details to discuss your request.'}
                        </p>

                        <div className="grid grid-2 gap-xl mb-xl">
                            {/* Contact Name */}
                            <div>
                                <label className="label">
                                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={isArabic ? 'اسمك الكامل' : 'Your full name'}
                                    required
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                />
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label className="label">
                                    {isArabic ? 'رقم الجوال / واتساب' : 'Phone / WhatsApp'}
                                </label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder={isArabic ? 'مثال: +966 5X XXX XXXX' : 'e.g. +966 5X XXX XXXX'}
                                    required
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact Email */}
                        <div>
                            <label className="label">
                                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder={isArabic ? 'example@company.com' : 'example@company.com'}
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-block btn-lg ${isSubmitting ? 'loading' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? (isArabic ? 'جاري الإرسال...' : 'Sending...')
                            : (isArabic ? 'إرسال طلب التوظيف المخصص' : 'Submit Custom Employee Request')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomRequest;
