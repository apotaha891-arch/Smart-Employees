import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile, getWalletBalance, saveSalonConfig, activateSalonAgent, getServices, addService, updateService, deleteService, linkGoogleAccount, saveIntegrationCredentials, getIntegrations, supabase } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import {
    User, FileText, Calendar, CheckCircle2, Smartphone,
    MessageCircle, Settings, Upload, Clock, Briefcase, Sparkles,
    CreditCard, Activity, Users, Send, Plus, Edit2, Trash2, Save, X, Puzzle
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const SalonSetup = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');
    const [salonConfigId, setSalonConfigId] = useState(null);
    const [industry, setIndustry] = useState('general');
    const [walletBalance, setWalletBalance] = useState(null);
    const [connectedIntegrations, setConnectedIntegrations] = useState({ google: false, whatsapp: false });

    // Handle OAuth Redirect and Load Integrations

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
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const balanceResult = await getWalletBalance(user.id);
                    if (balanceResult.success) {
                        setWalletBalance(balanceResult.balance);
                    }
                    const type = profileResult.data.business_type?.toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic')) setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate')) setIndustry('realestate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty')) setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau')) setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit')) setIndustry('fitness');
                }

                // Fetch the salon_config for this user
                const { data: configs } = await supabase
                    .from('salon_configs')
                    .select('id, agent_name, specialty, tone, working_hours')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (configs) {
                    setSalonConfigId(configs.id);
                    setFormData({
                        agentName: configs.agent_name || 'سارة',
                        specialty: configs.specialty || 'شامل',
                        tone: configs.tone || 'friendly',
                        workingHours: configs.working_hours || { start: '10:00', end: '22:00' },
                        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                        calendarUrl: '',
                        whatsappNumber: ''
                    });
                }
            }
        };
        checkUser();
    }, []);

    // Load Integrations and Handle OAuth Redirect
    useEffect(() => {
        const processIntegrations = async () => {
            const { user } = await getCurrentUser();
            if (!user) return;

            // Check if returning from Google OAuth
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.provider_token || session?.provider_refresh_token) {
                const creds = {
                    access_token: session.provider_token,
                    refresh_token: session.provider_refresh_token,
                    expires_in: 3600 // approximate, mostly relying on refresh_token
                };
                await saveIntegrationCredentials(user.id, 'google', creds);
                // Clear fragment to prevent re-processing on refresh
                window.history.replaceState(null, '', window.location.pathname);
            }

            // Fetch current integrations
            const result = await getIntegrations(user.id);
            if (result.success) {
                const googleConnected = result.data.some(i => i.provider === 'google' && i.status === 'connected');
                const waConnected = result.data.some(i => i.provider === 'whatsapp' && i.status === 'connected');
                setConnectedIntegrations({ google: googleConnected, whatsapp: waConnected });
            }
        };

        if (activeTab === 'integrations') {
            processIntegrations();
        }
    }, [activeTab]);

    const handleGoogleConnect = async () => {
        setLoading(true);
        const result = await linkGoogleAccount();
        if (!result.success) {
            alert("خطأ في ربط حساب جوجل: " + result.error);
            setLoading(false);
        }
    };


    useEffect(() => {
        const updatePreview = () => {
            const tones = {
                friendly: t('toneFriendlyGreeting'),
                professional: t('toneProfessionalGreeting'),
                bubbly: t('toneBubblyGreeting')
            };

            const specialty = formData.specialty === 'شامل' || formData.specialty === 'Comprehensive Beauty'
                ? t('comprehensiveBeautyText')
                : `${t('specialtyPrefixText')}${formData.specialty}`;

            const agentIntro = t('agentIntroText')
                .replace('{{name}}', formData.agentName)
                .replace('{{specialty}}', specialty);

            const workingHours = t('workingHoursText')
                .replace('{{start}}', formData.workingHours.start)
                .replace('{{end}}', formData.workingHours.end);

            const initialMsg = `
${tones[formData.tone] || tones.friendly}
${agentIntro}
${workingHours}
${t('helpQuestion')}
            `;

            setMessages([{ role: 'agent', content: initialMsg, time: 'Now' }]);
        };
        updatePreview();
    }, [formData, t]);

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
            alert(t('fillAllFields'));
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
            alert(t('failedAddService') + result.error);
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
        if (!confirm(t('confirmDeleteService'))) return;

        const result = await deleteService(serviceId);
        if (result.success) {
            setServices(services.filter(s => s.id !== serviceId));
        } else {
            alert(t('failedDeleteService') + result.error);
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

            alert(t('settingsSavedSuccess'));
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
                <StatCard icon={Activity} label={t('activeWorkflow')} value="1" color="#8B5CF6" />
                <StatCard icon={Users} label={t('activeEmployees')} value="2" color="#10B981" />
                <StatCard icon={MessageCircle} label={t('totalMessages')} value="1,240" color="#3B82F6" />
                <StatCard icon={CreditCard} label={t('remainingCredit')} value={walletBalance !== null ? walletBalance.toLocaleString() : "⏳"} color="#F59E0B" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>

                {/* LEFT COLUMN: Settings & Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Placeholder Chart Area */}
                    <div style={{ background: '#111827', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{t('messageStatistics')}</h3>
                            <select style={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                                <option style={{ color: 'white', background: '#1F2937' }}>{t('lastDays')}</option>
                            </select>
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.9rem' }}>{t('chartPlaceholder')}</div>
                    </div>

                    {/* Settings Panel */}
                    <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { id: 'identity', label: t('tabIdentity'), icon: User },
                                { id: 'knowledge', label: t('tabKnowledge'), icon: Briefcase },
                                { id: 'integrations', label: t('tabIntegrations') || 'Integrations', icon: Puzzle },
                                { id: 'activation', label: t('tabActivation'), icon: Smartphone }
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
                                            <label className="text-sm text-dim mb-sm block">{t('agentNameLabel')}</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.agentName}
                                                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">{t('specialtyLabel')}</label>
                                            <select
                                                className="input-field"
                                                value={formData.specialty}
                                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                                style={{ color: 'white', background: '#1F2937' }}
                                            >
                                                {industry === 'beauty' && (
                                                    <>
                                                        <option value="شامل" style={{ color: 'white', background: '#1F2937' }}>شامل (Comprehensive)</option>
                                                        <option value="شعر" style={{ color: 'white', background: '#1F2937' }}>شعر (Hair Care)</option>
                                                        <option value="مكياج" style={{ color: 'white', background: '#1F2937' }}>مكياج (Makeup Artist)</option>
                                                    </>
                                                )}
                                                {industry === 'medical' && (
                                                    <>
                                                        <option value="طب عام" style={{ color: 'white', background: '#1F2937' }}>طب عام (General Medicine)</option>
                                                        <option value="أسنان" style={{ color: 'white', background: '#1F2937' }}>أسنان (Dental)</option>
                                                        <option value="جلدية" style={{ color: 'white', background: '#1F2937' }}>جلدية (Dermatology)</option>
                                                    </>
                                                )}
                                                {industry === 'realestate' && (
                                                    <>
                                                        <option value="مبيعات" style={{ color: 'white', background: '#1F2937' }}>مبيعات (Sales)</option>
                                                        <option value="تأجير" style={{ color: 'white', background: '#1F2937' }}>تأجير (Rentals)</option>
                                                        <option value="أملاك" style={{ color: 'white', background: '#1F2937' }}>إدارة أملاك (Property Management)</option>
                                                    </>
                                                )}
                                                {industry === 'restaurant' && (
                                                    <>
                                                        <option value="حجوزات" style={{ color: 'white', background: '#1F2937' }}>حجوزات طاولات (Table Reservations)</option>
                                                        <option value="توصيل" style={{ color: 'white', background: '#1F2937' }}>طلبات خارجية (Delivery)</option>
                                                        <option value="شكاوى" style={{ color: 'white', background: '#1F2937' }}>خدمة العملاء (Customer Service)</option>
                                                    </>
                                                )}
                                                {industry === 'fitness' && (
                                                    <>
                                                        <option value="اشتراكات" style={{ color: 'white', background: '#1F2937' }}>اشتراكات (Memberships)</option>
                                                        <option value="تدريب شخصي" style={{ color: 'white', background: '#1F2937' }}>تدريب شخصي (Personal Training)</option>
                                                        <option value="تغذية" style={{ color: 'white', background: '#1F2937' }}>استشارات تغذية (Nutrition)</option>
                                                    </>
                                                )}
                                                {industry === 'general' && (
                                                    <>
                                                        <option value="شامل" style={{ color: 'white', background: '#1F2937' }}>شامل (General)</option>
                                                        <option value="مبيعات" style={{ color: 'white', background: '#1F2937' }}>مبيعات (Sales)</option>
                                                        <option value="دعم فني" style={{ color: 'white', background: '#1F2937' }}>دعم فني (Tech Support)</option>
                                                        <option value="خدمة عملاء" style={{ color: 'white', background: '#1F2937' }}>خدمة عملاء (Customer Service)</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-dim mb-sm block">{t('styleAndTone')}</label>
                                        <div className="flex gap-md">
                                            {[
                                                { value: 'friendly', label: t('toneFriendlyLabel') },
                                                { value: 'professional', label: t('toneProfessionalLabel') },
                                                { value: 'bubbly', label: t('toneBubblyLabel') }
                                            ].map(tone => (
                                                <button
                                                    key={tone.value}
                                                    onClick={() => setFormData({ ...formData, tone: tone.value })}
                                                    style={{
                                                        flex: 1, padding: '10px', borderRadius: '8px',
                                                        border: `1px solid ${formData.tone === tone.value ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
                                                        background: formData.tone === tone.value ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                                        color: formData.tone === tone.value ? '#8B5CF6' : '#9CA3AF',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {tone.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'knowledge' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t('servicesCatalog')}</h3>

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
                                            <label className="text-sm text-dim mb-sm block">{t('startTimeLabel')}</label>
                                            <input type="time" className="input-field" value={formData.workingHours.start} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-sm text-dim mb-sm block">{t('endTimeLabel')}</label>
                                            <input type="time" className="input-field" value={formData.workingHours.end} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>ربط التطبيقات (Native Integrations)</h3>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#DB443720', padding: '10px', borderRadius: '8px', color: '#DB4437' }}><Calendar /></div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>Google Calendar</h4>
                                                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>مزامنة المواعيد وقراءة الأوقات المتاحة</div>
                                                </div>
                                            </div>
                                            {connectedIntegrations.google ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22C55E' }}>
                                                    <CheckCircle2 size={18} /> تم الربط
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }} onClick={handleGoogleConnect} disabled={loading}>ربط الحساب</button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#25D36620', padding: '10px', borderRadius: '8px', color: '#25D366' }}><MessageCircle /></div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>WhatsApp Business</h4>
                                                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>استقبال الواتساب والرد المباشر</div>
                                                </div>
                                            </div>
                                            <button className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>إعداد الربط</button>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#0F9D5820', padding: '10px', borderRadius: '8px', color: '#0F9D58' }}><FileText /></div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>Google Sheets Sync</h4>
                                                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>تصدير الحجوزات والعملاء تلقائياً (نسخة احتياطية)</div>
                                                </div>
                                            </div>
                                            {connectedIntegrations.google ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22C55E' }}>
                                                    <CheckCircle2 size={18} /> جاهز للعمل
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }} onClick={handleGoogleConnect} disabled={loading}>اربط بحساب Google أولاً</button>
                                            )}
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
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t('agentReadyTitle')}</h3>
                                        <p className="text-dim mb-xl">{t('agentReadyDesc')}</p>
                                        <button className="btn w-100" style={{ background: '#22C55E', border: 'none' }} onClick={handleSave} disabled={loading}>
                                            {loading ? t('activating') : t('activateAgentBtn')}
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
                            <Smartphone size={16} /> {t('livePreview')}
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
                                    <div style={{ fontSize: '10px', opacity: 0.9 }}>{t('activeStatus')}</div>
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
        </div >
    );
};

export default SalonSetup;
