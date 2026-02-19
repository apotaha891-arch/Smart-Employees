import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, saveSalonConfig, activateSalonAgent, getServices, addService, updateService, deleteService } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import {
    User, FileText, Calendar, CheckCircle2, Smartphone,
    MessageCircle, Settings, Upload, Clock, Briefcase, Sparkles,
    CreditCard, Activity, Users, Send, Plus, Edit2, Trash2, Save, X
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const SalonSetup = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');
    const [salonConfigId, setSalonConfigId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        agentName: 'سارة',
        specialty: 'شامل',
        tone: 'friendly',
        workingHours: { start: '10:00', end: '22:00' },
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        calendarUrl: '',
        whatsappNumber: ''
    });

    // Services State
    const [services, setServices] = useState([]);
    const [editingService, setEditingService] = useState(null);
    const [newService, setNewService] = useState({ service_name: '', price: '', duration_minutes: '' });

    // Simulated Chat State (Preview) - Auto-updates
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const updatePreview = () => {
            const tones = {
                friendly: "يا هلا! 🌸 نورتي المشغل. أنا هنا عشان أنسق لك أحلى موعد.",
                professional: "مرحباً بك. يسعدني مساعدتك في حجز خدماتنا المتميزة.",
                bubbly: "أهلاً يا جميلة! ✨ مستعدة للدلال؟ قولي لي إيش بخاطرك اليوم!"
            };

            const initialMsg = `
${tones[formData.tone] || tones.friendly}
أنا ${formData.agentName}، مساعدتك الشخصية في ${formData.specialty === 'شامل' ? 'كل خدمات التجميل' : 'قسم ' + formData.specialty}.
ساعات دوامنا من ${formData.workingHours.start} إلى ${formData.workingHours.end}.
كيف أقدر أساعدك؟ 💅
            `;

            setMessages([{ role: 'agent', content: initialMsg, time: 'Now' }]);
        };
        updatePreview();
    }, [formData]);

    // Load services when salon config is available
    useEffect(() => {
        if (salonConfigId) {
            loadServices();
        }
    }, [salonConfigId]);

    const loadServices = async () => {
        const result = await getServices(salonConfigId);
        if (result.success) {
            setServices(result.data || []);
        }
    };

    const handleAddService = async () => {
        if (!newService.service_name || !newService.price || !newService.duration_minutes) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        const result = await addService({
            ...newService,
            salon_config_id: salonConfigId
        });

        if (result.success) {
            setServices([...services, result.data]);
            setNewService({ service_name: '', price: '', duration_minutes: '' });
        } else {
            alert('فشل في إضافة الخدمة: ' + result.error);
        }
    };

    const handleUpdateService = async (serviceId) => {
        const result = await updateService(serviceId, editingService);
        if (result.success) {
            setServices(services.map(s => s.id === serviceId ? result.data : s));
            setEditingService(null);
        } else {
            alert('فشل في تحديث الخدمة: ' + result.error);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

        const result = await deleteService(serviceId);
        if (result.success) {
            setServices(services.filter(s => s.id !== serviceId));
        } else {
            alert('فشل في حذف الخدمة: ' + result.error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { user } = await getCurrentUser();
            if (!user) throw new Error('Auth required');

            const configResult = await saveSalonConfig({
                user_id: user.id,
                ...formData,
                is_active: false
            });

            if (!configResult.success) throw new Error(configResult.error);

            // Store the salon config ID for services management
            setSalonConfigId(configResult.data.id);

            const activationResult = await activateSalonAgent(configResult.data.id, 'mock_token');
            if (!activationResult.success) throw new Error(activationResult.error);

            alert('تم حفظ الإعدادات بنجاح! 🚀');
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(`Error: ${error.message}`);
        }
    };

    // Stat Card Component
    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: `${color}20` }}>
                <Icon size={24} color={color} />
            </div>
            <div>
                <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{value}</div>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={Activity} label="سير العمل النشط" value="1" color="#8B5CF6" />
                <StatCard icon={Users} label="الموظفين النشطين" value="2" color="#10B981" />
                <StatCard icon={MessageCircle} label="إجمالي الرسائل" value="1,240" color="#3B82F6" />
                <StatCard icon={CreditCard} label="الرصيد المتبقي" value="450" color="#F59E0B" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>

                {/* LEFT COLUMN: Settings & Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Placeholder Chart Area */}
                    <div style={{ background: '#111827', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>إحصائيات الرسائل</h3>
                            <select style={{ background: '#1F2937', border: 'none', color: '#9CA3AF', padding: '5px 10px', borderRadius: '8px' }}>
                                <option>آخر 7 أيام</option>
                            </select>
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.9rem' }}>[Area Chart Placeholder: Incoming vs Outgoing Messages]</div>
                    </div>

                    {/* Settings Panel */}
                    <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { id: 'identity', label: 'الهوية', icon: User },
                                { id: 'knowledge', label: 'المعلومات', icon: Briefcase },
                                { id: 'activation', label: 'التفعيل', icon: Smartphone }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        flex: 1, padding: '1.5rem', background: activeTab === tab.id ? '#1F2937' : 'transparent',
                                        border: 'none', color: activeTab === tab.id ? '#8B5CF6' : '#9CA3AF',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : 'none'
                                    }}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ padding: '2rem' }}>
                            {activeTab === 'identity' && (
                                <div className="animate-fade-in">
                                    <div className="grid grid-2 gap-lg mb-lg">
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">اسم الموظفة</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.agentName}
                                                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">التخصص</label>
                                            <select
                                                className="input-field"
                                                value={formData.specialty}
                                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                            >
                                                <option value="شامل">تجميل شامل</option>
                                                <option value="شعر">عناية بالشعر</option>
                                                <option value="مكياج">ميك أب آرتست</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-dim mb-sm block">الأسلوب ونبرة الصوت</label>
                                        <div className="flex gap-md">
                                            {['friendly', 'professional', 'bubbly'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setFormData({ ...formData, tone: t })}
                                                    style={{
                                                        flex: 1, padding: '10px', borderRadius: '8px',
                                                        border: `1px solid ${formData.tone === t ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
                                                        background: formData.tone === t ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                                        color: formData.tone === t ? '#8B5CF6' : '#9CA3AF',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'knowledge' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>كتالوج الخدمات</h3>

                                    <ServicesTable
                                        services={services}
                                        editingService={editingService}
                                        setEditingService={setEditingService}
                                        newService={newService}
                                        setNewService={setNewService}
                                        onAdd={handleAddService}
                                        onUpdate={handleUpdateService}
                                        onDelete={handleDeleteService}
                                    />

                                    <div className="grid grid-2 gap-lg">
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">بدء العمل</label>
                                            <input type="time" className="input-field" value={formData.workingHours.start} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">نهاية العمل</label>
                                            <input type="time" className="input-field" value={formData.workingHours.end} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activation' && (
                                <div className="animate-fade-in text-center">
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', padding: '2rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#22C55E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>الموظفة جاهزة للإطلاق</h3>
                                        <p className="text-dim mb-xl">سيتم تفعيل الرقم +966 50 123 4567 فوراً</p>
                                        <button className="btn w-100" style={{ background: '#22C55E', border: 'none' }} onClick={handleSubmit} disabled={loading}>
                                            {loading ? 'جاري التفعيل...' : 'تفعيل الموظفة الآن'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Preview */}
                <div style={{ position: 'sticky', top: '2rem' }}>
                    <div style={{ background: '#111827', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Smartphone size={16} /> معاينة حية
                        </h4>

                        <div className="phone-mockup" style={{
                            width: '100%', maxWidth: '300px', height: '600px',
                            background: '#000', borderRadius: '30px', border: '8px solid #1F2937',
                            margin: '0 auto', overflow: 'hidden', position: 'relative'
                        }}>
                            <div style={{ background: '#075E54', padding: '30px 15px 10px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '35px', height: '35px', background: 'white', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop"
                                        alt="Agent"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{formData.agentName}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.9 }}>متصل (Active) • Elite AI</div>
                                </div>
                            </div>

                            <div style={{ height: 'calc(100% - 100px)', background: '#ECE5DD', padding: '10px', overflowY: 'auto' }}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} style={{
                                        background: msg.role === 'agent' ? 'white' : '#DCF8C6',
                                        padding: '8px', borderRadius: '8px', marginBottom: '8px',
                                        fontSize: '11px', lineHeight: '1.4', textAlign: 'left'
                                    }}>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalonSetup;
