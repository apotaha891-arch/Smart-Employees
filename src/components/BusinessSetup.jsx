import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateBusinessProfile, getProfile } from '../services/supabaseService';

const BusinessSetup = () => {
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: '',
        working_hours: '',
        description: '',
        services: '',
        branding_tone: 'professional'
    });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                navigate('/login');
            } else {
                setUser(user);
                // Load existing profile if any
                const profile = await getProfile(user.id);
                if (profile.success && profile.data) {
                    setFormData({
                        business_name: profile.data.business_name || '',
                        business_type: profile.data.business_type || '',
                        working_hours: profile.data.working_hours || '',
                        description: profile.data.description || '',
                        services: profile.data.services || '',
                        branding_tone: profile.data.branding_tone || 'professional'
                    });
                }
            }
        };
        checkUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateBusinessProfile(user.id, formData);
        if (result.success) {
            alert('تم تحديث معلومات الموظف الرقمي بنجاح! سيتم تطبيق هذه المعايير في جميع مهامه.');
            navigate('/dashboard');
        } else {
            alert('خطأ: ' + result.error);
        }
        setLoading(false);
    };

    return (
        <div className="container py-xl">
            <div className="page-header text-center">
                <h2>🛠️ تخصيص الموظف الرقمي</h2>
                <p>قم برفع معلومات عملك ليصبح الموظف متحدثاً رسمياً وباسم شركتك</p>
            </div>

            <div className="grid grid-2 gap-xl" style={{ alignItems: 'start' }}>
                <div className="card card-solid p-2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2 gap-xl mb-xl">
                            <div>
                                <label className="label">اسم المنشأة</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="مثال: عيادة النور لطب الأسنان"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">نوع النشاط</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="مثال: عيادة طبية / مكتب عقارات"
                                    value={formData.business_type}
                                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-xl">
                            <label className="label">ساعات العمل الرسمية</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="مثال: من الأحد إلى الخميس، 9 ص - 9 م"
                                value={formData.working_hours}
                                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-xl">
                            <label className="label">الخدمات التي يقدمها الموظف</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                placeholder="مثال: حجز المواعيد، تقديم استشارات أولية، الرد على أسئلة الموقع..."
                                value={formData.services}
                                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-xl">
                            <label className="label">معلومات هامة عن العمل (اختياري)</label>
                            <textarea
                                className="input-field"
                                rows="4"
                                placeholder="أي تفاصيل أخرى تريد من الموظف معرفتها (روابط، مواقع، سياسات معينة)..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="mb-xl">
                            <label className="label">📚 تدريب الموظف (قاعدة المعرفة الخاصة بك)</label>
                            <textarea
                                className="input-field"
                                rows="6"
                                placeholder="هنا تضع سر المهنة.. مثال: قائمة أسعار الفلل في الملقا بالتفصيل، بروتوكول استقبال المرضى، سياسة الضمان والإرجاع... أي نص تضعه هنا سيقوم الموظف بدراسته والالتزام به."
                                value={formData.knowledge_base || ''}
                                onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                            ></textarea>
                            <small className="text-muted">كلما زادت التفاصيل هنا، زاد ذكاء الموظف في الرد على عملائك.</small>
                        </div>

                        <div className="mb-2xl">
                            <label className="label">نبرة تواصل الموظف المفضلة</label>
                            <select
                                className="input-field"
                                value={formData.branding_tone}
                                onChange={(e) => setFormData({ ...formData, branding_tone: e.target.value })}
                            >
                                <option value="professional">احترافي ورسمي</option>
                                <option value="friendly">ودود ولطيف</option>
                                <option value="fast">سريع ومباشر</option>
                                <option value="luxury">فخم وحصري</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-block btn-lg ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات للموظف ✨'}
                        </button>
                    </form>
                </div>

                <div className="animate-fade-in">
                    <div className="recommendation-card mb-md">
                        <div>
                            <h4 className="mb-xs">💡 نصيحة لخبراء العقارات</h4>
                            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                إذا كنت تستهدف فلل الملقا، اطلب من الموظف التركيز على "التشطيب المودرن" و "القرب من الخدمات". هذه أكثر كلمات يبحث عنها عملاؤك.
                            </p>
                        </div>
                    </div>

                    <div className="recommendation-card mb-md" style={{ borderRightColor: 'var(--accent-purple)' }}>
                        <div>
                            <h4 className="mb-xs">🚀 اجذب الانتباه بالنبرة</h4>
                            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                النبرة "الفخمة" تناسب العملاء الراغبين في التميز، بينما النبرة "السريعة" تناسب المحترفين المشغولين. اختر ما يشبه عميلك المثالي.
                            </p>
                        </div>
                    </div>

                    <div className="card card-gradient p-xl">
                        <h4 className="mb-sm">📈 إحصائية سريعة</h4>
                        <p style={{ fontSize: '0.9rem' }}>الموظفون الذين لديهم "معلومات عمل" واضحة يحققون مبيعات أعلى بنسبة 40% من الموظفين العامين.</p>
                    </div>
                </div>
            </div>
            <div className="mt-xl text-center">
                <p className="text-muted">هذه المعلومات تُستخدم كـ "مرجع" أساسي لموظفك الرقمي وتُحدث فوراً في قاعدة بياناته.</p>
            </div>
        </div>
    );
};

export default BusinessSetup;
