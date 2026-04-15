import React, { useState } from 'react';
import { 
    Activity, Key, RefreshCw, Save, MessageSquare, CreditCard 
} from 'lucide-react';
import { Card, Btn, Input } from './SharedComponents';
import * as adminService from '../../../services/adminService';

const InfrastructureTab = ({
    isEnglish, isRtl, intTab, setIntTab, loading, saving, platformTelegramToken, setPlatformTelegramToken,
    academyPriceId, setAcademyPriceId, integrations, setIntegrations, savePlatformInteg,
    logParams, setLogParams, fetchLogs, logs, flash
}) => {
    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
                {isEnglish ? 'Infrastructure & Security' : 'البنية التحتية والسجلات'}
            </h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '10px' }}>
                {[
                    { id: 'platform', l: isEnglish ? 'Platform Keys' : 'مفاتيح المنصة', i: Key },
                    { id: 'logs', l: isEnglish ? 'System Logs' : 'سجلات النظام', i: Activity }
                ].map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setIntTab(t.id)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', 
                            borderRadius: '10px', background: intTab === t.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                            color: intTab === t.id ? '#A78BFA' : '#6B7280', border: 'none', cursor: 'pointer',
                            fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s'
                        }}
                    >
                        <t.i size={18} /> {t.l}
                    </button>
                ))}
            </div>

            {intTab === 'platform' && (
                <div style={{ maxWidth: '800px' }}>
                    <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {isEnglish 
                            ? 'Manage global integration keys and platform-wide settings. These tokens power AI operations and automation workflows.' 
                            : 'أدوات التحكم في مفاتيح الربط البرمجية للمنصة بالكامل. هذه المفاتيح تشغل الذكاء الاصطناعي وتدفقات الأتمتة (OpenAI, Telegram, Stripe).'}
                    </p>
                    
                    {/* Platform Telegram Bot */}
                    <Card s={{ marginBottom: '1.5rem', background: 'rgba(0,136,204,0.03)', border: '1px solid rgba(0,136,204,0.2)', padding: '1.5rem' }} c={
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,136,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={20} color="#0088cc" />
                                </div>
                                <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontWeight: 800, fontSize: '1rem' }}>
                                    {isEnglish ? 'Global Telegram Gateway' : 'بوت التيليجرام الرئيسي للمنصة'}
                                </h3>
                            </div>
                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 600 }}>
                                {isEnglish ? 'Bot Token (Platform Notifications & AI)' : 'توكن البوت الرئيسي (إشعارات الإدارة والمستشار الذكي)'}
                            </label>
                            <Input 
                                type="password" 
                                value={platformTelegramToken} 
                                placeholder="7434105220:..." 
                                onChange={e => setPlatformTelegramToken(e.target.value)} 
                            />
                            <p style={{ color: '#4B5563', fontSize: '0.72rem', marginTop: '10px', fontStyle: 'italic' }}>
                                {isEnglish 
                                    ? '💡 This bot handles admin alerts and smart consultant interactions.' 
                                    : '💡 هذا البوت مخصص لإرسال تنبيهات الإدارة والعمليات الحساسة في المنصة.'}
                            </p>
                        </div>
                    } />

                    {/* Academy Pricing */}
                    <Card s={{ marginBottom: '1.5rem', background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.2)', padding: '1.5rem' }} c={
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={20} color="#A78BFA" />
                                </div>
                                <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontWeight: 800, fontSize: '1rem' }}>
                                    {isEnglish ? 'Academy Payment Hub (Stripe)' : 'إعدادات الدفع للأكاديمية'}
                                </h3>
                            </div>
                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 600 }}>Stripe Price ID</label>
                            <Input 
                                value={academyPriceId} 
                                placeholder="price_1TLQyRAW..." 
                                onChange={e => setAcademyPriceId(e.target.value)} 
                            />
                            <p style={{ color: '#4B5563', fontSize: '0.72rem', marginTop: '10px', fontStyle: 'italic' }}>
                                {isEnglish 
                                    ? '💡 Used for Stripe Checkout for the Training Bag product.' 
                                    : '💡 هذا المعرف يربط بوابات الدفع بمنتج الحقيبة التدريبية في نوار.'}
                            </p>
                        </div>
                    } />

                    {/* Integrations List */}
                    {integrations.map((integ, idx) => {
                        const conn = integ.status === 'Connected';
                        return (
                            <Card key={integ.id} s={{ marginBottom: '1rem', border: `1px solid ${conn ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`, padding: '1.25rem' }} c={
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>{integ.name}</h3>
                                        <select 
                                            value={integ.status} 
                                            onChange={e => { 
                                                const u = [...integrations]; 
                                                u[idx].status = e.target.value; 
                                                setIntegrations(u); 
                                            }} 
                                            style={{ 
                                                background: conn ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
                                                color: conn ? '#10B981' : '#EF4444', 
                                                border: 'none', borderRadius: '8px', padding: '4px 12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem', outline: 'none'
                                            }}
                                        >
                                            <option value="Disconnected">{isEnglish ? 'Disabled' : 'معطل ❌'}</option>
                                            <option value="Connected">{isEnglish ? 'Connected' : 'متصل ✅'}</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 600 }}>Webhook Endpoint</label>
                                            <Input value={integ.url} placeholder="https://..." onChange={e => { const u = [...integrations]; u[idx].url = e.target.value; setIntegrations(u); }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 600 }}>Authorization Token</label>
                                            <Input type="password" value={integ.key} placeholder="sk-..." onChange={e => { const u = [...integrations]; u[idx].key = e.target.value; setIntegrations(u); }} />
                                        </div>
                                    </div>
                                </div>
                            } />
                        );
                    })}

                    <Btn onClick={savePlatformInteg} disabled={saving} style={{ marginTop: '1.5rem', padding: '12px 25px' }}>
                        <Save size={18} />
                        {saving ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : (isEnglish ? 'Apply Global Settings' : 'حفظ مفاتيح المنصة')}
                    </Btn>
                </div>
            )}

            {intTab === 'logs' && (
                <div className="flex flex-col gap-1.5rem">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select 
                            value={logParams.category} 
                            onChange={e => setLogParams(p => ({ ...p, category: e.target.value }))} 
                            style={{ 
                                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', 
                                color: 'var(--color-text-main)', borderRadius: '10px', padding: '8px 15px', 
                                fontSize: '0.85rem', minWidth: '180px', outline: 'none'
                            }}
                        >
                            <option value="">{isEnglish ? 'All Categories' : 'كل التصنيفات'}</option>
                            <option value="system">{isEnglish ? 'System' : 'نظام'}</option>
                            <option value="auth">{isEnglish ? 'Auth' : 'هوية'}</option>
                            <option value="agent">{isEnglish ? 'AI Agents' : 'ذكاء اصطناعي'}</option>
                        </select>
                        <Btn onClick={fetchLogs}>
                            <RefreshCw size={16} /> 
                            {isEnglish ? 'Refresh' : 'تحديث'}
                        </Btn>
                    </div>

                    <Card s={{ padding: 0, overflow: 'hidden' }} c={
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: isRtl ? 'right' : 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                        <th style={{ padding: '1rem', fontWeight: 700, color: '#6B7280' }}>{isEnglish ? 'Timestamp' : 'الوقت'}</th>
                                        <th style={{ padding: '1rem', fontWeight: 700, color: '#6B7280' }}>{isEnglish ? 'Level' : 'المستوى'}</th>
                                        <th style={{ padding: '1rem', fontWeight: 700, color: '#6B7280' }}>{isEnglish ? 'Category' : 'التصنيف'}</th>
                                        <th style={{ padding: '1rem', fontWeight: 700, color: '#6B7280' }}>{isEnglish ? 'Message' : 'الرسالة'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                                {isEnglish ? 'No system logs available' : 'لا توجد سجلات حالياً'}
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map(l => {
                                            const lev = l.level === 'error' ? '#EF4444' : l.level === 'warn' ? '#F59E0B' : '#3B82F6';
                                            return (
                                                <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.75rem' }}>
                                                        {new Date(l.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ 
                                                            color: lev, background: `${lev}15`, 
                                                            padding: '2px 8px', borderRadius: '6px', 
                                                            fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase'
                                                        }}>
                                                            {l.level}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{l.category}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--color-text-main)', fontSize: '0.82rem' }}>{l.message}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    } />
                </div>
            )}
        </div>
    );
};

export default InfrastructureTab;
