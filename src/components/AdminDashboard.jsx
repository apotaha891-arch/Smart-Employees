import React, { useState, useEffect } from 'react';
import * as adminService from '../services/adminService';
import {
    LayoutDashboard,
    Settings,
    CreditCard,
    Link as LinkIcon,
    Users,
    Bot,
    ChevronRight,
    TrendingUp,
    Activity,
    Save
} from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data states
    const [stats, setStats] = useState({ users: 0, activeAgents: 0, revenue: 0 });
    const [customers, setCustomers] = useState([]);
    const [siteContent, setSiteContent] = useState({ heroTitle: '', heroSubtitle: '', contactEmail: '' });
    const [pricingPlans, setPricingPlans] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // Fetch everything concurrently
            const [cData, tData, plansConfig, integConfig, siteConfig] = await Promise.all([
                adminService.getAllCustomers(),
                adminService.getTemplates(),
                adminService.getPlatformSettings('pricing_plans'),
                adminService.getPlatformSettings('external_integrations'),
                adminService.getPlatformSettings('site_content')
            ]);

            setCustomers(cData || []);
            setTemplates(tData || []);

            if (plansConfig) setPricingPlans(plansConfig);
            else setPricingPlans([
                { id: 'starter', name: 'باقة الانطلاق', monthlyPrice: 199, yearlyPrice: 159, trialPrice: 99 },
                { id: 'pro', name: 'باقة الاحتراف', monthlyPrice: 399, yearlyPrice: 319, trialPrice: 199 },
                { id: 'enterprise', name: 'باقة النخبة', monthlyPrice: 899, yearlyPrice: 719, trialPrice: 449 }
            ]);

            if (integConfig) setIntegrations(integConfig);
            else setIntegrations([
                { id: 'n8n', name: 'n8n Webhook', url: '', key: '', status: 'Disconnected' },
                { id: 'whatsapp', name: 'WhatsApp API', url: '', key: '', status: 'Disconnected' }
            ]);

            if (siteConfig) setSiteContent(siteConfig);
            else setSiteContent({ heroTitle: 'كوادر رقمية لا تنام', heroSubtitle: 'وظف أذكى الوكلاء الافتراضيين لخدمة عملائك', contactEmail: 'support@eliteagents.com' });

            // Mock Stats based on data
            setStats({
                users: cData?.length || 12,
                activeAgents: (cData?.length || 12) * 2,
                revenue: (cData?.length || 12) * 399
            });

        } catch (error) {
            console.error('Admin Load Error:', error);
        }
        setLoading(false);
    };

    const handleSaveConfig = async (key, data) => {
        setSaving(true);
        try {
            await adminService.updatePlatformSettings(key, data);
            alert('تم الحفظ بنجاح ✓');
        } catch (err) {
            alert('حدث خطأ أثناء الحفظ');
        }
        setSaving(false);
    };

    const handlePlanChange = (index, field, value) => {
        const updated = [...pricingPlans];
        updated[index][field] = value;
        setPricingPlans(updated);
    };

    const handleIntegrationChange = (index, field, value) => {
        const updated = [...integrations];
        updated[index][field] = value;
        setIntegrations(updated);
    };

    const sidebarItems = [
        { id: 'overview', label: 'لوحة القيادة', icon: <LayoutDashboard size={20} /> },
        { id: 'content', label: 'محتوى الموقع', icon: <Settings size={20} /> },
        { id: 'pricing', label: 'إدارة الباقات', icon: <CreditCard size={20} /> },
        { id: 'integrations', label: 'مفاتيح الربط', icon: <LinkIcon size={20} /> },
        { id: 'templates', label: 'قوالب الموظفين', icon: <Bot size={20} /> },
        { id: 'customers', label: 'العملاء والاشتراكات', icon: <Users size={20} /> }
    ];

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B' }}>
            <h2 style={{ color: 'white' }}>جاري تحميل غرفة التحكم...</h2>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B', direction: 'rtl', color: '#E4E4E7' }}>

            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: '#18181B',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                top: 0,
                right: 0,
                zIndex: 50
            }}>
                <div style={{ marginBottom: '3rem', padding: '0 1rem' }}>
                    <div className="badge badge-success mb-xs" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>Admin Panel</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>نظام الجذور</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: activeTab === item.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                color: activeTab === item.id ? '#A78BFA' : '#A1A1AA',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: activeTab === item.id ? 800 : 500,
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                textAlign: 'right'
                            }}
                        >
                            {item.icon}
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {activeTab === item.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '3rem 4rem', marginRight: '280px' }}>

                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', color: 'white' }}>نظرة عامة على المنصة</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#10B981' }}>
                                    <Users size={24} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>إجمالي العملاء</h3>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white' }}>{stats.users}</div>
                            </div>
                            <div className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#8B5CF6' }}>
                                    <Bot size={24} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>الموظفون النشطون</h3>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white' }}>{stats.activeAgents}</div>
                            </div>
                            <div className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#F59E0B' }}>
                                    <TrendingUp size={24} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>الدخل الشهري المتوقع</h3>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white' }}>${stats.revenue}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SITE CONTENT */}
                {activeTab === 'content' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>محتوى الموقع</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSaveConfig('site_content', siteContent)}
                                disabled={saving}
                            >
                                <Save size={18} style={{ marginLeft: '0.5rem' }} />
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                        </div>
                        <div className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px' }}>
                            <div className="grid gap-lg">
                                <div>
                                    <label className="label">عنوان الصفحة الرئيسية (Hero Title)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={siteContent.heroTitle}
                                        onChange={(e) => setSiteContent({ ...siteContent, heroTitle: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">النص الفرعي (Hero Subtitle)</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        value={siteContent.heroSubtitle}
                                        onChange={(e) => setSiteContent({ ...siteContent, heroSubtitle: e.target.value })}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="label">بريد الدعم الفني</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={siteContent.contactEmail}
                                        onChange={(e) => setSiteContent({ ...siteContent, contactEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PRICING PLANS */}
                {activeTab === 'pricing' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>إدارة الباقات والأسعار</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSaveConfig('pricing_plans', pricingPlans)}
                                disabled={saving}
                            >
                                <Save size={18} style={{ marginLeft: '0.5rem' }} />
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {pricingPlans.map((plan, idx) => (
                                <div key={plan.id} className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#A78BFA' }}>{plan.name} ({plan.id})</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                        <div>
                                            <label className="label">سعر الاشتراك الشهري (ريال)</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                value={plan.monthlyPrice}
                                                onChange={(e) => handlePlanChange(idx, 'monthlyPrice', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">سعر الاشتراك السنوي/شهرياً (ريال)</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                value={plan.yearlyPrice}
                                                onChange={(e) => handlePlanChange(idx, 'yearlyPrice', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">خطة التجربة لـ 3 شهور (ريال)</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                value={plan.trialPrice}
                                                onChange={(e) => handlePlanChange(idx, 'trialPrice', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. INTEGRATIONS API LINKS */}
                {activeTab === 'integrations' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>مفاتيح الـ API وروابط التحكم</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSaveConfig('external_integrations', integrations)}
                                disabled={saving}
                            >
                                <Save size={18} style={{ marginLeft: '0.5rem' }} />
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {integrations.map((integ, idx) => (
                                <div key={integ.id} className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#A78BFA' }}>{integ.name}</h3>
                                        <select
                                            className="input-field"
                                            style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem' }}
                                            value={integ.status}
                                            onChange={(e) => handleIntegrationChange(idx, 'status', e.target.value)}
                                        >
                                            <option value="Disconnected">غير متصل ❌</option>
                                            <option value="Connected">متصل ✅</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="label">رابط الويب هوك (URL)</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="https://hooks.n8n..."
                                                value={integ.url}
                                                onChange={(e) => handleIntegrationChange(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">مفتاح الوصول (API Key / Token)</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                placeholder="sk-..."
                                                value={integ.key}
                                                onChange={(e) => handleIntegrationChange(idx, 'key', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. CUSTOMERS */}
                {activeTab === 'customers' && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '2rem' }}>قاعدة العملاء والاشتراكات</h2>
                        <div className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#A1A1AA' }}>اسم العميل</th>
                                        <th style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#A1A1AA' }}>البريد الإلكتروني</th>
                                        <th style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#A1A1AA' }}>الباقة</th>
                                        <th style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#A1A1AA' }}>تاريخ التسجيل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length > 0 ? customers.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700 }}>{c.full_name || 'غير مدرج'}</td>
                                            <td style={{ padding: '1.5rem 2rem', color: '#A1A1AA' }}>{c.email}</td>
                                            <td style={{ padding: '1.5rem 2rem' }}>
                                                <span className={`badge ${c.subscription_tier === 'pro' ? 'badge-success' : 'badge-secondary'}`}>
                                                    {c.subscription_tier || 'مجاني'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem 2rem', color: '#A1A1AA' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#71717A' }}>لا يوجد سجلات للعملاء حتى الآن.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. TEMPLATES */}
                {activeTab === 'templates' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>مكتبة الوكلاء الافتراضيين</h2>
                            <button className="btn btn-primary">+ وكيل جديد</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {templates.map(t => (
                                <div key={t.id} className="card" style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFF' }}>{t.title}</h3>
                                    <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{t.description}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontWeight: 800, color: '#10B981' }}>${t.base_price}</span>
                                        <button className="btn btn-sm btn-secondary" style={{ padding: '0.5rem 1rem' }}>تعديل</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;
