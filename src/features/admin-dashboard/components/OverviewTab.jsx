import React from 'react';
import { 
    Users, Bot, Calendar, Zap, TrendingUp 
} from 'lucide-react';
import { Card, StatCard } from './SharedComponents';

const OverviewTab = ({ 
    t, isEnglish, clients, agents, bookings, customRequests, pricing, sectors 
}) => {
    // Sector normalization logic
    const normalizeSector = (bt) => {
        if (!bt) return 'general';
        const map = {
            'beauty-salon': 'beauty', 'beauty': 'beauty',
            'medical-clinic': 'medical', 'dental-receptionist': 'medical', 'medical': 'medical',
            'restaurant-reservations': 'restaurant', 'restaurant': 'restaurant',
            'real-estate-marketing': 'real_estate', 'real_estate': 'real_estate',
            'gym-coordinator': 'call_center', 'gym': 'call_center',
            'support-agent': 'call_center', 'call_center': 'call_center',
            'sales-lead-gen': 'retail_ecommerce', 'retail_ecommerce': 'retail_ecommerce',
            'telecom_it': 'telecom_it', 'banking': 'banking', 'general': 'general'
        };
        return map[bt] || map[bt.toLowerCase()] || 'general';
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px' }}>
                {t('admin.overview')}
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                {isEnglish ? 'Comprehensive overview of 24Shift performance' : 'نظرة شاملة على أداء منصة 24Shift'}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.1rem', marginBottom: '2rem' }}>
                <StatCard 
                    icon={Users} 
                    label={t('admin.totalClients')} 
                    value={clients.length} 
                    color="#10B981" 
                    sub={`+${clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 3600 * 1000)).length} ${isEnglish ? 'new clients' : 'عملاء جدد'}`} 
                />
                <StatCard 
                    icon={Bot} 
                    label={isEnglish ? 'Active Agents' : 'موظفات نشطة'} 
                    value={agents.filter(a => a.status === 'active').length} 
                    color="#8B5CF6" 
                />
                <StatCard 
                    icon={Calendar} 
                    label={isEnglish ? 'Pending Bookings' : 'حجوزات معلقة'} 
                    value={bookings.filter(b => b.status === 'pending').length} 
                    color="#F59E0B" 
                    sub={isEnglish ? 'Requires review' : 'تحتاج مراجعة'} 
                />
                <StatCard 
                    icon={Zap} 
                    label={isEnglish ? 'Custom Requests' : 'طلبات التوظيف'} 
                    value={customRequests.filter(r => r.status === 'pending').length} 
                    color="#A78BFA" 
                    sub={isEnglish ? 'New lead requests' : 'طلبات توظيف جديدة'} 
                />
                {(() => {
                    const avgPrice = pricing.find(p => p.id === 'pro')?.monthlyPrice || 69;
                    const estRev = clients.length * avgPrice;
                    return (
                        <StatCard 
                            icon={TrendingUp} 
                            label={isEnglish ? 'Estimated Revenue' : 'إيراد متوقع'} 
                            value={`${estRev.toLocaleString()} $`} 
                            color="#3B82F6" 
                            sub={isEnglish ? 'Monthly Est.' : 'شهري تقديري'} 
                        />
                    );
                })()}
            </div>

            <h3 style={{ color: 'var(--color-text-main)', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>
                {isEnglish ? 'Client Sector Distribution' : 'توزيع العملاء بالقطاعات'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '1rem' }}>
                {Object.entries(sectors).map(([k, v]) => {
                    const cnt = clients.filter(c => normalizeSector(c.business_type) === k).length;
                    return (
                        <Card 
                            key={k} 
                            s={{ 
                                padding: '1rem', 
                                border: `1px solid ${v.c}30`, 
                                opacity: v.on ? 1 : 0.5,
                                background: `linear-gradient(135deg, var(--color-bg-surface), ${v.c}05)` 
                            }} 
                            c={
                                <>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{v.e}</div>
                                    <div style={{ color: v.c, fontWeight: 800, fontSize: '0.8rem', marginBottom: '4px' }}>{v.l}</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-text-main)' }}>{cnt}</div>
                                </>
                            } 
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default OverviewTab;
