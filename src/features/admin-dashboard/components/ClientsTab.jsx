import React from 'react';
import { 
    Search, Download, Settings, LogOut, X, 
    Key, Users, Zap
} from 'lucide-react';
import { Card, Btn, Input, StatCard } from './SharedComponents';
import * as adminService from '../../../services/adminService';
import { supabase } from '../../../services/supabaseService';

const ClientsTab = ({
    t, isEnglish, language, clients, setSelClient, selClient, 
    cSearch, setCSearch, cFilter, setCFilter, 
    handleExport, updateClientPlan, remoteLogin, PLANS,
    clientKeys, setClientKeys, saveClientKey, load, sectors
}) => {
    const isRtl = language === 'ar';

    // Filtering Logic
    const filteredClients = (clients || []).filter(c => {
        const matchesSearch = (c.full_name || '').toLowerCase().includes(cSearch.toLowerCase()) || 
                             (c.business_name || '').toLowerCase().includes(cSearch.toLowerCase()) ||
                             (c.email || '').toLowerCase().includes(cSearch.toLowerCase());
        
        let matchesFilter = true;
        if (cFilter === 'agencies') matchesFilter = c.is_agency;
        else if (cFilter === 'independent') matchesFilter = !c.is_agency && !c.agency_id;
        else if (cFilter === 'sub-accounts') matchesFilter = !c.is_agency && !!c.agency_id;
        else if (cFilter) matchesFilter = c.id === cFilter;
        
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }} className="animate-fade-in">
            <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px' }}>
                    {t('admin.clients')}
                </h1>
                <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    {filteredClients.length} {isEnglish ? 'clients matched' : 'عميل مطابق'}
                </p>
                
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <select 
                        value={cFilter} 
                        onChange={e => setCFilter(e.target.value)} 
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
                        <option value="">{isEnglish ? 'All Categories' : 'كل التصنيفات'}</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
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
                            value={cSearch} 
                            onChange={e => setCSearch(e.target.value)} 
                            placeholder={isEnglish ? "Search by name or email..." : "بحث بالاسم أو الإيميل..."}
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
                    
                    <Btn onClick={() => handleExport(filteredClients, 'clients')} color="#10B981">
                        <Download size={16} />
                        {isEnglish ? 'Export' : 'تصدير'}
                    </Btn>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '8px' }}>
                    {[
                        { id: '', l: isEnglish ? 'All' : 'الكل', c: '#9CA3AF' },
                        { id: 'agencies', l: isEnglish ? 'Agencies 🤝' : 'الوكالات 🤝', c: '#8B5CF6' },
                        { id: 'independent', l: isEnglish ? 'Independent 🏢' : 'منشآت مستقلة 🏢', c: '#10B981' },
                        { id: 'sub-accounts', l: isEnglish ? 'Sub-accounts 👤' : 'عملاء تابعين 👤', c: '#3B82F6' }
                    ].map(f => (
                        <button 
                            key={f.id} 
                            onClick={() => setCFilter(f.id)} 
                            style={{ 
                                padding: '8px 20px', 
                                borderRadius: '99px', 
                                border: '1px solid var(--color-border-subtle)',
                                background: cFilter === f.id ? f.c : 'transparent',
                                color: cFilter === f.id ? 'white' : '#9CA3AF',
                                fontSize: '0.8rem', 
                                fontWeight: 700, 
                                cursor: 'pointer', 
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.l}
                        </button>
                    ))}
                </div>

                <Card s={{ padding: 0, overflow: 'hidden' }} c={
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{t('admin.clients')}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Type / Agency' : 'النوع / التبعية'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Resources' : 'الموارد'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Balance / Plan' : 'الرصيد / الباقة'}</th>
                                    <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Actions' : 'إجراءات'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                            {isEnglish ? 'No matching clients found' : 'لا يوجد بيانات مطابقة'}
                                        </td>
                                    </tr>
                                ) : filteredClients.map(c => {
                                    const isAgency = c.is_agency;
                                    const isSubAccount = !!c.agency_id;
                                    const plan = PLANS[c.subscription_tier || 'basic'] || PLANS.basic;
                                    
                                    const typeInfo = isAgency ? { l: isEnglish ? 'Agency' : 'وكالة نشطة', c: '#8B5CF6', e: '🤝' } 
                                                   : (isSubAccount ? { l: isEnglish ? `Under ${c.agency_name || 'Agency'}` : `تابع لـ ${c.agency_name || 'وكالة'}`, c: '#3B82F6', e: '👤' } 
                                                   : { l: isEnglish ? 'Independent' : 'منشأة مستقلة', c: '#10B981', e: '🏢' });

                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>
                                                    {c.business_name && c.business_name !== '—' ? c.business_name : (c.full_name || '—')}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>{c.email}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#4B5563', marginTop: '2px' }}>ID: {c.id.slice(0,8).toUpperCase()}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: typeInfo.c, fontWeight: 700, fontSize: '0.78rem' }}>
                                                    <span>{typeInfo.e}</span>
                                                    <span>{typeInfo.l}</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                                    {sectors[c.business_type]?.l || (isEnglish ? 'General Sector' : 'قطاع عام')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ background: 'rgba(139,92,246,0.06)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.1)' }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#A78BFA', textAlign: 'center' }}>{c.agents_count || 0}</div>
                                                        <div style={{ fontSize: '0.55rem', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>{isEnglish ? 'Agents' : 'موظفة'}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(59,130,246,0.06)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#60A5FA', textAlign: 'center' }}>{c.bookings_count || 0}</div>
                                                        <div style={{ fontSize: '0.55rem', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' }}>{isEnglish ? 'Bookings' : 'طلب'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: '#FCD34D', fontWeight: 900, fontSize: '1.05rem', marginBottom: '4px' }}>
                                                    {(c.wallet_balance || 0).toLocaleString()} <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{isEnglish ? 'PTS' : 'نقطة'}</span>
                                                </div>
                                                <select 
                                                    value={c.subscription_tier || 'basic'} 
                                                    onChange={e => updateClientPlan(c.id, e.target.value)}
                                                    style={{ 
                                                        background: plan.bg, 
                                                        color: plan.t, 
                                                        border: '1px solid rgba(255,255,255,0.05)', 
                                                        borderRadius: '6px', 
                                                        padding: '2px 8px', 
                                                        fontWeight: 800, 
                                                        fontSize: '0.72rem', 
                                                        cursor: 'pointer',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    {Object.entries(PLANS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        onClick={() => setSelClient(c)} 
                                                        style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', transition: '0.2s' }} 
                                                        title={isEnglish ? 'Detailed Management' : 'إدارة مفصلة'}
                                                    >
                                                        <Settings size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => remoteLogin(c)} 
                                                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }} 
                                                        title={isEnglish ? 'Login as Support' : 'دخول الدعم'}
                                                    >
                                                        <LogOut size={15} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                } />
            </div>

            {/* Sidebar Details */}
            {selClient && (
                <div style={{ width: '360px', flexShrink: 0, animation: 'slideIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ fontWeight: 900, color: 'var(--color-text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={18} className="text-primary" />
                            {isEnglish ? 'Admin Control' : 'إدارة التحكم الكامل'}
                        </div>
                        <button 
                            onClick={() => setSelClient(null)} 
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: 'none', 
                                color: '#6B7280', 
                                borderRadius: '50%', 
                                width: '32px', 
                                height: '32px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer' 
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* Profile Header */}
                    <Card s={{ marginBottom: '1.25rem', border: '1px solid rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, var(--color-bg-surface), rgba(139,92,246,0.05))' }} c={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ 
                                width: '54px', 
                                height: '54px', 
                                borderRadius: '14px', 
                                background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1.4rem',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                            }}>
                                {selClient.is_agency ? '🤝' : '🏢'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 900, color: 'var(--color-text-main)', fontSize: '1rem', marginBottom: '2px' }}>
                                    {selClient.business_name || selClient.full_name}
                                </div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{selClient.email}</div>
                            </div>
                        </div>
                    } />

                    {/* Identity Logic */}
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> {isEnglish ? 'Identity & Hierarchy' : 'إعدادات الهوية والتبيعة'}
                    </div>
                    <Card s={{ marginBottom: '1.25rem' }} c={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#6B7280', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Account Type' : 'نوع الحساب الرئيسي'}</label>
                                <div style={{ display: 'flex', background: 'var(--color-bg-input)', borderRadius: '10px', padding: '4px', border: '1px solid var(--color-border-subtle)' }}>
                                    <button 
                                        onClick={() => adminService.changeClientIdentity(selClient.id, true).then(load)} 
                                        style={{ 
                                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
                                            background: selClient.is_agency ? '#8B5CF6' : 'transparent', 
                                            color: selClient.is_agency ? 'white' : '#6B7280', 
                                            fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                                        }}
                                    >
                                        {isEnglish ? 'Agency' : 'وكالة'}
                                    </button>
                                    <button 
                                        onClick={() => adminService.changeClientIdentity(selClient.id, false).then(load)} 
                                        style={{ 
                                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
                                            background: !selClient.is_agency ? '#10B981' : 'transparent', 
                                            color: !selClient.is_agency ? 'white' : '#6B7280', 
                                            fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                                        }}
                                    >
                                        {isEnglish ? 'Independent' : 'عميل مباشر'}
                                    </button>
                                </div>
                            </div>

                            {!selClient.is_agency && (
                                <div>
                                    <label style={{ display: 'block', color: '#6B7280', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 600 }}>{isEnglish ? 'Parent Agency' : 'التبعية (الوكالة الأم)'}</label>
                                    <select 
                                        value={selClient.agency_id || ''} 
                                        onChange={(e) => adminService.changeClientIdentity(selClient.id, false, e.target.value === '' ? null : e.target.value).then(load)}
                                        style={{ 
                                            width: '100%', padding: '10px', background: 'var(--color-bg-input)', 
                                            border: '1px solid var(--color-border-subtle)', borderRadius: '10px', 
                                            color: 'var(--color-text-main)', fontSize: '0.8rem', outline: 'none' 
                                        }}
                                    >
                                        <option value="">— {isEnglish ? 'Independent (None)' : 'منشأة مستقلة (بدون وكالة)'} —</option>
                                        {clients.filter(x => x.is_agency && x.id !== selClient.id).map(a => (
                                            <option key={a.id} value={a.id}>{isEnglish ? 'Agency: ' : 'وكالة: '}{a.business_name || a.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    } />

                    {/* Financials / Wallet */}
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} className="text-warning" /> {isEnglish ? 'Wallet Management' : 'إدارة الرصيد (المحفظة)'}
                    </div>
                    <Card s={{ marginBottom: '1.25rem', border: '1px solid rgba(252,211,77,0.3)', background: 'linear-gradient(135deg, var(--color-bg-surface), rgba(252,211,77,0.03))' }} c={
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{isEnglish ? 'Current Balance' : 'الرصيد الحالي'}:</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FCD34D' }}>
                                    {selClient.wallet_balance || 0} <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>{isEnglish ? 'PTS' : 'نقطة'}</small>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => {
                                        const amt = prompt(isEnglish ? 'Points to ADD (+):' : 'أدخل عدد النقاط للإضافة (+):');
                                        if(amt) supabase.rpc('transfer_wallet_credits', { p_client_id: selClient.id, p_amount: parseInt(amt) }).then(load);
                                    }} 
                                    style={{ 
                                        flex: 1, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', 
                                        borderRadius: '10px', padding: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                                    }}
                                >
                                    + {isEnglish ? 'Add' : 'إضافة'}
                                </button>
                                <button 
                                    onClick={() => {
                                        const amt = prompt(isEnglish ? 'Points to DEDUCT (-):' : 'أدخل عدد النقاط للخصم (-):');
                                        if(amt) supabase.rpc('deduct_wallet_credits', { p_client_id: selClient.id, p_amount: parseInt(amt) }).then(load);
                                    }} 
                                    style={{ 
                                        flex: 1, background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', 
                                        borderRadius: '10px', padding: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                                    }}
                                >
                                    - {isEnglish ? 'Deduct' : 'خصم'}
                                </button>
                            </div>
                        </>
                    } />

                    {/* Keys Management */}
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={14} className="text-primary" /> {isEnglish ? 'API & Integration Keys' : '🔑 مفاتيح الربط البرمجية'}
                    </div>
                    <Card c={
                        <>
                            {[
                                ['telegram_token', isEnglish ? 'Telegram Token' : 'Telegram Token'], 
                                ['whatsapp_number', isEnglish ? 'WhatsApp Phone' : 'رقم WhatsApp'], 
                                ['whatsapp_api_key', isEnglish ? 'WhatsApp Secret' : 'WhatsApp Key']
                            ].map(([f, l]) => (
                                <div key={f} style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', color: '#6B7280', fontSize: '0.72rem', marginBottom: '5px', fontWeight: 600 }}>{l}</label>
                                    <Input 
                                        type={f.includes('token') || f.includes('key') ? 'password' : 'text'} 
                                        value={clientKeys[selClient.id]?.[f] || ''} 
                                        placeholder="—" 
                                        onChange={e => setClientKeys(p => ({ ...p, [selClient.id]: { ...(p[selClient.id] || {}), [f]: e.target.value } }))} 
                                    />
                                </div>
                            ))}
                            <Btn 
                                onClick={() => saveClientKey(selClient.id)} 
                                style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '12px' }}
                            >
                                <Key size={15} />
                                {isEnglish ? 'Update Keys' : 'حفظ التغييرات'}
                            </Btn>
                        </>
                    } />
                </div>
            )}
        </div>
    );
};

export default ClientsTab;
