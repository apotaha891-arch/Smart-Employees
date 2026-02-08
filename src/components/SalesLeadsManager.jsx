import React, { useState, useEffect } from 'react';

const SalesLeadsManager = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [leads, setLeads] = useState([]);
    const [statusLogs, setStatusLogs] = useState([]);
    const [isAutoMode, setIsAutoMode] = useState(() => {
        return localStorage.getItem('executive_auto_mode') === 'true';
    });

    const addLog = (msg) => {
        setStatusLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    // Simulated "Background Activity" when Auto Mode is on
    useEffect(() => {
        let interval;
        if (isAutoMode) {
            addLog("المكتب التنفيذي: تم ربط الأنظمة بنظام المسح الجغرافي المستمر. جاري المراقبة...");
            interval = setInterval(() => {
                const activities = [
                    "فحص العملاء المحتملين في النطاق الجغرافي النشط...",
                    "المكتب التنفيذي: تم تحديث بيانات 3 منشآت مكتشفة حديثاً.",
                    "تحديث قائمة الفرص البيعية بناءً على التقييمات الجديدة...",
                    "المكتب التنفيذي: لا توجد تغيرات كبيرة في منطقتك حالياً، جاري توسيع النطاق..."
                ];
                const randomMsg = activities[Math.floor(Math.random() * activities.length)];
                addLog(randomMsg);
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [isAutoMode]);

    const handleSearch = () => {
        if (!searchQuery) return;
        setIsSearching(true);
        setLeads([]);
        setStatusLogs([]);

        addLog("المكتب التنفيذي: بدأت عملية المسح الجغرافي للمنطقة...");

        setTimeout(() => addLog("جاري الاتصال بقاعدة بيانات خرائط جوجل..."), 800);
        setTimeout(() => addLog(`تم تحديد 15 منشأة في نطاق "${searchQuery}"`), 1600);
        setTimeout(() => addLog("جاري استخراج أرقام التواصل وتصنيف العملاء..."), 2400);

        // Simulate Google Maps Prospecting
        setTimeout(() => {
            const mockLeads = [
                { name: 'مجمع عيادات الابتسامة', phone: '055XXX1234', rating: '4.5', location: 'الصحافة، الرياض', status: 'Hot' },
                { name: 'مركز الرعاية المتكاملة', phone: '050XXX5678', rating: '4.2', location: 'الملقا، الرياض', status: 'Interested' },
                { name: 'صالون لافندر للتجميل', phone: '054XXX9012', rating: '4.8', location: 'حطين، الرياض', status: 'Hot' },
                { name: 'شركة ريادة العقارية', phone: '056XXX3456', rating: '4.0', location: 'الياسمين، الرياض', status: 'New' },
            ];
            setLeads(mockLeads);
            setIsSearching(false);
            addLog("المكتب التنفيذي: اكتملت المهمة بنجاح. القائمة جاهزة للتواصل.");
        }, 4000);
    };

    const toggleAutoMode = () => {
        const newState = !isAutoMode;
        setIsAutoMode(newState);
        localStorage.setItem('executive_auto_mode', newState);
        if (newState) {
            addLog("المكتب التنفيذي: تم تفعيل وضع الاستحواذ الآلي. سأعمل في الخلفية لجلب العملاء.");
        } else {
            addLog("المكتب التنفيذي: تم الانتقال للوضع اليدوي بناءً على طلبك.");
        }
    };

    return (
        <div className="card p-xl animate-fade-in" style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
            <div className="flex align-center justify-between mb-xl">
                <div className="flex align-center gap-md">
                    <div style={{ width: '60px', height: '60px', background: 'linear-gradient(45deg, #0F172A, #334155)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white' }}>🌎</div>
                    <div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.2rem' }}>نظام الاستحواذ الجغرافي (Maps)</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>تحت إشراف المدير التنفيذي - أتمتة جلب العملاء الجدد</p>
                    </div>
                </div>
                <div className="flex align-center gap-md">
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isAutoMode ? 'var(--success)' : 'var(--text-muted)' }}>
                        {isAutoMode ? '⚡ وضع الاستحواذ الآلي نشط' : 'التحكم اليدوي'}
                    </span>
                    <button
                        onClick={toggleAutoMode}
                        className={`btn btn-sm ${isAutoMode ? 'btn-success' : 'btn-secondary'}`}
                        style={{ borderRadius: '20px' }}
                    >
                        {isAutoMode ? 'تعطيل الاستحواذ' : 'تشغيل الاستحواذ الآلي'}
                    </button>
                </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 700, fontSize: '0.9rem' }}>🎯 تحديد الهدف الجغرافي للاستحواذ:</p>
                <div className="flex gap-md">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="مثال: مكاتب عقارية في جدة، حي الروضة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, background: 'white' }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={isSearching}
                        style={{ padding: '0 2rem', fontWeight: 800 }}
                    >
                        {isSearching ? 'جاري الاستخراج...' : 'بدء عملية الجلب'}
                    </button>
                </div>
            </div>

            {statusLogs.length > 0 && (
                <div className="mb-xl" style={{ background: '#0F172A', color: '#94A3B8', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid #1E293B' }}>
                    {statusLogs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '0.25rem', color: i === 0 ? 'var(--accent)' : 'inherit' }}>
                            {log}
                        </div>
                    ))}
                </div>
            )}

            {isSearching && (
                <div className="text-center py-xl">
                    <div className="loading-spinner mb-md" style={{ margin: '0 auto' }}></div>
                    <p style={{ color: 'var(--primary)', fontWeight: 800 }}>المكتب التنفيذي يقوم الآن بتحليل الخرائط الجغرافية...</p>
                </div>
            )}

            {!isSearching && leads.length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex align-center justify-between mb-md">
                        <h4 style={{ margin: 0 }}>📊 قائمة الفرص البيعية المستخرجة ({leads.length})</h4>
                        <button className="btn btn-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 800 }}>تصدير إلى CRM 📥</button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>الاسم التجاري</th>
                                    <th>الموقع / الحي</th>
                                    <th>الحالة</th>
                                    <th>رقم التواصل</th>
                                    <th>الإجراء التنفيذي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{lead.name}</td>
                                        <td>{lead.location}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                background: lead.status === 'Hot' ? '#FEE2E2' : '#E0F2FE',
                                                color: lead.status === 'Hot' ? '#991B1B' : '#075985'
                                            }}>
                                                {lead.status === 'Hot' ? '🔥 عميل جاد' : '💎 فرصة نمو'}
                                            </span>
                                        </td>
                                        <td>{lead.phone}</td>
                                        <td>
                                            <button className="btn btn-sm" style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px' }}>
                                                إرسال الموظف للمتابعة 🤖
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isSearching && leads.length === 0 && !isAutoMode && (
                <div style={{ padding: '3rem', background: '#F8FAFC', borderRadius: '20px', textAlign: 'center', border: '2px dashed #E2E8F0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌎</div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>أهلاً بك في نظام الاستحواذ الجغرافي. بصفتي مديرك التنفيذي، سأقوم بجلب قائمة العملاء المحتملين لك آلياً بمجرد تحديد الهدف.</p>
                </div>
            )}
        </div>
    );
};

export default SalesLeadsManager;
