import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Users, UserPlus, Search, Briefcase, Star, FileText, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';

const HRRecruitmentManager = () => {
    const { t, language } = useLanguage();
    const isAr = language === 'ar';
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock candidates for HR CRM
        setTimeout(() => {
            setCandidates([
                { id: 1, name: 'Laila Mansour', role: 'Digital Marketing', stage: 'Interview', score: 92, appliedAt: '2026-03-07', experience: '5 years' },
                { id: 2, name: 'Khaled Omar', role: 'Software Engineer', stage: 'Screening', score: 78, appliedAt: '2026-03-08', experience: '3 years' },
                { id: 3, name: 'Noura Salem', role: 'Accountant', stage: 'Hired', score: 88, appliedAt: '2026-02-28', experience: '7 years' },
                { id: 4, name: 'Yousef Hassan', role: 'Sales Lead', stage: 'Rejected', score: 45, appliedAt: '2026-03-01', experience: '1 year' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const getStageStyle = (stage) => {
        switch (stage) {
            case 'Hired': return { bg: '#10B98120', text: '#10B981', icon: CheckCircle };
            case 'Rejected': return { bg: '#EF444420', text: '#EF4444', icon: XCircle };
            case 'Interview': return { bg: '#8B5CF620', text: '#8B5CF6', icon: Clock };
            default: return { bg: '#3B82F620', text: '#3B82F6', icon: Search };
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '1.5rem', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                        {isAr ? 'مركز التوظيف والموارد البشرية' : 'Hiring Hub & HR Management'}
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                        {isAr ? 'إدارة المتقدمين، تتبع المقابلات الذكاء الاصطناعي وتنظيم فريقك' : 'Manage candidates, track AI interviews, and build your team'}
                    </p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> {isAr ? 'إشهار وظيفة جديدة' : 'Post New Job'}
                </button>
            </div>

            {/* Pipeline Overview */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {[
                    { label: isAr ? 'المتقدمين الجدد' : 'New Applicants', count: 24, color: '#3B82F6' },
                    { label: isAr ? 'المقابلات' : 'Interviews', count: 8, color: '#8B5CF6' },
                    { label: isAr ? 'العروض المرسلة' : 'Offers Sent', count: 3, color: '#F59E0B' },
                    { label: isAr ? 'الموظفين الجدد' : 'New Hires', count: 12, color: '#10B981' },
                ].map((step, idx) => (
                    <div key={idx} style={{ flex: 1, minWidth: '180px', background: '#111827', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>{step.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>{step.count}</div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: step.color }} />
                    </div>
                ))}
            </div>

            {/* Candidate List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, min-grow(300px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>{isAr ? 'جاري تحليل السير الذاتية...' : 'Analyzing resumes...'}</div>
                ) : candidates.map(candidate => {
                    const stage = getStageStyle(candidate.stage);
                    return (
                        <div key={candidate.id} className="card shadow-premium" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                                    <Users size={24} />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        <Star size={12} fill="#A78BFA" /> {candidate.score}%
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ color: 'white', fontWeight: 800, marginBottom: '0.25rem' }}>{candidate.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                <Briefcase size={14} /> {candidate.role}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    <div style={{ marginBottom: '2px' }}>{isAr ? 'الخبرة' : 'Exp'}</div>
                                    <div style={{ color: '#E5E7EB', fontWeight: 600 }}>{candidate.experience}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    <div style={{ marginBottom: '2px' }}>{isAr ? 'تاريخ التقديم' : 'Applied'}</div>
                                    <div style={{ color: '#E5E7EB', fontWeight: 600 }}>{new Date(candidate.appliedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <stage.icon size={16} color={stage.text} />
                                    <span style={{ color: stage.text, fontSize: '0.85rem', fontWeight: 700 }}>{candidate.stage}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: '#9CA3AF', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={18} /></button>
                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{isAr ? 'عرض' : 'View'}</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HRRecruitmentManager;
