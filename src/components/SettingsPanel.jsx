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
        <div>
            {/* Pricing Plans Editor */}
            <div className="card p-xl mb-lg">
                <h3 className="mb-md">⚙️ خطط التسعير</h3>
                <p className="text-secondary mb-lg" style={{ fontSize: '0.9rem' }}>
                    عدّل خطط التسعير بسهولة بدون الحاجة للـ JSON
                </p>

                {pricingSetting ? (
                    <div>
                        <div className="grid gap-lg mb-lg">
                            {plans.map((plan, idx) => (
                                <div key={idx} className="n8n-card p-lg" style={{ background: 'var(--n8n-surface-card)', border: '1px solid var(--n8n-border)' }}>
                                    <div className="flex gap-md mb-md">
                                        <input 
                                            className="input-field" 
                                            style={{ flex: 1, marginTop: 0 }} 
                                            placeholder="اسم الباقة" 
                                            value={plan.name} 
                                            onChange={e => handlePlanChange(idx, 'name', e.target.value)} 
                                        />
                                        <input 
                                            className="input-field" 
                                            style={{ width: '120px', marginTop: 0 }} 
                                            placeholder="السعر ($)" 
                                            value={plan.price} 
                                            onChange={e => handlePlanChange(idx, 'price', e.target.value)} 
                                        />
                                        <input 
                                            className="input-field" 
                                            style={{ width: '120px', marginTop: 0 }} 
                                            placeholder="الرصيد" 
                                            value={plan.credits} 
                                            onChange={e => handlePlanChange(idx, 'credits', e.target.value)} 
                                        />
                                        <input 
                                            className="input-field" 
                                            style={{ width: '150px', marginTop: 0 }} 
                                            placeholder="نص الزر" 
                                            value={plan.cta} 
                                            onChange={e => handlePlanChange(idx, 'cta', e.target.value)} 
                                        />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!plan.popular} 
                                                onChange={e => handlePlanChange(idx, 'popular', e.target.checked)} 
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>الأكثر</span>
                                        </label>
                                        <button className="btn btn-danger btn-xs" onClick={() => handleRemovePlan(idx)}>حذف</button>
                                    </div>

                                    <div className="mb-md">
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>المميزات:</label>
                                        {plan.features && plan.features.map((f, fidx) => (
                                            <div key={fidx} className="flex gap-sm mb-sm">
                                                <input 
                                                    className="input-field" 
                                                    style={{ flex: 1, marginTop: 0 }} 
                                                    placeholder="ميزة" 
                                                    value={f} 
                                                    onChange={e => handlePlanFeatureChange(idx, fidx, e.target.value)} 
                                                />
                                                <button className="btn btn-xs btn-danger" onClick={() => handleRemoveFeature(idx, fidx)}>حذف</button>
                                            </div>
                                        ))}
                                        <button className="btn btn-xs btn-secondary mt-sm" onClick={() => handleAddFeature(idx)}>+ ميزة</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-md">
                            <button className="btn btn-primary" onClick={handleAddPlan}>+ إضافة باقة جديدة</button>
                            <button className="btn btn-success" onClick={handleSavePlans}>💾 حفظ الخطط</button>
                        </div>
                    </div>
                ) : (
                    <div className="n8n-card p-lg text-center" style={{ background: 'var(--n8n-surface-card)', border: '1px dashed var(--n8n-border)' }}>
                        <p className="text-secondary mb-md">لم يتم العثور على خطط التسعير. قم بإنشاء الإعداد الأول.</p>
                        <button className="btn btn-primary" onClick={async () => {
                            const defaultPlans = [
                                { name: 'باقة الاستقطاب', price: '29', credits: '500', features: ['500 موعد/شهرياً'], cta: 'تجديد العقد', popular: false },
                                { name: 'باقة الموظف المثالي', price: '79', credits: '2500', features: ['2500 موعد/شهرياً'], cta: 'الاشتراك', popular: true }
                            ];
                            await adminService.saveSetting('pricing_plans', defaultPlans);
                            await load();
                            setPlansLoaded(false);
                        }}>إنشاء الخطط الافتراضية</button>
                    </div>
                )}
            </div>

            {/* Other Settings */}
            {otherSettings.length > 0 && (
                <div className="card p-xl mb-lg">
                    <h3 className="mb-md">🔌 روابط التكامل الخارجية</h3>
                    <p className="text-secondary mb-lg" style={{ fontSize: '0.9rem' }}>
                        أدخل مفاتيح الوصول والروابط لكل خدمة
                    </p>

                    {integrationsSetting ? (
                        <div>
                            <div className="grid gap-lg mb-lg">
                                {integrations.map((intg, idx) => (
                                    <div key={idx} className="n8n-card p-lg" style={{ background: 'var(--n8n-surface-card)', border: '1px solid var(--n8n-border)' }}>
                                        <div className="flex gap-md mb-md align-center">
                                            <span style={{ fontSize: '1.5rem', width: '40px' }}>{intg.icon}</span>
                                            <h4 style={{ margin: 0, flex: 1 }}>{intg.name}</h4>
                                            <span className={`badge ${intg.status === 'Connected' ? 'badge-success' : 'badge-secondary'}`}>
                                                {intg.status === 'Connected' ? '✅ متصل' : '❌ غير متصل'}
                                            </span>
                                        </div>
                                        <div className="flex gap-md">
                                            <input 
                                                className="input-field" 
                                                style={{ flex: 1, marginTop: 0 }} 
                                                placeholder="مفتاح API / Access Token" 
                                                type="password"
                                                value={intg.key} 
                                                onChange={e => handleIntegrationChange(idx, 'key', e.target.value)} 
                                            />
                                            <input 
                                                className="input-field" 
                                                style={{ flex: 1, marginTop: 0 }} 
                                                placeholder="رابط الخدمة / Webhook URL" 
                                                value={intg.url} 
                                                onChange={e => handleIntegrationChange(idx, 'url', e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-success" onClick={handleSaveIntegrations}>💾 حفظ الروابط</button>
                        </div>
                    ) : (
                        <div className="n8n-card p-lg text-center" style={{ background: 'var(--n8n-surface-card)', border: '1px dashed var(--n8n-border)' }}>
                            <p className="text-secondary">لم يتم العثور على روابط التكامل</p>
                        </div>
                    )}
                </div>
            )}

            {/* Manager AI Config */}
            {managerSetting && (
                <div className="card p-xl mb-lg">
                    <h3 className="mb-md">🤖 إعدادات المدير الذكي</h3>
                    <p className="text-secondary mb-lg" style={{ fontSize: '0.9rem' }}>
                        قم بتخصيص إعدادات المدير التنفيذي للمنصة
                    </p>

                    <div className="n8n-card p-lg" style={{ background: 'var(--n8n-surface-card)', border: '1px solid var(--n8n-border)' }}>
                        <div className="mb-md">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الاسم:</label>
                            <input 
                                className="input-field"
                                style={{ marginTop: 0 }}
                                placeholder="مثال: Elite Manager"
                                value={managerConfig.name || ''}
                                onChange={e => handleManagerChange('name', e.target.value)}
                            />
                        </div>
                        <div className="mb-md">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الدور:</label>
                            <input 
                                className="input-field"
                                style={{ marginTop: 0 }}
                                placeholder="مثال: مدير المنصة الذكي"
                                value={managerConfig.role || ''}
                                onChange={e => handleManagerChange('role', e.target.value)}
                            />
                        </div>
                        <div className="mb-lg">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>المعرفة / الوصف:</label>
                            <textarea 
                                className="input-field"
                                style={{ marginTop: 0 }}
                                rows={4}
                                placeholder="وصف دقيق عن دور ومعرفة المدير"
                                value={managerConfig.knowledge || ''}
                                onChange={e => handleManagerChange('knowledge', e.target.value)}
                            ></textarea>
                        </div>
                        <button className="btn btn-success" onClick={handleSaveManager}>💾 حفظ الإعدادات</button>
                    </div>
                </div>
            )}

            {/* Generic JSON Settings */}
            {otherSettings.filter(s => s.key !== 'external_integrations' && s.key !== 'manager_ai_config').length > 0 && (
                <div className="card p-xl">
                    <h3 className="mb-md">⚙️ الإعدادات الأخرى</h3>
                    <p className="text-secondary mb-md" style={{ fontSize: '0.9rem' }}>
                        تعديل الإعدادات الأخرى بصيغة JSON
                    </p>

                    <table className="w-full text-right" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                <th className="py-sm">المفتاح</th>
                                <th className="py-sm">القيمة (JSON)</th>
                                <th className="py-sm">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {otherSettings.filter(s => s.key !== 'external_integrations' && s.key !== 'manager_ai_config').map((s) => (
                                <tr key={s.key} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td className="py-md" style={{ verticalAlign: 'top' }}>{s.key}</td>
                                    <td className="py-md" style={{ verticalAlign: 'top', maxWidth: '50%' }}>
                                        {editKey === s.key ? (
                                            <textarea
                                                rows={4}
                                                style={{ width: '100%', fontFamily: 'monospace' }}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                            ></textarea>
                                        ) : (
                                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {JSON.stringify(s.value, null, 2)}
                                            </pre>
                                        )}
                                    </td>
                                    <td className="py-md" style={{ verticalAlign: 'top' }}>
                                        {editKey === s.key ? (
                                            <>
                                                <button className="btn btn-sm btn-success mb-sm" onClick={() => handleSave(s.key, editValue)}>حفظ</button><br />
                                                <button className="btn btn-sm btn-secondary" onClick={() => setEditKey(null)}>إلغاء</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn btn-sm btn-secondary mb-sm" onClick={() => { setEditKey(s.key); setEditValue(JSON.stringify(s.value, null, 2)); }}>تعديل</button><br />
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.key)}>حذف</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add new setting */}
                    <div className="mt-xl" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                        <h4>إضافة إعداد جديد</h4>
                        <div className="flex gap-md align-center mb-md">
                            <input
                                type="text"
                                placeholder="المفتاح"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="input-field"
                                style={{ width: '30%', marginTop: 0 }}
                            />
                            <textarea
                                rows={3}
                                placeholder="القيمة بصيغة JSON"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="input-field"
                                style={{ width: '60%', fontFamily: 'monospace' }}
                            ></textarea>
                        </div>
                        <button className="btn btn-primary" onClick={handleAdd}>إنشاء</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;
