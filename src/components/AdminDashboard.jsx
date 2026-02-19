import React, { useState, useEffect } from 'react';
import * as adminService from '../services/adminService';
import { sendMessage, initializeChat } from '../services/geminiService';
import * as automationService from '../services/automationService';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('manager'); // manager, templates, customers
    const [templates, setTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [managerConfig, setManagerConfig] = useState(null);
    const [globalLeads, setGlobalLeads] = useState([
        { id: 1, business: 'عيادات الابتسامة', city: 'الرياض', tier: 'Hot', contact: '055XXX1234', owner: 'عبدالله' },
        { id: 2, business: 'صالون لافندر', city: 'جدة', tier: 'Interested', contact: '050XXX5678', owner: 'سارة' },
        { id: 3, business: 'مجمع الصحة', city: 'الدمام', tier: 'Hot', contact: '054XXX9012', owner: 'فهد' }
    ]);
    const [integrations, setIntegrations] = useState([
        { id: 'n8n', name: 'n8n Automation', status: 'Disconnected', icon: '🔗', key: '', url: '' },
        { id: 'google_sheets', name: 'Google Sheets', status: 'Disconnected', icon: '📊', key: '', url: '' },
        { id: 'whatsapp', name: 'WhatsApp Cloud', status: 'Disconnected', icon: '💬', key: '', url: '' },
        { id: 'maps', name: 'Google Maps API', status: 'Disconnected', icon: '📍', key: '', url: '' }
    ]);
    const [opsLogs, setOpsLogs] = useState([
        'المدير التنفيذي: كافة أنظمة الربط التقني جاهزة للتفعيل واستقبال الأوامر الاستراتيجية.'
    ]);
    const [departments, setDepartments] = useState([
        { id: 'marketing', name: 'مدير التسويق', icon: '📢', status: 'Active', tasks: 12, performance: '98%' },
        { id: 'sales', name: 'مدير المبيعات', icon: '💰', status: 'Scanning', tasks: 45, performance: '94%' },
        { id: 'finance', name: 'المدير المالي', icon: '🏦', status: 'Monitoring', tasks: 8, performance: '100%' },
        { id: 'operations', name: 'مدير العمليات', icon: '⚙️', status: 'Active', tasks: 22, performance: '96%' }
    ]);
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [executiveInbox, setExecutiveInbox] = useState([
        { id: 1, sender: 'n8n Bot', message: 'تم استلام بيانات عيادة الابتسامة.. جاري إرسال حملة الواتساب.', time: 'منذ دقيقة', status: 'unread' },
        { id: 2, sender: 'Sales Manager', message: 'هل أؤكد ترحيل قائمة جدة إلى Google Sheets؟', time: 'منذ 5 دقائق', status: 'need_action' }
    ]);
    const [livePipeline, setLivePipeline] = useState([
        { id: 'req_101', stage: 2, patient: 'سارة أحمد', request: 'حجز موعد أسنان', lastAction: 'بانتظار تأكيد التوفر' },
        { id: 'req_102', stage: 4, patient: 'محمد علي', request: 'استشارة فورية', lastAction: 'جاري إنشاء رابط Stripe' }
    ]);

    // AI Manager State
    const [chatMessages, setChatMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [tData, cData, config] = await Promise.all([
                adminService.getTemplates(),
                adminService.getAllCustomers(),
                adminService.getPlatformSettings('manager_ai_config')
            ]);
            setTemplates(tData);
            setCustomers(cData);
            setManagerConfig(config);

            // Load Integrations
            const savedIntegrations = await adminService.getPlatformSettings('external_integrations');
            if (savedIntegrations) {
                setIntegrations(savedIntegrations);
            }

            // Initialize Manager AI
            if (config) {
                const systemPrompt = `أنت المدير التنفيذي (CEO) لمنصة Elite Agents المتخصصة في "بروتوكول التشغيل الخماسي".
مهمتك إدارة رحلة العميل عبر 5 محطات:
1. الاستقبال (واتساب)
2. القرار الذكي (تحليل الطلب)
3. التحقق (التقويم/التوافر)
4. التوثيق المالي (Supabase/Sheets/Stripe)
5. الإغلاق (تأكيد واتساب)

عندما يطلب المالك حجزاً، اطلب من n8n تفعيل "محرك التحقق" (Station 3).
عندما يتم التأكيد، اطلب تفعيل "الضربة الثلاثية" (Station 4).
أنت خبير في n8n وتعرف متى تطلق كل Webhook بناءً على المحطة المطلوبة.`;
                initializeChat(systemPrompt, 'admin');
                setChatMessages([{ role: 'agent', content: `سيدي المالك. بروتوكول التشغيل الخماسي جاهز للتفعيل. سأقوم بإدارة رحلة المريض من واتساب وحتى التأكيد النهائي.` }]);
            }
        } catch (error) {
            console.error('Admin Load Error:', error);
        }
        setLoading(false);
    };

    const handleSaveIntegration = async () => {
        try {
            const updatedIntegrations = integrations.map(integ =>
                integ.id === selectedIntegration.id ? { ...selectedIntegration, status: selectedIntegration.key ? 'Connected' : 'Disconnected' } : integ
            );
            await adminService.updatePlatformSettings('external_integrations', updatedIntegrations);
            setIntegrations(updatedIntegrations);
            setSelectedIntegration(null);

            // Log action
            setOpsLogs(prev => [`المدير التنفيذي: تم تحديث بروتوكول الربط لـ ${selectedIntegration.name}.. الأنظمة متصلة الآن.`, ...prev]);
        } catch (error) {
            alert('خطأ في حفظ الربط');
        }
    };

    const handleTestIntegration = async (integ) => {
        setOpsLogs(prev => [`نظام العمليات: جاري اختبار الاتصال بـ ${integ.name}...`, ...prev]);
        const result = await automationService.triggerIntegration(integ.id, { test: true, message: 'EliteAgents Test Signal' });
        if (result.success) {
            setOpsLogs(prev => [`✅ نظام العمليات: نجح الاتصال بـ ${integ.name} (Code: ${result.status})`, ...prev]);
        } else {
            setOpsLogs(prev => [`❌ نظام العمليات: فشل الاتصال بـ ${integ.name} (${result.error})`, ...prev]);
        }
    };

    const handleExportGlobalLeads = async () => {
        setOpsLogs(prev => [`المدير التنفيذي: جاري ترحيل قائمة الفرص العالمية إلى Google Sheets...`, ...prev]);
        const result = await automationService.exportLeadsToSheets(globalLeads);
        if (result.success) {
            setOpsLogs(prev => [`✅ مدير المبيعات: تم ترحيل ${globalLeads.length} فرصة بيعية بنجاح.`, ...prev]);
        } else {
            setOpsLogs(prev => [`❌ مدير المبيعات: فشل ترحيل البيانات. تأكد من إعدادات الربط.`, ...prev]);
        }
    };

    const handleActionResponse = (action, id) => {
        setOpsLogs(prev => [`نظام الاستجابة: تم تنفيذ إجراء "${action}" على الرسالة رقم ${id}.`, ...prev]);
        setExecutiveInbox(prev => prev.filter(msg => msg.id !== id));
    };

    const handleSendToManager = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setChatMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // CEO Intelligence: Deciding if we should trigger an external workflow
        if (inputValue.includes('أتمتة') || inputValue.includes('ربط')) {
            setOpsLogs(prev => [`المدير التنفيذي: جاري تفعيل سير عمل خارجي لـ n8n بناءً على طلبك...`, ...prev]);
            await automationService.triggerEvent('EXECUTIVE_ORDER', { command: inputValue });
        }

        const response = await sendMessage(inputValue, 'admin');
        if (response.success) {
            setChatMessages(prev => [...prev, { role: 'agent', content: response.text }]);
        }
    };

    if (loading) return <div className="container py-3xl text-center">جاري تحميل لوحة الإدارة...</div>;

    return (
        <div className="container py-xl">
            <div className="card mb-2xl" style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: 'white',
                padding: '2.5rem',
                borderRadius: '32px',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#D4AF37' }}></div>
                <div className="flex align-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="flex align-center gap-xl">
                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(to bottom, #D4AF37, #AA8A2E)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👔</div>
                        <div>
                            <div className="flex align-center gap-sm mb-xs">
                                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0 }}>جناح القيادة التنفيذية</h1>
                                <span style={{ background: 'rgba(212,175,55,0.2)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', color: '#D4AF37', fontWeight: 900, border: '1px solid #D4AF37' }}>PLATFORM CHIEF</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', margin: 0 }}>مكتب المدير التنفيذي: الإشراف الشامل على الموظفين، العمليات، وقاعدة بيانات النمو</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-md mb-xl" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <button
                    className={`nav-link ${activeTab === 'manager' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manager')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    🤖 المدير الذكي
                </button>
                <button
                    className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    💼 إدارة الموظفين
                </button>
                <button
                    className={`nav-link ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('customers')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    👥 بيانات المالكين
                </button>
                <button
                    className={`nav-link ${activeTab === 'operations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('operations')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    🚀 العمليات والربط
                </button>
                <button
                    className={`nav-link ${activeTab === 'boardroom' ? 'active' : ''}`}
                    onClick={() => setActiveTab('boardroom')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    🏛️ اجتماع الإدارة
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">

                {activeTab === 'manager' && (
                    <div className="grid grid-2 gap-xl">
                        {/* Executive Delegation Chat */}
                        <div className="card card-solid p-xl" style={{ border: '1px solid #E2E8F0', borderRadius: '24px' }}>
                            <div className="flex align-center justify-between mb-md">
                                <div className="flex align-center gap-sm">
                                    <span style={{ fontSize: '1.5rem' }}>🤵‍♂️</span>
                                    <h3 style={{ margin: 0 }}>مكتب الوفد التنفيذي (Delegation)</h3>
                                </div>
                                <span className="badge badge-success">المدير التنفيذي نشط</span>
                            </div>
                            <div className="chat-container mb-md" style={{ background: '#f8fafc', borderRadius: '12px', height: '350px' }}>
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-agent'}`}>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-sm mb-md">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تفويض سريع إلى:</span>
                                <button className="btn btn-xs btn-secondary">📢 التسويق</button>
                                <button className="btn btn-xs btn-secondary">💰 المبيعات</button>
                                <button className="btn btn-xs btn-secondary">🏦 المالية</button>
                            </div>
                            <form onSubmit={handleSendToManager} className="flex gap-sm">
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ marginTop: 0 }}
                                    placeholder="أصدر أمراً تنفيذياً أو فوض مهمة لمدير قسم..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">تفويض</button>
                            </form>
                        </div>

                        {/* Department Managers Quick Info */}
                        <div className="grid gap-md">
                            {departments.map(dept => (
                                <div key={dept.id} className="card p-lg flex align-center justify-between" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                    <div className="flex align-center gap-md">
                                        <div style={{ fontSize: '1.5rem', width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dept.icon}</div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{dept.name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: dept.status === 'Active' ? 'var(--success)' : 'var(--accent)' }}>● {dept.status}</span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{dept.performance}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>أداء القسم</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div>
                        <div className="flex justify-between align-center mb-md">
                            <h3>الموظفون المتاحون في السوق</h3>
                            <button className="btn btn-primary btn-sm">+ إضافة موظف جديد</button>
                        </div>
                        <div className="stats-grid">
                            {templates.map((t) => (
                                <div key={t.id} className="card p-md">
                                    <div className="flex justify-between">
                                        <h4>{t.title}</h4>
                                        <span className="badge badge-success">${t.base_price}</span>
                                    </div>
                                    <p className="text-secondary mb-sm" style={{ fontSize: '0.8rem' }}>{t.description}</p>
                                    <div className="flex gap-sm">
                                        <button className="btn btn-secondary btn-sm w-full">تعديل</button>
                                        <button className="btn-link" style={{ color: 'red' }}>حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'customers' && (
                    <div className="card p-xl">
                        <h3 className="mb-md">سجل مالكي المنشآت (Platform Owners)</h3>
                        <table className="w-full text-right" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                    <th className="py-sm">الاسم</th>
                                    <th className="py-sm">البريد الإلكتروني</th>
                                    <th className="py-sm">الباقة</th>
                                    <th className="py-sm">تاريخ التسجيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td className="py-md">{c.full_name || 'غير معروف'}</td>
                                        <td className="py-md">{c.email}</td>
                                        <td className="py-md">
                                            <span className={`badge ${c.subscription_tier === 'pro' ? 'badge-success' : 'badge-secondary'}`}>
                                                {c.subscription_tier}
                                            </span>
                                        </td>
                                        <td className="py-md">{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'operations' && (
                    <div className="grid gap-xl">
                        {/* 5-Station Operational Pipeline Visualization */}
                        <div className="card p-xl" style={{ border: '2px solid #0F172A', background: '#F8FAFC' }}>
                            <div className="flex justify-between align-center mb-xl">
                                <div>
                                    <h3 style={{ margin: 0 }}>🚉 مسار التشغيل الخماسي (Live Pipeline)</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>مراقبة حية لرحلة المريض من WhatsApp حتى التأكيد النهائي</p>
                                </div>
                                <div className="flex gap-sm">
                                    <span className="badge badge-success">● {livePipeline.length} عمليات جارية</span>
                                </div>
                            </div>

                            <div className="grid gap-lg">
                                {livePipeline.map(req => (
                                    <div key={req.id} className="p-lg" style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <div className="flex justify-between align-center mb-md">
                                            <div className="flex align-center gap-md">
                                                <div style={{ width: '40px', height: '40px', background: '#0F172A', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{req.patient} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{req.id}</span></h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6366F1' }}>{req.request}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <span className="badge badge-primary">{req.lastAction}</span>
                                            </div>
                                        </div>

                                        {/* Station Progress Bar */}
                                        <div className="flex justify-between align-center px-md py-sm" style={{ background: '#F1F5F9', borderRadius: '16px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: '#CBD5E1', zIndex: 0 }}></div>
                                            {[1, 2, 3, 4, 5].map(step => (
                                                <div key={step} style={{
                                                    zIndex: 1,
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: req.stage >= step ? '#0F172A' : 'white',
                                                    color: req.stage >= step ? 'white' : '#94A3B8',
                                                    border: `2px solid ${req.stage >= step ? '#0F172A' : '#CBD5E1'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 900
                                                }}>
                                                    {req.stage > step ? '✓' : step}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-center mt-sm" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            <div style={{ width: '20%' }}>واتساب</div>
                                            <div style={{ width: '20%' }}>القرار الذكي</div>
                                            <div style={{ width: '20%' }}>التوافر</div>
                                            <div style={{ width: '20%' }}>المالية</div>
                                            <div style={{ width: '20%' }}>التأكيد</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-2 gap-xl">
                            {/* External Integrations List */}
                            <div className="card p-xl" style={{ border: '1px solid #E2E8F0' }}>
                                <h3 className="mb-md">🔌 مركز الربط والاتصال (Integration Hub)</h3>
                                <div className="grid gap-md">
                                    {integrations.map(integ => (
                                        <div key={integ.id} className="p-md flex align-center justify-between" style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                                            <div className="flex align-center gap-md">
                                                <span style={{ fontSize: '1.2rem' }}>{integ.icon}</span>
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>{integ.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: integ.status === 'Connected' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {integ.status === 'Connected' ? '✅ متصل وجاهز' : '❌ غير متصل'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex align-center gap-sm">
                                                {integ.status === 'Connected' && (
                                                    <button
                                                        onClick={() => handleTestIntegration(integ)}
                                                        className="btn btn-xs btn-success"
                                                        title="إرسال إشارة اختبار"
                                                    >
                                                        ⚡ اختبار
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedIntegration(integ)}
                                                    className={`btn btn-xs ${integ.status === 'Connected' ? 'btn-secondary' : 'btn-primary'}`}
                                                >
                                                    {integ.status === 'Connected' ? 'تعديل الربط' : 'تفعيل الآن'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Integration Modal/Config Panel */}
                            {selectedIntegration ? (
                                <div className="card p-xl animate-fade-in" style={{ border: '2px solid var(--accent)', background: '#FFFDF5' }}>
                                    <div className="flex justify-between align-start mb-lg">
                                        <div className="flex align-center gap-md">
                                            <div style={{ fontSize: '2rem' }}>{selectedIntegration.icon}</div>
                                            <div>
                                                <h3 style={{ margin: 0 }}>إعدادات {selectedIntegration.name}</h3>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>أدخل المفاتيح المطلوبة لتمكين الأتمتة</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedIntegration(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                                    </div>

                                    <div className="mb-md">
                                        <label className="label">
                                            {selectedIntegration.id === 'whatsapp' ? 'رمز الوصول الدائم (Permanent Access Token)' : 'مفتاح الـ API (API Key)'}
                                        </label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            placeholder={selectedIntegration.id === 'whatsapp' ? 'EAABw...' : 'sk-xxxxxxxxxxxx'}
                                            value={selectedIntegration.key}
                                            onChange={(e) => setSelectedIntegration({ ...selectedIntegration, key: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-lg">
                                        <label className="label">
                                            {selectedIntegration.id === 'whatsapp' ? 'معرف رقم الهاتف (Phone Number ID)' : 'رابط الاتصال (Webhook / Spreadsheet URL)'}
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder={selectedIntegration.id === 'whatsapp' ? '105xxxxxxx' : 'https://hooks.n8n.io/...'}
                                            value={selectedIntegration.url}
                                            onChange={(e) => setSelectedIntegration({ ...selectedIntegration, url: e.target.value })}
                                        />
                                    </div>

                                    {selectedIntegration.id === 'whatsapp' && (
                                        <div className="mb-lg p-md" style={{ background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px dashed #22c55e' }}>
                                            <label className="label" style={{ color: '#15803d', fontWeight: 800 }}>🔐 إعدادات الربط المباشر (No-n8n)</label>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                سيقوم الموظف باستخدام هذه البيانات للرد مباشرة على الرسائل الواردة وصرف الوحدات من رصيد العميل.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-md">
                                        <button className="btn btn-primary flex-1" onClick={handleSaveIntegration}>حفظ وتفعيل البروتوكول</button>
                                        <button className="btn btn-secondary" onClick={() => setSelectedIntegration(null)}>إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="card p-xl flex-center text-center" style={{ border: '1px dashed #CBD5E1', background: '#F8FAFC' }}>
                                    <div>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                                        <h4>بانتظار اختيار الأداة</h4>
                                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>اختر أداة من القائمة اليمنى لتكوين جسر الربط مع المنصة.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logs and Data Section */}
                        <div className="grid grid-2 gap-xl">
                            {/* Live Ops Logs */}
                            <div className="card p-xl" style={{ maxHeight: '400px', overflowY: 'auto', background: '#0F172A', color: '#38BDF8', fontFamily: 'monospace' }}>
                                <h3 className="mb-md" style={{ color: 'white' }}>📟 سجل العمليات المباشر (Live Ops)</h3>
                                <div className="grid gap-xs">
                                    {opsLogs.map((log, i) => (
                                        <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4px 0', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#94A3B8' }}>[{new Date().toLocaleTimeString()}]</span> {log}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Global Leads Collected */}
                            <div className="card p-xl" style={{ border: '1px solid #E2E8F0' }}>
                                <div className="flex justify-between align-center mb-md">
                                    <h3 style={{ margin: 0 }}>📍 مجمع الفرص العالمي (Leads)</h3>
                                    <button className="btn btn-xs btn-success" onClick={handleExportGlobalLeads}>ترحيل إلى Google Sheets 🚀</button>
                                </div>
                                <table className="w-full text-right" style={{ fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <th className="py-xs">المنشأة</th>
                                            <th className="py-xs">الحالة</th>
                                            <th className="py-xs">المدينة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {globalLeads.slice(0, 5).map(lead => (
                                            <tr key={lead.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td className="py-xs" style={{ fontWeight: 700 }}>{lead.business}</td>
                                                <td className="py-xs">
                                                    <span style={{ color: lead.tier === 'Hot' ? 'red' : 'blue' }}>
                                                        {lead.tier === 'Hot' ? '🔥 حار' : '💎 ذو قيمة'}
                                                    </span>
                                                </td>
                                                <td className="py-xs">{lead.city}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Executive Response Center (Inbox) */}
                        <div className="card p-xl" style={{ border: '2px solid #6366F1', background: '#F5F3FF' }}>
                            <div className="flex justify-between align-center mb-lg">
                                <div className="flex align-center gap-md">
                                    <div style={{ width: '50px', height: '50px', background: '#6366F1', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📥</div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>مركز الاستجابة والتعقيب (Executive Inbox)</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#4F46E5' }}>مخرجات n8n وردود فعل الأنظمة الخارجية بانتظار قرارك</p>
                                    </div>
                                </div>
                                <span className="badge badge-primary">{executiveInbox.length} رسائل جديدة</span>
                            </div>

                            <div className="grid gap-md">
                                {executiveInbox.length > 0 ? executiveInbox.map(msg => (
                                    <div key={msg.id} className="p-lg flex justify-between align-center" style={{ background: 'white', border: '1px solid #DDD6FE', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <div className="flex align-center gap-md">
                                            <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
                                            <div>
                                                <div className="flex align-center gap-sm">
                                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{msg.sender}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                                                </div>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem' }}>{msg.message}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-sm">
                                            <button className="btn btn-xs btn-primary" onClick={() => {
                                                const reply = prompt('أدخل ردك ليتم إرساله للعميل عبر n8n:');
                                                if (reply) {
                                                    automationService.triggerEvent('EXECUTIVE_REPLY', { messageId: msg.id, reply });
                                                    handleActionResponse('تم الرد والاعتماد', msg.id);
                                                }
                                            }}>💬 رد واعتماد</button>
                                            <button className="btn btn-xs btn-secondary" onClick={() => handleActionResponse('تجاهل', msg.id)}>تجاهل</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-xl" style={{ color: 'var(--text-muted)' }}>
                                        لا توجد ردود فعل خارجية حالياً.. الأنظمة تعمل بهدوء.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'boardroom' && (
                    <div className="card p-xl">
                        <div className="flex justify-between align-center mb-xl">
                            <h3 style={{ margin: 0 }}>🏛️ قاعة اجتماعات مجلس الإدارة</h3>
                            <button className="btn btn-primary btn-sm">عقد اجتماع طارئ 📞</button>
                        </div>
                        <div className="grid grid-3 gap-lg">
                            {departments.map(dept => (
                                <div key={dept.id} className="card p-xl text-center" style={{ border: '1px solid #E2E8F0', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{dept.icon}</div>
                                    <h4 style={{ marginBottom: '0.5rem' }}>{dept.name}</h4>
                                    <div className="badge badge-primary mb-md">{dept.tasks} مهمة جارية</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                        هذا المدير مسؤول عن كافة عمليات الـ {dept.name.split(' ')[1]} والأتمتة الخاصة بها.
                                    </p>
                                    <button className="btn btn-secondary btn-sm btn-block">مراجعة تقرير القسم</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
