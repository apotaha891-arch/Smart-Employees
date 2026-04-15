import React, { useState, useEffect } from 'react';
import { X, History, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react';
import { getWalletLedger } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';

const WalletLedgerModal = ({ isOpen, onClose, userId }) => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            getWalletLedger(userId).then(res => {
                if(res.success) {
                    setHistory(res.data);
                }
                setLoading(false);
            });
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', direction: isAr ? 'rtl' : 'ltr'
        }}>
            <div className="animate-fade-in-up" style={{
                background: 'var(--color-bg-surface)', borderRadius: '24px',
                width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                border: '1px solid var(--color-border-subtle)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,92,246,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(139,92,246,0.15)', borderRadius: '10px', color: '#8B5CF6' }}>
                            <History size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{isAr ? 'سجل العمليات والرصيد' : 'Billing & Credit Ledger'}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                {isAr ? 'تابع جميع عمليات الدفع والمنصرف من رصيدك بشفافية' : 'Track all deductions and top-ups transparently'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <FileText size={48} opacity={0.3} />
                            <p>{isAr ? 'لا توجد عمليات مسجلة حتى الآن.' : 'No transactions recorded yet.'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {history.map((record, idx) => {
                                const isDeduction = record.amount < 0;
                                const amountStr = Math.abs(record.amount).toLocaleString();
                                const color = isDeduction ? '#EF4444' : '#10B981';
                                const Icon = isDeduction ? ArrowDownRight : ArrowUpRight;
                                
                                return (
                                    <div key={record.id || idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1rem', background: '#18181B', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                                                    {record.reason || (isAr ? 'عملية غير مصنفة' : 'Uncategorized Transaction')}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span>{new Date(record.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    {record.platform && (
                                                        <>
                                                          <span>•</span>
                                                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                              {record.platform}
                                                          </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: color }}>
                                            {isDeduction ? '-' : '+'}{amountStr}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletLedgerModal;
