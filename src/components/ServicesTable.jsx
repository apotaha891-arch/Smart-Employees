import React from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const ServicesTable = ({
    services,
    editingService,
    setEditingService,
    newService,
    setNewService,
    onAdd,
    onUpdate,
    onDelete
}) => {
    return (
        <div style={{ background: '#0B0F19', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#1F2937', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>الخدمة</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>السعر (ريال)</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>المدة (دقيقة)</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((service) => (
                        <tr key={service.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {editingService?.id === service.id ? (
                                <>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="text"
                                            value={editingService.service_name}
                                            onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
                                            style={{ background: '#1F2937', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="number"
                                            value={editingService.price}
                                            onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                                            style={{ background: '#1F2937', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="number"
                                            value={editingService.duration_minutes}
                                            onChange={(e) => setEditingService({ ...editingService, duration_minutes: e.target.value })}
                                            style={{ background: '#1F2937', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => onUpdate(service.id)}
                                            style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginLeft: '8px' }}
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditingService(null)}
                                            style={{ background: '#6B7280', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{ padding: '1rem' }}>{service.service_name}</td>
                                    <td style={{ padding: '1rem' }}>{service.price}</td>
                                    <td style={{ padding: '1rem' }}>{service.duration_minutes}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setEditingService(service)}
                                            style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginLeft: '8px' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(service.id)}
                                            style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    {/* Add New Service Row */}
                    <tr style={{ background: '#1F2937' }}>
                        <td style={{ padding: '1rem' }}>
                            <input
                                type="text"
                                placeholder="اسم الخدمة"
                                value={newService.service_name}
                                onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                            />
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <input
                                type="number"
                                placeholder="السعر"
                                value={newService.price}
                                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                            />
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <input
                                type="number"
                                placeholder="المدة"
                                value={newService.duration_minutes}
                                onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '6px', width: '100%' }}
                            />
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button
                                onClick={onAdd}
                                style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                            >
                                <Plus size={16} /> إضافة
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ServicesTable;
