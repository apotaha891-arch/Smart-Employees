import React, { useState } from 'react';
import { 
    Settings, Zap, Bot, Users, Globe, Check, Plus, Trash2, Edit2
} from 'lucide-react';
import { Card, Btn, Input } from './SharedComponents';
import * as adminService from '../../../services/adminService';

const ConfigurationTab = ({
    isEnglish, isRtl, sectors, setSectors, roles, setRoles, 
    agentAppsConfig, setAgentAppsConfig, aiConfig, setAiConfig, saveAiConfig, flash
}) => {
    const [activeSection, setActiveSection] = useState('general');

    const updateSector = (key, field, val) => {
        setSectors(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    };

    const updateRole = (key, field, val) => {
        setRoles(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    };

    const saveSystemConfig = async () => {
        try {
            await Promise.all([
                adminService.updatePlatformSettings('system_sectors', sectors),
                adminService.updatePlatformSettings('system_roles', roles),
                adminService.updatePlatformSettings('system_agent_apps', agentAppsConfig)
            ]);
            flash(isEnglish ? '✅ System configuration saved' : '✅ تم حفظ إعدادات النظام بنجاح');
        } catch (e) {
            flash('❌ Error: ' + e.message);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
                {isEnglish ? 'System Configuration' : 'إعدادات النظام البرمجية'}
            </h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '10px' }}>
                {[
                    { id: 'general', l: isEnglish ? 'General' : 'عام', i: Settings },
                    { id: 'sectors', l: isEnglish ? 'Sectors' : 'القطاعات', i: Globe },
                    { id: 'roles', l: isEnglish ? 'Roles' : 'التخصصات', i: Users },
                    { id: 'ai', l: isEnglish ? 'AI Brain' : 'عقل المستشارة', i: Bot }
                ].map(s => (
                    <button 
                        key={s.id} 
                        onClick={() => setActiveSection(s.id)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', 
                            borderRadius: '10px', background: activeSection === s.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                            color: activeSection === s.id ? '#A78BFA' : '#6B7280', border: 'none', cursor: 'pointer',
                            fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s'
                        }}
                    >
                        <s.i size={18} /> {s.l}
                    </button>
                ))}
            </div>

            {activeSection === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5rem">
                    <Card c={
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={18} className="text-primary" /> {isEnglish ? 'Agent Builder Apps' : 'تطبيقات بناء الموظفة'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {agentAppsConfig.map((app, idx) => (
                                    <div key={app.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <Input 
                                                value={app.label} 
                                                onChange={e => {
                                                    const updated = [...agentAppsConfig];
                                                    updated[idx].label = e.target.value;
                                                    setAgentAppsConfig(updated);
                                                }}
                                                style={{ marginBottom: '4px' }}
                                            />
                                            <Input 
                                                value={app.desc} 
                                                onChange={e => {
                                                    const updated = [...agentAppsConfig];
                                                    updated[idx].desc = e.target.value;
                                                    setAgentAppsConfig(updated);
                                                }}
                                                style={{ fontSize: '0.75rem', opacity: 0.7 }}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setAgentAppsConfig(p => p.filter((_, i) => i !== idx))}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <Btn 
                                    onClick={() => setAgentAppsConfig(p => [...p, { id: Date.now().toString(), icon: 'Zap', label: 'New Plugin', desc: 'Description...' }])}
                                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                                >
                                    <Plus size={16} /> {isEnglish ? 'Add New App' : 'إضافة تطبيق جديد'}
                                </Btn>
                            </div>
                        </div>
                    } />
                    
                    <Btn 
                        onClick={saveSystemConfig} 
                        color="#10B981" 
                        style={{ marginTop: '2rem', width: '200px', alignSelf: 'flex-start' }}
                    >
                        <Check size={18} /> {isEnglish ? 'Save Global Config' : 'حفظ الإعدادات العامة'}
                    </Btn>
                </div>
            )}

            {activeSection === 'sectors' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {Object.entries(sectors).map(([k, v]) => (
                        <Card key={k} c={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{v.e}</span>
                                    <input 
                                        type="checkbox" 
                                        checked={v.on} 
                                        onChange={e => updateSector(k, 'on', e.target.checked)} 
                                    />
                                </div>
                                <Input value={v.l} onChange={e => updateSector(k, 'l', e.target.value)} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input 
                                        type="color" 
                                        value={v.c} 
                                        onChange={e => updateSector(k, 'c', e.target.value)}
                                        style={{ width: '30px', height: '30px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                                    />
                                    <code style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem' }}>{k}</code>
                                </div>
                            </div>
                        } />
                    ))}
                    <Btn onClick={saveSystemConfig} color="#10B981" style={{ position: 'fixed', bottom: '2rem', right: isRtl ? 'auto' : '2rem', left: isRtl ? '2rem' : 'auto', zIndex: 100 }}>
                        <Check size={18} /> {isEnglish ? 'Save Sectors' : 'حفظ القطاعات'}
                    </Btn>
                </div>
            )}

            {activeSection === 'roles' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {Object.entries(roles).map(([k, v]) => (
                        <Card key={k} c={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: v.c }}>{k.toUpperCase()}</div>
                                <Input value={v.l} onChange={e => updateRole(k, 'l', e.target.value)} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input 
                                        type="color" 
                                        value={v.c} 
                                        onChange={e => updateRole(k, 'c', e.target.value)}
                                        style={{ width: '30px', height: '30px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                                    />
                                    <span style={{ flex: 1, fontSize: '0.8rem', color: '#6B7280', alignSelf: 'center' }}>{v.c}</span>
                                </div>
                            </div>
                        } />
                    ))}
                    <Btn onClick={saveSystemConfig} color="#10B981" style={{ position: 'fixed', bottom: '2rem', right: isRtl ? 'auto' : '2rem', left: isRtl ? '2rem' : 'auto', zIndex: 100 }}>
                        <Check size={18} /> {isEnglish ? 'Save Roles' : 'حفظ التخصصات'}
                    </Btn>
                </div>
            )}

            {activeSection === 'ai' && (
                <Card c={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={20} /> {isEnglish ? 'AI Global Knowledge' : 'المعرفة العامة للموظفة الذكية'}
                        </h3>
                        <div>
                            <label style={{ display: 'block', color: '#6B7280', fontSize: '0.8rem', marginBottom: '6px' }}>
                                {isEnglish ? 'Platform Master Prompt' : 'التلقين الرئيسي للمنصة (Prompt)'}
                            </label>
                            <textarea 
                                value={aiConfig.knowledge || ''} 
                                onChange={e => setAiConfig(p => ({ ...p, knowledge: e.target.value }))}
                                style={{ width: '100%', height: '200px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)', padding: '12px', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#6B7280', fontSize: '0.8rem', marginBottom: '6px' }}>Max Word Length</label>
                                <Input type="number" value={aiConfig.max_length || 150} onChange={e => setAiConfig(p => ({ ...p, max_length: parseInt(e.target.value) }))} />
                            </div>
                        </div>
                        <Btn onClick={saveAiConfig} color="#8B5CF6">
                            <Check size={16} /> {isEnglish ? 'Update AI Brain' : 'تحديث عقل الذكاء الاصطناعي'}
                        </Btn>
                    </div>
                } />
            )}
        </div>
    );
};

export default ConfigurationTab;
