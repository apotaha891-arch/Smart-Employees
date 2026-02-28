import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Bot, Plus, Settings, Power, Calendar, MessageCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SECTOR_LABELS = {
    beauty: { label: 'تجميل وعناية', emoji: '🌸', color: '#EC4899' },
    medical: { label: 'طبي / عيادات', emoji: '🩺', color: '#3B82F6' },
    restaurant: { label: 'مطاعم وضيافة', emoji: '🍽', color: '#F59E0B' },
    fitness: { label: 'رياضة وصحة', emoji: '🏋', color: '#10B981' },
    real_estate: { label: 'عقارات', emoji: '🏠', color: '#8B5CF6' },
    general: { label: 'عام', emoji: '🏢', color: '#6B7280' },
};

const ROLE_LABELS = {
    booking: { label: 'منسقة حجوزات', icon: Calendar, color: '#8B5CF6' },
    support: { label: 'خدمة عملاء', icon: MessageCircle, color: '#10B981' },
    sales: { label: 'متابعة مبيعات', icon: TrendingUp, color: '#F59E0B' },
    followup: { label: 'متابعة', icon: RefreshCw, color: '#3B82F6' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Employees = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userSector, setUserSector] = useState('beauty');
    const [filterRole, setFilterRole] = useState('');

    useEffect(() => { loadSectorAndAgents(); }, []);

    const loadSectorAndAgents = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: config } = await supabase
                .from('salon_configs')
                .select('business_type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (config?.business_type) setUserSector(config.business_type);
        }
        const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
        setAgents(data || []);
        setLoading(false);
    };

    const toggleAgent = async (agent) => {
        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id);
        loadSectorAndAgents();
    };

    const sector = SECTOR_LABELS[userSector] || SECTOR_LABELS.beauty;
    const filtered = agents.filter(a => !filterRole || (a.specialty || 'booking') === filterRole);

    return (
        <div style={{ color: 'white', minHeight: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>الموظفات الذكيات</h1>
                        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '4px 0 0' }}>
                            قطاع: <span style={{ color: sector.color, fontWeight: 600 }}>{sector.emoji} {sector.label}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/templates')}
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    <Plus size={18} /> استئجار موظفة
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'إجمالي الموظفات', value: agents.length, color: '#8B5CF6' },
                    { label: 'نشطة الآن', value: agents.filter(a => a.status === 'active').length, color: '#10B981' },
                    { label: 'أدوار مختلفة', value: [...new Set(agents.map(a => a.specialty || 'booking'))].length, color: '#F59E0B' },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Role Filter only — sector is determined globally from onboarding */}
            <div style={{ marginBottom: '1.5rem' }}>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '0.9rem' }}>
                    <option value="">كل الأدوار</option>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Agents Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>جاري التحميل...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#111827', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Bot size={48} color="#374151" style={{ marginBottom: '1rem' }} />
                    <div style={{ color: '#9CA3AF', marginBottom: '1rem' }}>لا توجد موظفات بعد</div>
                    <button onClick={() => setShowAddModal(true)} style={{ background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                        استئجر أول موظفة
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filtered.map(agent => {
                        const role = ROLE_LABELS[agent.specialty || 'booking'] || ROLE_LABELS.booking;
                        const RoleIcon = role.icon;
                        const isActive = agent.status === 'active';
                        return (
                            <div key={agent.id} style={{ background: '#111827', borderRadius: '16px', border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`, overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${role.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                            {agent.avatar || '👩'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{agent.name}</div>
                                            <span style={{ fontSize: '0.75rem', background: `${role.color}20`, color: role.color, padding: '2px 8px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <RoleIcon size={10} />{role.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#10B981' : '#374151' }} />
                                        <span style={{ fontSize: '0.75rem', color: isActive ? '#10B981' : '#6B7280' }}>{isActive ? 'نشطة' : 'متوقفة'}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5 }}>
                                    {agent.description || `موظفة ${role.label} في قطاع ${sector.label}`}
                                </div>
                                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
                                    <button onClick={() => navigate(`/salon-setup?agent=${agent.id}`)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Settings size={14} /> إعدادات
                                    </button>
                                    <button onClick={() => toggleAgent(agent)}
                                        style={{ flex: 1, background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isActive ? '#EF4444' : '#10B981', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Power size={14} /> {isActive ? 'إيقاف' : 'تفعيل'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showAddModal && (
                <HireModal
                    sector={userSector}
                    onClose={() => setShowAddModal(false)}
                    onAdded={() => { setShowAddModal(false); loadSectorAndAgents(); }}
                />
            )}
        </div>
    );
};

// ─── Hire Wizard: Role → Details (sector pre-set from onboarding) ─────────────
const HireModal = ({ sector, onClose, onAdded }) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ specialty: '', name: '', description: '', platform: 'telegram' });
    const [saving, setSaving] = useState(false);
    const sectorInfo = SECTOR_LABELS[sector] || SECTOR_LABELS.beauty;

    const handleSave = async () => {
        if (!form.name || !form.specialty) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('agents').insert([{
            name: form.name,
            description: form.description,
            business_type: sector,
            specialty: form.specialty,
            platform: form.platform,
            status: 'inactive',
            plan: 'basic',
            avatar: '👩',
            user_id: user?.id ?? null,
        }]);
        setSaving(false);
        onAdded();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#111827', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '480px' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>استئجار موظفة جديدة</h2>
                        <p style={{ margin: '4px 0 0', color: sectorInfo.color, fontSize: '0.85rem' }}>{sectorInfo.emoji} {sectorInfo.label}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                {/* Progress bar */}
                <div style={{ height: '3px', background: '#1F2937' }}>
                    <div style={{ height: '100%', width: `${step * 50}%`, background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)', transition: 'width 0.3s' }} />
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Step 1: Choose Role */}
                    {step === 1 && (
                        <div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'white' }}>اختر دور الموظفة</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(ROLE_LABELS).map(([k, v]) => {
                                    const Icon = v.icon;
                                    const isLocked = k !== 'booking';
                                    return (
                                        <button key={k}
                                            onClick={() => { if (!isLocked) { setForm({ ...form, specialty: k }); setStep(2); } }}
                                            style={{ padding: '1rem', borderRadius: '12px', border: `2px solid ${form.specialty === k ? v.color : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.03)', color: isLocked ? '#4B5563' : 'white', cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px', opacity: isLocked ? 0.6 : 1 }}>
                                            <Icon size={20} color={isLocked ? '#4B5563' : v.color} />
                                            <span style={{ flex: 1, fontWeight: 600 }}>{v.label}</span>
                                            {isLocked && <span style={{ fontSize: '0.7rem', background: '#F59E0B20', color: '#F59E0B', padding: '2px 8px', borderRadius: '99px' }}>🔒 قريباً</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Employee Details */}
                    {step === 2 && (
                        <div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'white' }}>تفاصيل الموظفة</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px' }}>اسم الموظفة</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="مثال: رنا — منسقة الحجوزات"
                                        style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px' }}>المنصة</label>
                                    <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                                        <option value="telegram">Telegram</option>
                                        <option value="whatsapp" disabled>WhatsApp (قريباً)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '6px' }}>وصف مختصر (اختياري)</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={2} style={{ width: '100%', padding: '10px', background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', resize: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {step > 1 && (
                        <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                            رجوع
                        </button>
                    )}
                    {step === 2 && (
                        <button onClick={handleSave} disabled={!form.name || saving}
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600, opacity: !form.name ? 0.5 : 1 }}>
                            {saving ? 'جاري الحفظ...' : '✅ استئجار الموظفة'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Employees;
