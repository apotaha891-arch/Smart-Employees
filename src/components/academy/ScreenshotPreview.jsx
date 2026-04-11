import React from 'react';
import { 
    LayoutDashboard, Users, Zap, Bot, ShieldCheck, 
    BarChart3, Calendar, MessageSquare, Briefcase 
} from 'lucide-react';

/**
 * This component is a pure UI mockup of the real 24Shift platform
 * using the project's actual styles and icons, but with static data.
 * Used to capture high-quality screenshots for the Training Bag.
 */
const ScreenshotPreview = ({ type = 'dashboard' }) => {
    const isArabic = true; // Most screenshots should be in Arabic as requested

    const DashboardMock = () => (
        <div style={{ padding: '2rem', background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>لوحة التحكم</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 700 }}>رصيد المحفظة: 240$</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'العملاء النشطون', value: '124', icon: <Users />, color: '#3B82F6' },
                    { label: 'المحادثات اليومية', value: '1,420', icon: <MessageSquare />, color: '#10B981' },
                    { label: 'المواعيد المؤكدة', value: '42', icon: <Calendar />, color: '#8B5CF6' },
                    { label: 'الموظفين الأذكياء', value: '3', icon: <Bot />, color: '#F59E0B' },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#111827', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: stat.color, marginBottom: '1rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.25rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#111827', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>آخر العمليات</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1F2937' }}></div>
                                <div>
                                    <div style={{ fontWeight: 700 }}>عميل جديد #240{i}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#4B5563' }}>منذ 5 دقائق - واتساب</div>
                                </div>
                            </div>
                            <div style={{ color: '#10B981', fontWeight: 700 }}>ناجح</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const AgentsMock = () => (
        <div style={{ padding: '2rem', background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '3rem' }}>معرض الموظفين الذكي</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                {[
                    { name: 'سارة - موظفة عقارات', role: 'مبيعات وتأجير', color: '#8B5CF6' },
                    { name: 'خالد - دعم فني', role: 'حل مشكلات تقنية', color: '#10B981' },
                    { name: 'ليلى - سكرتيرة طبية', role: 'حجز مواعيد واستشارات', color: '#EC4899' },
                ].map((agent, i) => (
                    <div key={i} style={{ background: '#111827', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '140px', background: `linear-gradient(135deg, ${agent.color}dd, #111827)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={60} color="white" />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{agent.name}</h3>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{agent.role}</p>
                            <button style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: agent.color, color: 'white', border: 'none', fontWeight: 700 }}>توظيف الآن</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (type === 'agents') return <AgentsMock />;
    return <DashboardMock />;
};

export default ScreenshotPreview;
