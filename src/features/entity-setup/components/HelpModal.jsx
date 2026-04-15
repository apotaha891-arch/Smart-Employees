import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { HELP_GUIDES } from '../constants';

const HelpModal = ({ 
    language, 
    helpModalType, 
    setShowHelpModal, 
    currentUserId, 
    setStatusMsg 
}) => {
    if (!helpModalType) return null;

    const guides = HELP_GUIDES(language, currentUserId);
    const guide = guides[helpModalType];
    
    if (!guide) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px'
        }}>
            <div className="animate-scale-in" style={{
                width: '100%', maxWidth: '600px', background: '#18181B',
                borderRadius: '24px', border: `1px solid ${guide.color}44`,
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    padding: '24px', background: `linear-gradient(135deg, ${guide.color}22, transparent)`,
                    borderBottom: '1px solid var(--color-border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>{guide.title}</h3>
                    <button 
                        onClick={() => setShowHelpModal(false)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-secondary)', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {guide.steps.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px', background: `${guide.color}22`,
                                    color: guide.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem', fontWeight: 800, flexShrink: 0, border: `1px solid ${guide.color}44`
                                }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{step.t}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{step.d}</p>
                                    
                                    {step.copy && (
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                            <code style={{ flex: 1, background: '#0F172A', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', color: guide.color, border: '1px solid var(--color-border-subtle)', wordBreak: 'break-all' }}>
                                                {step.copy}
                                            </code>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(step.copy);
                                                    setStatusMsg({ type: 'success', text: language === 'ar' ? 'تم نسخ البريد!' : 'Email copied!' });
                                                }}
                                                style={{ background: '#374151', border: 'none', color: 'var(--color-text-main)', padding: '0 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                                            >
                                                {language === 'ar' ? 'نسخ' : 'Copy'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ 
                        marginTop: '32px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', 
                        borderRadius: '16px', border: '1px dashed rgba(139, 92, 246, 0.3)',
                        display: 'flex', alignItems: 'center', gap: '16px'
                    }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✨
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                                {language === 'ar' ? 'هل تواجه صعوبة؟' : 'Need more help?'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                {language === 'ar' ? 'يمكن لـ "نورة" مساعدتك في كل خطوة.' : 'Noura can guide you through every step.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                setShowHelpModal(false);
                                const msg = language === 'ar' 
                                    ? `أريد مساعدة في تفعيل ربط ${guide.title}` 
                                    : `I need help activating ${guide.title}`;
                                window.dispatchEvent(new CustomEvent('open-concierge', { detail: { type: 'support', message: msg } }));
                            }}
                            style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                            {language === 'ar' ? 'اسأل نورة' : 'Ask Noura'}
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px', background: '#18181B', borderTop: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                    <button onClick={() => setShowHelpModal(false)} style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                        {language === 'ar' ? 'فهمت ذلك، إغلاق' : 'Got it, close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
