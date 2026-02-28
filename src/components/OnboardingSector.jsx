import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

const FALLBACK_SECTORS = [
    { value: 'beauty', label: 'تجميل وعناية', sublabel: 'صالونات، سبا، كلينيك جمال', emoji: '🌸', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC489920, #EC489905)' },
    { value: 'medical', label: 'طبي وصحي', sublabel: 'عيادات، مراكز أسنان، مختبرات', emoji: '🩺', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F620, #3B82F605)' },
    { value: 'restaurant', label: 'مطاعم وضيافة', sublabel: 'مطاعم، كافيهات، كيترينج', emoji: '🍽', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B20, #F59E0B05)' },
    { value: 'general', label: 'خدمات عامة', sublabel: 'تجارة، مقاولات، استشارات', emoji: '🏢', color: '#6B7280', gradient: 'linear-gradient(135deg, #6B728020, #6B728005)' },
];

const OnboardingSector = () => {
    const navigate = useNavigate();
    const [sectors, setSectors] = useState(FALLBACK_SECTORS);
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hovering, setHovering] = useState(null);

    useEffect(() => {
        const fetchSectors = async () => {
            const { data, error } = await supabase.from('platform_settings').select('value').eq('key', 'system_sectors').maybeSingle();
            if (data?.value) {
                const list = Object.entries(data.value)
                    .filter(([_, v]) => v.on !== false)
                    .map(([k, v]) => ({
                        value: k,
                        label: v.l,
                        emoji: v.e,
                        color: v.c,
                        gradient: `linear-gradient(135deg, ${v.c}20, ${v.c}05)`
                    }));
                if (list.length) setSectors(list);
            }
        };
        fetchSectors();
    }, []);

    const handleContinue = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            // Save business_type to salon_configs (upsert)
            const { data: existingConfig } = await supabase
                .from('salon_configs')
                .select('id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingConfig) {
                await supabase.from('salon_configs')
                    .update({ business_type: selected })
                    .eq('id', existingConfig.id);
            } else {
                await supabase.from('salon_configs')
                    .insert({ user_id: user.id, business_type: selected, status: 'active' });
            }

            // Also save to profiles for quick access
            await supabase.from('profiles')
                .update({ business_type: selected })
                .eq('id', user.id);

            navigate('/employees');
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    const sector = sectors.find(s => s.value === selected);

    return (
        <div style={{
            minHeight: '100vh', background: '#070B14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', fontFamily: "'Inter', 'Segoe UI', sans-serif"
        }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: `radial-gradient(circle, ${sector?.color || '#8B5CF6'}15 0%, transparent 70%)`, borderRadius: '50%', transition: 'all 0.6s ease' }} />
            </div>

            <div style={{ width: '100%', maxWidth: '720px', position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #10B981, #3B82F6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>24</div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, background: 'linear-gradient(90deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>24Shift</span>
                    </div>

                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', lineHeight: 1.2 }}>
                        ما هو قطاع نشاطك؟
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '1rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                        سنُخصِّص موظفيك الرقميين وخدماتهم بناءً على قطاعك تلقائياً
                    </p>
                </div>

                {/* Sector Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {sectors.map(s => {
                        const isSelected = selected === s.value;
                        const isHovered = hovering === s.value;
                        return (
                            <button
                                key={s.value}
                                onClick={() => setSelected(s.value)}
                                onMouseEnter={() => setHovering(s.value)}
                                onMouseLeave={() => setHovering(null)}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: `2px solid ${isSelected ? s.color : isHovered ? `${s.color}50` : 'rgba(255,255,255,0.07)'}`,
                                    background: isSelected ? s.gradient : isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'right',
                                    transition: 'all 0.25s ease',
                                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {isSelected && (
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', width: '22px', height: '22px', borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</div>
                                )}
                                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: isSelected ? s.color : 'white' }}>{s.label}</div>
                                <div style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>{s.sublabel}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Continue Button */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={handleContinue}
                        disabled={!selected || saving}
                        style={{
                            background: selected ? `linear-gradient(135deg, ${sector.color}, ${sector.color}cc)` : '#1F2937',
                            color: selected ? 'white' : '#4B5563',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '16px 48px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: selected ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            boxShadow: selected ? `0 8px 32px ${sector.color}40` : 'none',
                            transform: selected ? 'translateY(-2px)' : 'none',
                            minWidth: '240px'
                        }}
                    >
                        {saving ? '⏳ جاري الحفظ...' : selected ? `ابدأ في قطاع ${sector.label} ${sector.emoji}` : 'اختر قطاعك أولاً'}
                    </button>
                    <p style={{ color: '#4B5563', fontSize: '0.8rem', marginTop: '1rem' }}>
                        يمكنك تغيير هذا لاحقاً من إعدادات المنشأة
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingSector;
