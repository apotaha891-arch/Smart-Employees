import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, Clock, DollarSign, ChevronDown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

// Service types/roles — price & duration are not always needed
const SERVICE_TYPES = {
    booking: { labelAr: 'حجز / موعد', labelEn: 'Booking / Appointment', needsPrice: true, needsDuration: true },
    product: { labelAr: 'منتج / سلعة', labelEn: 'Product / Item', needsPrice: true, needsDuration: false },
    inquiry: { labelAr: 'استفسار / معلومات', labelEn: 'Inquiry / Info', needsPrice: false, needsDuration: false },
    task: { labelAr: 'مهمة / إجراء', labelEn: 'Task / Action', needsPrice: false, needsDuration: false },
    subscription: { labelAr: 'اشتراك / باقة', labelEn: 'Subscription / Package', needsPrice: true, needsDuration: false },
};

const inp = {
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-main)', padding: '7px 10px', borderRadius: '7px', width: '100%',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
};

const ServicesTable = ({
    services,
    editingService,
    setEditingService,
    newService,
    setNewService,
    onAdd,
    onUpdate,
    onDelete,
}) => {
    const { language } = useLanguage();
    const [showTypeHint, setShowTypeHint] = useState(false);

    // Determine which columns to show based on what services actually use
    const hasAnyPrice = services.some(s => s.price);
    const hasAnyDuration = services.some(s => s.duration_minutes);

    const currentType = SERVICE_TYPES[newService.service_type] || SERVICE_TYPES.booking;
    const showNewPrice = currentType.needsPrice;
    const showNewDuration = currentType.needsDuration;

    const th = { padding: '0.75rem 1rem', textAlign: language === 'ar' ? 'right' : 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' };
    const td = { padding: '0.75rem 1rem', color: 'var(--color-text-main)', fontSize: '0.9rem', verticalAlign: 'middle' };

    return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', marginBottom: '1.5rem' }}>
            {/* Column legend / type picker hint */}
            <div style={{ background: 'var(--color-bg-surface)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>
                    {language === 'ar'
                        ? '💡 السعر والمدة اختياريان ويُحدَّدان حسب نوع الخدمة'
                        : '💡 Price & duration are optional — set per service type'}
                </span>
                <button
                    onClick={() => setShowTypeHint(p => !p)}
                    style={{ background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: 99, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {language === 'ar' ? 'أنواع الخدمات' : 'Service Types'} <ChevronDown size={12} />
                </button>
            </div>

            {/* Type hint panel */}
            {showTypeHint && (
                <div style={{ background: '#0B0F19', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(SERVICE_TYPES).map(([key, def]) => (
                        <span key={key} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {language === 'ar' ? def.labelAr : def.labelEn}
                            {def.needsPrice ? ' · 💰' : ''}
                            {def.needsDuration ? ' · ⏱' : ''}
                        </span>
                    ))}
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={th}>{language === 'ar' ? 'الخدمة / المنتج' : 'Service / Product'}</th>
                        <th style={th}>{language === 'ar' ? 'النوع' : 'Type'}</th>
                        {hasAnyPrice && <th style={th}>{language === 'ar' ? 'السعر' : 'Price'}</th>}
                        {hasAnyDuration && <th style={th}>{language === 'ar' ? 'المدة' : 'Duration'}</th>}
                        <th style={{ ...th, textAlign: 'center' }}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map(service => {
                        const stype = SERVICE_TYPES[service.service_type] || SERVICE_TYPES.booking;
                        return (
                            <tr key={service.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                {editingService?.id === service.id ? (
                                    <>
                                        <td style={td}>
                                            <input type="text" value={editingService.service_name}
                                                onChange={e => setEditingService({ ...editingService, service_name: e.target.value })}
                                                style={inp} />
                                        </td>
                                        <td style={td}>
                                            <select value={editingService.service_type || 'booking'}
                                                onChange={e => setEditingService({ ...editingService, service_type: e.target.value })}
                                                style={{ ...inp, appearance: 'none' }}>
                                                {Object.entries(SERVICE_TYPES).map(([key, def]) => (
                                                    <option key={key} value={key}>{language === 'ar' ? def.labelAr : def.labelEn}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {hasAnyPrice && (
                                            <td style={td}>
                                                {stype.needsPrice
                                                    ? <input type="number" value={editingService.price || ''}
                                                        onChange={e => setEditingService({ ...editingService, price: e.target.value })}
                                                        style={inp} placeholder="—" />
                                                    : <span style={{ color: '#4B5563' }}>—</span>}
                                            </td>
                                        )}
                                        {hasAnyDuration && (
                                            <td style={td}>
                                                {stype.needsDuration
                                                    ? <input type="number" value={editingService.duration_minutes || ''}
                                                        onChange={e => setEditingService({ ...editingService, duration_minutes: e.target.value })}
                                                        style={inp} placeholder="—" />
                                                    : <span style={{ color: '#4B5563' }}>—</span>}
                                            </td>
                                        )}
                                        <td style={{ ...td, textAlign: 'center' }}>
                                            <button onClick={() => onUpdate(service.id)}
                                                style={{ background: '#10B981', color: 'var(--color-text-main)', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', marginLeft: 6 }}>
                                                <Save size={14} />
                                            </button>
                                            <button onClick={() => setEditingService(null)}
                                                style={{ background: '#374151', color: 'var(--color-text-main)', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>
                                                <X size={14} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ ...td, fontWeight: 600 }}>{service.service_name}</td>
                                        <td style={td}>
                                            <span style={{ background: 'rgba(99,102,241,0.12)', color: '#A5B4FC', padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem' }}>
                                                {language === 'ar' ? stype.labelAr : stype.labelEn}
                                            </span>
                                        </td>
                                        {hasAnyPrice && <td style={td}>{service.price ? `${service.price} ${language === 'ar' ? 'ر.س' : 'SAR'}` : <span style={{ color: '#4B5563' }}>—</span>}</td>}
                                        {hasAnyDuration && <td style={td}>{service.duration_minutes ? `${service.duration_minutes} ${language === 'ar' ? 'د' : 'min'}` : <span style={{ color: '#4B5563' }}>—</span>}</td>}
                                        <td style={{ ...td, textAlign: 'center' }}>
                                            <button onClick={() => setEditingService(service)}
                                                style={{ background: '#3B82F6', color: 'var(--color-text-main)', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', marginLeft: 6 }}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => onDelete(service.id)}
                                                style={{ background: '#EF4444', color: 'var(--color-text-main)', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}

                    {/* ── Add new service row ── */}
                    <tr style={{ background: 'var(--color-bg-surface)', borderTop: '2px solid rgba(99,102,241,0.15)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                            <input type="text"
                                placeholder={language === 'ar' ? 'اسم الخدمة / المنتج' : 'Service / product name'}
                                value={newService.service_name}
                                onChange={e => setNewService({ ...newService, service_name: e.target.value })}
                                style={inp} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                            <select value={newService.service_type || 'booking'}
                                onChange={e => setNewService({ ...newService, service_type: e.target.value })}
                                style={{ ...inp, appearance: 'none' }}>
                                {Object.entries(SERVICE_TYPES).map(([key, def]) => (
                                    <option key={key} value={key}>{language === 'ar' ? def.labelAr : def.labelEn}</option>
                                ))}
                            </select>
                        </td>
                        {hasAnyPrice && (
                            <td style={{ padding: '0.75rem 1rem' }}>
                                {showNewPrice
                                    ? <input type="number" placeholder={language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
                                        value={newService.price}
                                        onChange={e => setNewService({ ...newService, price: e.target.value })}
                                        style={inp} />
                                    : <span style={{ color: '#4B5563', padding: '7px 0', display: 'block', fontSize: '0.85rem' }}>—</span>}
                            </td>
                        )}
                        {hasAnyDuration && (
                            <td style={{ padding: '0.75rem 1rem' }}>
                                {showNewDuration
                                    ? <input type="number" placeholder={language === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}
                                        value={newService.duration_minutes}
                                        onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })}
                                        style={inp} />
                                    : <span style={{ color: '#4B5563', padding: '7px 0', display: 'block', fontSize: '0.85rem' }}>—</span>}
                            </td>
                        )}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button onClick={onAdd}
                                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'var(--color-text-main)', border: 'none', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.85rem' }}>
                                <Plus size={15} /> {language === 'ar' ? 'إضافة' : 'Add'}
                            </button>
                        </td>
                    </tr>

                    {/* Show price/duration columns on first add if nothing yet */}
                    {services.length === 0 && !hasAnyPrice && (
                        <tr style={{ background: '#0d1117' }}>
                            <td colSpan={3} style={{ padding: '0.5rem 1rem' }}>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {showNewPrice && (
                                        <input type="number" placeholder={language === 'ar' ? 'السعر (اختياري)' : 'Price (optional)'}
                                            value={newService.price}
                                            onChange={e => setNewService({ ...newService, price: e.target.value })}
                                            style={{ ...inp, flex: 1 }} />
                                    )}
                                    {showNewDuration && (
                                        <input type="number" placeholder={language === 'ar' ? 'المدة بالدقائق (اختياري)' : 'Duration in minutes (optional)'}
                                            value={newService.duration_minutes}
                                            onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })}
                                            style={{ ...inp, flex: 1 }} />
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ServicesTable;
