import React, { useState, useEffect } from 'react';
import { getBookings, updateBooking, cancelBooking, getCurrentUser, supabase } from '../services/supabaseService';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salonConfigId, setSalonConfigId] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
        phone: ''
    });

    useEffect(() => {
        loadUserAndBookings();
    }, []);

    useEffect(() => {
        if (salonConfigId) {
            loadBookings();
        }
    }, [salonConfigId, filters]);

    const loadUserAndBookings = async () => {
        try {
            const { user } = await getCurrentUser();
            if (!user) {
                alert('يرجى تسجيل الدخول أولاً');
                return;
            }

            // Fetch the active salon config for this user
            const { data: configs, error } = await supabase
                .from('salon_configs')
                .select('id')
                .eq('user_id', user.id)
                .is('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('Error fetching salon config:', error);
                return;
            }

            if (configs) {
                setSalonConfigId(configs.id);
            } else {
                alert('يرجى إكمال إعداد المنشأة أولاً');
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const loadBookings = async () => {
        setLoading(true);
        const result = await getBookings(salonConfigId, filters);
        if (result.success) {
            setBookings(result.data || []);
        } else {
            alert('فشل في تحميل الحجوزات: ' + result.error);
        }
        setLoading(false);
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        const result = await updateBooking(bookingId, { status: newStatus });
        if (result.success) {
            loadBookings();
        } else {
            alert('فشل في تحديث الحالة: ' + result.error);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;

        const result = await cancelBooking(bookingId);
        if (result.success) {
            loadBookings();
        } else {
            alert('فشل في إلغاء الحجز: ' + result.error);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: '#F59E0B', icon: AlertCircle, label: 'قيد الانتظار' },
            confirmed: { color: '#3B82F6', icon: CheckCircle, label: 'مؤكد' },
            completed: { color: '#10B981', icon: CheckCircle, label: 'مكتمل' },
            cancelled: { color: '#EF4444', icon: XCircle, label: 'ملغي' }
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>إدارة الحجوزات</h1>
                    <p style={{ color: '#9CA3AF' }}>عرض وإدارة جميع حجوزات العملاء</p>
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
                            الحالة
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
                            <option value="">الكل</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                            <Calendar size={16} style={{ display: 'inline', marginLeft: '6px' }} />
                            التاريخ
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
                            رقم الهاتف
                        </label>
                        <input
                            type="text"
                            placeholder="بحث برقم الهاتف..."
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
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>جاري التحميل...</div>
                    ) : bookings.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>لا توجد حجوزات</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1F2937', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>العميل</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>الخدمة</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>التاريخ</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>الوقت</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>المدة</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>الحالة</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>الإجراءات</th>
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
                                        <td style={{ padding: '1rem' }}>{booking.service?.service_name || 'غير محدد'}</td>
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
                                        <td style={{ padding: '1rem' }}>{booking.duration_minutes} دقيقة</td>
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
                                                        تأكيد
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
                                                        إلغاء
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
                                                    إكمال
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
