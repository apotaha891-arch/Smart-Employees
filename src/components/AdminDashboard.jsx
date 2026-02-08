import React, { useState, useEffect } from 'react';
import * as adminService from '../services/adminService';
import { sendMessage, initializeChat } from '../services/geminiService';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('manager'); // manager, templates, customers
    const [templates, setTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [managerConfig, setManagerConfig] = useState(null);
    const [loading, setLoading] = useState(true);

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

            // Initialize Manager AI
            if (config) {
                const systemPrompt = `أنت ${config.name}، ${config.role}. 
مهمتك هي مساعدة العملاء ومديري المنصة في فهم فوائد Elite Agents.
معلوماتك: ${config.knowledge}
أجب باختصار واحترافية تسويقية عالية. جادل حول العائد على الاستثمار (ROI).`;
                initializeChat(systemPrompt, 'admin');
                setChatMessages([{ role: 'agent', content: `مرحباً بك في غرفة تحكم الإدارة. أنا ${config.name}، كيف يمكنني مساعدتك في تطوير المنصة اليوم؟` }]);
            }
        } catch (error) {
            console.error('Admin Load Error:', error);
        }
        setLoading(false);
    };

    const handleSendToManager = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setChatMessages(prev => [...prev, userMsg]);
        setInputValue('');

        const response = await sendMessage(inputValue, 'admin');
        if (response.success) {
            setChatMessages(prev => [...prev, { role: 'agent', content: response.text }]);
        }
    };

    if (loading) return <div className="container py-3xl text-center">جاري تحميل لوحة الإدارة...</div>;

    return (
        <div className="container py-xl">
            <div className="page-header d-flex justify-between align-center mb-xl">
                <div>
                    <h1>🏢 لوحة تحكم الإدارة</h1>
                    <p>التحكم الشامل في الموظفين، العملاء، والذكاء الاصطناعي للمنصة</p>
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
                    👥 بيانات العملاء
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">

                {activeTab === 'manager' && (
                    <div className="grid grid-2 gap-xl">
                        {/* Manager Chat */}
                        <div className="card card-solid p-xl">
                            <h3 className="mb-md">اختبار المدير الذكي</h3>
                            <div className="chat-container mb-md" style={{ background: '#f8fafc', borderRadius: '12px', height: '400px' }}>
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-agent'}`}>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendToManager} className="flex gap-sm">
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ marginTop: 0 }}
                                    placeholder="اسأل المدير عن خطة التسويق أو أسعار التوظيف..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">إرسال</button>
                            </form>
                        </div>

                        {/* Manager Setup */}
                        <div className="card p-xl">
                            <h3 className="mb-md">تحديث "عقل" مدير المنصة</h3>
                            <div className="mb-md">
                                <label className="label">اسم المدير</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={managerConfig?.name || ''}
                                    onChange={(e) => setManagerConfig({ ...managerConfig, name: e.target.value })}
                                />
                            </div>
                            <div className="mb-md">
                                <label className="label">المعرفة الأساسية (Knowledge Base)</label>
                                <textarea
                                    className="input-field"
                                    rows="10"
                                    value={managerConfig?.knowledge || ''}
                                    onChange={(e) => setManagerConfig({ ...managerConfig, knowledge: e.target.value })}
                                ></textarea>
                            </div>
                            <button
                                className="btn btn-primary btn-block"
                                onClick={() => adminService.updatePlatformSettings('manager_ai_config', managerConfig)}
                            >
                                حفظ الإعدادات العميقة للمدير
                            </button>
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
                        <h3 className="mb-md">سجل العملاء للأهداف التسويقية كـ Leads</h3>
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

            </div>
        </div>
    );
};

export default AdminDashboard;
