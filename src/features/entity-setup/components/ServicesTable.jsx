import React from 'react';
import { Plus, Edit, Trash2, Check, X, Clock } from 'lucide-react';

const ServicesTable = ({ 
    services, 
    editingService, 
    setEditingService, 
    newService, 
    setNewService, 
    onAdd, 
    onUpdate, 
    onDelete,
    language 
}) => {
    const inpStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '8px',
        color: 'var(--color-text-main)',
        padding: '6px 10px',
        fontSize: '0.85rem',
        outline: 'none',
        boxSizing: 'border-box'
    };

    return (
        <div style={{ background: '#0D1117', borderRadius: 12, border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                    <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={{ padding: '12px 14px', color: '#A78BFA', fontWeight: 700, textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الخدمة / المنتج' : 'Service / Product'}
                        </th>
                        <th style={{ padding: '12px 14px', color: '#A78BFA', fontWeight: 700, textAlign: 'center', width: '100px' }}>
                            {language === 'ar' ? 'السعر' : 'Price'}
                        </th>
                        <th style={{ padding: '12px 14px', color: '#A78BFA', fontWeight: 700, textAlign: 'center', width: '100px' }}>
                            {language === 'ar' ? 'المدة' : 'Dur.'}
                        </th>
                        <th style={{ padding: '12px 14px', color: '#A78BFA', fontWeight: 700, textAlign: 'center', width: '100px' }}>
                            {language === 'ar' ? 'إجراءات' : 'Actions'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((svc) => (
                        <tr key={svc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                            {editingService?.id === svc.id ? (
                                <>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input style={inpStyle} value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input style={inpStyle} type="number" value={editingService.price} onChange={e => setEditingService({ ...editingService, price: e.target.value })} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input style={inpStyle} type="number" value={editingService.duration} onChange={e => setEditingService({ ...editingService, duration: e.target.value })} />
                                    </td>
                                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                            <Check size={18} color="#10B981" style={{ cursor: 'pointer' }} onClick={() => onUpdate(svc.id, editingService)} />
                                            <X size={18} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => setEditingService(null)} />
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{ padding: '12px 14px', color: 'var(--color-text-main)', fontWeight: 600 }}>{svc.name}</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10B981', fontWeight: 700 }}>${svc.price}</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                        {svc.duration} {language === 'ar' ? 'د' : 'min'}
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                            <Edit size={16} color="#8B5CF6" style={{ cursor: 'pointer' }} onClick={() => setEditingService(svc)} />
                                            <Trash2 size={16} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => onDelete(svc.id)} />
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    <tr style={{ background: 'rgba(139,92,246,0.03)' }}>
                        <td style={{ padding: '10px 14px' }}>
                            <input style={inpStyle} placeholder={language === 'ar' ? 'اسم الخدمة الجديدة...' : 'New service name...'} value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                            <input style={inpStyle} type="number" placeholder="0.00" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                            <input style={inpStyle} type="number" placeholder="60" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button onClick={onAdd} style={{ background: '#8B5CF6', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                                <Plus size={16} /> {language === 'ar' ? 'إضافة' : 'Add'}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ServicesTable;
