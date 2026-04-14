import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, CheckCircle, Scale } from 'lucide-react';
import { createAgent, saveContract } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';

const ContractSign = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve the passed along Business Rules and Plan
    const businessRules = location.state?.businessRules || JSON.parse(localStorage.getItem('pendingBusinessRules') || '{}');
    const template = location.state?.template || JSON.parse(localStorage.getItem('pendingAgentTemplate') || '{}');

    const [accepted, setAccepted] = useState(false);
    const [signature, setSignature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for Stripe success URL params
    const [paymentSuccess, setPaymentSuccess] = React.useState(false);

    React.useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('success')) {
            setPaymentSuccess(true);
            // Optionally clear the query params to keep URL clean
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (query.get('canceled')) {
            alert(isArabic ? "تم إلغاء عملية الدفع. يمكنك المحاولة لاحقاً." : "Payment canceled. You can try again later.");
        }
    }, [location.search, isArabic]);

    const handleSignContract = async () => {
        if (!accepted || signature.trim() === '') {
            alert(isArabic ? 'يرجى الموافقة على الشروط وتوقيع العقد باسمك.' : 'Please agree to the terms and sign the contract with your name.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Now we actually create the Agent in the database, because the user has paid and signed
            const agentResult = await createAgent({
                name: businessRules.businessName || template.title || 'AI Agent',
                specialty: template.id || businessRules.businessType || 'General',
                avatar: template.avatar || template.icon || '👩',
                business_type: businessRules.businessSector || template.detectedIndustry || null,
                platform: template.metadata?.platforms ? template.metadata.platforms.join(',') : null
            });

            if (!agentResult.success) {
                alert(isArabic ? `حدث خطأ في إنشاء الموظف. يرجى المحاولة مرة أخرى.\nالسبب: ${agentResult.error}` : `Error creating employee. Please try again.\nReason: ${agentResult.error}`);
                setIsSubmitting(false);
                return;
            }

            const newAgentFromDB = agentResult.data;

            // Save the contract details
            const contractPayload = {
                ...businessRules,
                digitalSignature: signature,
                agreedToNDA: true,
                signedAt: new Date().toISOString()
            };

            const contractResult = await saveContract(newAgentFromDB.id, contractPayload);

            if (!contractResult.success) {
                alert(isArabic ? 'حدث خطأ أثناء حفظ وثيقة العقد.' : 'Error saving contract document.');
                setIsSubmitting(false);
                return;
            }

            localStorage.setItem('currentAgentId', newAgentFromDB.id);

            // Clear temporary storage
            localStorage.removeItem('pendingBusinessRules');
            localStorage.removeItem('pendingAgentTemplate');

            // Move to Step 6: Onboarding/Customization
            navigate('/setup', { state: { agentId: newAgentFromDB.id, businessRules, template } });
        } catch (error) {
            console.error('Contract signing error:', error);
            alert(isArabic ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem', direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <ShieldCheck size={40} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
                        {isArabic ? 'اتفاقية سرية المعلومات والموظف الرقمي' : 'Non-Disclosure Agreement & Digital Agent'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {isArabic ? 'خطوتك الأخيرة قبل تهيئة موظفك الذكي نحو العمل الفعلي.' : 'Your final step before configuring your smart agent for actual work.'}
                    </p>
                </div>

                <div className="card" style={{
                    padding: '3rem',
                    borderRadius: '24px',
                    background: '#18181B',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <div style={{
                        height: '300px',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-subtle)',
                        marginBottom: '2rem',
                        color: '#D4D4D8',
                        lineHeight: 1.8,
                        fontSize: '0.95rem'
                    }}>
                        <h4 style={{ color: 'var(--color-text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Scale size={20} color="#8B5CF6" /> {isArabic ? 'بنود اتفاقية (NDA) وتوظيف الذكاء الاصطناعي' : 'NDA & AI Employment Terms'}
                        </h4>
                        <p><strong>{isArabic ? '١. حماية البيانات السرية:' : '1. Confidentiality:'}</strong> {isArabic ? 'تتعهد منصة 24Shift بالمحافظة التامة على سرية كافة البيانات، الملفات، والمرفقات التي يتم رفعها لغرض تدريب الموظف الرقمي الخاص بك.' : '24Shift platform pledges to maintain complete confidentiality of all data, files, and attachments uploaded for training your digital agent.'}</p>
                        <p><strong>{isArabic ? '٢. ملكية المعلومات:' : '2. Data Ownership:'}</strong> {isArabic ? 'جميع قواعد المعرفة المُدخلة هي ملك حصري لمنشأتك، ولن يتم استخدامها لتدريب نماذج عامة أو مشاركتها مع أطراف ثالثة نهائياً.' : 'All knowledge bases entered are the exclusive property of your business, and will never be used to train public models or shared with third parties.'}</p>
                        <p><strong>{isArabic ? '٣. حدود المسؤولية:' : '3. Liability Limit:'}</strong> {isArabic ? 'الموظف الرقمي هو أداة مساعدة تعمل وفق التعليمات وقواعد البيانات المعطاة له. المنشأة تتحمل مسؤولية مراجعة التعليمات لضمان عدم تعارضها مع سياساتها الداخلية.' : 'The digital agent is an assisting tool operating under the instructions and knowledge bases given to it. The establishment is responsible for reviewing the instructions to ensure they do not conflict with its internal policies.'}</p>
                        <p><strong>{isArabic ? '٤. الإلغاء والتعديل:' : '4. Cancellation:'}</strong> {isArabic ? 'يحق للعميل مسح بياناته بالكامل وإنهاء الاستعانة بالموظف الرقمي في أي لحظة عبر لوحة التحكم، وسيتم إتلاف قواعد المعرفة الخاصة به تلقائياً.' : 'The client has the right to completely wipe their data and terminate the use of the digital agent at any moment via the dashboard, and their knowledge bases will be destroyed automatically.'}</p>
                    </div>

                    <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    marginTop: '4px',
                                    accentColor: '#8B5CF6'
                                }}
                            />
                            <div>
                                <span style={{ color: 'var(--color-text-main)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                    {isArabic ? 'أقر بأنني اطلعت على البنود وموّفق عليها' : 'I acknowledge that I have read and agree to the terms'}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {isArabic ? 'بموافقتك، يتم تحويل العقد إلى مسودة رقمية ملزمة لضمان حقوقك فوراً.' : 'By agreeing, the contract is converted into a binding digital draft to ensure your rights immediately.'}
                                </span>
                            </div>
                        </label>
                    </div>

                    <div style={{ marginBottom: '2.5rem', textAlign: isArabic ? 'right' : 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{isArabic ? 'التوقيع الإلكتروني (الاسم الكامل):' : 'Electronic Signature (Full Name):'}</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={20} color="#A1A1AA" style={{ position: 'absolute', [isArabic ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder={isArabic ? "اكتب اسمك للمصادقة على العقد..." : "Type your name to authenticate the contract..."}
                                style={{
                                    width: '100%',
                                    padding: isArabic ? '1rem 3rem 1rem 1rem' : '1rem 1rem 1rem 3rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--color-border-subtle)',
                                    color: 'var(--color-text-main)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSignContract}
                        disabled={!accepted || signature.trim() === '' || isSubmitting}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            background: accepted && signature.trim() !== '' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#27272A',
                            color: 'var(--color-text-main)',
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            border: 'none',
                            cursor: accepted && signature.trim() !== '' ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            boxShadow: accepted && signature.trim() !== '' ? '0 10px 25px rgba(16, 185, 129, 0.3)' : 'none'
                        }}
                    >
                        {isSubmitting ? (isArabic ? 'جاري توثيق العقد...' : 'Authenticating Contract...') : (
                            <>
                                <CheckCircle size={24} /> {isArabic ? 'اعتماد وتفعيل الموظف' : 'Approve & Activate Agent'}
                            </>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {isArabic ? 'معلوماتك محمية بتشفير 256-bit آمن ولن تُشارك مع أي جهة.' : 'Your information is protected with secure 256-bit encryption and will not be shared.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractSign;
