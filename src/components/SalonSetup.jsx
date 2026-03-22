import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { 
    getCurrentUser, getProfile, getWalletBalance, saveSalonConfig, 
    activateSalonAgent, getServices, addService, updateService, 
    deleteService, linkGoogleAccount, saveIntegrationCredentials, 
    getIntegrations, updateAgent, invokeMultiFileWorkflow,
    supabase 
} from '../services/supabaseService';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, FileText, Calendar, CheckCircle2, Smartphone,
    MessageCircle, Settings, Upload, Clock, Briefcase, Sparkles,
    CreditCard, Activity, Users, Send, Plus, Edit2, Trash2, Save, X, Puzzle, Star, Target, Zap,
    Link as LinkIcon, Loader, Globe, Linkedin, Facebook, Instagram, Mail, HardDrive, BookOpen
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const EntitySetup = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'sources';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [salonConfigId, setSalonConfigId] = useState(null);
    const [industry, setIndustry] = useState('general');
    const [walletBalance, setWalletBalance] = useState(null);
    const [connectedIntegrations, setConnectedIntegrations] = useState({ google: false, whatsapp: false });
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (queryParams.get('success')) {
            setPaymentSuccess(true);
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname + '?tab=' + activeTab);
        }
    }, []);

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
    const [loadingOAuth, setLoadingOAuth] = useState(null);
    const [userPlan, setUserPlan] = useState('free');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [appBaseUrl, setAppBaseUrl] = useState(window.location.origin);
    const [requestToolName, setRequestToolName] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [agentId, setAgentId] = useState(null);


    const handleOAuthConnect = async (platformId) => {
        setLoadingOAuth(platformId);
        // Simulate a seamless OAuth redirect/popup experience
        setTimeout(() => {
            setIntegrationKeys(prev => ({ ...prev, [`oauth_${platformId}`]: true }));
            setLoadingOAuth(null);
        }, 1800);
    };

    // Handle OAuth Redirect and Load Integrations

    // Form State — Company / Entity Profile
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: '',
        description: '',
        phone: '',
        address: '',
        website: '',
        position: '',
        workingHours: { shifts: [{ start: '09:00', end: '22:00' }], isCustom: false },
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        knowledge_base: '',
        // Mission-Ready fields
        mission_statement: '',
        target_audience: '',
        brand_voice_details: '',
        faq_data: [],
        sop_instructions: '',
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
    const [newFaq, setNewFaq] = useState({ q: '', a: '' });

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
        console.log("SalonSetup: Initiating AI Extraction", { files: aiFiles.length, urls: aiUrlsList });
        
        try {
            const result = await invokeMultiFileWorkflow(aiFiles, aiUrlsList);
            console.log("SalonSetup: Extraction Result:", result);
            
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
                    knowledgeBase: result.data.knowledge_base || '',
                    // Mission fields
                    mission_statement: result.data.mission_statement || '',
                    target_audience: result.data.target_audience || '',
                    brand_voice: result.data.brand_voice || '',
                    procedures: result.data.procedures || '',
                });
                console.log("SalonSetup: Profile extracted and set for preview ✅");
            } else {
                console.error("SalonSetup: Extraction failed:", result.error);
                alert(language === 'ar' ? 'حدث خطأ أثناء التحليل: ' + result.error : 'Analysis error: ' + result.error);
            }
        } catch (error) {
            console.error("SalonSetup: Unexpected error during AI generate:", error);
            alert(language === 'ar' ? 'خطأ غير متوقع: ' + error.message : 'Unexpected error: ' + error.message);
        } finally {
            setAiLoading(false);
            console.log("SalonSetup: AI Extraction process finished.");
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
            knowledge_base: extractedProfile.knowledgeBase || prev.knowledge_base,
            mission_statement: extractedProfile.mission_statement || prev.mission_statement,
            target_audience: extractedProfile.target_audience || prev.target_audience,
            brand_voice_details: extractedProfile.brand_voice || prev.brand_voice_details,
            sop_instructions: extractedProfile.procedures || prev.sop_instructions,
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
                knowledge_base: extractedProfile.knowledgeBase,
                mission_statement: extractedProfile.mission_statement,
                target_audience: extractedProfile.target_audience,
                brand_voice_details: extractedProfile.brand_voice,
                sop_instructions: extractedProfile.procedures,
                is_active: false,
            });
            if (!configResult.success) throw new Error(configResult.error);
            setSalonConfigId(configResult.data.id);
            setExtractedProfile(null);
            setAiFiles([]);
            setAiUrlsList([]);
            
            // If we have an agentId, sync it immediately to avoid losing the reference
            if (agentId) {
                await updateAgent(agentId, {
                    name: extractedProfile.businessName,
                    specialty: extractedProfile.businessType,
                    salon_config_id: configResult.data.id
                });
            }

            setActiveTab('identity');
            alert(language === 'ar' ? '✅ تم حفظ بيانات المنشأة ومزامنة الموظف بنجاح!' : '✅ Entity profile saved and agent synced successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };


    useEffect(() => {
        const checkUser = async () => {
            let configs = null;
            const { user } = await getCurrentUser();
            if (user) {
                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const balanceResult = await getWalletBalance(user.id);
                    if (balanceResult.success) {
                        setWalletBalance(balanceResult.balance);
                    }
                    const type = (profileResult.data.business_type || configs?.specialty || '').toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic') || type === 'medical') setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate') || type === 'real_estate') setIndustry('realestate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty') || type === 'beauty') setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau') || type === 'restaurant') setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit') || type === 'fitness') setIndustry('fitness');
                    else if (type === 'retail_ecommerce') setIndustry('retail_ecommerce');
                    else if (type === 'banking' || type?.includes('بنك') || type?.includes('مالي')) setIndustry('banking');
                    else if (type === 'call_center' || type?.includes('اتصال') || type?.includes('خدمة')) setIndustry('call_center');
                    else if (type === 'telecom_it' || type?.includes('تكنو') || type?.includes('برمج') || type?.includes('it')) setIndustry('telecom_it');

                    setFormData(prev => ({
                        ...prev,
                        businessName: configs?.agent_name || prev.businessName,
                        businessType: configs?.specialty || profileResult.data.business_type || prev.businessType,
                        description: configs?.description || prev.description,
                        phone: configs?.phone || profileResult.data.phone || prev.phone,
                        address: configs?.address || prev.address,
                        website: configs?.website || profileResult.data.website || prev.website,
                        position: profileResult.data.position || prev.position,
                        knowledge_base: configs?.knowledge_base || prev.knowledge_base,
                    }));
                }

                const agentIdFromUrl = queryParams.get('agent');
                if (agentIdFromUrl) {
                    console.log("SalonSetup: Operating on agent from URL:", agentIdFromUrl);
                    setAgentId(agentIdFromUrl);
                }

                // Priority 1: If we have an agent, fetch the config specific to it
                if (agentIdFromUrl) {
                    const { data: linkedAgent } = await supabase
                        .from('agents')
                        .select('salon_config_id')
                        .eq('id', agentIdFromUrl)
                        .maybeSingle();
                    
                    if (linkedAgent?.salon_config_id) {
                        const { data } = await supabase
                            .from('salon_configs')
                            .select('*')
                            .eq('id', linkedAgent.salon_config_id)
                            .maybeSingle();
                        configs = data;
                    }
                }

                if (configs) {
                    console.log("SalonSetup: Found existing config:", configs.id);
                    setSalonConfigId(configs.id);

                    // Migration logic for multiple shifts
                    const migrateWorkingHours = (wh) => {
                        if (!wh) return { shifts: [{ start: '09:00', end: '22:00' }] };
                        // If already in new format, return as is
                        if (wh.shifts || (wh.isCustom && wh.days && Object.values(wh.days).some(d => d.shifts))) return wh;

                        if (wh.isCustom && wh.days) {
                            const newDays = {};
                            ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
                                const dayData = wh.days[day] || { active: true, start: '09:00', end: '22:00' };
                                newDays[day] = {
                                    active: dayData.active,
                                    shifts: dayData.shifts || [{ start: dayData.start || '09:00', end: dayData.end || '22:00' }]
                                };
                            });
                            return { ...wh, days: newDays };
                        } else {
                            return {
                                ...wh,
                                shifts: wh.shifts || [{ start: wh.start || '09:00', end: wh.end || '22:00' }]
                            };
                        }
                    };

                    setFormData(prev => ({
                        ...prev,
                        businessName: configs.agent_name || prev.businessName || '',
                        businessType: configs.specialty || prev.businessType || '',
                        description: configs.description || prev.description || '',
                        phone: configs.phone || prev.phone || '',
                        address: configs.address || prev.address || '',
                        website: configs.website || prev.website || '',
                        workingHours: migrateWorkingHours(configs.working_hours || prev.workingHours),
                        mission_statement: configs.mission_statement || prev.mission_statement || '',
                        target_audience: configs.target_audience || prev.target_audience || '',
                        brand_voice_details: configs.brand_voice_details || prev.brand_voice_details || '',
                        faq_data: (Array.isArray(configs.faq_data) && configs.faq_data.length > 0) ? configs.faq_data : (prev.faq_data || []),
                        sop_instructions: configs.sop_instructions || prev.sop_instructions || '',
                        knowledge_base: configs.knowledge_base || prev.knowledge_base || '',
                    }));
                    setIntegrationKeys({
                        website: configs.website || '',
                        telegram_token: configs.telegram_token || '',
                        whatsapp_number: configs.whatsapp_number || '',
                        whatsapp_api_key: configs.whatsapp_api_key || '',
                        google_sheets_id: configs.google_sheets_id || '',
                        google_calendar_id: configs.google_calendar_id || '',
                        welcome_message: configs.welcome_message || '',
                        widget_color: configs.widget_color || '#8B5CF6',
                    });

                    // If we don't have an agentId from URL, try to find the one linked to this config
                    if (!agentIdFromUrl) {
                        const { data: agentData } = await supabase
                            .from('agents')
                            .select('id')
                            .eq('salon_config_id', configs.id)
                            .maybeSingle();
                        
                        if (agentData) setAgentId(agentData.id);
                    }
                } else if (!agentIdFromUrl) {
                     // Last fallback: find any agent for this user
                     const { data: userAgent } = await supabase
                        .from('agents')
                        .select('id')
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle();
                    if (userAgent) setAgentId(userAgent.id);
                }
            }
        };
        checkUser().catch(err => {
            console.error("SalonSetup: Initialization error:", err);
        });
    }, [location.search]);

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

        if (!salonConfigId) {
            alert(language === 'ar' ? '⚠️ يرجى حفظ بيانات المنشأة (Entity Info) أولاً قبل إضافة الخدمات.' : '⚠️ Please save the Entity Info first before adding services.');
            return;
        }

        // Clean up empty fields to be NULL in DB for optional values
        const payload = {
            service_name: newService.service_name,
            price: newService.price || 0,
            duration_minutes: newService.duration_minutes || 0,
            description: newService.description || null,
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
            service_name: editingService.service_name,
            price: editingService.price || 0,
            duration_minutes: editingService.duration_minutes || 0,
            description: editingService.description || null,
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
        if (!formData.businessName) {
            alert(language === 'ar' ? '❌ يرجى إدخال "اسم المنشأة" أولاً في قسم معلومات المنشأة.' : '❌ Please enter the Business Name in the Entity Info section first.');
            return;
        }
        
        setLoading(true);
        try {
            const { user } = await getCurrentUser();
            if (!user) throw new Error('Authentication required. Please refresh.');

            // 1. Update Salon Config
            const configResult = await saveSalonConfig({
                id: salonConfigId,
                user_id: user.id,
                agent_name: formData.businessName,
                specialty: formData.businessType,
                description: formData.description || null,
                phone: formData.phone || null,
                address: formData.address || null,
                website: formData.website || null,
                working_hours: formData.workingHours || null,
                mission_statement: formData.mission_statement || null,
                target_audience: formData.target_audience || null,
                brand_voice_details: formData.brand_voice_details || null,
                faq_data: formData.faq_data || [],
                sop_instructions: formData.sop_instructions || null,
                knowledge_base: formData.knowledge_base || null,
                is_active: false,
            });

            if (!configResult.success) throw new Error(configResult.error);

            // 2. Sync to Agent Identity (Fix personality context)
            if (agentId && configResult.data?.id) {
                await updateAgent(agentId, {
                    name: formData.businessName,
                    specialty: formData.businessType,
                    salon_config_id: configResult.data.id
                });
            }

            // 3. Update Profile Extended Fields
            // Use supabase from the service import explicitly
            const { error: profileError } = await supabase.from('profiles').update({
                position: formData.position || null,
                business_type: formData.businessType || null,
                phone: formData.phone || null,
                business_name: formData.businessName || null
            }).eq('id', user.id);

            if (profileError) {
                console.warn("Profile update warning (safe if columns just added):", profileError);
            }

            alert(language === 'ar' ? '✅ تم تحديث بيانات المنشأة ومزامنة الموظف بنجاح!' : '✅ Business profile updated and agent synced successfully!');
        } catch (error) {
            console.error("Profile save error:", error);
            const msg = error.message || "";
            let hint = language === 'ar' 
                ? 'حدث خطأ غير متوقع أثناء الحفظ. يرجى المحاولة مرة أخرى أو التحقق من اتصالك بالإنترنت.' 
                : 'An unexpected error occurred while saving. Please try again or check your internet connection.';
            
            if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
                hint = language === 'ar' ? 'هذه البيانات موجودة مسبقاً.' : 'This data already exists.';
            }
            
            alert(hint);
        } finally {
            setLoading(false);
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
        fields.forEach(f => { 
            initial[f.key] = integrationKeys[f.key] || (f.type === 'color' ? '#8B5CF6' : ''); 
        });
        setIntegrationDraft(initial);
        setExpandedIntegration(id);
    };

    const handleSaveIntegration = async () => {
        if (!salonConfigId) {
            alert(language === 'ar' ? 'يرجى حفظ بيانات المنشأة أولاً.' : 'Please save entity info first.');
            return;
        }
        if (expandedIntegration === 'custom_request') {
            handleCustomToolRequest();
            return;
        }
        if (Object.keys(integrationDraft).length === 0) return;
        
        setIntegrationSaving(true);
        try {
            const { user } = await getCurrentUser();
            console.log("Saving integration via Service:", integrationDraft, "for ID:", salonConfigId);
            
            // 1. Update Salon Config
            const result = await saveSalonConfig({
                id: salonConfigId,
                user_id: user?.id,
                ...integrationDraft
            });
            
            if (!result.success) throw new Error(result.error);

            // 2. IMPORTANT: Sync Token to the specific Agent if active
            const currentAgentId = agentId || localStorage.getItem('currentAgentId');
            if (currentAgentId && result.success) {
                console.log("Syncing token to agent:", currentAgentId);
                const agentUpdate = {};
                if (integrationDraft.telegram_token) agentUpdate.telegram_token = integrationDraft.telegram_token;
                if (integrationDraft.whatsapp_number) agentUpdate.whatsapp_token = integrationDraft.whatsapp_number; // Syncing number as token reference if needed
                
                if (Object.keys(agentUpdate).length > 0) {
                    await updateAgent(currentAgentId, agentUpdate);
                }
            }

            // 3. Auto-Setup Telegram Webhook if token provided
            if (integrationDraft.telegram_token) {
                const token = integrationDraft.telegram_token;
                const projectUrl = import.meta.env.VITE_SUPABASE_URL || '';
                
                // Use the standard Supabase API gateway URL for functions
                const webhookUrl = `${projectUrl}/functions/v1/telegram-webhook?agent_id=${currentAgentId}`;
                
                console.log("Setting up Telegram Webhook with URL:", webhookUrl);
                fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
                    .then(r => r.json())
                    .then(res => console.log("Telegram Webhook Sync Result:", res))
                    .catch(e => console.warn("Webhook Sync Error:", e));
            }
            
            console.log("Integration saved and synced successfully ✅");
            
            setIntegrationKeys(prev => ({ ...prev, ...integrationDraft }));
            
            alert(language === 'ar' ? '✅ تم حفظ الإعدادات بنجاح!' : '✅ Settings saved successfully!');
            
            // Only collapse if not website (to keep the code snippet visible)
            if (expandedIntegration !== 'website') {
                setExpandedIntegration(null);
            }
        } catch (err) {
            console.error("Save integration error detail:", err);
            const msg = err.message || "Unknown error";
            const isCors = msg.includes('CORS') || msg.includes('fetch');
            const isTimeout = msg.includes('timeout') || msg.includes('30 seconds');

            let userMsg = language === 'ar' 
                ? '⚠️ حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.' 
                : '⚠️ Error saving settings. Please try again.';
                
            if (isCors || isTimeout) {
                userMsg = language === 'ar'
                    ? '⚠️ يرجى التأكد من جودة اتصال الإنترنت والمحاولة مرة أخرى.'
                    : '⚠️ Please check your internet connection and try again.';
            }
            
            alert(userMsg);
        } finally {
            setIntegrationSaving(false);
        }
    };

    const handleCustomToolRequest = async () => {
        if (!requestToolName.trim()) return;
        setIntegrationSaving(true);
        try {
            const { error } = await supabase.from('system_logs').insert([{
                level: 'info',
                category: 'system',
                message: `New Tool Request: ${requestToolName}`,
                details: {
                    tool_name: requestToolName,
                    reason: requestReason,
                    salon_config_id: salonConfigId
                }
            }]);
            if (error) throw error;
            setRequestSuccess(true);
            setTimeout(() => {
                setExpandedIntegration(null);
                setRequestSuccess(false);
                setRequestToolName('');
                setRequestReason('');
            }, 2500);
        } catch (err) {
            alert('Error sending request: ' + err.message);
        } finally {
            setIntegrationSaving(false);
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

    const inp = {
        width: '100%', padding: '11px 14px',
        background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: 'white', fontSize: '0.9rem',
        boxSizing: 'border-box', outline: 'none',
    };

    return (
        <div className="fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ar' ? 'right' : 'left', color: 'white' }}>

            {/* Page Header */}
            {paymentSuccess && (
                <div className="animate-fade-in" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#10B981'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle2 size={24} />
                        <div>
                            <span style={{ fontWeight: 800, display: 'block' }}>{language === 'ar' ? 'تم تفعيل الخدمة بنجاح!' : 'Plan Activated Successfully!'}</span>
                            <span style={{ fontSize: '0.85rem' }}>{language === 'ar' ? 'يمكنك الآن البدء بربط الأدوات وتدريب موظفك.' : 'You can now start connecting tools and training your agent.'}</span>
                        </div>
                    </div>
                    <button onClick={() => setPaymentSuccess(false)} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
            )}

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

                            <div style={{ padding: '1rem 1.2rem', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(109,40,217,0.05))', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <Sparkles size={18} color="#A78BFA" />
                                    <span style={{ fontWeight: 700, color: '#A78BFA', fontSize: '0.95rem' }}>
                                        {language === 'ar' ? 'الإعداد الذكي بالذكاء الاصطناعي' : 'AI-Powered Smart Setup'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.83rem', lineHeight: 1.6 }}>
                                    {language === 'ar'
                                        ? 'ارفع ملفات منشأتك (PDF, Word, Excel) للحصول على أفضل دقة. وكيلنا الذكي سيقرأها ويُنشئ لك ملف تعريفي متكامل تلقائياً.'
                                        : 'Upload your business files (PDF, Word, Excel) for best accuracy. Our AI agent will read them and auto-generate a complete profile.'}
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

                            {/* URL Input - Secondary & Experimental Section */}
                            <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', fontWeight: 600 }}>
                                        🔗 {language === 'ar' ? 'أضف روابط (اختياري - ميزة تجريبية)' : 'Add Links (Optional - Experimental)'}
                                    </label>
                                    <span style={{ fontSize: '0.7rem', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                                        {language === 'ar' ? '⚠️ استخراج الروابط قد يكون غير دقيق' : '⚠️ Extraction may be inaccurate'}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <LinkIcon size={16} style={{ position: 'absolute', [language === 'ar' ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                        <input type="url" value={aiUrl} onChange={e => setAiUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                                            placeholder="https://"
                                            style={{ ...inp, [language === 'ar' ? 'paddingRight' : 'paddingLeft']: 38 }} />
                                    </div>
                                    <button onClick={handleAddUrl}
                                        style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#A78BFA', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
                                
                                <p style={{ margin: '10px 0 0', color: '#6B7280', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                    {language === 'ar' 
                                        ? '💡 نوصي برفع ملفات PDF أو Word بدلاً من الروابط للحصول على نتائج أدق وأسرع.' 
                                        : '💡 We recommend uploading PDF/Word files instead of links for faster and more accurate results.'}
                                </p>
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
                                    : (<>
                                        <Sparkles size={18} /> 
                                        {aiFiles.length > 0 && aiUrlsList.length > 0 
                                            ? (language === 'ar' ? 'تحليل الملفات والروابط ✨' : 'Analyze Files & Links ✨')
                                            : aiFiles.length > 0 
                                            ? (language === 'ar' ? 'بدء تحليل الملفات ✨' : 'Start Analyzing Files ✨')
                                            : (language === 'ar' ? 'بدء استخراج البيانات ✨' : 'Start Data Extraction ✨')
                                        }
                                       </>)}
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
                                                    { key: 'mission_statement', labelAr: 'مهمة المنشأة (Mission)', labelEn: 'Mission Statement', multiline: true },
                                                    { key: 'target_audience', labelAr: 'الجمهور المستهدف', labelEn: 'Target Audience', multiline: false },
                                                    { key: 'brand_voice', labelAr: 'نبرة الصوت (Tone)', labelEn: 'Brand Voice', multiline: false },
                                                    { key: 'procedures', labelAr: 'إجراءات العمل (SOPs)', labelEn: 'Standard Procedures', multiline: true },
                                                    { key: 'description', labelAr: 'وصف عام', labelEn: 'General Description', multiline: true },
                                                    { key: 'services', labelAr: 'الخدمات المستخرجة', labelEn: 'Extracted Services', multiline: true },
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

                            {/* Mission Checklist Panel */}
                            <div style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.05)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <Target size={20} color="#F59E0B" />
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                        {language === 'ar' ? 'خارطة طريق نجاح الموظف الذكي' : 'Success Roadmap for your AI Agent'}
                                    </h4>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { 
                                            label: language === 'ar' ? 'وصف المنشأة' : 'Entity Description', 
                                            desc: language === 'ar' ? 'ليعرف من هو' : 'Identity info',
                                            done: !!formData.businessName 
                                        },
                                        { 
                                            label: language === 'ar' ? 'الخدمات والمنتجات' : 'Services & Products', 
                                            desc: language === 'ar' ? 'ليعرف ماذا يبيع' : 'Catalog info',
                                            done: services.length > 0 
                                        },
                                        { 
                                            label: language === 'ar' ? 'قنوات التواصل' : 'Communication Channels', 
                                            desc: language === 'ar' ? 'ليعرف أين يرد' : 'WhatsApp/Web',
                                            done: !!integrationKeys.telegram_token || !!integrationKeys.whatsapp_number 
                                        }
                                    ].map((step, i) => (
                                        <div key={i} style={{ padding: '10px', borderRadius: 8, background: step.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: step.done ? '#10B981' : 'white' }}>
                                                {step.done ? <Zap size={14} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />}
                                                {step.label}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>{step.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
                                        <option value="telecom_it">{language === 'ar' ? '📡 اتصالات وتقنية' : '📡 Telecom & IT'}</option>
                                        <option value="banking">{language === 'ar' ? '🏦 بنوك ومالية' : '🏦 Banking & Finance'}</option>
                                        <option value="real_estate">{language === 'ar' ? '🏢 عقارات' : '🏢 Real Estate'}</option>
                                        <option value="restaurant">{language === 'ar' ? '🍽️ مطاعم' : '🍽️ Restaurant'}</option>
                                        <option value="fitness">{language === 'ar' ? '💪 لياقة ورياضة' : '💪 Fitness & Sports'}</option>
                                        <option value="retail_ecommerce">{language === 'ar' ? '🛍️ تجزئة ومتاجر' : '🛍️ Retail & E-commerce'}</option>
                                        <option value="call_center">{language === 'ar' ? '🎧 خدمة عملاء' : '🎧 Customer Support'}</option>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)'}
                                    </label>
                                    <input style={inp} value={formData.website} type="url"
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                        {language === 'ar' ? 'منصبك الوظيفي' : 'Your Position'}
                                    </label>
                                    <input style={inp} value={formData.position} 
                                        onChange={e => setFormData({...formData, position: e.target.value})}
                                        placeholder={language === 'ar' ? 'مثال: المدير التنفيذي' : 'e.g. CEO, Manager'} />
                                </div>
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
                                />
                            </section>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '2rem' }}>
                                {/* 2. Business Knowledge Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                                            <Target size={18} color="#8B5CF6" />
                                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'مهمة المنشأة والجمهور المستهدف' : 'Mission & Audience'}</h4>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: 6 }}>{language === 'ar' ? 'رسالة المنشأة (لماذا نحن هنا؟)' : 'Business Mission'}</label>
                                                <textarea style={{ ...inp, minHeight: 60 }} placeholder={language === 'ar' ? 'مثال: تقديم أفضل خدمات العناية بالبشرة بأحدث التقنيات...' : 'e.g. Provide best skincare using latest tech...'} 
                                                    value={formData.mission_statement} onChange={e => setFormData({...formData, mission_statement: e.target.value})} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: 6 }}>{language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</label>
                                                <input style={inp} placeholder={language === 'ar' ? 'مثال: سيدات الأعمال، المهتمين بالجمال...' : 'e.g. Business women, beauty enthusiasts...'} 
                                                    value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                                            <BookOpen size={18} color="#8B5CF6" />
                                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'دليل إجراءات العمل (SOPs)' : 'Operating Procedures (SOPs)'}</h4>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '1rem' }}>
                                            {language === 'ar' ? 'أعطِ تعليمات واضحة للموظف حول كيفية التصرف في حالات معينة (مثل الخصومات، الإرجاع، المواعيد المستعجلة).' : 'Give clear instructions on how to handle specific cases (e.g. discounts, cancellations, urgent cues).'}
                                        </p>
                                        <textarea style={{ ...inp, minHeight: 180, border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(17, 24, 39, 0.4)' }} 
                                            placeholder={language === 'ar' ? 'مثال: إذا طلب العميل خصماً، قم بإبلاغه بوجود باقات التوفير...' : 'e.g. If client asks for discount, tell them about saving bundles...'} 
                                            value={formData.sop_instructions} onChange={e => setFormData({...formData, sop_instructions: e.target.value})} />
                                    </div>

                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                                            <Sparkles size={18} color="#8B5CF6" />
                                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions'}</h4>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {(formData.faq_data || []).map((faq, idx) => (
                                                <div key={idx} style={{ padding: 10, background: '#111827', borderRadius: 8, borderLeft: '3px solid #8B5CF6' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '0.85rem' }}>{faq.q}</strong>
                                                        <Trash2 size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => setFormData({...formData, faq_data: formData.faq_data.filter((_, i) => i !== idx)})} />
                                                    </div>
                                                    <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>{faq.a}</p>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                                <input style={inp} placeholder={language === 'ar' ? 'السؤال...' : 'Question...'} 
                                                    value={newFaq.q} onChange={e => setNewFaq({...newFaq, q: e.target.value})} />
                                                <textarea style={inp} placeholder={language === 'ar' ? 'الإجابة...' : 'Answer...'} 
                                                    value={newFaq.a} onChange={e => setNewFaq({...newFaq, a: e.target.value})} />
                                                <button onClick={() => {
                                                    if (newFaq.q && newFaq.a) {
                                                        setFormData({...formData, faq_data: [...(formData.faq_data || []), newFaq]});
                                                        setNewFaq({ q: '', a: '' });
                                                    }
                                                }} style={{ padding: 8, background: '#374151', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    {language === 'ar' ? '+ إضافة سؤال' : '+ Add Question'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Side Panel (Hours & Brand Voice) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Clock size={18} color="#8B5CF6" />
                                                <h4 style={{ margin: 0 }}>{language === 'ar' ? 'أوقات العمل' : 'Working Hours'}</h4>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const wh = { ...formData.workingHours };
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
                                                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: 4 }}>{language === 'ar' ? `وقت البدء (${sIdx + 1})` : `Start Time (${sIdx + 1})`}</label>
                                                            <input type="time" style={inp} value={shift.start} onChange={e => {
                                                                const newShifts = [...(formData.workingHours.shifts || [])];
                                                                newShifts[sIdx] = { ...shift, start: e.target.value };
                                                                setFormData({ ...formData, workingHours: { ...formData.workingHours, shifts: newShifts } });
                                                            }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: 4 }}>{language === 'ar' ? `وقت الانتهاء (${sIdx + 1})` : `End Time (${sIdx + 1})`}</label>
                                                            <input type="time" style={inp} value={shift.end} onChange={e => {
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
                                                    const daysAr = { Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };
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
                                                                    <input type="time" style={{ ...inp, padding: '4px', flex: 1, minWidth: 0, fontSize: '0.75rem' }}
                                                                        value={shift.start} onChange={e => {
                                                                            const wh = { ...formData.workingHours };
                                                                            const dShifts = [...wh.days[day].shifts];
                                                                            dShifts[sIdx] = { ...shift, start: e.target.value };
                                                                            wh.days[day] = { ...wh.days[day], shifts: dShifts };
                                                                            setFormData({ ...formData, workingHours: wh });
                                                                        }} />
                                                                    <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>-</span>
                                                                    <input type="time" style={{ ...inp, padding: '4px', flex: 1, minWidth: 0, fontSize: '0.75rem' }}
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

                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
                                            <MessageCircle size={18} color="#8B5CF6" />
                                            <h4 style={{ margin: 0 }}>{language === 'ar' ? 'نبرة الصوت (Tone)' : 'Brand Voice'}</h4>
                                        </div>
                                        <textarea style={{ ...inp, minHeight: 100 }} 
                                            placeholder={language === 'ar' ? 'مثال: احترافي، ودود، يتجنب الاختصارات...' : 'e.g. Professional, friendly, avoids slang...'} 
                                            value={formData.brand_voice_details} onChange={e => setFormData({...formData, brand_voice_details: e.target.value})} />
                                    </div>

                                    <button onClick={handleSave} disabled={loading}
                                        style={{
                                            padding: '14px', borderRadius: 12, border: 'none',
                                            background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                                            color: 'white', fontWeight: 700, cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                                            marginTop: '1rem'
                                        }}>
                                        {loading ? '...' : (language === 'ar' ? '✅ حفظ كل التعليمات' : '✅ Save All Instructions')}
                                    </button>
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
                                    { key: 'website', labelAr: 'رابط موقعك (دومين العميل)', labelEn: 'Target Website URL', placeholder: 'https://www.customer-site.com', password: false, hintAr: 'الموقع المستهدف', hintEn: 'Target site', guide: null },
                                    { key: 'welcome_message', labelAr: 'رسالة الترحيب', labelEn: 'Welcome Message', placeholder: 'Hello! How can I help you?', password: false, hintAr: 'تظهر عند فتح المحادثة', hintEn: 'Shows when chat opens', guide: null },
                                    { key: 'widget_color', labelAr: 'لون المحادثة', labelEn: 'Widget Color', type: 'color', password: false, hintAr: 'لون ليناسب هوية موقعك', hintEn: 'Match your website brand', guide: null }
                                ],
                                customContent: (expandedIntegration === 'website') ? (
                                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: agentId ? '#22C55E' : '#F59E0B' }}></div>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: agentId ? '#818CF8' : '#F59E0B' }}>
                                                {agentId 
                                                    ? (language === 'ar' ? 'جاهز للتضمين' : 'Ready to Embed') 
                                                    : (language === 'ar' ? 'يرجى تعيين موظف أولاً' : 'Hire an Agent first')}
                                            </span>
                                        </div>
                                        {agentId ? (
                                            <>
                                                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                                                    {language === 'ar'
                                                        ? 'انسخ الكود أدناه وضعه قبل وسم </body> في موقعك ليتمكن الزوار من التحدث مع موظفك الذكي.'
                                                        : 'Copy the code below and paste it before the </body> tag on your website to allow visitors to chat with your agent.'}
                                                </p>
                                                <div style={{ position: 'relative' }}>
                                                    <pre style={{
                                                        background: '#0F172A',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        color: '#E2E8F0',
                                                        overflowX: 'auto',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {`<script
  src="${(window.location.origin.includes('localhost') ? 'https://24shift.solutions' : window.location.origin)}/widget.js"
  data-agent-id="${agentId}"
  data-name="${formData.businessName || 'Elite Agent'}"
  data-welcome="${integrationDraft.welcome_message || integrationKeys.welcome_message || 'Hello!'}"
  data-color="${integrationDraft.widget_color || integrationKeys.widget_color || '#8B5CF6'}"
></script>`}
                                                    </pre>
                                                    <button 
                                                        onClick={() => {
                                                            const finalBase = window.location.origin.includes('localhost') ? 'https://24shift.solutions' : window.location.origin;
                                                            const code = `<script src="${finalBase}/widget.js" data-agent-id="${agentId}" data-name="${formData.businessName || 'Elite Agent'}" data-welcome="${integrationDraft.welcome_message || integrationKeys.welcome_message || 'Hello!'}" data-color="${integrationDraft.widget_color || integrationKeys.widget_color || '#8B5CF6'}"></script>`;
                                                            navigator.clipboard.writeText(code);
                                                            alert(language === 'ar' ? 'تم نسخ الكود!' : 'Code copied!');
                                                        }}
                                                        style={{
                                                            position: 'absolute', top: '8px', [language === 'ar' ? 'left' : 'right']: '8px',
                                                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer'
                                                        }}>
                                                        {language === 'ar' ? 'نسخ' : 'Copy'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                                                {language === 'ar' 
                                                    ? 'يجب عليك توظيف موظف ذكي واحد على الأقل ليظهر كود التضمين الخاص به.' 
                                                    : 'You need to hire at least one AI agent to see the embedding code.'}
                                            </p>
                                        )}
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                            <a href={`/test-widget.html?agentId=${agentId || ''}&name=${encodeURIComponent(formData.businessName || 'Elite Agent')}&welcome=${encodeURIComponent(integrationKeys.welcome_message || 'Hello!')}`} target="_blank" rel="noreferrer" style={{
                                                fontSize: '0.8rem', color: '#818CF8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <Globe size={14} /> {language === 'ar' ? 'تجربة المحادثة الآن' : 'Test Widget Now'}
                                            </a>
                                        </div>
                                    </div>
                                ) : null
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
                                badge: 'Add-on', badgeColor: '#10B981',
                                fields: [
                                    { key: 'whatsapp_number', labelAr: 'معرف رقم الهاتف (Phone ID)', labelEn: 'Phone Number ID', placeholder: '101234567890', password: false, hintAr: 'من Meta Developers', hintEn: 'from Meta Developers', guide: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' },
                                    { key: 'whatsapp_api_key', labelAr: 'رمز الوصول (Access Token)', labelEn: 'Access Token', placeholder: 'EAAG...', password: true, hintAr: 'رمز الوصول الدائم', hintEn: 'Permanent Access Token', guide: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' }
                                ]
                            },
                            {
                                id: 'instagram', icon: Instagram, color: '#E1306C',
                                titleAr: 'انستقرام (قريباً)', titleEn: 'Instagram (Beta)',
                                descAr: 'الرد على الرسائل الخاصة والتعليقات',
                                descEn: 'Reply to DMs and comments automatically',
                                badge: 'Beta', badgeColor: '#F59E0B',
                                fields: [
                                    { key: 'instagram_id', labelAr: 'معرف الحساب', labelEn: 'Account ID', placeholder: '12345...', password: false, hintAr: 'اختياري في المرحلة التجريبية', hintEn: 'Optional in beta', guide: null }
                                ]
                            },
                            {
                                id: 'sheets', icon: FileText, color: '#0F9D58',
                                titleAr: 'جداول جوجل', titleEn: 'Google Sheets',
                                descAr: 'تصدير الحجوزات والعملاء تلقائياً لجدولك',
                                descEn: 'Auto-export bookings to Google Sheets',
                                badge: 'Pro', badgeColor: '#F59E0B',
                                comingSoon: true,
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
                                comingSoon: true,
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
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'linkedin_org', icon: Linkedin, color: '#0A66C2',
                                titleAr: 'لينكد إن (الصفحات)', titleEn: 'LinkedIn (Organization)',
                                descAr: 'إدارة حساب شركتك على لينكد إن ونشر المحتوى.',
                                descEn: 'Create and share posts on your organization\'s behalf.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'facebook', icon: Facebook, color: '#1877F2',
                                titleAr: 'فيسبوك', titleEn: 'Facebook',
                                descAr: 'إدارة صفحات الفيسبوك وحسابات إنستغرام والنشر.',
                                descEn: 'Manage Facebook and Instagram pages, accounts, and posts.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'instagram', icon: Instagram, color: '#E4405F',
                                titleAr: 'إنستغرام', titleEn: 'Instagram',
                                descAr: 'إدارة حساب إنستغرام للأعمال أو منشئ المحتوى.',
                                descEn: 'Manage your Instagram Business or Creator account.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'gmail', icon: Mail, color: '#EA4335',
                                titleAr: 'جيميل', titleEn: 'Gmail',
                                descAr: 'اسمح للموظفين بقراءة رسائلك الجيميل والرد عليها.',
                                descEn: 'Let helpers send emails and read your inbox.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'outlook', icon: Mail, color: '#0078D4',
                                titleAr: 'آوتلوك', titleEn: 'Outlook',
                                descAr: 'التعامل التلقائي مع رسائل بريدك على خدمة آوتلوك.',
                                descEn: 'Handle your Outlook emails.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'drive', icon: HardDrive, color: '#1FA463',
                                titleAr: 'جوجل درايف', titleEn: 'Google Drive',
                                descAr: 'إنشاء ومقروئية المستندات والجداول تلقائياً.',
                                descEn: 'Create and read docs, sheets, and other files.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'notion', icon: BookOpen, color: '#000000',
                                titleAr: 'نوشن', titleEn: 'Notion',
                                descAr: 'قراءة وتحديث بيانات مساحة العمل الخاصة بك.',
                                descEn: 'Read and update your Notion data.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'quickbooks', icon: Briefcase, color: '#2CA01C',
                                titleAr: 'كويك بوكس', titleEn: 'QuickBooks',
                                descAr: 'قراءة وتحديث الفواتير والبيانات المحاسبية.',
                                descEn: 'Read and update your QuickBooks data.',
                                badge: 'OAuth', badgeColor: '#3B82F6', comingSoon: true, fields: []
                            },
                            {
                                id: 'custom_request', icon: Puzzle, color: '#8B5CF6',
                                titleAr: 'طلب أداة مخصصة', titleEn: 'Request Custom Tool',
                                descAr: 'هل تحتاج لربط أداة غير موجودة؟ اطلبها الآن.',
                                descEn: 'Need an integration not listed here? Let us know.',
                                badge: language === 'ar' ? 'جديد' : 'New', badgeColor: '#F59E0B',
                                fields: [
                                    { key: 'tool_name', labelAr: 'اسم الأداة', labelEn: 'Tool Name', placeholder: 'Slack, Zapier...', password: false, hintAr: 'الأداة المطلوبة', hintEn: 'Required service', guide: null },
                                    { key: 'reason', labelAr: 'سبب الاستخدام', labelEn: 'How will you use it?', placeholder: 'Describe your workflow...', password: false, hintAr: 'اختياري', hintEn: 'Optional', guide: null }
                                ]
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
                                        const isConnected = card.fields.length > 0 ? card.fields.some(f => !!integrationKeys[f.key]) : !!integrationKeys[`oauth_${card.id}`];
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
                                                        {card.comingSoon ? (
                                                            <div style={{
                                                                background: 'rgba(255,255,255,0.05)',
                                                                color: '#9CA3AF',
                                                                padding: '6px 14px',
                                                                borderRadius: 99,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                            }}>
                                                                {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                                                            </div>
                                                        ) : card.fields.length > 0 ? (
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
                                                                onClick={() => !isConnected && handleOAuthConnect(card.id)}
                                                                disabled={loadingOAuth === card.id}
                                                                style={{
                                                                    background: isConnected ? 'rgba(255,255,255,0.08)' : '#3B82F6',
                                                                    color: isConnected ? '#10B981' : '#FFFFFF',
                                                                    border: isConnected ? '1px solid rgba(16,185,129,0.3)' : 'none',
                                                                    borderRadius: 99, padding: '7px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: isConnected || loadingOAuth === card.id ? 'default' : 'pointer', transition: '0.2s',
                                                                    boxShadow: isConnected ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.4)',
                                                                    display: 'flex', alignItems: 'center', gap: 6, opacity: loadingOAuth === card.id ? 0.7 : 1
                                                                }}>
                                                                {loadingOAuth === card.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                                                {isConnected ? (language === 'ar' ? 'متصل' : 'Linked') : (language === 'ar' ? 'توصيل' : 'Connect')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Form / Setup Fields */}
                                                {isOpen && card.fields.length > 0 && (
                                                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {card.id === 'custom_request' ? (
                                                            /* Render special custom request fields if ID matches */
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                                                <div>
                                                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                                                        {language === 'ar' ? 'اسم الأداة أو المنصة' : 'Tool / Platform Name'}
                                                                    </label>
                                                                    <input style={inp} value={requestToolName}
                                                                        onChange={e => setRequestToolName(e.target.value)}
                                                                        placeholder="e.g. Slack, WhatsApp API, Zapier..." />
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                                                        {language === 'ar' ? 'وصف الاحتياج' : 'Description of Need'}
                                                                    </label>
                                                                    <textarea style={{ ...inp, resize: 'vertical' }} rows={2}
                                                                        value={requestReason}
                                                                        onChange={e => setRequestReason(e.target.value)}
                                                                        placeholder={language === 'ar' ? 'لماذا تحتاج هذا الربط؟' : 'How will this help your workflow?'} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            card.fields.map(f => (
                                                                <div key={f.key} style={{ marginTop: 16 }}>
                                                                    <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', marginBottom: 8, fontWeight: 500 }}>
                                                                        {language === 'ar' ? f.labelAr : f.labelEn}
                                                                        <span style={{ fontWeight: 400, color: '#6B7280', marginInlineStart: 8 }}>
                                                                            — {language === 'ar' ? f.hintAr : f.hintEn}
                                                                        </span>
                                                                    </label>
                                                                    <input
                                                                        type={f.password ? 'password' : f.type || 'text'}
                                                                        value={integrationDraft[f.key] ?? (f.type === 'color' ? '#8B5CF6' : '')}
                                                                        onChange={e => setIntegrationDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                        placeholder={f.placeholder}
                                                                        style={{
                                                                            width: '100%', padding: f.type === 'color' ? '2px 6px' : '10px 14px', height: f.type === 'color' ? '42px' : 'auto', background: '#27272A', border: '1px solid #3F3F46', borderRadius: 10, color: '#FFFFFF',
                                                                            fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: f.password ? '0.1em' : 'normal', outline: 'none', cursor: f.type === 'color' ? 'pointer' : 'text'
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
                                                            ))
                                                        )}

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
                                                                {integrationSaving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (requestSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                                                                {integrationSaving
                                                                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending Request...')
                                                                    : (requestSuccess 
                                                                        ? (language === 'ar' ? 'تم الإرسال!' : 'Request Sent!')
                                                                        : (isOpen && card.id === 'custom_request' 
                                                                            ? (language === 'ar' ? 'إرسال الطلب' : 'Send Request')
                                                                            : (language === 'ar' ? 'حفظ البيانات' : 'Save Connection')
                                                                          )
                                                                      )}
                                                            </button>
                                                        </div>

                                                        {card.customContent && card.customContent}

                                                        {card.id === 'website' && (
                                                            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
                                                                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#EF4444', fontWeight: 700 }}>
                                                                    {language === 'ar' ? '⚠️ تجديد ذكاء الموظف' : '⚠️ Reset Industry Intelligence'}
                                                                </h4>
                                                                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#9CA3AF', lineHeight: 1.4 }}>
                                                                    {language === 'ar'
                                                                        ? 'إذا كان الموظف يرد بمعلومات خاطئة عن نشاطك (مثلاً يرد كصالون تجميل وأنت شركة برمجيات)، اضغط هنا لمسح البيانات القديمة.'
                                                                        : 'If the agent is giving wrong info (e.g. answering like a salon when you are a software firm), reset old data here.'}
                                                                </p>
                                                                <button 
                                                                    onClick={async () => {
                                                                        if (!confirm(language === 'ar' ? 'هل أنت متأكد من مسح خدمات النشاط؟' : 'Are you sure you want to wipe business services?')) return;
                                                                        try {
                                                                            const { error } = await supabase.from('salon_services').delete().eq('salon_config_id', salonConfigId);
                                                                            if (error) throw error;
                                                                            alert(language === 'ar' ? '✅ تم تصفير البيانات! قم بتحديث الصفحة وسيعود الذكاء لبروفايلك الحالي.' : '✅ Data cleared! Refresh page to force AI reset.');
                                                                        } catch (e) {
                                                                            alert('Error: ' + e.message);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                                                                    {language === 'ar' ? 'مسح بيانات الخدمات القديمة' : 'Wipe Stale Service Data'}
                                                                </button>
                                                            </div>
                                                        )}
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
