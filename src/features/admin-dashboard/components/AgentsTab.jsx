import React from 'react';
import { 
    Download, Plus, Search, Check, X, 
    Edit2, Trash2, MessageSquare, Zap, Bot, Power
} from 'lucide-react';
import { Card, Btn, Input } from './SharedComponents';
import { ICON_MAP } from '../constants';

const AgentsTab = ({
    t, isEnglish, language, agents, clients, cl,
    aSearch, setASearch, aFilter, setAFilter,
    showAddAgent, setShowAddAgent, newAgent, setNewAgent, addAgent,
    handleExport, roles, sectors, editAgent, setEditAgent, saveAgentEdit,
    deleteAgent, agentApps, toggleApp, toggleAgent, agentAppsConfig
}) => {
    const isRtl = language === 'ar';

    const filteredAgents = (agents || []).filter(a => {
        const client = clients.find(c => c.id === a.user_id);
        const ownerName = client?.full_name || client?.email || '';
        const matchesSearch = (a.name || '').toLowerCase().includes(aSearch.toLowerCase()) || 
                               ownerName.toLowerCase().includes(aSearch.toLowerCase());
        const matchesFilter = !aFilter || a.user_id === aFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                        {t('admin.agents')}
                    </h1>
                    <p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.85rem' }}>
                        {filteredAgents.length} {isEnglish ? 'matching agents' : 'موظفة مطابقة'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Btn onClick={() => handleExport(filteredAgents, 'agents')} color="#10B981">
                        <Download size={16} />
                        {isEnglish ? 'Export' : 'تصدير'}
                    </Btn>
                    <Btn onClick={() => setShowAddAgent(!showAddAgent)}>
                        <Plus size={16} />
                        {isEnglish ? 'Register Agent' : 'إضافة موظفة'}
                    </Btn>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select 
                    value={aFilter} 
                    onChange={e => setAFilter(e.target.value)} 
                    style={{ 
                        background: 'var(--color-bg-surface)', 
                        border: '1px solid var(--color-border-subtle)', 
                        borderRadius: '10px', 
                        color: 'var(--color-text-main)', 
                        padding: '10px 14px', 
                        fontSize: '0.85rem', 
                        minWidth: '220px',
                        outline: 'none'
                    }}
                >
                    <option value="">{isEnglish ? 'All Business Owners' : 'كل أصحاب الأعمال'} ({agents.length})</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.full_name || c.email} ({cl(c.id).length})
                        </option>
                    ))}
                </select>
                
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search 
                        size={16} 
                        style={{ 
                            position: 'absolute', 
                            [isRtl ? 'right' : 'left']: '12px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: '#6B7280' 
                        }} 
                    />
                    <input 
                        value={aSearch} 
                        onChange={e => setASearch(e.target.value)} 
                        placeholder={isEnglish ? 'Search agent or owner...' : 'بحث باسم الموظفة أو المالك...'} 
                        style={{ 
                            width: '100%', 
                            padding: isRtl ? '10px 38px 10px 12px' : '10px 12px 10px 38px', 
                            background: 'var(--color-bg-surface)', 
                            border: '1px solid var(--color-border-subtle)', 
                            borderRadius: '10px', 
                            color: 'var(--color-text-main)', 
                            fontSize: '0.85rem',
                            outline: 'none'
                        }} 
                    />
                </div>
            </div>

            {/* Registration Form */}
            {showAddAgent && (
                <Card s={{ marginBottom: '1.5rem', border: '1px solid rgba(139,92,246,0.3)', animation: 'slideDown 0.3s ease-out' }} c={
                    <div>
                        <div style={{ fontWeight: 800, color: '#A78BFA', marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={18} />
                            {isEnglish ? 'Register New Digital Agent' : 'تسجيل موظفة ذكاء اصطناعي جديدة'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>
                                    {isEnglish ? 'Agent Name *' : 'اسم الموظفة *'}
                                </label>
                                <Input 
                                    value={newAgent.name} 
                                    onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))} 
                                    placeholder={isEnglish ? 'e.g. Sarah' : 'مثال: سارة'} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>
                                    {t('specialtyLabel')}
                                </label>
                                <select 
                                    value={newAgent.specialty} 
                                    onChange={e => setNewAgent(p => ({ ...p, specialty: e.target.value }))} 
                                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', color: 'var(--color-text-main)', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{isEnglish ? k.toUpperCase() : v.l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>
                                    {t('home.sectorTitle')}
                                </label>
                                <select 
                                    value={newAgent.business_type} 
                                    onChange={e => setNewAgent(p => ({ ...p, business_type: e.target.value }))} 
                                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', color: 'var(--color-text-main)', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    {Object.entries(sectors).map(([k, v]) => <option key={k} value={k}>{v.e} {isEnglish ? k.toUpperCase() : v.l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>
                                    {isEnglish ? 'Assign to Client *' : 'إسناد للمالك (العميل) *'}
                                </label>
                                <select 
                                    value={newAgent.user_id} 
                                    onChange={e => setNewAgent(p => ({ ...p, user_id: e.target.value }))} 
                                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', color: 'var(--color-text-main)', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    <option value="">{isEnglish ? 'Select client...' : 'اختر عميل...'}</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowAddAgent(false)} 
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                            >
                                {t('templates.cancelBtn')}
                            </button>
                            <Btn onClick={addAgent}>
                                <Check size={16} />
                                {isEnglish ? 'Create Agent' : 'إصدار وتفعيل الموظفة'}
                            </Btn>
                        </div>
                    </div>
                } />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filteredAgents.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: '#6B7280', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px dashed var(--color-border-subtle)' }}>
                        {isEnglish ? 'No agents found matching your search' : 'لا توجد موظفات مطابقة لهذا البحث'}
                    </div>
                ) : filteredAgents.map(agent => {
                    const role = roles[agent.specialty || 'booking'] || roles.booking || { l: '—', c: '#6B7280' };
                    const isActive = agent.status === 'active';
                    const isEd = editAgent?.id === agent.id;
                    const apps = agentApps[agent.id] || {};
                    const client = clients.find(c => c.id === agent.user_id);

                    return (
                        <Card 
                            key={agent.id} 
                            s={{ 
                                border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                background: isActive ? 'linear-gradient(135deg, var(--color-bg-surface), rgba(139,92,246,0.03))' : 'var(--color-bg-surface)'
                            }} 
                            c={
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {isEd ? (
                                                <input 
                                                    value={editAgent.name} 
                                                    onChange={e => setEditAgent({ ...editAgent, name: e.target.value })} 
                                                    style={{ 
                                                        background: 'var(--color-bg-input)', 
                                                        border: '1px solid #8B5CF6', 
                                                        borderRadius: '8px', 
                                                        color: 'var(--color-text-main)', 
                                                        padding: '4px 10px', 
                                                        fontWeight: 700, 
                                                        width: '100%', 
                                                        fontSize: '0.9rem', 
                                                        marginBottom: '6px',
                                                        outline: 'none'
                                                    }} 
                                                />
                                            ) : (
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {agent.name}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {isEnglish ? 'Owner:' : 'المستفيد:'} 
                                                <span style={{ color: '#A78BFA', fontWeight: 700 }}>{client?.full_name || client?.email || '—'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {isEd ? (
                                                <>
                                                    <button onClick={() => saveAgentEdit(editAgent)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Check size={14} /></button>
                                                    <button onClick={() => setEditAgent(null)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><X size={14} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => setEditAgent({ ...agent })} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', transition: '0.2s' }}><Edit2 size={14} /></button>
                                                    <button onClick={() => deleteAgent(agent.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', transition: '0.2s' }}><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {isEd ? (
                                            <select 
                                                value={editAgent.specialty} 
                                                onChange={e => setEditAgent({ ...editAgent, specialty: e.target.value })} 
                                                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', color: 'var(--color-text-main)', fontSize: '0.75rem', padding: '4px 8px', outline: 'none' }}
                                            >
                                                {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                            </select>
                                        ) : (
                                            <span style={{ background: `${role.c}15`, color: role.c, padding: '2px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, border: `1px solid ${role.c}25` }}>
                                                {role.l}
                                            </span>
                                        )}
                                        <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', padding: '2px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
                                            {sectors[agent.business_type]?.e || '🏢'} {sectors[agent.business_type]?.l || 'عام'}
                                        </span>
                                    </div>

                                    {/* Integration Micro-Panel */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '1rem', fontSize: '0.8rem', border: '1px solid var(--color-border-subtle)' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label style={{ color: '#0088cc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <MessageSquare size={12} /> Telegram Integration
                                            </label>
                                            {isEd ? (
                                                <Input 
                                                    value={editAgent.telegram_token || ''} 
                                                    onChange={e => setEditAgent({ ...editAgent, telegram_token: e.target.value })} 
                                                    placeholder="Token ID..." 
                                                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                                                />
                                            ) : (
                                                <div style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                                                    {agent.telegram_token || (isEnglish ? 'None' : '❌ غير مرتبط')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label style={{ color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <Zap size={12} /> WhatsApp Business
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                                <div style={{ 
                                                    width: '8px', height: '8px', borderRadius: '50%', 
                                                    background: agent.whatsapp_settings?.enabled ? '#10B981' : '#4B5563',
                                                    boxShadow: agent.whatsapp_settings?.enabled ? '0 0 8px #10B981' : 'none'
                                                }} />
                                                <span style={{ color: agent.whatsapp_settings?.enabled ? 'var(--color-text-main)' : 'var(--color-text-secondary)', fontSize: '0.72rem', fontWeight: 600 }}>
                                                    {agent.whatsapp_settings?.enabled ? (isEnglish ? 'Active' : 'نشط') : (isEnglish ? 'Disabled' : 'معطل')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plugins / Apps */}
                                    <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px', marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {isEnglish ? 'Automation Plugins' : 'التطبيقات والإضافات:'}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                            {agentAppsConfig.map(app => {
                                                const Icon = ICON_MAP[app.icon] || Bot; 
                                                const on = !!apps[app.id];
                                                return (
                                                    <button 
                                                        key={app.id} 
                                                        onClick={() => toggleApp(agent.id, app.id)} 
                                                        title={app.desc}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                            borderRadius: '8px', background: on ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', 
                                                            border: `1px solid ${on ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)'}`, 
                                                            color: on ? '#A78BFA' : '#4B5563', cursor: 'pointer', 
                                                            fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.2s' 
                                                        }}
                                                    >
                                                        <Icon size={12} />
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ 
                                                width: '8px', height: '8px', borderRadius: '50%', 
                                                background: isActive ? '#10B981' : '#4B5563',
                                                boxShadow: isActive ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                                            }} />
                                            <span style={{ fontSize: '0.78rem', color: isActive ? '#10B981' : '#6B7280', fontWeight: 700 }}>
                                                {isActive ? (isEnglish ? 'Online' : 'نشطة آلياً') : (isEnglish ? 'Offline' : 'متوقفة')}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => toggleAgent(agent)} 
                                            style={{ 
                                                background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                                                color: isActive ? '#EF4444' : '#10B981', 
                                                border: 'none', borderRadius: '8px', padding: '6px 14px', 
                                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800,
                                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                            }}
                                        >
                                            <Power size={13} />
                                            {isActive ? (isEnglish ? 'Deactivate' : 'إيقاف') : (isEnglish ? 'Activate' : 'تفعيل')}
                                        </button>
                                    </div>
                                </>
                            } 
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default AgentsTab;
