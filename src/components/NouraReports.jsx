import React, { useState, useEffect } from 'react';

const ExecutiveReports = () => {
    const [reports, setReports] = useState([
        {
            id: 'STR-001',
            date: '2026-02-08',
            title: 'تقرير استحقاق المبيعات التنفيذي',
            leadsFound: 42,
            growthRate: '+15%',
            status: 'Done',
            summary: 'تم مسح النطاق الجغرافي بنجاح. تم تحديد 12 عميل جاد (Hot Leads) يوصي المكتب التنفيذي بالتواصل معهم فوراً.'
        },
        {
            id: 'STR-002',
            date: '2026-02-07',
            title: 'تحليل الفرص الاستراتيجية',
            leadsFound: 18,
            growthRate: '+5%',
            status: 'Old',
            summary: 'رصد تزايد في الطلب القطاعي. يوصي المدير التنفيذي بتوسيع نطاق الجلب ليشمل الأحياء المجاورة.'
        }
    ]);

    const [isGenerating, setIsGenerating] = useState(false);

    const generateNewReport = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const newReport = {
                id: `STR-00${reports.length + 1}`,
                date: new Date().toISOString().split('T')[0],
                title: 'تقرير ذكاء الأعمال المحدث',
                leadsFound: Math.floor(Math.random() * 50) + 10,
                growthRate: '+12%',
                status: 'New',
                summary: 'قام نظام الأتمتة التنفيذي برصد تحركات جديدة في السوق. تم تحديث قوائم الاستحواذ بنجاح.'
            };
            setReports([newReport, ...reports]);
            setIsGenerating(false);
        }, 3000);
    };

    return (
        <div className="card p-xl animate-fade-in" style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
            <div className="flex align-center justify-between mb-xl">
                <div className="flex align-center gap-md">
                    <div style={{ width: '50px', height: '50px', background: '#0F172A', color: 'var(--accent)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👔</div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.2rem' }}>مركز التقارير الاستراتيجية (CEO)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>تحليلات الأداء والنمو الصادرة عن المدير التنفيذي</p>
                    </div>
                </div>
                <button
                    onClick={generateNewReport}
                    className="btn btn-sm"
                    disabled={isGenerating}
                    style={{ background: '#0F172A', color: 'white', fontWeight: 700 }}
                >
                    {isGenerating ? 'جاري التحليل...' : 'إصدار تقرير استراتيجي 📑'}
                </button>
            </div>

            <div className="grid grid-2 gap-md">
                {reports.map((report, i) => (
                    <div key={i} className="p-lg" style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', position: 'relative' }}>
                        {report.status === 'New' && (
                            <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--accent)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900 }}>سري ✦</span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{report.date} | {report.id}</div>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '1.05rem', color: '#0F172A' }}>{report.title}</h4>
                        <div className="flex gap-md mb-md">
                            <div style={{ textAlign: 'center', flex: 1, background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #EDF2F7' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>فرص مكتشفة</div>
                                <div style={{ fontWeight: 800, color: 'var(--success)' }}>{report.leadsFound}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1, background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #EDF2F7' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>معدل النمو</div>
                                <div style={{ fontWeight: 800, color: '#D4AF37' }}>{report.growthRate}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            {report.summary}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExecutiveReports;
