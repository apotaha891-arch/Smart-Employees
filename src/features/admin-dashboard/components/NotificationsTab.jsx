import React from 'react';
import { 
    Bell, Check 
} from 'lucide-react';
import { Card } from './SharedComponents';
import * as adminService from '../../../services/adminService';

const NotificationsTab = ({
    isEnglish, isRtl, notifications, setNotifications, 
    notifTypeFilter, setNotifTypeFilter, notifClientFilter, setNotifClientFilter,
    clients, t
}) => {
    const filteredNotifications = notifications.filter(n => {
        const matchesClient = !notifClientFilter || n.user_id === notifClientFilter;
        const matchesType = !notifTypeFilter || n.type === notifTypeFilter;
        return matchesClient && matchesType;
    });

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
                {t('admin.notifications')}
            </h1>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <select 
                    value={notifClientFilter} 
                    onChange={e => setNotifClientFilter(e.target.value)} 
                    style={{ 
                        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', 
                        borderRadius: '10px', color: 'var(--color-text-main)', padding: '10px 14px', 
                        fontSize: '0.85rem', minWidth: '220px', outline: 'none'
                    }}
                >
                    <option value="">{isEnglish ? 'Filter by Client' : 'كل العملاء'}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                </select>
                <select 
                    value={notifTypeFilter} 
                    onChange={e => setNotifTypeFilter(e.target.value)} 
                    style={{ 
                        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', 
                        borderRadius: '10px', color: 'var(--color-text-main)', padding: '10px 14px', 
                        fontSize: '0.85rem', minWidth: '220px', outline: 'none'
                    }}
                >
                    <option value="">{isEnglish ? 'All Types' : 'كل الأنواع'}</option>
                    <option value="new_booking">{isEnglish ? 'Bookings' : 'حجوزات جديدة'}</option>
                    <option value="booking_update">{isEnglish ? 'Updates' : 'تحديثات الحجوزات'}</option>
                    <option value="new_chat">{isEnglish ? 'Chats' : 'محادثات جديدة'}</option>
                    <option value="custom_request">{isEnglish ? 'Custom Req' : 'طلبات مخصصة'}</option>
                    <option value="wallet">{isEnglish ? 'Wallet' : 'تنبيهات المحفظة'}</option>
                    <option value="system">{isEnglish ? 'System' : 'تنبيهات النظام'}</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredNotifications.length === 0 ? (
                    <Card c={
                        <div style={{ textAlign: 'center', color: '#6B7280', padding: '4rem' }}>
                            {t('admin.noNotifications')}
                        </div>
                    } />
                ) : (
                    filteredNotifications.map(n => (
                        <Card 
                            key={n.id} 
                            s={{ 
                                background: n.is_read ? 'var(--color-bg-surface)' : 'rgba(139,92,246,0.06)', 
                                borderLeft: n.is_read ? '1px solid var(--color-border-subtle)' : '4px solid #8B5CF6',
                                transition: 'all 0.2s'
                            }} 
                            c={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '44px', height: '44px', borderRadius: '50%', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}>
                                            <Bell size={20} color={n.is_read ? '#6B7280' : '#8B5CF6'} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>{n.title}</div>
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</div>
                                            <div style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: '6px', fontWeight: 600 }}>
                                                {new Date(n.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}
                                            </div>
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <button 
                                            onClick={() => adminService.markNotificationAsRead(n.id).then(() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)))} 
                                            style={{ 
                                                background: 'rgba(139, 92, 246, 0.12)', border: 'none', color: '#8B5CF6', 
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, 
                                                padding: '6px 14px', borderRadius: '8px', transition: 'all 0.2s' 
                                            }}
                                        >
                                            {t('admin.markRead')}
                                        </button>
                                    )}
                                </div>
                            } 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsTab;
