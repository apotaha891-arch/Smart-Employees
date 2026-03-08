import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, getProfile, getWalletBalance, saveSalonConfig, activateSalonAgent, getServices, addService, updateService, deleteService, linkGoogleAccount, saveIntegrationCredentials, getIntegrations, supabase, invokeMultiFileWorkflow } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import {
    User, FileText, Calendar, CheckCircle2, Smartphone,
    MessageCircle, Settings, Upload, Clock, Briefcase, Sparkles,
    CreditCard, Activity, Users, Send, Plus, Edit2, Trash2, Save, X, Puzzle, Star,
    Link as LinkIcon, Loader, Globe, Linkedin, Facebook, Instagram, Mail, HardDrive, BookOpen
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const EntitySetup = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('sources');
    const [salonConfigId, setSalonConfigId] = useState(null);
    const [industry, setIndustry] = useState('general');
    const [walletBalance, setWalletBalance] = useState(null);
    const [connectedIntegrations, setConnectedIntegrations] = useState({ google: false, whatsapp: false });

    // Integration Keys State
    const [integrationKeys, setIntegrationKeys] = useState({
        telegram_token: '',
        whatsapp_number: '',
        whatsapp_api_key: '',
        google_sheets_id: '',
        google_calendar_id: '',
    });
    const [integrationDraft, setIntegrationDraft] = useState({});  // live edits for open card
    const [integrationSaving, setIntegrationSaving] = useState(false);
    const [expandedIntegration, setExpandedIntegration] = useState(null);

    // Handle OAuth Redirect and Load Integrations

    // Form State — Company / Entity Profile
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: '',
        description: '',
        phone: '',
        address: '',
        website: '',
        workingHours: { start: '09:00', end: '22:00' },
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    });

    // Services State
    const [services, setServices] = useState([]);
    const [editingService, setEditingService] = useState(null);
    const [newService, setNewService] = useState({ service_name: '', price: '', duration_minutes: '', service_type: 'booking' });

    // AI Sources State
    const [aiFiles, setAiFiles] = useState([]);
    const [aiUrl, setAiUrl] = useState('');
    const [aiUrlsList, setAiUrlsList] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiLoadingMsg, setAiLoadingMsg] = useState(0);
    const [extractedProfile, setExtractedProfile] = useState(null); // holds AI result for preview table

    const aiLoadingMessages = language === 'ar' ? [
        'جاري رفع الملفات وقراءتها...',
        'جاري تحليل المحتوى بالذكاء الاصطناعي...',
        'يتم استخراج تفاصيل المنشأة...',
        'شارفنا على الانتهاء...'
    ] : [
        'Uploading and reading files...',
        'Analyzing with AI...',
        'Extracting business details...',
        'Almost done...'
    ];

    useEffect(() => {
        let iv;
        if (aiLoading) iv = setInterval(() => setAiLoadingMsg(p => (p + 1) % 4), 3000);
        else setAiLoadingMsg(0);
        return () => clearInterval(iv);
    }, [aiLoading]);

    const handleFileChange = e => {
        if (e.target.files) setAiFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };
    const removeFile = i => setAiFiles(prev => prev.filter((_, idx) => idx !== i));
    const handleAddUrl = () => {
        if (aiUrl && !aiUrlsList.includes(aiUrl)) {
            setAiUrlsList(prev => [...prev, aiUrl]);
            setAiUrl('');
        }
    };
    const removeUrl = i => setAiUrlsList(prev => prev.filter((_, idx) => idx !== i));

    const handleAiGenerate = async () => {
        if (aiFiles.length === 0 && aiUrlsList.length === 0) {
            alert(language === 'ar' ? 'يرجى إضافة ملف أو رابط واحد على الأقل.' : 'Please add at least one file or URL.');
            return;
        }
        setExtractedProfile(null);
        setAiLoading(true);
        const result = await invokeMultiFileWorkflow(aiFiles, aiUrlsList);
        setAiLoading(false);
        if (result.success && result.data) {
            // Store for preview — user reviews then confirms
            setExtractedProfile({
                businessName: result.data.business_name || '',
                businessType: result.data.business_type || '',
                description: result.data.description || '',
                phone: result.data.phone || '',
                address: result.data.address || '',
                website: result.data.website || '',
                services: result.data.services || '',
                workingHours: result.data.working_hours || '',
            });
        } else {
            alert(language === 'ar' ? 'حدث خطأ أثناء التحليل: ' + result.error : 'Analysis error: ' + result.error);
        }
    };

    const handleConfirmProfile = async () => {
        if (!extractedProfile) return;
        setFormData(prev => ({
            ...prev,
            businessName: extractedProfile.businessName || prev.businessName,
            businessType: extractedProfile.businessType || prev.businessType,
            description: extractedProfile.description || prev.description,
            phone: extractedProfile.phone || prev.phone,
            address: extractedProfile.address || prev.address,
            website: extractedProfile.website || prev.website,
        }));
        // Auto-save immediately
        setLoading(true);
        try {
            const { user } = await getCurrentUser();
            if (!user) throw new Error('Auth required');
            const configResult = await saveSalonConfig({
                user_id: user.id,
                agent_name: extractedProfile.businessName,
                specialty: extractedProfile.businessType,
                description: extractedProfile.description,
                phone: extractedProfile.phone,
                address: extractedProfile.address,
                website: extractedProfile.website,
                is_active: false,
            });
            if (!configResult.success) throw new Error(configResult.error);
            setSalonConfigId(configResult.data.id);
            setExtractedProfile(null);
            setAiFiles([]);
            setAiUrlsList([]);
            setActiveTab('identity');
            alert(language === 'ar' ? '✅ تم حفظ بيانات المنشأة بنجاح!' : '✅ Entity profile saved successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };


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
                    .select('id, agent_name, specialty, tone, working_hours, phone, address, website, description, telegram_token, whatsapp_number, whatsapp_api_key, google_sheets_id, google_calendar_id')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (configs) {
                    setSalonConfigId(configs.id);
                    setFormData(prev => ({
                        ...prev,
                        businessName: configs.agent_name || '',
                        businessType: configs.specialty || '',
                        description: configs.description || '',
                        phone: configs.phone || '',
                        address: configs.address || '',
                        website: configs.website || '',
                        workingHours: configs.working_hours || { start: '09:00', end: '22:00' },
                    }));
                    setIntegrationKeys({
                        website: configs.website || '', // Map integration data
                        telegram_token: configs.telegram_token || '',
                        whatsapp_number: configs.whatsapp_number || '',
                        whatsapp_api_key: configs.whatsapp_api_key || '',
                        google_sheets_id: configs.google_sheets_id || '',
                        google_calendar_id: configs.google_calendar_id || '',
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
        if (!newService.service_name) {
            alert(language === 'ar' ? 'الرجاء إدخال اسم الخدمة' : 'Please enter a service name');
            return;
        }

        // Clean up empty fields to be NULL in DB for optional values
        const payload = {
            ...newService,
            price: newService.price || 0,
            duration_minutes: newService.duration_minutes || 0,
            salon_config_id: salonConfigId
        };

        const result = await addService(payload);

        if (result.success) {
            setServices([...services, result.data]);
            setNewService({ service_name: '', price: '', duration_minutes: '', service_type: 'booking' });
        } else {
            alert(t('failedAddService') + result.error);
        }
    };

    const handleUpdateService = async (serviceId) => {
        if (!editingService.service_name) {
            alert(language === 'ar' ? 'الرجاء إدخال اسم الخدمة' : 'Please enter a service name');
            return;
        }

        const payload = {
            ...editingService,
            price: editingService.price || 0,
            duration_minutes: editingService.duration_minutes || 0,
        };

        const result = await updateService(serviceId, payload);
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
                agent_name: formData.businessName,
                specialty: formData.businessType,
                description: formData.description || null,
                phone: formData.phone || null,
                address: formData.address || null,
                website: formData.website || null,
                working_hours: formData.workingHours || null,
                is_active: false,
            });

            if (!configResult.success) throw new Error(configResult.error);
            setSalonConfigId(configResult.data.id);
            alert(language === 'ar' ? '✅ تم حفظ بيانات المنشأة بنجاح!' : '✅ Entity profile saved!');
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(`Error: ${error.message}`);
        }
    };

    const handleActivate = async () => {
        setLoading(true);
        if (!salonConfigId) {
            alert(language === 'ar' ? 'يرجى حفظ بيانات المنشأة أولاً.' : 'Please save entity info first.');
            setLoading(false);
            return;
        }

        try {
            const result = await activateSalonAgent(salonConfigId);
            if (result.success) {
                alert(language === 'ar' ? '🎉 تم تفعيل الموظف بنجاح! سيتم تحويلك للوحة التحكم.' : '🎉 Agent activated successfully! Redirecting...');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                alert((language === 'ar' ? 'خطأ في التفعيل: ' : 'Activation error: ') + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setLoading(false);
    };

    // Opens an integration card and seeds draft from saved keys
    const openIntegration = (id, fields) => {
        if (expandedIntegration === id) {
            setExpandedIntegration(null);
            return;
        }
        const initial = {};
        fields.forEach(f => { initial[f.key] = integrationKeys[f.key] || ''; });
        setIntegrationDraft(initial);
        setExpandedIntegration(id);
    };

    const handleSaveIntegration = async () => {
        if (!salonConfigId) {
            alert(language === 'ar' ? 'يرجى حفظ بيانات المنشأة أولاً.' : 'Please save entity info first.');
            return;
        }
        if (Object.keys(integrationDraft).length === 0) return;
        setIntegrationSaving(true);
        try {
            const { error } = await supabase
                .from('salon_configs')
                .update(integrationDraft)
                .eq('id', salonConfigId);
            if (error) throw error;
            setIntegrationKeys(prev => ({ ...prev, ...integrationDraft }));
            setExpandedIntegration(null);
            setIntegrationDraft({});
            alert(language === 'ar' ? '✅ تم حفظ مفاتيح الربط بنجاح!' : '✅ Integration keys saved!');
        } catch (err) {
            const col = err.message?.match(/column[\s'"]+([\w]+)/i)?.[1] || '';
            const hint = col
                ? `\n\nℹ️ أضف عمود مفقود في Supabase:\nALTER TABLE salon_configs ADD COLUMN IF NOT EXISTS ${col} TEXT;`
                : '';
            alert((language === 'ar' ? 'خطأ في الحفظ: ' : 'Save error: ') + err.message + hint);
        }
        setIntegrationSaving(false);
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

    const inp = {
        width: '100%', padding: '11px 14px',
        background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: 'white', fontSize: '0.9rem',
        boxSizing: 'border-box', outline: 'none',
    };

    return (
        <div className="fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ar' ? 'right' : 'left', color: 'white' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                    <Briefcase size={24} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                        {language === 'ar' ? 'إعداد المنشأة' : 'Entity Setup'}
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
                        {language === 'ar'
                            ? 'معلومات منشأتك التي يستخدمها الموظفون الذكيون للتعرف على عملك'
                            : 'Your business profile that AI agents read to understand your entity'}
                    </p>
                </div>
            </div>

            {/* Tabs Panel */}
            <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    {[
                        { id: 'sources', label: language === 'ar' ? 'مصادر الذكاء' : 'AI Sources', icon: Sparkles },
                        { id: 'identity', label: language === 'ar' ? 'معلومات المنشأة' : 'Entity Info', icon: Briefcase },
                        { id: 'knowledge', label: language === 'ar' ? 'الخدمات والمواعيد' : 'Services & Hours', icon: FileText },
                        { id: 'integrations', label: language === 'ar' ? 'الربط' : 'Integrations', icon: Puzzle },
                        { id: 'activation', label: language === 'ar' ? 'التفعيل' : 'Activation', icon: Smartphone }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '1rem', background: activeTab === tab.id ? '#1F2937' : 'transparent',
                                border: 'none', color: activeTab === tab.id ? '#8B5CF6' : '#9CA3AF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : 'none',
                                fontWeight: activeTab === tab.id ? 600 : 400
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* ─── SOURCES TAB ─── */}
                    {activeTab === 'sources' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Header */}
                            <div style={{ padding: '1rem 1.2rem', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(109,40,217,0.05))', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <Sparkles size={18} color="#A78BFA" />
                                    <span style={{ fontWeight: 700, color: '#A78BFA', fontSize: '0.95rem' }}>
                                        {language === 'ar' ? 'الإعداد الذكي بالذكاء الاصطناعي' : 'AI-Powered Smart Setup'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.83rem', lineHeight: 1.6 }}>
                                    {language === 'ar'
                                        ? 'ارفع ملفات منشأتك (PDF, Word, Excel) أو أضف روابط موقعك وسوشيال ميديا — وكيلنا الذكي سيقرأها ويُنشئ لك ملف تعريفي متكامل تلقائياً.'
                                        : 'Upload your business files (PDF, Word, Excel) or add your website / social links — our AI agent will read them and auto-generate a complete business profile for you.'}
                                </p>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>
                                    📁 {language === 'ar' ? 'رفع الملفات (PDF, Word, Excel, CSV)' : 'Upload Files (PDF, Word, Excel, CSV)'}
                                </label>
                                <div
                                    onClick={() => document.getElementById('entity-ai-upload').click()}
                                    style={{
                                        border: '2px dashed rgba(139,92,246,0.3)', borderRadius: 12, padding: '1.75rem',
                                        textAlign: 'center', cursor: 'pointer', background: 'rgba(139,92,246,0.03)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
                                >
                                    <Upload size={28} color="#8B5CF6" style={{ marginBottom: 8 }} />
                                    <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85rem' }}>
                                        {language === 'ar' ? 'اضغط لاختيار الملفات أو اسحبها هنا' : 'Click to choose files or drag & drop here'}
                                    </p>
                                    <input id="entity-ai-upload" type="file" multiple style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                                </div>
                                {aiFiles.length > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {aiFiles.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '7px 12px', borderRadius: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E5E7EB', fontSize: '0.83rem' }}>
                                                    <FileText size={14} color="#8B5CF6" /> {f.name}
                                                </div>
                                                <X size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeFile(i)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* URL Input */}
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>
                                    🔗 {language === 'ar' ? 'روابط المنشأة (موقع، سوشيال، كتالوج)' : 'Business Links (website, social, catalog)'}
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <LinkIcon size={16} style={{ position: 'absolute', [language === 'ar' ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                        <input type="url" value={aiUrl} onChange={e => setAiUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                                            placeholder="https://"
                                            style={{ ...inp, [language === 'ar' ? 'paddingRight' : 'paddingLeft']: 38 }} />
                                    </div>
                                    <button onClick={handleAddUrl}
                                        style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'rgba(139,92,246,0.15)', color: '#A78BFA', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {language === 'ar' ? '+ إضافة' : '+ Add'}
                                    </button>
                                </div>
                                {aiUrlsList.length > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {aiUrlsList.map((url, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '7px 12px', borderRadius: 8 }}>
                                                <a href={url} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontSize: '0.82rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{url}</a>
                                                <X size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeUrl(i)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* AI Generate Button */}
                            <button onClick={handleAiGenerate}
                                disabled={aiLoading || (aiFiles.length === 0 && aiUrlsList.length === 0)}
                                style={{
                                    padding: '14px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: '1rem',
                                    background: (aiFiles.length === 0 && aiUrlsList.length === 0) ? '#374151' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                                    color: 'white', cursor: (aiFiles.length === 0 && aiUrlsList.length === 0) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s'
                                }}>
                                {aiLoading
                                    ? (<><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> {aiLoadingMessages[aiLoadingMsg]}</>)
                                    : (<><Sparkles size={18} /> {language === 'ar' ? 'تحليل وإنشاء الملف التعريفي ✨' : 'Analyze & Generate Profile ✨'}</>)}
                            </button>

                            {/* ── Extracted Profile Preview Table ── */}
                            {extractedProfile && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 4 }}>

                                    {/* Success banner */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.85rem 1.1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
                                        <CheckCircle2 size={18} />
                                        {language === 'ar'
                                            ? 'تم استخراج البيانات — راجع الجدول أدناه ثم اضغط "تأكيد وحفظ"'
                                            : 'Data extracted — review the table below then click "Confirm & Save"'}
                                    </div>

                                    {/* Profile table */}
                                    <div style={{ background: '#0D1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <th style={{ padding: '10px 14px', color: '#A78BFA', fontWeight: 700, textAlign: language === 'ar' ? 'right' : 'left', width: '35%' }}>
                                                        {language === 'ar' ? 'الحقل' : 'Field'}
                                                    </th>
                                                    <th style={{ padding: '10px 14px', color: '#A78BFA', fontWeight: 700, textAlign: language === 'ar' ? 'right' : 'left' }}>
                                                        {language === 'ar' ? 'القيمة المستخرجة (قابلة للتعديل)' : 'Extracted Value (editable)'}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { key: 'businessName', labelAr: 'اسم المنشأة', labelEn: 'Business Name', multiline: false },
                                                    { key: 'businessType', labelAr: 'نوع النشاط', labelEn: 'Business Type', multiline: false },
                                                    { key: 'phone', labelAr: 'رقم التواصل', labelEn: 'Contact Number', multiline: false },
                                                    { key: 'address', labelAr: 'الموقع / العنوان', labelEn: 'Location', multiline: false },
                                                    { key: 'website', labelAr: 'الموقع الإلكتروني', labelEn: 'Website', multiline: false },
                                                    { key: 'workingHours', labelAr: 'ساعات العمل', labelEn: 'Working Hours', multiline: false },
                                                    { key: 'description', labelAr: 'وصف المنشأة', labelEn: 'Description', multiline: true },
                                                    { key: 'services', labelAr: 'الخدمات', labelEn: 'Services', multiline: true },
                                                ].map((row, idx) => (
                                                    <tr key={row.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                                        <td style={{ padding: '10px 14px', color: '#9CA3AF', fontWeight: 600, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                            {language === 'ar' ? row.labelAr : row.labelEn}
                                                        </td>
                                                        <td style={{ padding: '8px 14px' }}>
                                                            {row.multiline ? (
                                                                <textarea
                                                                    rows={3}
                                                                    value={extractedProfile[row.key]}
                                                                    onChange={e => setExtractedProfile(p => ({ ...p, [row.key]: e.target.value }))}
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E5E7EB', padding: '7px 10px', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                                                />
                                                            ) : (
                                                                <input
                                                                    value={extractedProfile[row.key]}
                                                                    onChange={e => setExtractedProfile(p => ({ ...p, [row.key]: e.target.value }))}
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E5E7EB', padding: '7px 10px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Confirm buttons */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={handleConfirmProfile} disabled={loading}
                                            style={{
                                                flex: 1, padding: '13px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: '0.95rem',
                                                background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}>
                                            <Save size={16} />
                                            {loading
                                                ? (language === 'ar' ? '⏳ جاري الحفظ...' : '⏳ Saving...')
                                                : (language === 'ar' ? 'تأكيد وحفظ البروفايل' : 'Confirm & Save Profile')}
                                        </button>
                                        <button onClick={() => setExtractedProfile(null)}
                                            style={{ padding: '13px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600 }}>
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!extractedProfile && (
                                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.78rem', textAlign: 'center' }}>
                                    {language === 'ar'
                                        ? 'بعد التحليل ستظهر نتائج قابلة للمراجعة والتعديل قبل الحفظ.'
                                        : 'After analysis, results appear for review and editing before saving.'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ─── IDENTITY TAB ─── */}
                    {activeTab === 'identity' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Info banner */}
                            <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA', fontSize: '0.83rem', lineHeight: 1.6 }}>
                                {language === 'ar'
                                    ? '💡 هذه المعلومات يقرأها الموظف الذكي ليفهم منشأتك ويتحدث باسمها بشكل صحيح.'
                                    : '💡 This profile is read by your AI agents so they can represent your business accurately.'}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'اسم المنشأة *' : 'Entity / Business Name *'}
                                    </label>
                                    <input style={inp} value={formData.businessName}
                                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                        placeholder={language === 'ar' ? 'مثال: صالون نورة، عيادة الشفاء...' : 'e.g. Nora Salon, Al-Shifa Clinic...'} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'نوع النشاط التجاري' : 'Business Type'}
                                    </label>
                                    <select style={{ ...inp, cursor: 'pointer' }} value={formData.businessType}
                                        onChange={e => setFormData({ ...formData, businessType: e.target.value })}>
                                        <option value="">{language === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                                        <option value="beauty">{language === 'ar' ? '💄 تجميل وعناية' : '💄 Beauty & Wellness'}</option>
                                        <option value="medical">{language === 'ar' ? '🏥 طبي وصحي' : '🏥 Medical & Health'}</option>
                                        <option value="realestate">{language === 'ar' ? '🏢 عقارات' : '🏢 Real Estate'}</option>
                                        <option value="restaurant">{language === 'ar' ? '🍽️ مطاعم' : '🍽️ Restaurant'}</option>
                                        <option value="fitness">{language === 'ar' ? '💪 لياقة ورياضة' : '💪 Fitness & Sports'}</option>
                                        <option value="retail">{language === 'ar' ? '🛍️ تجزئة' : '🛍️ Retail'}</option>
                                        <option value="education">{language === 'ar' ? '📚 تعليم' : '📚 Education'}</option>
                                        <option value="general">{language === 'ar' ? '🏬 أخرى / عام' : '🏬 General / Other'}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                    {language === 'ar' ? 'وصف المنشأة' : 'Business Description'}
                                </label>
                                <textarea style={{ ...inp, resize: 'vertical' }} rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={language === 'ar'
                                        ? 'صف خدماتك ومميزاتك... (سيستخدم هذا الوصف لتعريف الموظف الذكي بنشاطك)'
                                        : 'Describe your services and what makes you unique... (used to brief AI agents)'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'رقم التواصل' : 'Contact Number'}
                                    </label>
                                    <input style={inp} value={formData.phone} type="tel"
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+966 5x xxx xxxx" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'الموقع / العنوان' : 'Location / Address'}
                                    </label>
                                    <input style={inp} value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={language === 'ar' ? 'الرياض، حي النخيل...' : 'Riyadh, Al-Nakheel...'} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                    {language === 'ar' ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)'}
                                </label>
                                <input style={inp} value={formData.website} type="url"
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://" />
                            </div>

                            <button onClick={handleSave} disabled={loading || !formData.businessName}
                                style={{
                                    padding: '12px', borderRadius: 10, border: 'none',
                                    background: !formData.businessName ? '#374151' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                                    color: 'white', fontWeight: 700, cursor: !formData.businessName ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}>
                                <Save size={16} />
                                {loading
                                    ? (language === 'ar' ? '⏳ جاري الحفظ...' : '⏳ Saving...')
                                    : (language === 'ar' ? 'حفظ معلومات المنشأة' : 'Save Entity Profile')}
                            </button>
                        </div>
                    )}

                    {activeTab === 'knowledge' && (
                        <div className="animate-fade-in">
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t('servicesCatalog') || (language === 'ar' ? 'قائمة الخدمات' : 'Services Catalog')}</h3>

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

                            <div className="grid grid-2 gap-lg" style={{ marginTop: '1.5rem' }}>
                                <div>
                                    <label className="text-sm text-dim mb-sm block">{t('startTimeLabel') || (language === 'ar' ? 'وقت البدء' : 'Start Time')}</label>
                                    <input type="time" className="input-field" value={formData.workingHours.start} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="text-sm text-dim mb-sm block">{t('endTimeLabel') || (language === 'ar' ? 'وقت الانتهاء' : 'End Time')}</label>
                                    <input type="time" className="input-field" value={formData.workingHours.end} onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (() => {
                        const CARDS = [
                            {
                                id: 'website', icon: Globe, color: '#6366F1',
                                titleAr: 'موقع الويب المباشر', titleEn: 'Website Chatbot',
                                descAr: 'ربط الموظف الذكي بموقعك لخدمة الزوار',
                                descEn: 'Embed the smart agent on your website',
                                badge: language === 'ar' ? 'مضمّن' : 'Included', badgeColor: '#22C55E',
                                fields: [
                                    { key: 'website', labelAr: 'رابط الموقع (دومين)', labelEn: 'Website URL', placeholder: 'https://www.yourdomain.com', password: false, hintAr: 'الموقع المستهدف', hintEn: 'Target site', guide: null }
                                ]
                            },
                            {
                                id: 'telegram', icon: Send, color: '#229ED9',
                                titleAr: 'بوت تيليجرام', titleEn: 'Telegram Bot',
                                descAr: 'ربط بوت تيليجرام الخاص بك ليستقبل الرسائل',
                                descEn: 'Connect your Telegram bot to receive & reply',
                                badge: language === 'ar' ? 'مضمّن' : 'Included', badgeColor: '#22C55E',
                                fields: [
                                    { key: 'telegram_token', labelAr: 'توكن البوت', labelEn: 'Bot Token', placeholder: '123456789:AAF...', password: false, hintAr: 'من @BotFather في تيليجرام', hintEn: 'from @BotFather', guide: 'https://core.telegram.org/bots/tutorial' }
                                ]
                            },
                            {
                                id: 'whatsapp', icon: MessageCircle, color: '#25D366',
                                titleAr: 'واتساب للأعمال', titleEn: 'WhatsApp Business',
                                descAr: 'ربط حساب واتساب للأعمال للرد التلقائي',
                                descEn: 'Connect WhatsApp for automated replies',
                                badge: language === 'ar' ? 'إضافة' : 'Add-on', badgeColor: '#F59E0B',
                                fields: [
                                    { key: 'whatsapp_number', labelAr: 'رقم الهاتف', labelEn: 'Phone Number', placeholder: '+966500000000', password: false, hintAr: 'بصيغة دولية', hintEn: 'international format', guide: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' },
                                    { key: 'whatsapp_api_key', labelAr: 'مفتاح API', labelEn: 'API Token', placeholder: 'EAAG...', password: true, hintAr: 'من Meta Developer Console', hintEn: 'from Meta', guide: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' }
                                ]
                            },
                            {
                                id: 'sheets', icon: FileText, color: '#0F9D58',
                                titleAr: 'جداول جوجل', titleEn: 'Google Sheets',
                                descAr: 'تصدير الحجوزات والعملاء تلقائياً لجدولك',
                                descEn: 'Auto-export bookings to Google Sheets',
                                badge: 'Pro', badgeColor: '#F59E0B',
                                fields: [
                                    { key: 'google_sheets_id', labelAr: 'معرّف الجدول', labelEn: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA...', password: false, hintAr: 'بعد /d/', hintEn: 'after /d/', guide: 'https://developers.google.com/sheets/api/guides/concepts' }
                                ]
                            },
                            {
                                id: 'calendar', icon: Calendar, color: '#DB4437',
                                titleAr: 'تقويم جوجل', titleEn: 'Google Calendar',
                                descAr: 'مزامنة المواعيد مع تقويم جوجل تلقائياً',
                                descEn: 'Sync with Google Calendar automatically',
                                badge: 'Pro', badgeColor: '#F59E0B',
                                fields: [
                                    { key: 'google_calendar_id', labelAr: 'معرّف التقويم', labelEn: 'Calendar ID', placeholder: 'your-email@gmail.com', password: false, hintAr: 'من الإعدادات', hintEn: 'from settings', guide: 'https://support.google.com/calendar/answer/37103' }
                                ]
                            },
                            // ── NEW INTEGRATIONS ──
                            {
                                id: 'linkedin_personal', icon: Linkedin, color: '#0A66C2',
                                titleAr: 'لينكد إن (حساب شخصي)', titleEn: 'LinkedIn (Personal)',
                                descAr: 'إنشاء ومشاركة منشورات مع متابعيك.',
                                descEn: 'Create and share posts with your network.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'linkedin_org', icon: Linkedin, color: '#0A66C2',
                                titleAr: 'لينكد إن (الصفحات)', titleEn: 'LinkedIn (Organization)',
                                descAr: 'إدارة حساب شركتك على لينكد إن ونشر المحتوى.',
                                descEn: 'Create and share posts on your organization\'s behalf.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'facebook', icon: Facebook, color: '#1877F2',
                                titleAr: 'فيسبوك', titleEn: 'Facebook',
                                descAr: 'إدارة صفحات الفيسبوك وحسابات إنستغرام والنشر.',
                                descEn: 'Manage Facebook and Instagram pages, accounts, and posts.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'instagram', icon: Instagram, color: '#E4405F',
                                titleAr: 'إنستغرام', titleEn: 'Instagram',
                                descAr: 'إدارة حساب إنستغرام للأعمال أو منشئ المحتوى.',
                                descEn: 'Manage your Instagram Business or Creator account.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'gmail', icon: Mail, color: '#EA4335',
                                titleAr: 'جيميل', titleEn: 'Gmail',
                                descAr: 'اسمح للموظفين بقراءة رسائلك الجيميل والرد عليها.',
                                descEn: 'Let helpers send emails and read your inbox.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'outlook', icon: Mail, color: '#0078D4',
                                titleAr: 'آوتلوك', titleEn: 'Outlook',
                                descAr: 'التعامل التلقائي مع رسائل بريدك على خدمة آوتلوك.',
                                descEn: 'Handle your Outlook emails.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'drive', icon: HardDrive, color: '#1FA463',
                                titleAr: 'جوجل درايف', titleEn: 'Google Drive',
                                descAr: 'إنشاء ومقروئية المستندات والجداول تلقائياً.',
                                descEn: 'Create and read docs, sheets, and other files.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'notion', icon: BookOpen, color: '#000000',
                                titleAr: 'نوشن', titleEn: 'Notion',
                                descAr: 'قراءة وتحديث بيانات مساحة العمل الخاصة بك.',
                                descEn: 'Read and update your Notion data.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                            {
                                id: 'quickbooks', icon: Briefcase, color: '#2CA01C',
                                titleAr: 'كويك بوكس', titleEn: 'QuickBooks',
                                descAr: 'قراءة وتحديث الفواتير والبيانات المحاسبية.',
                                descEn: 'Read and update your QuickBooks data.',
                                badge: 'OAuth', badgeColor: '#3B82F6', fields: []
                            },
                        ];

                        return (
                            <div className="animate-fade-in">
                                {/* Header */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#E5E7EB' }}>
                                        {language === 'ar' ? '🔌 أدوات الربط والمنصات' : '🔌 Connections & Integrations'}
                                    </h3>
                                    <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85rem' }}>
                                        {language === 'ar'
                                            ? 'قم بتوصيل الموظف الذكي بحساباتك ومنصاتك لتسريع سير العمل.'
                                            : 'Connect the AI agent with your platforms to accelerate workflows.'}
                                    </p>
                                </div>

                                {/* Cards Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                                    {CARDS.map(card => {
                                        const isOpen = expandedIntegration === card.id;
                                        const isConnected = card.fields.some(f => !!integrationKeys[f.key]);
                                        const cardColor = card.color;

                                        return (
                                            <div key={card.id} style={{
                                                borderRadius: 20,
                                                border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : isOpen ? `${cardColor}44` : 'rgba(255,255,255,0.08)'}`,
                                                background: isOpen ? `${cardColor}06` : '#18181B', // Darker background to match screenshot style
                                                overflow: 'hidden',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }}>
                                                {/* Main Interface Layout */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>

                                                    {/* Left: Icon & Text */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: isConnected ? `${cardColor}20` : '#27272A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isConnected ? cardColor : '#3B82F6', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            {/* If it has native color use it, otherwise use blue */}
                                                            <card.icon size={22} color={cardColor} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#E5E7EB' }}>
                                                                    {language === 'ar' ? card.titleAr : card.titleEn}
                                                                </span>
                                                                {isConnected && (
                                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 6px', borderRadius: 99, fontWeight: 700 }}>
                                                                        ✔ {language === 'ar' ? 'مربوط' : 'Connected'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: 4, lineHeight: 1.4 }}>
                                                                {language === 'ar' ? card.descAr : card.descEn}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Connect Button */}
                                                    <div style={{ flexShrink: 0, marginInlineStart: '1rem' }}>
                                                        {card.fields.length > 0 ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (isOpen) {
                                                                        setExpandedIntegration(null);
                                                                    } else {
                                                                        openIntegration(card.id, card.fields);
                                                                    }
                                                                }}
                                                                style={{
                                                                    background: isOpen || isConnected ? 'rgba(255,255,255,0.08)' : '#3B82F6',
                                                                    color: isOpen || isConnected ? '#E5E7EB' : '#FFFFFF',
                                                                    border: isOpen || isConnected ? '1px solid rgba(255,255,255,0.12)' : 'none',
                                                                    borderRadius: 99, padding: '7px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                                                                }}>
                                                                {isOpen ? (language === 'ar' ? 'إغلاق' : 'Close') : (language === 'ar' ? 'إعداد' : 'Connect')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => alert(language === 'ar' ? 'هذه الأداة ستتوفر قريباً للربط التلقائي!' : 'OAuth connection is coming soon!')}
                                                                style={{
                                                                    background: '#3B82F6',
                                                                    color: '#FFFFFF',
                                                                    border: 'none',
                                                                    borderRadius: 99, padding: '7px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                                                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)'
                                                                }}>
                                                                {language === 'ar' ? 'توصيل' : 'Connect'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Form / Setup Fields */}
                                                {isOpen && card.fields.length > 0 && (
                                                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {card.fields.map(f => (
                                                            <div key={f.key} style={{ marginTop: 16 }}>
                                                                <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', marginBottom: 8, fontWeight: 500 }}>
                                                                    {language === 'ar' ? f.labelAr : f.labelEn}
                                                                    <span style={{ fontWeight: 400, color: '#6B7280', marginInlineStart: 8 }}>
                                                                        — {language === 'ar' ? f.hintAr : f.hintEn}
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type={f.password ? 'password' : 'text'}
                                                                    value={integrationDraft[f.key] ?? ''}
                                                                    onChange={e => setIntegrationDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                    placeholder={f.placeholder}
                                                                    style={{
                                                                        width: '100%', padding: '10px 14px', background: '#27272A', border: '1px solid #3F3F46', borderRadius: 10, color: '#FFFFFF',
                                                                        fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: f.password ? '0.1em' : 'normal', outline: 'none'
                                                                    }}
                                                                />
                                                                {f.guide && (
                                                                    <span
                                                                        onClick={(e) => { e.stopPropagation(); navigate('/help/integrations'); }}
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#60A5FA', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                                                                        <LinkIcon size={12} /> {language === 'ar' ? 'كيف أحصل على هذا المفتاح؟' : 'How to get this key?'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}

                                                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                                            <button
                                                                onClick={handleSaveIntegration}
                                                                disabled={integrationSaving}
                                                                style={{
                                                                    flex: 1, padding: '12px', borderRadius: 99, border: 'none',
                                                                    background: `linear-gradient(135deg, ${cardColor}, ${cardColor}bb)`,
                                                                    color: 'white', fontWeight: 700, cursor: integrationSaving ? 'not-allowed' : 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem',
                                                                    opacity: integrationSaving ? 0.7 : 1, boxShadow: `0 4px 14px ${cardColor}40`
                                                                }}>
                                                                {integrationSaving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                                                {integrationSaving
                                                                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                                                    : (language === 'ar' ? 'حفظ البيانات' : 'Save Connection')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'activation' && (
                        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '2rem' }}>
                                <div style={{
                                    width: '64px', height: '64px', margin: '0 auto 1.5rem',
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1.8rem', fontWeight: '900',
                                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)',
                                    border: '2px solid rgba(255, 255, 255, 0.1)', position: 'relative', overflow: 'hidden'
                                }}>
                                    <span style={{ position: 'relative', zIndex: 2, letterSpacing: '-1.5px' }}>24</span>
                                    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)', opacity: 0.5 }}></div>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>
                                    {language === 'ar' ? '✅ الموظف جاهز للعمل' : '✅ Agent Ready to Deploy'}
                                </h3>
                                <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
                                    {language === 'ar'
                                        ? 'تم إعداد ملف المنشأة وأدوات الربط. اضغط أدناه لتفعيل الموظف الذكي.'
                                        : 'Entity profile and integrations configured. Click below to activate your AI agent.'}
                                </p>
                                <button
                                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#22C55E', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                                    onClick={handleActivate} disabled={loading}>
                                    {loading
                                        ? (language === 'ar' ? '⏳ جاري التفعيل...' : '⏳ Activating...')
                                        : (language === 'ar' ? '🚀 تفعيل الموظف' : '🚀 Activate Agent')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntitySetup;
