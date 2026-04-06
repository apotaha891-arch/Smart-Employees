import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { updateBooking, cancelBooking, supabase } from '../services/supabaseService';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';

const Bookings = () => {
    const { t } = useLanguage();
    const { user: contextUser } = useAuth(); // Use AuthContext — respects impersonation
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entityId, setEntityId] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
        phone: ''
    });

    // Re-run when impersonated user changes
    useEffect(() => {
        if (contextUser?.id) {
            loadUserAndBookings();
        }
    }, [contextUser?.id]);

    useEffect(() => {
        if (entityId) {
            loadBookings();
        }
    }, [entityId, filters]);

    const loadUserAndBookings = async () => {
        try {
            // Use contextUser.id — correctly reflects impersonated client
            const userId = contextUser?.id;
            if (!userId) return;

            // Get entity for THIS specific user only (not all entities!)
            const { data: entity } = await supabase
                .from('entities')
                .select('id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (entity?.id) {
                setEntityId(entity.id);
            } else {
                // No entity found for this client — show empty bookings
                setBookings([]);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error loading user/entity:', error);
            setLoading(false);
        }
    };

    const loadBookings = async () => {
        setLoading(true);
        try {
            // CRITICAL: Filter by entity_id — only show bookings for THIS client
            let query = supabase
                .from('bookings')
                .select('*')
                .eq('entity_id', entityId) // ← isolates data per client
                .order('booking_date', { ascending: false })
                .order('booking_time', { ascending: true });

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.date) query = query.eq('booking_date', filters.date);
            if (filters.phone) query = query.ilike('customer_phone', `%${filters.phone}%`);

            const { data, error } = await query;
            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
        setLoading(false);
    };


    const handleStatusChange = async (bookingId, newStatus) => {
        const result = await updateBooking(bookingId, { status: newStatus });
        if (result.success) {
            // Send confirmation/cancellation to customer via Telegram
            if (newStatus === 'confirmed' || newStatus === 'cancelled') {
                const booking = bookings.find(b => b.id === bookingId);
                
                // Only send if booking came from Telegram (has telegram_ session_id)
                if (booking?.session_id?.startsWith('telegram_') && booking?.agent_id) {
                    try {
                        const chatId = booking.session_id.replace('telegram_', '');
                        
                        // Get the bot token
                        const { data: agent } = await supabase
                            .from('agents')
                            .select('telegram_token, user_id')
                            .eq('id', booking.agent_id)
                            .single();

                        let botToken = agent?.telegram_token;
                        if (!botToken && agent?.user_id) {
                            const { data: sc } = await supabase.from('entities')
                                .select('telegram_token')
                                .eq('user_id', agent.user_id)
                                .order('created_at', { ascending: false })
                                .limit(1).maybeSingle();
                            botToken = sc?.telegram_token;
                        }

                        if (botToken && chatId) {
                            const msg = newStatus === 'confirmed'
                                ? `✅ تم تأكيد حجزك!\n\n📋 ${booking.service_requested}\n📅 ${booking.booking_date}\n🕐 ${booking.booking_time?.substring(0, 5)}\n\nنتطلع لخدمتك! 💜`
                                : `❌ عذراً، تم إلغاء حجزك.\n\n📋 ${booking.service_requested}\n📅 ${booking.booking_date}\n\nيمكنك الحجز مجدداً في أي وقت.`;

                            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: chatId, text: msg })
                            });
                            console.log(`✅ ${newStatus} notification sent to Telegram:`, chatId);
                        }
                    } catch (err) {
                        console.error('Notification error (non-blocking):', err);
                    }
                }
            }
            loadBookings();
        } else {
            alert(t('failedUpdateStatus') + result.error);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm(t('confirmDeleteCustomer'))) return;

        const result = await cancelBooking(bookingId);
        if (result.success) {
            loadBookings();
        } else {
            alert(t('failedCancelBooking') + result.error);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: '#F59E0B', icon: AlertCircle, label: t('pendingStatus') },
            confirmed: { color: '#3B82F6', icon: CheckCircle, label: t('confirmedStatus') },
            completed: { color: '#10B981', icon: CheckCircle, label: t('completedStatus') },
            cancelled: { color: '#EF4444', icon: XCircle, label: t('cancelledStatus') }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: `${config.color}20`,
                color: config.color,
                fontSize: '0.85rem',
                fontWeight: 600
            }}>
                <Icon size={14} />
                {config.label}
            </span>
        );
    };

    return (
        <div style={{ padding: '2rem', background: '#0B0F19', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('bookingsTitle')}</h1>
                    <p style={{ color: '#9CA3AF' }}>{t('bookingsSubtitle')}</p>
                </div>

                {/* Filters */}
                <div style={{
                    background: '#111827',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                            <Filter size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                            {t('statusLabel')}
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        >
                            <option value="" style={{ color: 'white', background: '#1F2937' }}>{t('allStatus')}</option>
                            <option value="pending" style={{ color: 'white', background: '#1F2937' }}>{t('pendingStatus')}</option>
                            <option value="confirmed" style={{ color: 'white', background: '#1F2937' }}>{t('confirmedStatus')}</option>
                            <option value="completed" style={{ color: 'white', background: '#1F2937' }}>{t('completedStatus')}</option>
                            <option value="cancelled" style={{ color: 'white', background: '#1F2937' }}>{t('cancelledStatus')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                            <Calendar size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                            {t('dateLabel')}
                        </label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                            <Phone size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                            {t('phoneLabel')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('phoneSearch')}
                            value={filters.phone}
                            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#1F2937',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>

                {/* Bookings Table */}
                <div style={{ background: '#111827', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>{t('loading')}</div>
                    ) : bookings.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>{t('noBookings')}</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1F2937', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>{t('clientLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>{t('serviceLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>{t('dateLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>{t('timeLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>{t('durationLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>{t('statusLabel')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>{t('actionsLabel')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} color="#9CA3AF" />
                                                <div>
                                                    <div>{booking.customer_name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{booking.customer_phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{booking.service_requested || booking.service?.service_name || t('notSpecified')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} color="#9CA3AF" />
                                                {new Date(booking.booking_date).toLocaleDateString('ar-SA')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} color="#9CA3AF" />
                                                {booking.booking_time}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{booking.duration_minutes} {t('minutes')}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                        style={{
                                                            background: '#10B981',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            marginLeft: '8px',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {t('confirmBooking')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        style={{
                                                            background: '#EF4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {t('cancelBooking')}
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStatusChange(booking.id, 'completed')}
                                                    style={{
                                                        background: '#3B82F6',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {t('completeBooking')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Bookings;
