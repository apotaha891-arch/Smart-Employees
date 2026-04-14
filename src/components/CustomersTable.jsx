import React, { useState } from 'react';
import {
    Search, User, Phone, Instagram, Send, MoreVertical,
    Edit2, Trash2, Calendar, FileText, Check, X
} from 'lucide-react';

const CustomersTable = ({ customers, onUpdateCustomer, onDeleteCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEdit = (customer) => {
        setEditingId(customer.id);
        setEditForm({ ...customer });
    };

    const handleSave = () => {
        onUpdateCustomer(editingId, editForm);
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const filteredCustomers = customers.filter(c =>
        (c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.customer_phone?.includes(searchTerm)) ||
        (c.instagram_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.telegram_id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'لا يوجد سجل';
        return new Date(dateString).toLocaleDateString('ar-SA');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text"
                    placeholder="بحث بالاسم، الهاتف، أو المعرف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        background: 'var(--color-bg-input)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        padding: '10px 10px 10px 40px',
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--color-bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border-subtle)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                            <th style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>العميل</th>
                            <th style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>معرفات المنصات</th>
                            <th style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>آخر زيارة</th>
                            <th style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ملاحظات</th>
                            <th style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1.2rem' }}>
                                    {editingId === customer.id ? (
                                        <input
                                            value={editForm.customer_name}
                                            onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                                            style={{ background: 'var(--color-bg-input)', border: '1px solid #8B5CF6', color: 'var(--color-text-main)', padding: '5px', borderRadius: '4px', width: '100%' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                                                <User size={16} />
                                            </div>
                                            <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{customer.customer_name || 'بدون اسم'}</span>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {customer.customer_phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                <Phone size={14} /> <span>{customer.customer_phone}</span>
                                            </div>
                                        )}
                                        {customer.instagram_id && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                <Instagram size={14} /> <span>{customer.instagram_id}</span>
                                            </div>
                                        )}
                                        {customer.telegram_id && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                <Send size={14} /> <span>{customer.telegram_id}</span>
                                            </div>
                                        )}
                                        {!customer.customer_phone && !customer.instagram_id && !customer.telegram_id && (
                                            <span style={{ color: '#4B5563', fontStyle: 'italic' }}>لا يوجد معرفات</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '1.2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} />
                                        {formatDate(customer.last_service_date)}
                                    </div>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    {editingId === customer.id ? (
                                        <textarea
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            style={{ background: 'var(--color-bg-input)', border: '1px solid #8B5CF6', color: 'var(--color-text-main)', padding: '5px', borderRadius: '4px', width: '100%', resize: 'none' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                            <FileText size={14} />
                                            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {customer.notes || 'لا يوجد ملاحظات'}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        {editingId === customer.id ? (
                                            <>
                                                <button onClick={handleSave} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10B981', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={handleCancel} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(customer)} style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', color: '#8B5CF6', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => onDeleteCustomer(customer.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#4B5563' }}>
                                    لم يتم العثور على زبائن
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomersTable;
