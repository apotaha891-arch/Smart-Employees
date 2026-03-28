import React, { useEffect, useState } from 'react';
import * as adminService from '../services/adminService';

const SettingsPanel = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('{}');
    const [editKey, setEditKey] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllSettings();
            setSettings(data || []);
        } catch (err) {
            console.error('Failed to load settings', err);
        }
        setLoading(false);
    };

    const handleSave = async (key, value) => {
        try {
            const parsed = JSON.parse(value);
            await adminService.saveSetting(key, parsed);
            await load();
            setEditKey(null);
            return true;
        } catch (err) {
            alert('JSON صيغة غير صحيحة');
            console.error(err);
            return false;
        }
    };

    const handleDelete = async (key) => {
        if (window.confirm(`هل تريد حذف الإعداد '${key}'؟`)) {
            try {
                await adminService.deleteSetting(key);
                await load();
            } catch (err) {
                alert('فشل الحذف');
                console.error(err);
            }
        }
    };

    const handleAdd = async () => {
        if (!newKey.trim()) return alert('الرجاء إدخال المفتاح');
        const success = await handleSave(newKey.trim(), newValue);
        if (success) {
            setNewKey('');
            setNewValue('{}');
        }
    };

    // --- Pricing plans state and logic ---
    const pricingSetting = settings.find(s => s.key === 'pricing_plans');
    const [plans, setPlans] = useState([]);
    const [plansLoaded, setPlansLoaded] = useState(false);

    useEffect(() => {
        if (pricingSetting && !plansLoaded) {
            setPlans(Array.isArray(pricingSetting.value) ? pricingSetting.value : []);
            setPlansLoaded(true);
        }
    }, [pricingSetting, plansLoaded]);

    const handlePlanChange = (idx, field, value) => {
        setPlans(plans => plans.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };

    const handlePlanFeatureChange = (idx, fidx, value) => {
        setPlans(plans => plans.map((p, i) => i === idx ? { ...p, features: p.features.map((f, fi) => fi === fidx ? value : f) } : p));
    };

    const handleAddFeature = (idx) => {
        setPlans(plans => plans.map((p, i) => i === idx ? { ...p, features: [...(p.features || []), ''] } : p));
    };

    const handleRemoveFeature = (idx, fidx) => {
        setPlans(plans => plans.map((p, i) => i === idx ? { ...p, features: p.features.filter((_, fi) => fi !== fidx) } : p));
    };

    const handleAddPlan = () => {
        setPlans(plans => [...plans, { name: '', price: '', credits: '', features: [], cta: '', popular: false }]);
    };

    const handleRemovePlan = (idx) => {
        setPlans(plans => plans.filter((_, i) => i !== idx));
    };

    const handleSavePlans = async () => {
        await adminService.saveSetting('pricing_plans', plans);
        await load();
        setPlansLoaded(false);
        alert('تم حفظ الخطط بنجاح');
    };

    // --- External Integrations state and logic ---
    const integrationsSetting = settings.find(s => s.key === 'external_integrations');
    const [integrations, setIntegrations] = useState([]);
    const [integrationsLoaded, setIntegrationsLoaded] = useState(false);

    useEffect(() => {
        if (integrationsSetting && !integrationsLoaded) {
            setIntegrations(Array.isArray(integrationsSetting.value) ? integrationsSetting.value : []);
            setIntegrationsLoaded(true);
        }
    }, [integrationsSetting, integrationsLoaded]);

    const handleIntegrationChange = (idx, field, value) => {
        setIntegrations(intgs => intgs.map((i, ix) => ix === idx ? { ...i, [field]: value } : i));
    };

    const handleSaveIntegrations = async () => {
        await adminService.saveSetting('external_integrations', integrations);
        await load();
        setIntegrationsLoaded(false);
        alert('تم حفظ الروابط بنجاح');
    };

    // --- Manager AI Config state and logic ---
    const managerSetting = settings.find(s => s.key === 'manager_ai_config');
    const [managerConfig, setManagerConfig] = useState({});
    const [managerLoaded, setManagerLoaded] = useState(false);

    useEffect(() => {
        if (managerSetting && !managerLoaded) {
            setManagerConfig(managerSetting.value || {});
            setManagerLoaded(true);
        }
    }, [managerSetting, managerLoaded]);

    const handleManagerChange = (field, value) => {
        setManagerConfig(cfg => ({ ...cfg, [field]: value }));
    };

    const handleSaveManager = async () => {
        await adminService.saveSetting('manager_ai_config', managerConfig);
        await load();
        setManagerLoaded(false);
        alert('تم حفظ إعدادات المدير بنجاح');
    };

    if (loading) return <div className="card p-xl">جاري التحميل...</div>;

    // Separate settings by type
    const otherSettings = settings.filter(s => s.key !== 'pricing_plans');

    return (
        <div style={{ background: 'var(--shift-background-dark)', padding: '2rem', borderRadius: '16px' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>⚙️</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--shift-text-main)' }}>لوحة التحكم الإدارية</h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--shift-text-muted)', fontSize: '0.95rem' }}>إدارة جميع إعدادات المنصة والتكاملات بسهولة</p>
                    </div>
                </div>
            </div>

            {/* Pricing Plans Editor */}
            <div className="shift-card" style={{ background: 'var(--shift-surface-card)', border: '1px solid var(--shift-border)', padding: '2rem', marginBottom: '2rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>💰</span>
                    <div>
                        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 700, color: 'var(--shift-text-main)' }}>خطط التسعير</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--shift-text-muted)' }}>أدِر باقاتك وأسعارك بدون الحاجة للـ JSON</p>
                    </div>
                </div>

                {pricingSetting ? (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {plans.map((plan, idx) => (
                                <div key={idx} style={{ background: 'var(--shift-background-dark)', border: '1px solid var(--shift-border)', padding: '1.5rem', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <input 
                                            className="input-field" 
                                            style={{ flex: 1, marginTop: 0 }} 
                                            placeholder="اسم الباقة" 
                                            value={plan.name} 
                                            onChange={e => handlePlanChange(idx, 'name', e.target.value)} 
                                        />
                                        <input 
                                            className="input-field" 
                                            style={{ width: '100px', marginTop: 0 }} 
                                            placeholder="السعر" 
                                            value={plan.price} 
                                            onChange={e => handlePlanChange(idx, 'price', e.target.value)} 
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <input 
                                            className="input-field" 
                                            style={{ flex: 1, marginTop: 0 }} 
                                            placeholder="الرصيد" 
                                            value={plan.credits} 
                                            onChange={e => handlePlanChange(idx, 'credits', e.target.value)} 
                                        />
                                        <input 
                                            className="input-field" 
                                            style={{ flex: 1, marginTop: 0 }} 
                                            placeholder="نص الزر" 
                                            value={plan.cta} 
                                            onChange={e => handlePlanChange(idx, 'cta', e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--shift-border)' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--shift-text-main)' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!plan.popular} 
                                                onChange={e => handlePlanChange(idx, 'popular', e.target.checked)} 
                                            />
                                            <span>⭐ الأكثر طلباً</span>
                                        </label>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem', color: 'var(--shift-text-main)' }}>المميزات:</label>
                                        {plan.features && plan.features.map((f, fidx) => (
                                            <div key={fidx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input 
                                                    className="input-field" 
                                                    style={{ flex: 1, marginTop: 0, fontSize: '0.85rem' }} 
                                                    placeholder="ميزة" 
                                                    value={f} 
                                                    onChange={e => handlePlanFeatureChange(idx, fidx, e.target.value)} 
                                                />
                                                <button className="btn btn-danger btn-xs" onClick={() => handleRemoveFeature(idx, fidx)}>✕</button>
                                            </div>
                                        ))}
                                        <button className="btn btn-secondary btn-xs" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => handleAddFeature(idx)}>+ إضافة ميزة</button>
                                    </div>

                                    <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => handleRemovePlan(idx)}>حذف الباقة</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleAddPlan}>+ إضافة باقة</button>
                            <button className="btn btn-success" onClick={handleSavePlans}>💾 حفظ الخطط</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--shift-background-dark)', borderRadius: '8px', border: '1px dashed var(--shift-border)' }}>
                        <p style={{ color: 'var(--shift-text-muted)', marginBottom: '1rem' }}>📊 لم يتم العثور على خطط التسعير</p>
                        <button className="btn btn-primary" onClick={async () => {
                            const defaultPlans = [
                                { name: 'باقة الاستقطاب', price: '29', credits: '500', features: ['500 موعد/شهرياً'], cta: 'تجديد', popular: false },
                                { name: 'باقة الموظف المثالي', price: '79', credits: '2500', features: ['2500 موعد/شهرياً'], cta: 'اشتراك', popular: true }
                            ];
                            await adminService.saveSetting('pricing_plans', defaultPlans);
                            await load();
                            setPlansLoaded(false);
                        }}>إنشاء الخطط الافتراضية</button>
                    </div>
                )}
            </div>

            {/* External Integrations */}
            {integrationsSetting && (
                <div className="shift-card" style={{ background: 'var(--shift-surface-card)', border: '1px solid var(--shift-border)', padding: '2rem', marginBottom: '2rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>🔌</span>
                        <div>
                            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 700, color: 'var(--shift-text-main)' }}>روابط التكامل</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--shift-text-muted)' }}>ربط الخدمات الخارجية بمفاتيح API وروابط Webhook</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {integrations.map((intg, idx) => (
                            <div key={idx} style={{ background: 'var(--shift-background-dark)', border: '1px solid var(--shift-border)', padding: '1.5rem', borderRadius: '12px' }}>
                                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--shift-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{intg.icon}</span>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--shift-text-main)', flex: 1 }}>{intg.name}</h3>
                                        <span className={`badge ${intg.status === 'Connected' ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.75rem' }}>
                                            {intg.status === 'Connected' ? '✅ متصل' : '⚠️ معطّل'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--shift-text-muted)', display: 'block', marginBottom: '0.25rem' }}>مفتاح API</label>
                                        <input 
                                            className="input-field" 
                                            style={{ marginTop: 0, fontSize: '0.85rem' }} 
                                            placeholder="أدخل مفتاح الوصول" 
                                            type="password"
                                            value={intg.key} 
                                            onChange={e => handleIntegrationChange(idx, 'key', e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--shift-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Webhook URL</label>
                                        <input 
                                            className="input-field" 
                                            style={{ marginTop: 0, fontSize: '0.85rem' }} 
                                            placeholder="رابط الخدمة" 
                                            value={intg.url} 
                                            onChange={e => handleIntegrationChange(idx, 'url', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-success" onClick={handleSaveIntegrations}>💾 حفظ الروابط</button>
                </div>
            )}

            {/* Manager AI Config */}
            {managerSetting && (
                <div className="shift-card" style={{ background: 'var(--shift-surface-card)', border: '1px solid var(--shift-border)', padding: '2rem', marginBottom: '2rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>🤖</span>
                        <div>
                            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 700, color: 'var(--shift-text-main)' }}>المدير الذكي</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--shift-text-muted)' }}>خصّص إعدادات المدير التنفيذي الذكي</p>
                        </div>
                    </div>
                    <div style={{ background: 'var(--shift-background-dark)', border: '1px solid var(--shift-border)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--shift-text-muted)', display: 'block', marginBottom: '0.5rem' }}>الاسم</label>
                            <input 
                                className="input-field"
                                style={{ marginTop: 0 }}
                                placeholder="مثال: Elite Manager"
                                value={managerConfig.name || ''}
                                onChange={e => handleManagerChange('name', e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--shift-text-muted)', display: 'block', marginBottom: '0.5rem' }}>الدور</label>
                            <input 
                                className="input-field"
                                style={{ marginTop: 0 }}
                                placeholder="مثال: مدير المنصة"
                                value={managerConfig.role || ''}
                                onChange={e => handleManagerChange('role', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--shift-text-muted)', display: 'block', marginBottom: '0.5rem' }}>الوصف والمعرفة</label>
                            <textarea 
                                className="input-field"
                                style={{ marginTop: 0, minHeight: '120px' }}
                                placeholder="وصف تفصيلي عن دور والمعرفة المطلوبة للمدير..."
                                value={managerConfig.knowledge || ''}
                                onChange={e => handleManagerChange('knowledge', e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                    <button className="btn btn-success" onClick={handleSaveManager}>💾 حفظ الإعدادات</button>
                </div>
            )}

            {/* Generic JSON Settings */}
            {otherSettings.filter(s => s.key !== 'external_integrations' && s.key !== 'manager_ai_config').length > 0 && (
                <div className="shift-card" style={{ background: 'var(--shift-surface-card)', border: '1px solid var(--shift-border)', padding: '2rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>📋</span>
                        <div>
                            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 700, color: 'var(--shift-text-main)' }}>الإعدادات الأخرى</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--shift-text-muted)' }}>تعديل الإعدادات المتقدمة بصيغة JSON</p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--shift-border)', backgroundColor: 'var(--shift-background-dark)' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--shift-text-main)', fontWeight: 600, fontSize: '0.85rem' }}>المفتاح</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--shift-text-main)', fontWeight: 600, fontSize: '0.85rem' }}>القيمة (JSON)</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--shift-text-main)', fontWeight: 600, fontSize: '0.85rem' }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherSettings.filter(s => s.key !== 'external_integrations' && s.key !== 'manager_ai_config').map((s) => (
                                    <tr key={s.key} style={{ borderBottom: '1px solid var(--shift-border)' }}>
                                        <td style={{ padding: '0.75rem', color: 'var(--shift-text-main)', fontSize: '0.9rem', fontWeight: 500 }}>{s.key}</td>
                                        <td style={{ padding: '0.75rem', maxWidth: '50%' }}>
                                            {editKey === s.key ? (
                                                <textarea
                                                    rows={4}
                                                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--shift-background-dark)', color: 'var(--shift-text-main)', border: '1px solid var(--shift-border)', padding: '0.5rem', borderRadius: '6px' }}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                ></textarea>
                                            ) : (
                                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', color: 'var(--shift-text-muted)', margin: 0 }}>
                                                    {JSON.stringify(s.value, null, 2)}
                                                </pre>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            {editKey === s.key ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-success btn-xs" onClick={() => handleSave(s.key, editValue)}>حفظ</button>
                                                    <button className="btn btn-secondary btn-xs" onClick={() => setEditKey(null)}>إلغاء</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary btn-xs" onClick={() => { setEditKey(s.key); setEditValue(JSON.stringify(s.value, null, 2)); }}>تعديل</button>
                                                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(s.key)}>حذف</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add new setting */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--shift-border)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--shift-text-main)' }}>➕ إضافة إعداد جديد</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="المفتاح"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="input-field"
                                style={{ marginTop: 0 }}
                            />
                            <textarea
                                rows={2}
                                placeholder="القيمة بصيغة JSON"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="input-field"
                                style={{ marginTop: 0, fontFamily: 'monospace', fontSize: '0.85rem' }}
                            ></textarea>
                        </div>
                        <button className="btn btn-primary" onClick={handleAdd}>إنشاء إعداد</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;
