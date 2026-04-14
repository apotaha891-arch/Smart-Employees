import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseService';
import { Users, UserPlus, Briefcase, Star, FileText, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

const HRRecruitmentManager = () => {
    const { t, language } = useLanguage();
    const isAr = language === 'ar';
    const { user: contextUser } = useAuth(); // Respects impersonation
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entityId, setEntityId] = useState(null);
    const [stats, setStats] = useState({ new: 0, interviews: 0, offers: 0, hired: 0 });

    // Re-run when user changes (impersonation support)
    useEffect(() => {
        if (contextUser?.id) loadData();
    }, [contextUser?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const userId = contextUser?.id;
            if (!userId) return;

            // Get entity for this user
            const { data: entity } = await supabase
                .from('entities')
                .select('id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const eid = entity?.id;
            setEntityId(eid);

            if (!eid) {
                setCandidates([]);
                setLoading(false);
                return;
            }

            // Fetch job applications for this entity only
            const { data: apps, error } = await supabase
                .from('job_applications')
                .select('*')
                .eq('entity_id', eid)
                .order('created_at', { ascending: false });

            if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
                console.error('HR: Error fetching applications:', error);
            }

            const list = apps || [];
            setCandidates(list);

            // Compute real stats
            setStats({
                new: list.filter(a => a.stage === 'Screening' || a.stage === 'New').length,
                interviews: list.filter(a => a.stage === 'Interview').length,
                offers: list.filter(a => a.stage === 'Offer').length,
                hired: list.filter(a => a.stage === 'Hired').length,
            });
        } catch (err) {
            console.error('HR: Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                        {isAr ? 'مركز التوظيف والموارد البشرية' : 'Hiring Hub & HR Management'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {isAr ? 'إدارة المتقدمين، تتبع المقابلات الذكاء الاصطناعي وتنظيم فريقك' : 'Manage candidates, track AI interviews, and build your team'}
                    </p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> {isAr ? 'إشهار وظيفة جديدة' : 'Post New Job'}
                </button>
            </div>

            {/* Pipeline Stats — computed from real data */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {[
                    { label: isAr ? 'المتقدمين الجدد' : 'New Applicants', count: stats.new, color: '#3B82F6' },
                    { label: isAr ? 'المقابلات' : 'Interviews', count: stats.interviews, color: '#8B5CF6' },
                    { label: isAr ? 'العروض المرسلة' : 'Offers Sent', count: stats.offers, color: '#F59E0B' },
                    { label: isAr ? 'الموظفين الجدد' : 'New Hires', count: stats.hired, color: '#10B981' },
                ].map((step, idx) => (
                    <div key={idx} style={{ flex: 1, minWidth: '180px', background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--color-border-subtle)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{step.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-main)' }}>{step.count}</div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: step.color }} />
                    </div>
                ))}
            </div>

            {/* Candidate List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    {isAr ? 'جاري تحميل البيانات...' : 'Loading data...'}
                </div>
            ) : candidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-bg-surface)', borderRadius: '20px', border: '1px dashed var(--color-border-subtle)' }}>
                    <div style={{ width: '72px', height: '72px', background: 'rgba(139,92,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#8B5CF6' }}>
                        <Users size={36} />
                    </div>
                    <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {isAr ? 'لا يوجد متقدمون بعد' : 'No applicants yet'}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                        {isAr 
                            ? 'أشهر وظيفتك الأولى لتبدأ باستقبال الطلبات وتتبع المقابلات الذكية.'
                            : 'Post your first job to start receiving applications and track AI-powered interviews.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {candidates.map(candidate => {
                        const stage = getStageStyle(candidate.stage);
                        const StageIcon = stage.icon;
                        return (
                            <div key={candidate.id} className="card shadow-premium" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '20px', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                                        <Users size={24} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139,92,246,0.1)', color: '#A78BFA', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        <Star size={12} fill="#A78BFA" /> {candidate.score || 0}%
                                    </div>
                                </div>
                                <h3 style={{ color: 'var(--color-text-main)', fontWeight: 800, marginBottom: '0.25rem' }}>{candidate.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    <Briefcase size={14} /> {candidate.role || candidate.job_title}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                        <div style={{ marginBottom: '2px' }}>{isAr ? 'الخبرة' : 'Exp'}</div>
                                        <div style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{candidate.experience || '—'}</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                        <div style={{ marginBottom: '2px' }}>{isAr ? 'تاريخ التقديم' : 'Applied'}</div>
                                        <div style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{new Date(candidate.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <StageIcon size={16} color={stage.text} />
                                        <span style={{ color: stage.text, fontSize: '0.85rem', fontWeight: 700 }}>{candidate.stage}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: 'var(--color-text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={18} /></button>
                                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{isAr ? 'عرض' : 'View'}</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HRRecruitmentManager;
