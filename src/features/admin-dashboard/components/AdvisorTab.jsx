import React from 'react';
import { 
    RefreshCw, Zap, Sparkles 
} from 'lucide-react';
import { Card, Btn } from './SharedComponents';
import * as adminService from '../../../services/adminService';

const AdvisorTab = ({
    isEnglish, language, advisorMessages, setAdvisorMessages, 
    advisorInput, setAdvisorInput, advisorConfig, setAdvisorConfig,
    clients, agents, bookings, saving, setSaving, flash, t
}) => {
    const isRtl = language === 'ar';

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!advisorInput?.trim() || saving) return;
        
        const userMsg = advisorInput.trim();
        setAdvisorInput('');
        setAdvisorMessages(p => [...p, { role: 'user', content: userMsg }]);
        
        setSaving(true);
        try {
            const context = `Platform Stats: ${clients.length} Clients, ${agents.length} Agents, ${bookings.length} Bookings.`;
            const response = await adminService.chatWithAdvisor(userMsg, advisorMessages, advisorConfig, context);
            setAdvisorMessages(p => [...p, { role: 'assistant', content: response }]);
        } catch (e) {
            console.error('Advisor chat error:', e);
            setAdvisorMessages(p => [...p, { 
                role: 'assistant', 
                content: isEnglish 
                    ? 'I encountered an error while processing your request. Please check the system logs.' 
                    : 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى التحقق من سجلات النظام.' 
            }]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
            <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={28} className="text-secondary" />
                    {isEnglish ? 'Smart Admin Advisor' : 'المستشار الذكي للأدمن'}
                </h1>
                <p style={{ color: '#6B7280', margin: '6px 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {isEnglish 
                        ? 'Discuss platform strategies, request data analysis, and optimize agent performance with your AI business partner.' 
                        : 'ناقش استراتيجيات المنصة، واطلب تحليل البيانات، وحسّن أداء الموظفات الأذكياء مع شريكك الإداري المدعوم بالذكاء الاصطناعي.'}
                </p>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
                {/* Chat Interface */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: '#0D1117', 
                    borderRadius: '20px', 
                    border: '1px solid var(--color-border-subtle)', 
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {(advisorMessages || []).map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                background: m.role === 'user' ? 'var(--color-bg-input)' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                                color: m.role === 'user' ? '#E2E8F0' : '#A78BFA',
                                padding: '12px 18px',
                                borderRadius: m.role === 'user' ? (isRtl ? '20px 0 20px 20px' : '0 20px 20px 20px') : (isRtl ? '20px 20px 0 20px' : '20px 20px 20px 0'),
                                fontSize: '0.92rem',
                                lineHeight: 1.6,
                                border: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.3)'}`,
                                boxShadow: m.role === 'user' ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontWeight: 900, fontSize: '0.7rem', marginBottom: '6px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {m.role === 'user' ? (isEnglish ? 'Administrator' : 'المدير') : (isEnglish ? 'Smart Advisor' : 'المستشار الذكي')}
                                </div>
                                {m.content}
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                        <form style={{ display: 'flex', gap: '0.8rem' }} onSubmit={handleSendMessage}>
                            <input 
                                value={advisorInput || ''} 
                                onChange={e => setAdvisorInput(e.target.value)} 
                                placeholder={isEnglish ? 'Ask your consultant about growth, data, or settings...' : 'اسأل مستشارك الذكي عن النمو، البيانات، أو الإعدادات...'}
                                style={{ 
                                    flex: 1, 
                                    background: 'var(--color-bg-input)', 
                                    border: '1px solid var(--color-border-subtle)', 
                                    borderRadius: '12px', 
                                    color: 'var(--color-text-main)', 
                                    padding: '12px 18px', 
                                    fontSize: '0.95rem', 
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                            <button 
                                type="submit" 
                                disabled={saving} 
                                style={{ 
                                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    padding: '0 1.8rem', 
                                    fontWeight: 800, 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                {saving ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                                {isEnglish ? 'Consult' : 'استشر'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Strategy Cards */}
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Card s={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', padding: '1.5rem' }} c={
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <div style={{ 
                                background: '#10B981', color: 'white', display: 'inline-block', 
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', 
                                fontWeight: 900, marginBottom: '0.8rem', textTransform: 'uppercase' 
                            }}>
                                {isEnglish ? 'Growth Hack' : 'فكرة نمو'}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                                {isEnglish 
                                    ? '"Data shows medical clinics have the highest retention. Consider a 15% discount for doctors to boost acquisition."' 
                                    : '"تظهر البيانات أن العيادات الطبية لديها أعلى معدل بقاء. فكر في منح خصم 15% للأطباء لزيادة الاستحواذ."'}
                            </p>
                        </div>
                    } />
                    
                    <Card s={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', padding: '1.5rem' }} c={
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <div style={{ 
                                background: '#3B82F6', color: 'white', display: 'inline-block', 
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', 
                                fontWeight: 900, marginBottom: '0.8rem', textTransform: 'uppercase' 
                            }}>
                                {isEnglish ? 'Performance' : 'تحليل الأداء'}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                                {isEnglish 
                                    ? '"Agent response time has improved by 22% after the last prompt update. Efficiency is peak."' 
                                    : '"تحسن وقت استجابة الموظفات بنسبة 22% بعد تحديث التلقين الأخير. الكفاءة في أعلى مستوياتها."'}
                            </p>
                        </div>
                    } />

                    <div style={{ 
                        marginTop: 'auto', padding: '1rem', background: 'rgba(139, 92, 246, 0.05)', 
                        borderRadius: '15px', border: '1px dashed rgba(139, 92, 246, 0.2)', fontSize: '0.75rem', 
                        color: '#6B7280', textAlign: 'center' 
                    }}>
                        {isEnglish 
                            ? 'Advisor is trained on your platform data and safe management practices.' 
                            : 'المستشار مدرب على بيانات منصتك وأفضل الممارسات الإدارية الآمنة.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvisorTab;
