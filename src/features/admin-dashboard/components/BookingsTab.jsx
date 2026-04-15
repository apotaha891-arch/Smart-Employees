import React from 'react';
import { 
    Search, Download, Check, X, Calendar 
} from 'lucide-react';
import { Card, Btn, StatusBadge } from './SharedComponents';
import { STATUS_CONFIG } from '../constants';

const BookingsTab = ({
    isEnglish, isRtl, bookings, bSearch, setBSearch, bFilter, setBFilter,
    clients, updateBookingStatus, handleExport, t
}) => {
    const baseBookings = bFilter ? bookings.filter(b => b.user_id === bFilter || b.entity_id === bFilter) : bookings;
    
    const filtBk = baseBookings.filter(b => 
        (b.customer_name || '').toLowerCase().includes(bSearch.toLowerCase()) || 
        (b.customer_phone || '').toLowerCase().includes(bSearch.toLowerCase()) ||
        (b.service_requested || '').toLowerCase().includes(bSearch.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                        {t('admin.bookings')}
                    </h1>
                    <p style={{ color: '#6B7280', margin: '3px 0 0', fontSize: '0.85rem' }}>
                        {filtBk.length} {isEnglish ? 'total matching bookings' : 'حجز مطابق للبحث'}
                    </p>
                </div>
                <Btn onClick={() => handleExport(filtBk, 'bookings')} color="#10B981">
                    <Download size={16} />
                    {isEnglish ? 'Export to Excel' : 'تصدير للطلبات'}
                </Btn>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select 
                    value={bFilter} 
                    onChange={e => setBFilter(e.target.value)} 
                    style={{ 
                        background: 'var(--color-bg-surface)', 
                        border: '1px solid var(--color-border-subtle)', 
                        borderRadius: '10px', 
                        color: 'var(--color-text-main)', 
                        padding: '10px 14px', 
                        fontSize: '0.85rem', 
                        minWidth: '220px',
                        outline: 'none'
                    }}
                >
                    <option value="">{isEnglish ? 'Filter by Client' : 'تصفية حسب العميل'}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                </select>
                
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search 
                        size={16} 
                        style={{ 
                            position: 'absolute', 
                            [isRtl ? 'right' : 'left']: '12px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: '#6B7280' 
                        }} 
                    />
                    <input 
                        value={bSearch} 
                        onChange={e => setBSearch(e.target.value)} 
                        placeholder={isEnglish ? 'Search by customer, phone or service...' : 'بحث باسم العميل، الهاتف أو الخدمة...'} 
                        style={{ 
                            width: '100%', 
                            padding: isRtl ? '10px 38px 10px 12px' : '10px 12px 10px 38px', 
                            background: 'var(--color-bg-surface)', 
                            border: '1px solid var(--color-border-subtle)', 
                            borderRadius: '10px', 
                            color: 'var(--color-text-main)', 
                            fontSize: '0.85rem',
                            outline: 'none'
                        }} 
                    />
                </div>
            </div>

            <Card s={{ padding: 0, overflow: h => 'hidden' }} c={
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Customer' : 'العميل'}</th>
                                <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Date & Time' : 'الموعد'}</th>
                                <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Service' : 'الخدمة'}</th>
                                <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Status' : 'الحالة'}</th>
                                <th style={{ padding: '1rem', color: '#6B7280', fontWeight: 700, fontSize: '0.75rem' }}>{isEnglish ? 'Actions' : 'إجراءات'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtBk.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                        {isEnglish ? 'No matching bookings found' : 'لا يوجد حجوزات مطابقة'}
                                    </td>
                                </tr>
                            ) : filtBk.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>{b.customer_name || '—'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600 }}>{b.customer_phone || '—'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                            <Calendar size={14} className="text-primary" />
                                            {b.booking_date}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>{b.booking_time}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{b.service_requested || '—'}</div>
                                        {b.price > 0 && <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800 }}>{b.price} $</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <StatusBadge 
                                            label={STATUS_CONFIG[b.status]?.l || b.status} 
                                            config={STATUS_CONFIG[b.status]} 
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {b.status === 'pending' && (
                                                <button 
                                                    onClick={() => updateBookingStatus(b.id, 'confirmed')} 
                                                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, transition: '0.2s' }}
                                                >
                                                    <Check size={14} style={{ marginRight: '4px' }} />
                                                    {isEnglish ? 'Confirm' : 'تأكيد'}
                                                </button>
                                            )}
                                            {b.status !== 'cancelled' && (
                                                <button 
                                                    onClick={() => updateBookingStatus(b.id, 'cancelled')} 
                                                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, transition: '0.2s' }}
                                                >
                                                    <X size={14} style={{ marginRight: '4px' }} />
                                                    {isEnglish ? 'Cancel' : 'إلغاء'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            } />
        </div>
    );
};

export default BookingsTab;
