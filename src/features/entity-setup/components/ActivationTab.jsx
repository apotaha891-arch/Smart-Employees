import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ActivationTab = ({
    language,
    loading,
    setStatusMsg,
    setPaymentSuccess
}) => {
    return (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={40} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                {language === 'ar' ? '✅ الموظف جاهز للعمل' : '✅ Agent Ready to Deploy'}
            </h2>
            <p style={{ margin: '10px 0 2rem', color: 'var(--color-text-secondary)', maxWidth: '400px', marginInline: 'auto' }}>
                {language === 'ar'
                    ? 'لقد قمت بإعداد كل شيء بنجاح. يمكنك الآن تفعيل الموظف رسمياً ليبدأ باستقبال الطلبات.'
                    : 'Everything is set up. You can now activate the agent to start receiving requests.'}
            </p>
            <button 
                style={{ padding: '1rem 3rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)' }}
                onClick={() => {
                    setStatusMsg({ type: 'success', text: language === 'ar' ? '🚀 تم تفعيل الموظف بنجاح!' : '🚀 Agent activated successfully!' });
                    setPaymentSuccess(true);
                }}
            >
                {loading 
                    ? (language === 'ar' ? '⏳ جاري التفعيل...' : '⏳ Activating...') 
                    : (language === 'ar' ? '🚀 تفعيل الموظف' : '🚀 Activate Agent')
                }
            </button>
        </div>
    );
};

export default ActivationTab;
