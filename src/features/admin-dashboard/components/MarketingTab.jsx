import React from 'react';
import { 
    Target, Share2, Instagram, Send, Eye, Zap, 
    BarChart, TrendingUp, Users, ArrowUpRight 
} from 'lucide-react';
import { Card, Btn, StatCard } from './SharedComponents';

const MarketingTab = ({
    isEnglish, language, endCustomers, t
}) => {
    const isRtl = language === 'ar';
    const tgCount = endCustomers.filter(c => !!c.telegram_id).length;
    const igCount = endCustomers.filter(c => !!c.instagram_id).length;
    const totalCount = endCustomers.length || 1;

    const stats = [
        { 
            label: isEnglish ? 'Telegram Reach' : 'وصول تيليجرام', 
            val: tgCount, 
            perc: Math.round((tgCount / totalCount) * 100), 
            color: '#0088cc', 
            icon: Send 
        },
        { 
            label: isEnglish ? 'Instagram Reach' : 'وصول انستقرام', 
            val: igCount, 
            perc: Math.round((igCount / totalCount) * 100), 
            color: '#EC4899', 
            icon: Instagram 
        }
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                    {isEnglish ? 'Marketing Command Center' : 'مركز التحكم التسويقي'}
                </h1>
                <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '0.85rem' }}>
                    {isEnglish ? 'Analyze audience reach and multi-channel campaign performance' : 'تحليل وصول الجمهور وأداء الحملات عبر القنوات المتعددة'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card s={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.02))', border: '1px solid rgba(139, 92, 246, 0.2)' }} c={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>{isEnglish ? 'Total Reach' : 'إجمالي الوصول'}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{endCustomers.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowUpRight size={14} /> +12% {isEnglish ? 'this month' : 'هذا الشهر'}
                            </div>
                        </div>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={28} color="#A78BFA" />
                        </div>
                    </div>
                } />

                <Card s={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))', border: '1px solid rgba(16, 185, 129, 0.2)' }} c={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#34D399', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>{isEnglish ? 'Active Channels' : 'القنوات النشطة'}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>2</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px', fontWeight: 700 }}>
                                Telegram & Instagram
                            </div>
                        </div>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Share2 size={28} color="#34D399" />
                        </div>
                    </div>
                } />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <Card s={{ padding: '2rem' }} c={
                    <div>
                        <h3 style={{ margin: '0 0 2rem', color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 800 }}>
                            {isEnglish ? 'Channel Reach Distribution' : 'توزيع الوصول عبر القنوات'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {stats.map(s => (
                                <div key={s.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                                            <s.icon size={18} color={s.color} />
                                            {s.label}
                                        </div>
                                        <div style={{ fontWeight: 900, color: 'white' }}>{s.val} ({s.perc}%)</div>
                                    </div>
                                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${s.perc}%`, height: '100%', background: s.color, borderRadius: '10px', transition: 'width 1s ease-out' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                } />

                <Card s={{ padding: '2rem' }} c={
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Zap size={32} color="#F59E0B" />
                        </div>
                        <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                            {isEnglish ? 'Smart Marketing Insight' : 'رؤية تسويقية ذكية'}
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                            {isEnglish 
                                ? 'Your Telegram audience is growing 3x faster than Instagram. Focus your next AI-driven campaign on the Telegram channel for maximum conversion.' 
                                : 'ينمو جمهور تيليجرام بمعدل 3 أضعاف أسرع من انستقرام. ركز حملتك التالية المدعومة بالذكاء الاصطناعي على قناة تيليجرام لتحقيق أقصى قدر من التحويل.'}
                        </p>
                        <Btn style={{ marginTop: '2rem', width: '100%', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            {isEnglish ? 'Plan Campaign' : 'تخطيط حملة'}
                        </Btn>
                    </div>
                } />
            </div>
        </div>
    );
};

export default MarketingTab;
