import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Calendar, MessageSquare, Info } from 'lucide-react';
import { getClientNotifications, markClientNotificationRead, subscribeToClientNotifications, supabase } from '../../services/supabaseService';
import { useLanguage } from '../../LanguageContext';
import { useAuth } from '../../context/AuthContext';

const NotificationCenter = ({ userId }) => {
    const { language } = useLanguage();
    const { isAgency } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        
        loadNotifications();

        // Subscribe to real-time
        const channel = subscribeToClientNotifications(userId, isAgency, (payload) => {
            console.log('New notification received:', payload);
            const newNotif = payload.new;
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            
            // Play a subtle sound or show a toast if needed
            if (Notification.permission === "granted") {
                new Notification(language === 'ar' ? newNotif.title_ar : newNotif.title_en, {
                    body: language === 'ar' ? newNotif.message_ar : newNotif.message_en,
                });
            }
        });

        // Close on click outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userId]);

    const loadNotifications = async () => {
        setLoading(true);
        const res = await getClientNotifications(userId, isAgency);
        if (res.success) {
            setNotifications(res.data || []);
            setUnreadCount(res.data?.filter(n => !n.is_read).length || 0);
        }
        setLoading(false);
    };

    const markAsRead = async (id) => {
        const res = await markClientNotificationRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        await Promise.all(unreadIds.map(id => markClientNotificationRead(id)));
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <Calendar size={16} color="#8B5CF6" />;
            case 'inquiry': return <MessageSquare size={16} color="#10B981" />;
            default: return <Info size={16} color="#3B82F6" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Bell Icon */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '10px', 
                    padding: '10px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{ 
                        position: 'absolute', 
                        top: '-5px', 
                        right: '-5px', 
                        background: '#EF4444', 
                        color: 'var(--color-text-main)', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        border: '2px solid #0B0F19',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{ 
                    position: 'absolute', 
                    top: '55px', 
                    right: language === 'ar' ? 'auto' : '0',
                    left: language === 'ar' ? '0' : 'auto',
                    width: '350px', 
                    maxHeight: '500px',
                    background: 'var(--color-bg-input)', 
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280' }}>
                                <Bell size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                <div style={{ fontSize: '0.9rem' }}>{language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</div>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                    style={{ 
                                        padding: '15px 20px', 
                                        borderBottom: '1px solid var(--color-border-subtle)',
                                        background: n.is_read ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        position: 'relative'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(139, 92, 246, 0.08)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(139, 92, 246, 0.05)'}
                                >
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '8px', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: n.is_read ? '#E5E7EB' : 'white' }}>
                                                    {language === 'ar' ? n.title_ar : n.title_en}
                                                </div>
                                                {isAgency && n.metadata?.business_name && (
                                                    <span style={{ 
                                                        fontSize: '0.6rem', 
                                                        background: 'rgba(139, 92, 246, 0.2)', 
                                                        color: '#C4B5FD', 
                                                        padding: '1px 5px', 
                                                        borderRadius: '4px',
                                                        fontWeight: 600
                                                    }}>
                                                        {n.metadata.business_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                                {language === 'ar' ? n.message_ar : n.message_en}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: '6px' }}>
                                                {formatDate(n.created_at)}
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6', marginTop: '5px' }}></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.75rem', cursor: 'default' }}>
                            {language === 'ar' ? 'عرض السجل الكامل' : 'View all history'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
