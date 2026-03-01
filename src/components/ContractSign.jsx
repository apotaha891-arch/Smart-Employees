import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, CheckCircle, Scale } from 'lucide-react';
import { createAgent, saveContract } from '../services/supabaseService';

const ContractSign = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve the passed along Business Rules and Plan
    const businessRules = location.state?.businessRules || JSON.parse(localStorage.getItem('pendingBusinessRules') || '{}');
    const template = location.state?.template || JSON.parse(localStorage.getItem('pendingAgentTemplate') || '{}');

    const [accepted, setAccepted] = useState(false);
    const [signature, setSignature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignContract = async () => {
        if (!accepted || signature.trim() === '') {
            alert('يرجى الموافقة على الشروط وتوقيع العقد باسمك.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Now we actually create the Agent in the database, because the user has paid and signed
            const agentResult = await createAgent({
                name: businessRules.businessName || 'AI Agent',
                specialty: businessRules.businessType || 'General',
            });

            if (!agentResult.success) {
                alert(`حدث خطأ في إنشاء الوكيل. يرجى المحاولة مرة أخرى.\nالسبب: ${agentResult.error}`);
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
                alert('حدث خطأ أثناء حفظ وثيقة العقد.');
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
            alert('حدث خطأ غير متوقع.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem', direction: 'rtl' }}>
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
                        اتفاقية سرية المعلومات والموظف الرقمي
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        خطوتك الأخيرة قبل تهيئة موظفك الذكي نحو العمل الفعلي.
                    </p>
                </div>

                <div className="card" style={{
                    padding: '3rem',
                    borderRadius: '24px',
                    background: '#18181B',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <div style={{
                        height: '300px',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '2rem',
                        color: '#D4D4D8',
                        lineHeight: 1.8,
                        fontSize: '0.95rem'
                    }}>
                        <h4 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Scale size={20} color="#8B5CF6" /> بنود اتفاقية (NDA) وتوظيف الذكاء الاصطناعي
                        </h4>
                        <p><strong>١. حماية البيانات السرية:</strong> تتعهد منصة 24Shift بالمحافظة التامة على سرية كافة البيانات، الملفات، والمرفقات التي يتم رفعها لغرض تدريب الموظف الرقمي الخاص بك.</p>
                        <p><strong>٢. ملكية المعلومات:</strong> جميع قواعد المعرفة المُدخلة هي ملك حصري لمنشأتك، ولن يتم استخدامها لتدريب نماذج عامة أو مشاركتها مع أطراف ثالثة نهائياً.</p>
                        <p><strong>٣. حدود المسؤولية:</strong> الموظف الرقمي هو أداة مساعدة تعمل وفق التعليمات وقواعد البيانات المعطاة له. المنشأة تتحمل مسؤولية مراجعة التعليمات لضمان عدم تعارضها مع سياساتها الداخلية.</p>
                        <p><strong>٤. الإلغاء والتعديل:</strong> يحق للعميل مسح بياناته بالكامل وإنهاء الاستعانة بالموظف الرقمي في أي لحظة عبر لوحة التحكم، وسيتم إتلاف قواعد المعرفة الخاصة به تلقائياً.</p>
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
                                <span style={{ color: 'white', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                    أقر بأنني اطلعت على البنود وموّفق عليها
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    بموافقتك، يتم تحويل العقد إلى مسودة رقمية ملزمة لضمان حقوقك فوراً.
                                </span>
                            </div>
                        </label>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: 'white', fontWeight: 600 }}>التوقيع الإلكتروني (الاسم الكامل):</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={20} color="#A1A1AA" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="اكتب اسمك للمصادقة على العقد..."
                                style={{
                                    width: '100%',
                                    padding: '1rem 3rem 1rem 1rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
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
                            color: 'white',
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
                        {isSubmitting ? 'جاري توثيق العقد...' : (
                            <>
                                <CheckCircle size={24} /> اعتماد وتفعيل الموظف
                            </>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        معلوماتك محمية بتشفير 256-bit آمن ولن تُشارك مع أي جهة.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractSign;
