import React from 'react';
import { 
    Plus, Trash2, Check, ArrowRight, BookOpen 
} from 'lucide-react';
import { Card, Btn, Input } from './SharedComponents';

const InterviewAgentsTab = ({
    isEnglish, isRtl, interviewAgents, setInterviewAgents,
    savingInterview, saveInterviewAgentsData, resetInterviewAgentsData,
    showAddTemplate, setShowAddTemplate, newTemplate, setNewTemplate,
    templates, deleteTemplate, addTemplate, roles, sectors, t
}) => {
    // Realistic avatars helper
    const REALISTIC_AVATARS = [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop"
    ];

    const getRealisticAvatar = (url) => {
        if (!url || url.length < 5) return url; 
        if (url.startsWith('http')) return url;
        return REALISTIC_AVATARS[0];
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                        {isEnglish ? 'Interview Agent Templates' : '🎙️ قوالب موظفي المقابلة'}
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '0.85rem' }}>
                        {isEnglish ? 'Manage ready-made characters shown to clients in the interview room' : 'قم بإدارة النماذج والشخصيات الجاهزة التي يتم عرضها للعملاء في غرفة المقابلة'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn onClick={() => window.open('/academy/bag', '_blank')} color="rgba(139, 92, 246, 0.2)" style={{ color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <BookOpen size={16} /> {isEnglish ? 'Training Bag' : 'الحقيبة التدريبية'}
                    </Btn>
                    <Btn onClick={() => setShowAddTemplate(!showAddTemplate)}>
                        <Plus size={16} /> {isEnglish ? 'New Template' : 'إضافة شخصية'}
                    </Btn>
                </div>
            </div>

            {showAddTemplate && (
                <Card s={{ marginBottom: '2rem', border: '1px solid rgba(139,92,246,0.3)', animation: 'slideDown 0.3s ease-out' }} c={
                    <div>
                        <div style={{ fontWeight: 800, color: '#A78BFA', marginBottom: '1.25rem', fontSize: '1rem' }}>➕ {isEnglish ? 'Create Character Template' : 'إنشاء وعرض قالب شخصية جديد'}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Name (Arabic)' : 'اسم القالب (عربي)'}</label>
                                <Input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} placeholder="مثال: منسقة حجوزات ذكية" />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Name (English)' : 'اسم القالب (إنجليزي)'}</label>
                                <Input value={newTemplate.name_en} onChange={e => setNewTemplate(p => ({ ...p, name_en: e.target.value }))} placeholder="e.g. Smart Booking Coordinator" dir="ltr" />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Specialty' : 'التخصص'}</label>
                                <select value={newTemplate.specialty} onChange={e => setNewTemplate(p => ({ ...p, specialty: e.target.value }))} style={{ width: '100%', padding: '10px', background: 'var(--color-bg-input)', color: 'var(--color-text-main)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', outline: 'none' }}>
                                    {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Sector' : 'القطاع'}</label>
                                <select value={newTemplate.business_type} onChange={e => setNewTemplate(p => ({ ...p, business_type: e.target.value }))} style={{ width: '100%', padding: '10px', background: 'var(--color-bg-input)', color: 'var(--color-text-main)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', outline: 'none' }}>
                                    {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v.e} {v.l}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Description (Arabic)' : 'الوصف (عربي)'}</label>
                                <textarea value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '12px', background: 'var(--color-bg-input)', color: 'var(--color-text-main)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', minHeight: '80px', outline: 'none', fontSize: '0.85rem' }} placeholder="اشرح مهام هذه الموظفة بالعربية..." />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Description (English)' : 'الوصف (إنجليزي)'}</label>
                                <textarea value={newTemplate.description_en} onChange={e => setNewTemplate(p => ({ ...p, description_en: e.target.value }))} style={{ width: '100%', padding: '12px', background: 'var(--color-bg-input)', color: 'var(--color-text-main)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', minHeight: '80px', outline: 'none', fontSize: '0.85rem' }} placeholder="Explain this agent's tasks in English..." dir="ltr" />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 600 }}>{isEnglish ? 'Select Realistic Avatar' : 'اختر صورة الموظفة (صورة حقيقية)'}</label>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                                    {REALISTIC_AVATARS.map((url, i) => (
                                        <img 
                                            key={i} 
                                            src={url} 
                                            onClick={() => setNewTemplate(p => ({ ...p, avatar: url }))}
                                            style={{ 
                                                cursor: 'pointer',
                                                width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover',
                                                border: newTemplate.avatar === url ? '3px solid #8B5CF6' : '3px solid transparent',
                                                opacity: newTemplate.avatar === url ? 1 : 0.6,
                                                transform: newTemplate.avatar === url ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'all 0.2s',
                                                boxShadow: newTemplate.avatar === url ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none'
                                            }} 
                                        />
                                    ))}
                                </div>
                                <Input value={newTemplate.avatar} onChange={e => setNewTemplate(p => ({ ...p, avatar: e.target.value }))} placeholder={isEnglish ? "Or enter custom image URL..." : "أو أدخل رابط صورة مخصصة..."} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddTemplate(false)} style={{ background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
                            <Btn onClick={addTemplate}><Check size={16} /> {isEnglish ? 'Save Template' : 'حفظ القالب الجديد'}</Btn>
                        </div>
                    </div>
                } />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {templates.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: '#6B7280', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                        {isEnglish ? 'No templates found.' : 'لا يوجد قوالب شخصيات حالياً.'}
                    </div>
                ) : templates.map(temp => (
                    <Card key={temp.id} s={{ border: '1px solid rgba(139,92,246,0.15)', transition: 'all 0.2s', cursor: 'default' }} c={
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={getRealisticAvatar(temp.avatar)} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <div>
                                        <div style={{ fontWeight: 900, color: 'var(--color-text-main)', fontSize: '0.95rem', direction: isEnglish ? 'ltr' : 'rtl' }}>
                                            {isEnglish ? (temp.name_en || temp.name) : temp.name}
                                        </div>
                                        {temp.name_en && !isEnglish && <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>{temp.name_en}</div>}
                                    </div>
                                </div>
                                <button onClick={() => deleteTemplate(temp.id)} style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', transition: '0.2s' }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', fontWeight: 800 }}>
                                    {roles[temp.specialty]?.l || temp.specialty}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                                    {sectors[temp.business_type]?.l || temp.business_type}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px', minHeight: '3.6em', opacity: 0.9 }}>
                                {isEnglish ? (temp.description_en || temp.description) : temp.description}
                            </div>
                        </div>
                    } />
                ))}
            </div>
        </div>
    );
};

export default InterviewAgentsTab;
