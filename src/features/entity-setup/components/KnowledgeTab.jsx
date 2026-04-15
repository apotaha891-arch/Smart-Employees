import React from 'react';
import { 
    Briefcase, Target, BookOpen, Calendar as CalendarIcon, 
    Sparkles, Clock, Trash2, MessageCircle, Save 
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const KnowledgeTab = ({
    language,
    t,
    formData,
    setFormData,
    services,
    editingService,
    setEditingService,
    newService,
    setNewService,
    handleAddService,
    handleUpdateService,
    handleDeleteService,
    newFaq,
    setNewFaq,
    handleSave,
    loading
}) => {
    const inpStyle = {
        width: '100%',
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '10px',
        color: 'var(--color-text-main)',
        padding: '10px 14px',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    };

    const daysAr = { Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Services Section */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                    <Briefcase size={20} color="#8B5CF6" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('servicesCatalog') || (language === 'ar' ? 'قائمة الخدمات والأسعار' : 'Services & Pricing')}</h3>
                </div>
                <ServicesTable
                    services={services}
                    editingService={editingService}
                    setEditingService={setEditingService}
                    newService={newService}
                    setNewService={setNewService}
                    onAdd={handleAddService}
                    onUpdate={handleUpdateService}
                    onDelete={handleDeleteService}
                    language={language}
                />
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '2rem' }}>
                {/* 2. Business Knowledge Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                            <Target size={18} color="#8B5CF6" />
                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'مهمة المنشأة والجمهور المستهدف' : 'Mission & Audience'}</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: 6 }}>{language === 'ar' ? 'رسالة المنشأة (لماذا نحن هنا؟)' : 'Business Mission'}</label>
                                <textarea style={{ ...inpStyle, minHeight: 60 }} placeholder={language === 'ar' ? 'مثال: تقديم أفضل خدمات العناية بالبشرة بأحدث التقنيات...' : 'e.g. Provide best skincare using latest tech...'} 
                                    value={formData.mission_statement || ''} onChange={e => setFormData({...formData, mission_statement: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: 6 }}>{language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</label>
                                <input style={inpStyle} placeholder={language === 'ar' ? 'مثال: سيدات الأعمال، المهتمين بالجمال...' : 'e.g. Business women, beauty enthusiasts...'} 
                                    value={formData.target_audience || ''} onChange={e => setFormData({...formData, target_audience: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                            <BookOpen size={18} color="#8B5CF6" />
                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'دليل إجراءات العمل (SOPs)' : 'Operating Procedures (SOPs)'}</h4>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                            {language === 'ar' ? 'أعطِ تعليمات واضحة للموظف حول كيفية التصرف في حالات معينة (مثل الخصومات، الإرجاع، المواعيد المستعجلة).' : 'Give clear instructions on how to handle specific cases (e.g. discounts, cancellations, urgent cues).'}
                        </p>
                        <textarea style={{ ...inpStyle, minHeight: 180, border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(17, 24, 39, 0.4)' }} 
                            placeholder={language === 'ar' ? 'مثال: إذا طلب العميل خصماً، قم بإبلاغه بوجود باقات التوفير...' : 'e.g. If client asks for discount, tell them about saving bundles...'} 
                            value={formData.sop_instructions || ''} onChange={e => setFormData({...formData, sop_instructions: e.target.value})} />
                    </div>

                    {/* Booking Confirmation Toggle */}
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CalendarIcon size={18} color="#F59E0B" />
                                <div>
                                    <h4 style={{ margin: 0 }}>{language === 'ar' ? 'تأكيد الحجوزات يدوياً' : 'Manual Booking Confirmation'}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                                        {language === 'ar' 
                                            ? 'عند التفعيل: الحجوزات تكون مبدئية وتحتاج تأكيدك. الموظف سيُبلغ العميل بأن الحجز مبدئي وسيصله تأكيد لاحقاً.' 
                                            : 'When enabled: Bookings are preliminary and need your approval. The agent will inform the customer that a confirmation will be sent.'}
                                    </p>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                                <input type="checkbox" checked={formData.booking_requires_confirmation || false} 
                                    onChange={e => setFormData({...formData, booking_requires_confirmation: e.target.checked})}
                                    style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    background: formData.booking_requires_confirmation ? '#F59E0B' : '#374151',
                                    borderRadius: 26, transition: '0.3s',
                                }} />
                                <span style={{
                                    position: 'absolute', height: 20, width: 20, 
                                    left: formData.booking_requires_confirmation ? 26 : 4, bottom: 3,
                                    background: 'white', borderRadius: '50%', transition: '0.3s',
                                }} />
                            </label>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                            <Sparkles size={18} color="#8B5CF6" />
                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions'}</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(formData.faq_data || []).map((faq, idx) => (
                                <div key={idx} style={{ padding: 10, background: 'var(--color-bg-surface)', borderRadius: 8, borderLeft: '3px solid #8B5CF6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '0.85rem' }}>{faq.q}</strong>
                                        <Trash2 size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => setFormData({...formData, faq_data: formData.faq_data.filter((_, i) => i !== idx)})} />
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{faq.a}</p>
                                </div>
                            ))}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                <input style={inpStyle} placeholder={language === 'ar' ? 'السؤال...' : 'Question...'} 
                                    value={newFaq?.q || ''} onChange={e => setNewFaq({...newFaq, q: e.target.value})} />
                                <textarea style={inpStyle} placeholder={language === 'ar' ? 'الإجابة...' : 'Answer...'} 
                                    value={newFaq?.a || ''} onChange={e => setNewFaq({...newFaq, a: e.target.value})} />
                                <button onClick={() => {
                                    if (newFaq.q && newFaq.a) {
                                        setFormData({...formData, faq_data: [...(formData.faq_data || []), newFaq]});
                                        setNewFaq({ q: '', a: '' });
                                    }
                                }} style={{ padding: 8, background: '#374151', border: 'none', borderRadius: 8, color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    {language === 'ar' ? '+ إضافة سؤال' : '+ Add Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Side Panel (Hours & Brand Voice) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Clock size={18} color="#8B5CF6" />
                                <h4 style={{ margin: 0 }}>{language === 'ar' ? 'أوقات العمل' : 'Working Hours'}</h4>
                            </div>
                            <button 
                                onClick={() => {
                                    const wh = { ...(formData.workingHours || {}) };
                                    if (!wh.days) {
                                        const baseShifts = wh.shifts || [{ start: wh.start || '09:00', end: wh.end || '22:00' }];
                                        wh.days = {
                                            Sunday: { active: true, shifts: JSON.parse(JSON.stringify(baseShifts)) },
                                            Monday: { active: true, shifts: JSON.parse(JSON.stringify(baseShifts)) },
                                            Tuesday: { active: true, shifts: JSON.parse(JSON.stringify(baseShifts)) },
                                            Wednesday: { active: true, shifts: JSON.parse(JSON.stringify(baseShifts)) },
                                            Thursday: { active: true, shifts: JSON.parse(JSON.stringify(baseShifts)) },
                                            Friday: { active: false, shifts: [{ start: '16:00', end: '22:00' }] },
                                            Saturday: { active: false, shifts: [{ start: '14:00', end: '22:00' }] }
                                        };
                                    }
                                    setFormData({...formData, workingHours: {...wh, isCustom: !wh.isCustom}});
                                }}
                                style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                                {formData.workingHours?.isCustom 
                                    ? (language === 'ar' ? 'أوقات موحدة' : 'Fixed Hours') 
                                    : (language === 'ar' ? 'تخصيص بالأيام' : 'Custom by Day')}
                            </button>
                        </div>
                        
                        {!formData.workingHours?.isCustom ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(formData.workingHours?.shifts || [{ start: '09:00', end: '22:00' }]).map((shift, sIdx) => (
                                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: 4 }}>{language === 'ar' ? `وقت البدء (${sIdx + 1})` : `Start Time (${sIdx + 1})`}</label>
                                            <input type="time" style={inpStyle} value={shift.start} onChange={e => {
                                                const newShifts = [...(formData.workingHours.shifts || [])];
                                                newShifts[sIdx] = { ...shift, start: e.target.value };
                                                setFormData({ ...formData, workingHours: { ...formData.workingHours, shifts: newShifts } });
                                            }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: 4 }}>{language === 'ar' ? `وقت الانتهاء (${sIdx + 1})` : `End Time (${sIdx + 1})`}</label>
                                            <input type="time" style={inpStyle} value={shift.end} onChange={e => {
                                                const newShifts = [...(formData.workingHours.shifts || [])];
                                                newShifts[sIdx] = { ...shift, end: e.target.value };
                                                setFormData({ ...formData, workingHours: { ...formData.workingHours, shifts: newShifts } });
                                            }} />
                                        </div>
                                        {sIdx > 0 && (
                                            <Trash2 size={16} color="#EF4444" style={{ cursor: 'pointer', marginTop: 18 }} onClick={() => {
                                                const newShifts = formData.workingHours.shifts.filter((_, i) => i !== sIdx);
                                                setFormData({ ...formData, workingHours: { ...formData.workingHours, shifts: newShifts } });
                                            }} />
                                        )}
                                    </div>
                                ))}
                                <button onClick={() => {
                                    const shifts = formData.workingHours.shifts || [{ start: '09:00', end: '22:00' }];
                                    setFormData({ ...formData, workingHours: { ...formData.workingHours, shifts: [...shifts, { start: '17:00', end: '22:00' }] } });
                                }} style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px dashed #8B5CF6', color: '#8B5CF6', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    {language === 'ar' ? '+ إضافة فترة عمل' : '+ Add Shift'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                    const dayData = formData.workingHours?.days?.[day] || { active: true, shifts: [{ start: '09:00', end: '22:00' }] };
                                    const shifts = dayData.shifts || [{ start: '09:00', end: '22:00' }];
                                    
                                    return (
                                        <div key={day} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', opacity: dayData.active ? 1 : 0.6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: shifts.length > 0 && dayData.active ? '10px' : 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input type="checkbox" checked={dayData.active} 
                                                        onChange={e => {
                                                            const wh = { ...formData.workingHours };
                                                            if(!wh.days) wh.days = {};
                                                            wh.days[day] = { ...dayData, active: e.target.checked };
                                                            setFormData({ ...formData, workingHours: wh });
                                                        }} 
                                                        style={{ accentColor: '#8B5CF6', width: 14, height: 14, cursor: 'pointer' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                        {language === 'ar' ? daysAr[day] : day}
                                                    </span>
                                                </div>
                                                {dayData.active && (
                                                    <button onClick={() => {
                                                        const wh = { ...formData.workingHours };
                                                        const dData = wh.days[day] || { active: true, shifts: [] };
                                                        dData.shifts = [...(dData.shifts || []), { start: '17:00', end: '22:00' }];
                                                        wh.days[day] = dData;
                                                        setFormData({ ...formData, workingHours: wh });
                                                    }} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        {language === 'ar' ? '+ فترة' : '+ Shift'}
                                                    </button>
                                                )}
                                            </div>

                                            {dayData.active && shifts.map((shift, sIdx) => (
                                                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: sIdx > 0 ? '8px' : 0 }}>
                                                    <input type="time" style={{ ...inpStyle, padding: '4px', flex: 1, minWidth: 0, fontSize: '0.75rem' }}
                                                        value={shift.start} onChange={e => {
                                                            const wh = { ...formData.workingHours };
                                                            const dShifts = [...wh.days[day].shifts];
                                                            dShifts[sIdx] = { ...shift, start: e.target.value };
                                                            wh.days[day] = { ...wh.days[day], shifts: dShifts };
                                                            setFormData({ ...formData, workingHours: wh });
                                                        }} />
                                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>-</span>
                                                    <input type="time" style={{ ...inpStyle, padding: '4px', flex: 1, minWidth: 0, fontSize: '0.75rem' }}
                                                        value={shift.end} onChange={e => {
                                                            const wh = { ...formData.workingHours };
                                                            const dShifts = [...wh.days[day].shifts];
                                                            dShifts[sIdx] = { ...shift, end: e.target.value };
                                                            wh.days[day] = { ...wh.days[day], shifts: dShifts };
                                                            setFormData({ ...formData, workingHours: wh });
                                                        }} />
                                                    {sIdx > 0 && (
                                                        <Trash2 size={12} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => {
                                                            const wh = { ...formData.workingHours };
                                                            wh.days[day] = { ...wh.days[day], shifts: wh.days[day].shifts.filter((_, i) => i !== sIdx) };
                                                            setFormData({ ...formData, workingHours: wh });
                                                        }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-input)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                            <MessageCircle size={18} color="#8B5CF6" />
                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'نبرة الصوت (Tone)' : 'Brand Voice'}</h4>
                        </div>
                        <textarea style={{ ...inpStyle, minHeight: 100 }} 
                            placeholder={language === 'ar' ? 'مثال: احترافي، ودود، يتجنب الاختصارات...' : 'e.g. Professional, friendly, avoids slang...'} 
                            value={formData.brand_voice_details || ''} onChange={e => setFormData({...formData, brand_voice_details: e.target.value})} />
                    </div>

                    <button onClick={handleSave} disabled={loading}
                        style={{
                            padding: '14px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                            color: 'var(--color-text-main)', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                            marginTop: '1rem'
                        }}>
                        {loading ? '...' : (language === 'ar' ? '✅ حفظ كل التعليمات' : '✅ Save All Instructions')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeTab;
