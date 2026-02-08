import React, { useState } from 'react';
import { submitCustomRequest } from '../services/supabaseService';

const CustomRequest = () => {
    const [formData, setFormData] = useState({
        businessType: '',
        requiredTasks: '',
        preferredLanguage: 'ar',
        integrations: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await submitCustomRequest({
            ...formData,
            status: 'pending'
        });

        if (result.success) {
            setSubmitted(true);
        } else {
            alert('حدث خطأ أثناء إرسال الطلب: ' + result.error);
        }
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="container py-2xl text-center">
                <div className="card card-gradient p-2xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2 className="mb-md">تم استلام طلبك بنجاح!</h2>
                    <p className="mb-xl">سيقوم فريقنا (والموظف الذكي للجودة) بتحليل متطلباتك والرد عليك خلال 24 ساعة.</p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                        العودة للرئيسية
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-xl">
            <div className="text-center mb-2xl">
                <h1 className="mb-md">طلب موظف بمواصفات خاصة</h1>
                <p className="text-secondary">أخبرنا بما تطلبه، وسنقوم بتصميم موظف ذكي خصيصاً لعملك</p>
            </div>

            <div className="card card-solid p-2xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-xl">
                        <label className="label">نوع العمل / التخصص</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="مثال: مكتب محاماة، شركة شحن، صيدلية..."
                            required
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        />
                    </div>

                    <div className="mb-xl">
                        <label className="label">ما هي المهام التي تريد من الوكيل القيام بها؟</label>
                        <textarea
                            className="input-field"
                            rows="5"
                            placeholder="اشرح بالتفصيل المهام التي تهدف لأتمتتها..."
                            required
                            value={formData.requiredTasks}
                            onChange={(e) => setFormData({ ...formData, requiredTasks: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-2 gap-xl mb-xl">
                        <div>
                            <label className="label">اللغة المفضلة</label>
                            <select
                                className="input-field"
                                value={formData.preferredLanguage}
                                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                            >
                                <option value="ar">العربية</option>
                                <option value="en">الإنجليزية</option>
                                <option value="both">كلتا اللغتين</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">الأنظمة المطلوب الربط معها (إن وجدت)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="مثال: WhatsApp, Google Calendar, CRM..."
                                value={formData.integrations}
                                onChange={(e) => setFormData({ ...formData, integrations: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-block btn-lg ${isSubmitting ? 'loading' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب التوظيف المخصص'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomRequest;
