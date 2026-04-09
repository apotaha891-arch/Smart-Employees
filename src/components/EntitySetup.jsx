import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
    getCurrentUser, getProfile, getWalletBalance, saveEntityConfig, 
    activateEntityAgent, getServices, addService, updateService, 
    deleteService, linkGoogleAccount, saveIntegrationCredentials, 
    getIntegrations, updateAgent, invokeMultiFileWorkflow, getAgents,
    supabase 
} from '../services/supabaseService';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, FileText, Calendar, CheckCircle2, Smartphone, AlertCircle,
    MessageCircle, Settings, Upload, Clock, Briefcase, Sparkles,
    CreditCard, Activity, Users, Send, Plus, Edit2, Trash2, Save, X, Puzzle, Star, Target, Zap,
    Link as LinkIcon, Loader, Globe, Linkedin, Facebook, Instagram, Mail, HardDrive, BookOpen
} from 'lucide-react';
import ServicesTable from './ServicesTable';

const EntitySetup = () => {
    const hasInitialized = useRef(false);
    const { user: contextUser, isImpersonating, realUser } = useAuth(); // Use AuthContext user (supports impersonation)
    const isAgencyAdmin = realUser?.is_agency === true;
    console.info("EntitySetup: Loaded (v3-stability-fix). Status Banner ready.");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'sources';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [entityId, setEntityId] = useState(null);
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
    const [requestContactName, setRequestContactName] = useState('');
    const [requestContactPhone, setRequestContactPhone] = useState('');
    const [requestContactEmail, setRequestContactEmail] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [agentId, setAgentId] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [userTier, setUserTier] = useState('starter'); // Default to starter
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [isTestingSheets, setIsTestingSheets] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpModalType, setHelpModalType] = useState(null);
    const [activeFieldGuide, setActiveFieldGuide] = useState(null);

    const integrationGuides = {
        whatsapp_api_key: {
            stepsAr: [
                'اذهب إلى (Meta for Developers) وافتح تطبيقك.',
                'من القائمة الجانبية اختر (WhatsApp) ثم (Configuration).',
                'قم بإنشاء (System User Token) جديد.',
                'تأكد من اختيار صلاحيات: whatsapp_business_management و whatsapp_business_messaging.'
            ],
            stepsEn: [
                'Go to (Meta for Developers) and open your app.',
                'From the side menu, select (WhatsApp) then (Configuration).',
                'Generate a new (System User Token).',
                'Ensure you select: whatsapp_business_management and whatsapp_business_messaging permissions.'
            ],
            url: 'https://developers.facebook.com/apps/'
        },
        whatsapp_number: {
            stepsAr: [
                'اذهب إلى تطبيقك في Meta for Developers.',
                'اختر (WhatsApp) ثم (API Setup).',
                'ستجد (Phone number ID) في قسم خطوات الإرسال.',
                'انسخ الرقم الطويل المكون من عدة خانات.'
            ],
            stepsEn: [
                'Go to your app in Meta for Developers.',
                'Select (WhatsApp) then (API Setup).',
                'You will find (Phone number ID) in the "Send and receive messages" section.',
                'Copy the long numeric ID.'
            ],
            url: 'https://developers.facebook.com/apps/'
        },
        whatsapp_waba_id: {
            stepsAr: [
                'اذهب إلى تطبيقك في Meta for Developers.',
                'اختر (WhatsApp) ثم (API Setup).',
                'ستجد (WhatsApp Business Account ID) تحت رقم الهاتف.',
                'انسخ هذا المعرّف لاستخدامه هنا.'
            ],
            stepsEn: [
                'Go to your app in Meta for Developers.',
                'Select (WhatsApp) then (API Setup).',
                'You will find (WhatsApp Business Account ID) right below the Phone ID.',
                'Copy this ID to use here.'
            ],
            url: 'https://developers.facebook.com/apps/'
        },
        instagram_token: {
            stepsAr: [
                'اذهب إلى Meta for Developers.',
                'أنشئ (System User Token) مع صلاحية instagram_manage_messages.',
                'يجب أن يكون حساب إنستجرام مربوطاً بصفحة فيسبوك داخل نفس الـ Business Manager.'
            ],
            stepsEn: [
                'Go to Meta for Developers.',
                'Generate a (System User Token) with instagram_manage_messages permission.',
                'Ensure your Instagram account is linked to a Facebook Page within the same Business Manager.'
            ],
            url: 'https://developers.facebook.com/apps/'
        },
        instagram_account_id: {
            stepsAr: [
                'افتح (Meta Business Suite).',
                'اذهب إلى (Settings) ثم (Business Assets).',
                'اذهب لتبويب (Instagram Accounts) وستجد المعرّف هناك.',
                'أو من خلال إعدادات صفحة فيسبوك المربوطة.'
            ],
            stepsEn: [
                'Open (Meta Business Suite).',
                'Go to (Settings) then (Business Assets).',
                'Go to the (Instagram Accounts) tab to find the ID.',
                'Alternatively, find it via your linked Facebook Page settings.'
            ]
        },
        google_sheets_id: {
            stepsAr: [
                'افتح ملف جوجل شيت الخاص بك.',
                'انسخ الجزء الموجود في الرابط (URL) بين /d/ و /edit.',
                'مثال: 1BxiMVs0XRA... هو المعرّف المطلوب.'
            ],
            stepsEn: [
                'Open your Google Sheet.',
                'Copy the part of the URL between /d/ and /edit.',
                'Example: 1BxiMVs0XRA... is the ID you need.'
            ]
        }
    };
    
    // Shared Styles
    const cardStyle = {
        padding: '1.25rem',
        background: '#1F2937',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease'
    };

    const inp = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease'
    };


    const handleOAuthConnect = async (platformId) => {
        if (platformId === 'instagram') {
            setLoadingOAuth(platformId);
            const { user } = await getCurrentUser();
            if (!user) {
                alert(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                setLoadingOAuth(null);
                return;
            }
            // Redirect to our new Edge Function for OAuth handshake
            const authUrl = `${supabaseUrl}/functions/v1/instagram-auth/authorize?user_id=${user.id}`;
            window.location.href = authUrl;
            return;
        }

        // Default "Coming Soon" behavior for other OAuth services
        alert(language === 'ar' ? 'هذه الميزة (OAuth) سيتم تفعيلها قريباً! الموظف حالياً يدعم الربط السريع عبر Service Accounts.' : 'This OAuth feature is coming soon! Currently, we support Fast Sync via Service Accounts.');
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
        booking_requires_confirmation: false,
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

    const handleTestSheetsConnection = async () => {
        const spreadsheetId = integrationKeys.google_sheets_id || integrationDraft.google_sheets_id;
        if (!spreadsheetId) {
            alert(language === 'ar' ? 'يرجى إدخال معرّف الجدول أولاً' : 'Please enter Spreadsheet ID first');
            return;
        }
        
        setIsTestingSheets(true);
        let timeoutId;
        try {
            // Use a longer timeout (45s) for initial service initialization (cold starts)
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Connection timeout (45s). This might be due to a cold start or slow internet. Please try again.')), 45000);
            });

            const invokePromise = supabase.functions.invoke('sheets-sync', {
                body: {
                    type: 'INSERT',
                    record: {
                        id: 'test-' + Date.now(),
                        user_id: currentUserId,
                        entity_id: entityId,
                        salon_config_id: entityId, // USE STABLE COLUMN NAME
                        customer_name: 'نورة (اختبار الربط) ✨',
                        customer_phone: '12345678',
                        service_requested: 'Test Service / خدمة تجريبية',
                        booking_date: new Date().toLocaleDateString(),
                        booking_time: new Date().toLocaleTimeString(),
                        status: 'test'
                    },
                    test_spreadsheet_id: spreadsheetId 
                }
            });

            const { data, error } = await Promise.race([
                invokePromise,
                timeoutPromise
            ]);

            if (error) throw error;
            
            // Handle string response or object response
            const result = typeof data === 'string' ? { success: false, error: data } : data;

            if (result?.success) {
                setStatusMsg({ 
                    type: 'success', 
                    text: language === 'ar' ? '✅ تم إرسال صف تجريبي بنجاح! تحقق من جدول البيانات الخاص بك.' : '✅ Test row sent successfully! Check your spreadsheet.' 
                });
            } else {
                throw new Error(result?.error || (language === 'ar' ? 'فشل الاختبار: تأكد من مشاركة الجدول مع البريد الإلكتروني المذكور.' : 'Test failed: Make sure the sheet is shared with the indicated email.'));
            }
        } catch (err) {
            console.error('Sheets test error:', err);
            setStatusMsg({ 
                type: 'error', 
                text: language === 'ar' ? `❌ فشل الاختبار: ${err.message}` : `❌ Test failed: ${err.message}` 
            });
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            setIsTestingSheets(false);
            // Auto hide message after 5 seconds
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
        }
    };

    const [isTestingCalendar, setIsTestingCalendar] = useState(false);

    const handleTestCalendarConnection = async () => {
        const calendarId = integrationKeys.google_calendar_id || integrationDraft.google_calendar_id || 'primary';
        
        setIsTestingCalendar(true);
        let calendarTimeoutId;
        try {
            const invokePromise = supabase.functions.invoke('calendar-sync', {
                body: {
                    type: 'TEST',
                    calendar_id: calendarId,
                    user_id: currentUserId,
                    event: {
                        summary: 'نورة (اختبار الربط) ✨',
                        description: 'تم إنشاء هذا الحدث لاختبار ربط التقويم مع الموظف الذكي.',
                        start: {
                            dateTime: new Date(Date.now() + 3600000).toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: new Date(Date.now() + 7200000).toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                    }
                }
            });

            const { data, error } = await Promise.race([
                invokePromise,
                new Promise((_, rej) => {
                    calendarTimeoutId = setTimeout(() => rej(new Error(language === 'ar' ? "انتهت مهلة الاتصال (45 ثانية). يرجى التحقق من الإنترنت." : "Connection timeout (45s). Please check your internet.")), 45000);
                })
            ]);

            if (error) throw error;
            const result = typeof data === 'string' ? { success: false, error: data } : data;

            if (result?.success) {
                setStatusMsg({ 
                    type: 'success', 
                    text: language === 'ar' ? '✅ تم إنشاء موعد تجريبي بنجاح! تحقق من تقويم جوجل الخاص بك.' : '✅ Test event created successfully! Check your Google Calendar.' 
                });
            } else {
                throw new Error(result?.error || (language === 'ar' ? 'فشل الاختبار: تأكد من مشاركة التقويم مع البريد الإلكتروني المذكور.' : 'Test failed: Make sure the calendar is shared with the indicated email.'));
            }
        } catch (err) {
            console.error('Calendar test error:', err);
            setStatusMsg({ 
                type: 'error', 
                text: language === 'ar' ? `❌ فشل الاختبار: ${err.message}` : `❌ Test failed: ${err.message}` 
            });
        } finally {
            if (calendarTimeoutId) clearTimeout(calendarTimeoutId);
            setIsTestingCalendar(false);
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
        }
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
        console.log("EntitySetup: Initiating AI Extraction", { files: aiFiles.length, urls: aiUrlsList });
        
        try {
            const result = await invokeMultiFileWorkflow(aiFiles, aiUrlsList);
            console.log("EntitySetup: Extraction Result:", result);
            
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
                console.log("EntitySetup: Profile extracted and set for preview ✅");
            } else {
                console.error("EntitySetup: Extraction failed:", result.error);
                alert(language === 'ar' ? 'حدث خطأ أثناء التحليل: ' + result.error : 'Analysis error: ' + result.error);
            }
        } catch (error) {
            console.error("EntitySetup: Unexpected error during AI generate:", error);
            alert(language === 'ar' ? 'خطأ غير متوقع: ' + error.message : 'Unexpected error: ' + error.message);
        } finally {
            setAiLoading(false);
            console.log("EntitySetup: AI Extraction process finished.");
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
            knowledge_base: (extractedProfile.knowledgeBase || prev.knowledge_base) + 
                           (extractedProfile.services ? `\n\nOFFICIAL SERVICES:\n${extractedProfile.services}` : ''),
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
            const configResult = await saveEntityConfig({
                id: entityId, // IMPORTANT: Maintain existing ID if possible
                user_id: user.id,
                agent_name: extractedProfile.businessName,
                specialty: extractedProfile.businessType,
                description: extractedProfile.description,
                phone: extractedProfile.phone,
                address: extractedProfile.address,
                website: extractedProfile.website,
                // Combine knowledge base with services for the AI to read immediately
                knowledge_base: (extractedProfile.knowledgeBase || '') + 
                               (extractedProfile.services ? `\n\nOFFICIAL SERVICES:\n${extractedProfile.services}` : ''),
                mission_statement: extractedProfile.mission_statement,
                target_audience: extractedProfile.target_audience,
                brand_voice_details: extractedProfile.brand_voice,
                sop_instructions: extractedProfile.procedures,
                is_active: false,
            });
            if (!configResult.success) throw new Error(configResult.error);
            setEntityId(configResult.data.id);
            setExtractedProfile(null);
            setAiFiles([]);
            setAiUrlsList([]);
            
            // If we have an agentId, sync it immediately to avoid losing the reference
            const currentAgentId = agentId || localStorage.getItem('currentAgentId');
            if (currentAgentId) {
                await updateAgent(currentAgentId, {
                    name: extractedProfile.businessName,
                    specialty: extractedProfile.businessType,
                    entity_id: configResult.data.id
                });
            }

            setActiveTab('identity');
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم حفظ بيانات المنشأة ومزامنة الموظف بنجاح!' : '✅ Entity profile saved and agent synced successfully!' });
        } catch (err) {
            setStatusMsg({ type: 'error', text: (language === 'ar' ? '❌ فشل الحفظ: ' : '❌ Save failed: ') + err.message });
        }
        setLoading(false);
    };


    useEffect(() => {
        // Reset init flag when user changes (e.g., agency switches between clients)
        hasInitialized.current = false;
    }, [contextUser?.id]);

    useEffect(() => {
        // Guard to prevent infinite re-initialization loops
        if (hasInitialized.current) return;
        // Wait until we have a user from AuthContext
        if (!contextUser?.id) return;
        
        const checkUser = async () => {
            let configs = null;
            // Use contextUser from AuthContext — correctly reflects impersonated client
            const user = contextUser;
            
            if (user) {
                console.info("EntitySetup: [INIT] Starting initialization for user", user.id);
                hasInitialized.current = true;
                setCurrentUserId(user.id);


                // Priority 1: Fetch the global/latest entities as baseline
                const { data: globalConfigs, error: globalError } = await supabase
                    .from('entities')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (globalError) console.error("EntitySetup: Error fetching global configs:", globalError);
                if (globalConfigs) {
                    console.log("EntitySetup: Found global config baseline:", globalConfigs.id);
                    configs = globalConfigs;
                }

                // Priority 2: If we have an agent, fetch the config specific to it (OVERRIDE)
                let finalAgentId = queryParams.get('agent');
                
                // Fallback: If no agent in URL, find the first agent for this user
                if (!finalAgentId) {
                    console.log("EntitySetup: No agent in URL, fetching default agent...");
                    const { data: userAgents } = await getAgents();
                    if (userAgents && userAgents.length > 0) {
                        finalAgentId = userAgents[0].id;
                        console.log("EntitySetup: Auto-detected default agent:", finalAgentId);
                    }
                }

                if (finalAgentId) {
                    setAgentId(finalAgentId);
                    localStorage.setItem('currentAgentId', finalAgentId);

                    const { data: linkedAgent } = await supabase
                        .from('agents')
                        .select('entity_id')
                        .eq('id', finalAgentId)
                        .maybeSingle();
                    
                    if (linkedAgent?.entity_id) {
                        const { data: linkedConfig } = await supabase
                            .from('entities')
                            .select('*')
                            .eq('id', linkedAgent.entity_id)
                            .maybeSingle();
                        if (linkedConfig) {
                            console.log("EntitySetup: Found agent-specific config override:", linkedConfig.id);
                            configs = linkedConfig;
                        }
                    }
                }

                const profileResult = await getProfile(user.id);
                if (profileResult.success && profileResult.data) {
                    const balanceResult = await getWalletBalance(user.id);
                    if (balanceResult.success) {
                        setWalletBalance(balanceResult.balance);
                    }
                    
                    // Industry detection based on config OR profile
                    const type = (configs?.specialty || profileResult.data.business_type || '').toLowerCase();
                    if (type?.includes('طب') || type?.includes('صحي') || type?.includes('clinic') || type === 'medical') setIndustry('medical');
                    else if (type?.includes('عقار') || type?.includes('estate') || type === 'real_estate') setIndustry('realestate');
                    else if (type?.includes('تجميل') || type?.includes('salon') || type?.includes('beauty') || type === 'beauty') setIndustry('beauty');
                    else if (type?.includes('مطعم') || type?.includes('restau') || type === 'restaurant') setIndustry('restaurant');
                    else if (type?.includes('رياض') || type?.includes('gym') || type?.includes('club') || type?.includes('fit') || type === 'fitness') setIndustry('fitness');
                    else if (type === 'retail_ecommerce') setIndustry('retail_ecommerce');
                    else if (type === 'banking' || type?.includes('بنك') || type?.includes('مالي')) setIndustry('banking');
                    else if (type === 'call_center' || type?.includes('اتصال') || type?.includes('خدمة')) setIndustry('call_center');
                    else if (type === 'telecom_it' || type?.includes('تكنو') || type?.includes('برمج') || type?.includes('it')) setIndustry('telecom_it');

                    // Set Form Data from config or fallback to profile
                    setFormData(prev => ({
                        ...prev,
                        businessName: configs?.agent_name || profileResult.data.business_name || prev.businessName,
                        businessType: configs?.specialty || profileResult.data.business_type || prev.businessType,
                        description: configs?.description || prev.description,
                        phone: configs?.phone || profileResult.data.phone || prev.phone,
                        address: configs?.address || prev.address,
                        website: configs?.website || profileResult.data.website || prev.website,
                        position: profileResult.data.position || prev.position,
                        knowledge_base: configs?.knowledge_base || prev.knowledge_base,
                    }));
                }

                if (configs) {
                    console.log("EntitySetup: Finalizing sync... Config ID ->", configs.id);
                    setEntityId(configs.id);

                    // Migration logic for multiple shifts
                    const migrateWorkingHours = (wh) => {
                        if (!wh) return { shifts: [{ start: '09:00', end: '22:00' }] };
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
                        booking_requires_confirmation: configs.booking_requires_confirmation ?? prev.booking_requires_confirmation ?? false,
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

                    // If we didn't have an agentId from URL, try to find one for this config
                    const agentIdFromUrl = queryParams.get('agent');
                    if (!agentIdFromUrl) {
                        const { data: agentData } = await supabase
                            .from('agents')
                            .select('id')
                            .eq('entity_id', configs.id)
                            .maybeSingle();
                        if (agentData) setAgentId(agentData.id);
                    }
                } else {
                    const agentIdFromUrl = queryParams.get('agent');
                     if (!agentIdFromUrl) {
                        const { data: userAgent } = await supabase
                            .from('agents')
                            .select('id')
                            .eq('user_id', user.id)
                            .limit(1)
                            .maybeSingle();
                        if (userAgent) setAgentId(userAgent.id);
                     }
                }
            }
        };
        checkUser().catch(err => {
            console.error("EntitySetup: Initialization error:", err);
            setStatusMsg({ type: 'error', text: isAr ? '❌ فشل تحميل البيانات.' : '❌ Failed to load data.' });
        });
    }, [location.search, contextUser?.id]);

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




    // Load services when entity config is available
    useEffect(() => {
        if (entityId) {
            loadServices();
        }
    }, [entityId]);

    const loadServices = async () => {
        const result = await getServices(entityId);
        if (result.success) {
            setServices(result.data || []);
        }
    };

    const handleAddService = async () => {
        if (!newService.service_name) {
            setStatusMsg({ type: 'error', text: language === 'ar' ? 'الرجاء إدخال اسم الخدمة' : 'Please enter a service name' });
            return;
        }

        if (!entityId) {
            setStatusMsg({ type: 'error', text: language === 'ar' ? '⚠️ يرجى حفظ بيانات المنشأة (Entity Info) أولاً قبل إضافة الخدمات.' : '⚠️ Please save the Entity Info first before adding services.' });
            return;
        }

        // Clean up empty fields to be NULL in DB for optional values
        const payload = {
            service_name: newService.service_name,
            price: newService.price || 0,
            duration_minutes: newService.duration_minutes || 0,
            description: newService.description || null,
            entity_id: entityId
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
            setStatusMsg({ type: 'error', text: (isAr ? '❌ فشل تحديث الخدمة: ' : '❌ Failed to update service: ') + result.error });
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!confirm(t('confirmDeleteService'))) return;

        const result = await deleteService(serviceId);
        if (result.success) {
            setServices(services.filter(s => s.id !== serviceId));
        } else {
            setStatusMsg({ type: 'error', text: (isAr ? '❌ فشل حذف الخدمة: ' : '❌ Failed to delete service: ') + result.error });
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

            // 1. Update Entity Config
            const configResult = await saveEntityConfig({
                id: entityId,
                user_id: user.id,
                agent_name: formData.businessName,
                specialty: formData.businessType,
                business_type: formData.businessType,
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
                booking_requires_confirmation: formData.booking_requires_confirmation || false,
                is_active: false,
            });

            if (!configResult.success) throw new Error(configResult.error);

            // 2. Sync to ALL agents for this user (Unified Source of Truth)
            if (configResult.data?.id) {
                console.log("Syncing ALL agents to Master Config:", configResult.data.id);
                const { error: syncError } = await supabase
                    .from('agents')
                    .update({ 
                        entity_id: configResult.data.id,
                        // We also sync the basic business info to the agent's identity for immediate context
                        name: formData.businessName,
                        specialty: formData.businessType
                    })
                    .eq('user_id', user.id);
                
                if (syncError) console.error("Error syncing all agents:", syncError);
            }

            // 3. Update Profile Extended Fields
            await supabase.from('profiles').update({
                position: formData.position || null,
                business_type: formData.businessType || null,
                phone: formData.phone || null,
                business_name: formData.businessName || null
            }).eq('id', user.id);

            setStatusMsg({ 
                type: 'success', 
                text: language === 'ar' ? '✅ تم توحيد بيانات المنشأة لجميع الموظفين بنجاح!' : '✅ Business profile unified across all agents successfully!' 
            });
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
        if (!entityId) {
            alert(language === 'ar' ? 'يرجى حفظ بيانات المنشأة أولاً.' : 'Please save entity info first.');
            setLoading(false);
            return;
        }

        try {
            const result = await activateEntityAgent(entityId);
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
        if (!entityId) {
            setStatusMsg({ 
                type: 'error', 
                text: language === 'ar' ? '⚠️ يرجى حفظ بيانات المنشأة (Entity Info) أولاً قبل ربط الأدوات.' : '⚠️ Please save Entity Info first before linking tools.' 
            });
            return;
        }
        if (expandedIntegration === 'custom_request') {
            handleCustomToolRequest();
            return;
        }

        // TOOL LIMIT ENFORCEMENT (Starter Plan: Max 2 tools)
        if (userTier === 'starter') {
            const TOOL_KEYS = ['telegram_token', 'whatsapp_number', 'whatsapp_api_key', 'google_sheets_id', 'google_calendar_id', 'instagram_token'];
            
            // Count already connected tools for this agent/entity that are NOT the one being edited
            let currentToolsCount = 0;
            TOOL_KEYS.forEach(k => {
                // If it's already in integrationKeys and NOT being edited in the current draft
                if (integrationKeys[k] && !Object.keys(integrationDraft).includes(k)) {
                    currentToolsCount++;
                }
            });

            // Count how many NEW tools are in the draft
            let newToolsInDraft = 0;
            Object.keys(integrationDraft).forEach(k => {
                if (TOOL_KEYS.includes(k) && integrationDraft[k]) {
                    newToolsInDraft++;
                }
            });

            if (currentToolsCount + newToolsInDraft > 2) {
                setStatusMsg({
                    type: 'error',
                    text: language === 'ar' 
                        ? '⚠️ لقد وصلت للحد الأقصى للأدوات في الباقة المجانية (أداتين فقط). يرجى الترقية لإضافة المزيد.' 
                        : '⚠️ Tool limit reached for Starter plan (max 2). Please upgrade for more.'
                });
                return;
            }
        }

        if (Object.keys(integrationDraft).length === 0) return;
        
        setIntegrationSaving(true);
        setStatusMsg({ type: '', text: '' });
        
        try {
            console.info("EntitySetup: [STEP 1] Starting integration save sequence...");
            
            // 1. Get Session instead of full Auth Check (no-hang)
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            
            if (!user) {
                console.error("EntitySetup: No active session found.");
                throw new Error(language === 'ar' ? '⚠️ فشل التحقق من الجلسة. يرجى تسجيل الدخول مجدداً.' : '⚠️ Session check failed. Please log in again.');
            }

            console.info("EntitySetup: [STEP 2] Saving to Entity Table...", entityId);
            
            // 2. Wrap DB operations in a timeout
            const dbSave = Promise.race([
                saveEntityConfig({ id: entityId, user_id: user.id, ...integrationDraft }),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Database Timeout")), 10000))
            ]);
            
            const result = await dbSave;
            if (!result.success) throw new Error(result.error);

            const currentAgentId = agentId || localStorage.getItem('currentAgentId');
            if (currentAgentId) {
                console.info("EntitySetup: [STEP 3] Syncing to Agent:", currentAgentId);
                const agentUpdate = {};
                if (integrationDraft.telegram_token) agentUpdate.telegram_token = integrationDraft.telegram_token;
                if (integrationDraft.whatsapp_number) agentUpdate.whatsapp_token = integrationDraft.whatsapp_number;
                
                if (Object.keys(agentUpdate).length > 0) {
                    const agentSync = Promise.race([
                        updateAgent(currentAgentId, agentUpdate),
                        new Promise((_, rej) => setTimeout(() => rej(new Error("Agent Sync Timeout")), 10000))
                    ]);
                    await agentSync;
                }
            }

            if (integrationDraft.telegram_token) {
                console.info("EntitySetup: [STEP 4] Registering Telegram Webhook...");
                const token = integrationDraft.telegram_token;
                const projectUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
                const webhookUrl = `${projectUrl}/functions/v1/telegram-webhook?agent_id=${currentAgentId}`;
                
                const webhookFetch = Promise.race([
                    fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("Webhook API Timeout")), 10000))
                ]);
                
                const telegramRes = await webhookFetch;
                // Protection against hanging JSON parse
                const telegramData = await Promise.race([
                    telegramRes.json(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("Telegram API Parse Timeout")), 5000))
                ]);
                
                if (!telegramData.ok) {
                    console.warn("EntitySetup: Webhook Registration Warn:", telegramData.description);
                }
            }

            setIntegrationKeys(prev => ({ ...prev, ...integrationDraft }));
            setSaveSuccess(true);
            setStatusMsg({ 
                type: 'success', 
                text: language === 'ar' ? '✅ تم حفظ الإعدادات وربط القنوات بنجاح!' : '✅ Settings saved and channels synced successfully!' 
            });
            
            setTimeout(() => {
                setSaveSuccess(false);
                if (expandedIntegration !== 'website') {
                    setExpandedIntegration(null);
                }
            }, 2000);

            setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);

        } catch (err) {
            console.error("EntitySetup: Integration Save Error:", err);
            const msg = err.message || "Unknown error";
            setStatusMsg({ 
                type: 'error', 
                text: (language === 'ar' ? '❌ فشل الحفظ: ' : '❌ Save failed: ') + msg
            });
        } finally {
            setIntegrationSaving(false);
        }
    };

    const handleCustomToolRequest = async () => {
        if (!requestToolName.trim() || !requestContactName.trim() || !requestContactPhone.trim()) {
            alert(language === 'ar' ? 'يرجى إدخال اسم الأداة وبيانات التواصل المطلوبة' : 'Please enter the tool name and required contact info');
            return;
        }
        setIntegrationSaving(true);
        try {
            const { error } = await supabase.from('custom_requests').insert([{
                business_type: formData.businessType || 'Unknown',
                required_tasks: `Integration Tool Request: ${requestToolName}\nReason: ${requestReason}`,
                contact_name: requestContactName,
                contact_phone: requestContactPhone,
                contact_email: requestContactEmail,
                status: 'pending'
            }]);
            if (error) throw error;
            setRequestSuccess(true);
            setTimeout(() => {
                setExpandedIntegration(null);
                setRequestSuccess(false);
                setRequestToolName('');
                setRequestReason('');
                setRequestContactName('');
                setRequestContactPhone('');
                setRequestContactEmail('');
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

    const renderHelpModal = () => {
        if (!showHelpModal || !helpModalType) return null;

        const guides = {
            sheets: {
                title: language === 'ar' ? 'دليل ربط جداول جوجل 📊' : 'Google Sheets Setup Guide 📊',
                color: '#0F9D58',
                steps: language === 'ar' ? [
                    { t: 'أنشئ جدول بيانات جديد', d: 'قم بفتح Google Sheets وأنشئ جدولاً جديداً أو استخدم جدولاً موجوداً.' },
                    { t: 'المشاركة مع الموظف الذكي', d: 'هذه أهم خطوة! اضغط على زر "مشاركة" (Share) وأضف البريد التالي كـ "محرر" (Editor):', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
                    { t: 'نسخ معرّف الجدول', d: 'ستجده في رابط المتصفح (URL) بين /d/ و /edit. مثال: 1BxiMVs0XRA...' },
                    { t: 'الحفظ والاختبار', d: 'ضع المعرف في الخانة المخصصة واضغط "اختبار الربط" للتأكد من وصول البيانات.' }
                ] : [
                    { t: 'Create a Spreadsheet', d: 'Open Google Sheets and create a new sheet or use an existing one.' },
                    { t: 'Share with the AI Agent', d: 'Crucial step! Click "Share" and add this email as an "Editor":', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
                    { t: 'Copy Spreadsheet ID', d: 'Found in the URL between /d/ and /edit. Example: 1BxiMVs0XRA...' },
                    { t: 'Save & Test', d: 'Enter the ID in the field and click "Test Connection" to verify.' }
                ]
            },
            calendar: {
                title: language === 'ar' ? 'دليل ربط تقويم جوجل 📅' : 'Google Calendar Setup Guide 📅',
                color: '#4285F4',
                steps: language === 'ar' ? [
                    { t: 'افتح إعدادات التقويم', d: 'اذهب إلى Google Calendar، اضغط على أيقونة الترس ثم "الإعدادات".' },
                    { t: 'المشاركة مع الموظف', d: 'اختر تقويمك من القائمة الجانبية، ثم "مشاركة مع أشخاص محددين". أضف البريد التالي:', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
                    { t: 'تعيين الصلاحيات', d: 'تأكد من اختيار صلاحية "إجراء تغييرات على الأحداث" (Make changes to events).' },
                    { t: 'معرّف التقويم (ID)', d: 'انزل لأسفل في الإعدادات لقسم "دمج التقويم"، وانسخ الـ Calendar ID كاملاً (مثال: email@group.calendar.google.com).' }
                ] : [
                    { t: 'Open Calendar Settings', d: 'Go to Google Calendar, click the gear icon, then "Settings".' },
                    { t: 'Share with the Agent', d: 'Select your calendar on the left, then "Share with specific people". Add this email:', copy: 'google-sheet@smart-employees.iam.gserviceaccount.com' },
                    { t: 'Set Permissions', d: 'Ensure you select "Make changes to events" permission.' },
                    { t: 'Calendar ID', d: 'Scroll down to the "Integrate calendar" section and copy the full Calendar ID (e.g., email@group.calendar.google.com).' }
                ]
            },
            whatsapp: {
                title: language === 'ar' ? 'دليل ربط واتساب للأعمال 💬' : 'WhatsApp Business Setup Guide 💬',
                color: '#25D366',
                steps: language === 'ar' ? [
                    { t: 'بوابة Meta للمطورين', d: 'سجل الدخول في developers.facebook.com وأنشئ تطبيقاً من نوع Business.' },
                    { t: 'إعداد واتساب', d: 'أضف منتج "WhatsApp" لتطبيقك وقم بربط رقم هاتفك.' },
                    { t: 'الرموز والمعرفات', d: 'ستحتاج لنسخ الـ Phone ID والـ WABA ID من قسم API Setup.' },
                    { t: 'مفتاح الوصول الدائم', d: 'أنشئ System User Token دائم وتأكد من اختيار صلاحيات الرسائل.' }
                ] : [
                    { t: 'Meta Developers Portal', d: 'Log in to developers.facebook.com and create a "Business" type app.' },
                    { t: 'Setup WhatsApp', d: 'Add "WhatsApp" to your app and link your phone number.' },
                    { t: 'IDs & Tokens', d: 'Copy the Phone ID and WABA ID from the API Setup section.' },
                    { t: 'Permanent Token', d: 'Generate a Permanent System User Token with messaging permissions.' }
                ]
            },
            instagram: {
                title: language === 'ar' ? 'دليل ربط إنستجرام للأعمال 📸' : 'Instagram Business Setup Guide 📸',
                color: '#E4405F',
                steps: language === 'ar' ? [
                    { t: 'حساب تجاري', d: 'تأكد أن حسابك في إنستجرام هو حساب "تجاري" (Business) أو "صانع محتوى" (Creator).' },
                    { t: 'ربط بصفحة فيسبوك', d: 'يجب ربط حساب إنستجرام بصفحة فيسبوك نشطة من خلال Meta Business Suite.' },
                    { t: 'تفعيل الوصول للرسائل', d: 'من تطبيق إنستجرام: الإعدادات > الرسائل والردود على القصص > أدوات المراسلة > فعل "السماح بالوصول إلى الرسائل".' },
                    { t: 'بوابة Meta للمطورين', d: 'سجل في developers.facebook.com وأنشئ تطبيقاً من نوع (Business). أضف منتج "Instagram Graph API".' },
                    { t: 'معرّف الحساب (ID)', d: 'ستجد Instagram Business ID في Meta Business Suite > Settings > Business Assets.' },
                    { t: 'رمز الوصول الدائم (Token)', d: 'أنشئ (System User Token) دائم عبر Business Manager بصلاحيات: instagram_basic, instagram_manage_messages.' },
                    { t: 'إعداد الـ Webhook', d: 'في إعدادات تطبيق Meta، استخدم الرابط التالي لتلقي الرسائل مجاناً وفي الوقت الفعلي:', copy: (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/meta-webhook?user_id=' + currentUserId }
                ] : [
                    { t: 'Business Account', d: 'Ensure your Instagram account is set to "Business" or "Creator" mode.' },
                    { t: 'Link Facebook Page', d: 'Your Instagram must be linked to a Facebook Page via Meta Business Suite.' },
                    { t: 'Allow Message Access', d: 'In Instagram App: Settings > Messages & Story Replies > Message Tools > Toggle "Allow Access to Messages".' },
                    { t: 'Meta Developer App', d: 'Sign up at developers.facebook.com and create a "Business" type app. Add the "Instagram Graph API" product.' },
                    { t: 'Business Account ID', d: 'Found in Meta Business Suite > Settings > Business Assets under Instagram Accounts.' },
                    { t: 'Permanent Token', d: 'Generate a Permanent System User Token in Business Manager with permissions: instagram_basic, instagram_manage_messages.' },
                    { t: 'Configure Webhook', d: 'In your Meta App Webhook settings, use this URL to receive live messages:', copy: (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/meta-webhook?user_id=' + currentUserId }
                ]
            },
            telegram: {
                title: language === 'ar' ? 'دليل إعداد بوت تيليجرام 🤖' : 'Telegram Bot Setup Guide 🤖',
                color: '#229ED9',
                steps: language === 'ar' ? [
                    { t: 'ابدأ مع BotFather', d: 'افتح تطبيق تيليجرام وابحث عن @BotFather.' },
                    { t: 'إنشاء بوت جديد', d: 'أرسل الأمر /newbot واتبع التعليمات لاختيار اسم ومعرف للبوت.' },
                    { t: 'الحصول على التوكن', d: 'بعد الانتهاء، سيعطيك BotFather "API Token" (رقم طويل مع أحرف). انسخه هنا.' },
                    { t: 'تفعيل الموظف', d: 'ضع التوكن في الخانة المخصصة واحفظ الإعدادات لتفعيل الرد التلقائي.' }
                ] : [
                    { t: 'Start with BotFather', d: 'Open Telegram and search for @BotFather.' },
                    { t: 'Create New Bot', d: 'Send /newbot and follow instructions to set a name and username.' },
                    { t: 'Get API Token', d: 'BotFather will provide a long numeric/alphabetic token. Copy it.' },
                    { t: 'Activate Agent', d: 'Paste the token in the field and save your settings.' }
                ]
            }
        };

        const guide = guides[helpModalType];
        if (!guide) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10000, padding: '20px'
            }}>
                <div className="animate-scale-in" style={{
                    width: '100%', maxWidth: '600px', background: '#18181B',
                    borderRadius: '24px', border: `1px solid ${guide.color}44`,
                    overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                        padding: '24px', background: `linear-gradient(135deg, ${guide.color}22, transparent)`,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>{guide.title}</h3>
                        <button 
                            onClick={() => setShowHelpModal(false)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#9CA3AF', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {guide.steps.map((step, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '10px', background: `${guide.color}22`,
                                        color: guide.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 800, flexShrink: 0, border: `1px solid ${guide.color}44`
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#E5E7EB' }}>{step.t}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#9CA3AF', lineHeight: 1.5 }}>{step.d}</p>
                                        
                                        {step.copy && (
                                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                <code style={{ flex: 1, background: '#0F172A', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', color: guide.color, border: '1px solid rgba(255,255,255,0.05)', wordBreak: 'break-all' }}>
                                                    {step.copy}
                                                </code>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(step.copy);
                                                        setStatusMsg({ type: 'success', text: language === 'ar' ? 'تم نسخ البريد!' : 'Email copied!' });
                                                    }}
                                                    style={{ background: '#374151', border: 'none', color: 'white', padding: '0 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                                                >
                                                    {language === 'ar' ? 'نسخ' : 'Copy'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ 
                            marginTop: '32px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', 
                            borderRadius: '16px', border: '1px dashed rgba(139, 92, 246, 0.3)',
                            display: 'flex', alignItems: 'center', gap: '16px'
                        }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✨
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#E5E7EB', fontWeight: 600 }}>
                                    {language === 'ar' ? 'هل تواجه صعوبة؟' : 'Need more help?'}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                                    {language === 'ar' ? 'يمكن لـ "نورة" مساعدتك في كل خطوة.' : 'Noura can guide you through every step.'}
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowHelpModal(false);
                                    const msg = language === 'ar' 
                                        ? `أريد مساعدة في تفعيل ربط ${guide.title}` 
                                        : `I need help activating ${guide.title}`;
                                    window.dispatchEvent(new CustomEvent('open-concierge', { detail: { type: 'support', message: msg } }));
                                }}
                                style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                                {language === 'ar' ? 'اسأل نورة' : 'Ask Noura'}
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '20px', background: '#18181B', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <button onClick={() => setShowHelpModal(false)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                            {language === 'ar' ? 'فهمت ذلك، إغلاق' : 'Got it, close'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ar' ? 'right' : 'left', color: 'white', position: 'relative', minHeight: '100vh' }}>
            {renderHelpModal()}
            
            {/* Agency Self-Edit Warning Guardrail */}
            {isAgencyAdmin && !isImpersonating && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#F59E0B',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <AlertCircle size={24} />
                    <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 800, display: 'block', fontSize: '1rem' }}>
                            {language === 'ar' ? '⚠️ تنبيه: أنت تعدل ملف وكالتك الشخصي' : '⚠️ Warning: You are editing your Agency Profile'}
                        </span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            {language === 'ar' 
                                ? 'هذه البيانات تخص حسابك كوكالة (سولانا). إذا كنت تريد إعداد منشأة لعميل، يرجى الذهاب للوحة الوكالة واختيار "التحكم كعميل".' 
                                : 'These details belong to your Agency account. To setup a client business, go to Agency Dashboard and click "Manage as Client".'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Global Status Banner - TOP of Setup Page (Sticky) */}
            {statusMsg.text && (
                <div className="status-banner" style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    width: '90%',
                    maxWidth: '550px',
                    background: statusMsg.type === 'success' ? '#059669' : '#DC2626',
                    color: 'white',
                    padding: '1.25rem 2rem',
                    borderRadius: '24px',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 1), 0 0 30px rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '15px',
                    border: '2px solid rgba(255,255,255,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {statusMsg.type === 'success' ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
                        <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{statusMsg.type === 'success' ? (language === 'ar' ? 'نجاح ✅' : 'Success ✅') : (language === 'ar' ? 'خطأ ⚠️' : 'Error ⚠️')}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>{statusMsg.text}</div>
                        </div>
                    </div>
                    <button onClick={() => setStatusMsg({ type: '', text: '' })} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={24} />
                    </button>
                </div>
            )}

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
                                        ? 'ارفع ملفات منشأتك (PDF, Word, Excel) للحصول على أفضل دقة. موظفنا الذكي سيقرأها ويُنشئ لك ملف تعريفي متكامل تلقائياً.'
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
                                        placeholder={language === 'ar' ? 'مثال: شركة البركة، عيادة الشفاء...' : 'e.g. Al-Baraka Co, Al-Shifa Clinic...'} />
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

                                    {/* Booking Confirmation Toggle */}
                                    <div style={{ padding: '1.5rem', background: '#1F2937', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Calendar size={18} color="#F59E0B" />
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{language === 'ar' ? 'تأكيد الحجوزات يدوياً' : 'Manual Booking Confirmation'}</h4>
                                                    <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                                                        {language === 'ar' 
                                                            ? 'عند التفعيل: الحجوزات تكون مبدئية وتحتاج تأكيدك. الموظف سيُبلغ العميل بأن الحجز مبدئي وسيصله تأكيد لاحقاً.' 
                                                            : 'When enabled: Bookings are preliminary and need your approval. The agent will inform the customer that a confirmation will be sent.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                                                <input type="checkbox" checked={formData.booking_requires_confirmation} 
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
                                    { key: 'telegram_token', labelAr: 'توكن البوت', labelEn: 'Bot Token', placeholder: '123456789:AAF...', password: false, hintAr: 'من @BotFather في تيليجرام', hintEn: 'from @BotFather', guide: null }
                                ],
                                customContent: (expandedIntegration === 'telegram') && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <button 
                                            onClick={() => { setHelpModalType('telegram'); setShowHelpModal(true); }}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(34, 158, 217, 0.1)',
                                                border: '1px dashed #229ED9', color: '#229ED9', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            <BookOpen size={14} />
                                            {language === 'ar' ? 'كيف أحصل على توكن البوت؟' : 'How to get Bot Token?'}
                                        </button>
                                    </div>
                                )
                            },

                            {
                                id: 'whatsapp', icon: MessageCircle, color: '#25D366',
                                titleAr: 'واتساب للأعمال (BYOT)', titleEn: 'WhatsApp Business (BYOT)',
                                descAr: 'ربط حسابك الخاص عبر Meta للتحكم الكامل',
                                descEn: 'Connect your own Meta account for full control',
                                badge: language === 'ar' ? 'حر' : 'Hassle-Free', badgeColor: '#10B981',
                                fields: [
                                    { key: 'whatsapp_api_key', labelAr: 'رمز الوصول الدائم (Token)', labelEn: 'Permanent Access Token', placeholder: 'EAAG...', password: true, hintAr: 'من Meta Business', hintEn: 'from Meta Business', guide: true },
                                    { key: 'whatsapp_number', labelAr: 'معرف رقم الهاتف (Phone ID)', labelEn: 'Phone Number ID', placeholder: '101234567890', password: false, hintAr: 'Phone Number ID', hintEn: 'Phone Number ID', guide: true },
                                    { key: 'whatsapp_waba_id', labelAr: 'معرف حساب الأعمال (WABA ID)', labelEn: 'WhatsApp Business Account ID', placeholder: '201234567890', password: false, hintAr: 'WABA ID', hintEn: 'WABA ID', guide: true }
                                ],
                                customContent: (expandedIntegration === 'whatsapp' && currentUserId) && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(37, 211, 102, 0.05)', borderRadius: '12px', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
                                        <h5 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#25D366' }}>{language === 'ar' ? 'رابط الـ Webhook الخاص بك' : 'Your Unique Webhook URL'}</h5>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <code style={{ flex: 1, background: '#0F172A', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', color: '#E2E8F0', wordBreak: 'break-all' }}>
                                                {`${supabaseUrl}/functions/v1/meta-webhook?user_id=${currentUserId}`}
                                            </code>
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(`${supabaseUrl}/functions/v1/meta-webhook?user_id=${currentUserId}`);
                                                alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                                            }} style={{ background: '#374151', border: 'none', color: 'white', padding: '0 12px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                                {language === 'ar' ? 'نسخ' : 'Copy'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => { setHelpModalType('whatsapp'); setShowHelpModal(true); }}
                                            style={{
                                                width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(37, 211, 102, 0.1)',
                                                border: '1px dashed #25D366', color: '#25D366', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            <BookOpen size={14} />
                                            {language === 'ar' ? 'دليل إعداد منصة Meta (WhatsApp)' : 'Meta Platform Setup Guide (WhatsApp)'}
                                        </button>
                                        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>{language === 'ar' ? 'استخدم هذا الرابط في إعدادات Webhook في تطبيق Meta الخاص بك.' : 'Use this URL in your Meta App Webhook settings.'}</p>
                                    </div>
                                )
                            },
                            {
                                id: 'instagram', icon: Instagram, color: '#E4405F',
                                titleAr: 'إنستجرام للأعمال (BYOT)', titleEn: 'Instagram Business (BYOT)',
                                descAr: 'ربط حساب إنستجرام عبر تطبيق Meta الخاص بك',
                                descEn: 'Connect Instagram via your own Meta App',
                                badge: language === 'ar' ? 'حر' : 'Hassle-Free', badgeColor: '#E4405F',
                                fields: [
                                    { key: 'instagram_token', labelAr: 'رمز الوصول الدائم (Token)', labelEn: 'Permanent Access Token', placeholder: 'EAAG...', password: true, hintAr: 'رمز الوصول الدائم', hintEn: 'Permanent Access Token', guide: true },
                                    { key: 'instagram_account_id', labelAr: 'معرف حساب إنستجرام', labelEn: 'Instagram Business ID', placeholder: '1784...', password: false, hintAr: 'من إعدادات تطبيق Meta', hintEn: 'from Meta App settings', guide: true }
                                ],
                                customContent: (expandedIntegration === 'instagram' && currentUserId) && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(228, 64, 95, 0.05)', borderRadius: '12px', border: '1px solid rgba(228, 64, 95, 0.2)' }}>
                                        <h5 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#E4405F' }}>{language === 'ar' ? 'رابط الـ Webhook الخاص بك' : 'Your Unique Webhook URL'}</h5>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <code style={{ flex: 1, background: '#0F172A', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', color: '#E2E8F0', wordBreak: 'break-all' }}>
                                                {`${supabaseUrl}/functions/v1/meta-webhook?user_id=${currentUserId}`}
                                            </code>
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(`${supabaseUrl}/functions/v1/meta-webhook?user_id=${currentUserId}`);
                                                alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                                            }} style={{ background: '#374151', border: 'none', color: 'white', padding: '0 12px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                                {language === 'ar' ? 'نسخ' : 'Copy'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => { setHelpModalType('instagram'); setShowHelpModal(true); }}
                                            style={{
                                                width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(228, 64, 95, 0.1)',
                                                border: '1px dashed #E4405F', color: '#E4405F', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            <BookOpen size={14} />
                                            {language === 'ar' ? 'دليل إعداد منصة Meta (Instagram)' : 'Meta Platform Setup Guide (Instagram)'}
                                        </button>
                                        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>{language === 'ar' ? 'تأكد من اختيار (messages) في اشتراكات Webhook.' : 'Ensure you select (messages) in Webhook subscriptions.'}</p>
                                    </div>
                                )
                            },
                            {
                                id: 'calendar', icon: Calendar, color: '#4285F4',
                                titleAr: 'تقويم جوجل (بدون موافقة)', titleEn: 'Google Calendar (Easy Sync)',
                                descAr: 'حجز المواعيد تلقائياً في تقويمك الخاص',
                                descEn: 'Auto-book appointments directly in your calendar',
                                badge: language === 'ar' ? 'سريع' : 'Fast', badgeColor: '#4285F4',
                                fields: [
                                    { key: 'google_calendar_id', labelAr: 'معرّف التقويم', labelEn: 'Calendar ID', placeholder: 'primary', password: false, hintAr: 'استخدم primary للتقويم الأساسي', hintEn: 'use primary for your main calendar', guide: true }
                                ],
                                customContent: (expandedIntegration === 'calendar') && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(66, 133, 244, 0.05)', borderRadius: '12px', border: '1px solid rgba(66, 133, 244, 0.2)' }}>
                                        <button 
                                            onClick={() => { setHelpModalType('calendar'); setShowHelpModal(true); }}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(66, 133, 244, 0.1)',
                                                border: '1px dashed #4285F4', color: '#4285F4', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1rem'
                                            }}
                                        >
                                            <BookOpen size={16} />
                                            {language === 'ar' ? 'عرض دليل الإعداد المصبور (خطوة بخطوة)' : 'View Step-by-Step Setup Guide'}
                                        </button>
                                        
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                            <button 
                                                onClick={handleTestCalendarConnection}
                                                disabled={isTestingCalendar}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(66, 133, 244, 0.1)',
                                                    border: '1px solid rgba(66, 133, 244, 0.3)',
                                                    color: '#4285F4',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: isTestingCalendar ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8
                                                }}
                                            >
                                                {isTestingCalendar ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                                                {language === 'ar' ? 'اختبار ربط التقويم (إنشاء موعد)' : 'Test Calendar Link (Create Event)'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                id: 'sheets', icon: FileText, color: '#0F9D58',
                                titleAr: 'جداول جوجل (بدون موافقة)', titleEn: 'Google Sheets (Easy Sync)',
                                descAr: 'تصدير الحجوزات تلقائياً دون شاشات موافقة جوجل',
                                descEn: 'Auto-export bookings without OAuth consent screens',
                                badge: language === 'ar' ? 'سريع' : 'Fast', badgeColor: '#0F9D58',
                                fields: [
                                    { key: 'google_sheets_id', labelAr: 'معرّف الجدول', labelEn: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA...', password: false, hintAr: 'بعد /d/ في الرابط', hintEn: 'from the URL after /d/', guide: true }
                                ],
                                customContent: (expandedIntegration === 'sheets') && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(15, 157, 88, 0.05)', borderRadius: '12px', border: '1px solid rgba(15, 157, 88, 0.2)' }}>
                                        <button 
                                            onClick={() => { setHelpModalType('sheets'); setShowHelpModal(true); }}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(15, 157, 88, 0.1)',
                                                border: '1px dashed #0F9D58', color: '#0F9D58', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1rem'
                                            }}
                                        >
                                            <BookOpen size={16} />
                                            {language === 'ar' ? 'عرض دليل الإعداد المصبور (خطوة بخطوة)' : 'View Step-by-Step Setup Guide'}
                                        </button>

                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                            <button 
                                                onClick={handleTestSheetsConnection}
                                                disabled={isTestingSheets}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    color: '#10B981',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: isTestingSheets ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8
                                                }}
                                            >
                                                {isTestingSheets ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                                                {language === 'ar' ? 'اختبار الربط الآن (إرسال صف تجريبي)' : 'Test Connection Now (Send Test Row)'}
                                            </button>
                                        </div>
                                    </div>
                                )
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
                                        const isConnected = card.id === 'website'
                                            ? !!agentId  // Website widget is "connected" only when an agent exists
                                            : card.fields.length > 0 
                                                ? card.fields.some(f => f.key !== 'website' && !!integrationKeys[f.key]) 
                                                : !!integrationKeys[`oauth_${card.id}`];
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
                                                                {isOpen 
                                                                    ? (language === 'ar' ? 'إغلاق' : 'Close') 
                                                                    : isConnected 
                                                                        ? (language === 'ar' ? 'متصل ✅' : 'Connected ✅')
                                                                        : (language === 'ar' ? 'إعداد' : 'Connect')
                                                                }
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
                                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                                                    <h4 style={{ color: '#A78BFA', fontSize: '0.9rem', marginBottom: '1rem' }}>{language === 'ar' ? 'بيانات التواصل' : 'Contact Information'}</h4>
                                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                                                                {language === 'ar' ? 'الاسم' : 'Name'}
                                                                            </label>
                                                                            <input style={inp} value={requestContactName}
                                                                                onChange={e => setRequestContactName(e.target.value)} />
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                                                                {language === 'ar' ? 'رقم الجوال' : 'Phone'}
                                                                            </label>
                                                                            <input style={inp} type="tel" value={requestContactPhone}
                                                                                onChange={e => setRequestContactPhone(e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ marginTop: '1rem' }}>
                                                                        <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.82rem', marginBottom: 6 }}>
                                                                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                                                        </label>
                                                                        <input style={inp} type="email" value={requestContactEmail}
                                                                            onChange={e => setRequestContactEmail(e.target.value)} />
                                                                    </div>
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
                                                                    <div style={{ position: 'relative' }}>
                                                                        <input
                                                                            type={f.password ? 'password' : f.type || 'text'}
                                                                            value={integrationDraft[f.key] ?? (f.type === 'color' ? '#8B5CF6' : '')}
                                                                            onChange={e => setIntegrationDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                            placeholder={f.placeholder}
                                                                            style={{
                                                                                width: '100%', padding: f.type === 'color' ? '2px 6px' : (f.key === 'telegram_token' ? '10px 60px 10px 14px' : '10px 14px'), height: f.type === 'color' ? '42px' : 'auto', background: '#27272A', border: '1px solid #3F3F46', borderRadius: 10, color: '#FFFFFF',
                                                                                fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: f.password ? '0.1em' : 'normal', outline: 'none', cursor: f.type === 'color' ? 'pointer' : 'text'
                                                                            }}
                                                                        />
                                                                        {f.key === 'telegram_token' && integrationDraft[f.key] && (
                                                                            <button 
                                                                                onClick={async (e) => {
                                                                                    e.stopPropagation();
                                                                                    setIntegrationSaving(true);
                                                                                    try {
                                                                                        const currentAgentId = agentId || localStorage.getItem('currentAgentId');
                                                                                        if (!currentAgentId) throw new Error(language === 'ar' ? '⚠️ لم يتم العثور على معرّف الموظف.' : '⚠️ Agent ID not found.');
                                                                                        
                                                                                        // 1. SYNC: Save to Agent Table First (Backend needs this)
                                                                                        const tokenVal = integrationDraft[f.key];
                                                                                        console.log("Syncing token to Agent Table before linking:", currentAgentId);
                                                                                        await updateAgent(currentAgentId, { telegram_token: tokenVal });

                                                                                        // 2. LINK: Register Webhook with Telegram
                                                                                        const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '') + '/functions/v1/telegram-webhook?agent_id=' + currentAgentId;
                                                                                        const res = await fetch(`https://api.telegram.org/bot${tokenVal}/setWebhook?url=${encodeURIComponent(url)}`);
                                                                                        const data = await res.json();
                                                                                        if (data.ok) setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم بنجاح! البوت مربوط الآن وسيبدأ الرد فوراً.' : '✅ Success! Bot is linked and will reply now.' });
                                                                                        else setStatusMsg({ type: 'error', text: language === 'ar' ? `❌ فشل الربط: ${data.description}` : `❌ Link Failed: ${data.description}` });
                                                                                    } catch (err) {
                                                                                        setStatusMsg({ type: 'error', text: String(err.message) });
                                                                                    } finally { setIntegrationSaving(false); }
                                                                                }}
                                                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(34,197,94,0.1)', color: '#10B981', border: '1px solid rgba(34,197,94,0.2)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                                                            >
                                                                                {language === 'ar' ? 'اختبار' : 'Test'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {f.guide && (
                                                                        <div style={{ marginTop: 8 }}>
                                                                            <span
                                                                                onClick={(e) => { 
                                                                                    e.stopPropagation(); 
                                                                                    setActiveFieldGuide(activeFieldGuide === f.key ? null : f.key);
                                                                                }}
                                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#60A5FA', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                                                                                <LinkIcon size={12} /> {language === 'ar' ? 'كيف أحصل على هذا المفتاح؟' : 'How to get this key?'}
                                                                            </span>

                                                                            {activeFieldGuide === f.key && integrationGuides && integrationGuides[f.key] && (
                                                                                <div className="animate-fade-in" style={{
                                                                                    marginTop: '10px', padding: '12px', background: 'rgba(30, 41, 59, 0.5)',
                                                                                    borderRadius: '10px', border: '1px solid rgba(96, 165, 250, 0.2)', fontSize: '0.8rem'
                                                                                }}>
                                                                                    <ul style={{ margin: 0, padding: language === 'ar' ? '0 18px 0 0' : '0 0 0 18px', color: '#94A3B8', listStyleType: 'disc' }}>
                                                                                        {(language === 'ar' ? integrationGuides[f.key].stepsAr : integrationGuides[f.key].stepsEn).map((step, sIdx) => (
                                                                                            <li key={sIdx} style={{ marginBottom: '6px' }}>{step}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                    
                                                                                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                                        {integrationGuides[f.key].url && (
                                                                                            <a href={integrationGuides[f.key].url} target="_blank" rel="noreferrer" style={{
                                                                                                background: '#3B82F6', color: 'white', textDecoration: 'none', padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem'
                                                                                            }}>
                                                                                                {language === 'ar' ? 'فتح بوابة Meta' : 'Open Meta Portal'}
                                                                                            </a>
                                                                                        )}
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                const msg = language === 'ar' 
                                                                                                    ? `أحتاج مساعدة في الحصول على ${f.labelAr}` 
                                                                                                    : `I need help getting the ${f.labelEn}`;
                                                                                                window.dispatchEvent(new CustomEvent('open-concierge', { detail: { type: 'support', message: msg } }));
                                                                                            }}
                                                                                            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#A78BFA', padding: '4px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                                                                                            {language === 'ar' ? 'اسأل نورة للمساعدة ✨' : 'Ask Noura for help ✨'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
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
                                                                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                                                    : (saveSuccess 
                                                                        ? (language === 'ar' ? '✅ تم الحفظ!' : '✅ Saved!')
                                                                        : (requestSuccess 
                                                                            ? (language === 'ar' ? 'تم الإرسال!' : 'Request Sent!')
                                                                            : (isOpen && card.id === 'custom_request' 
                                                                                ? (language === 'ar' ? 'إرسال الطلب' : 'Send Request')
                                                                                : (language === 'ar' ? 'حفظ البيانات' : 'Save Connection')
                                                                              )
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
                                                                            const { error } = await supabase.from('entity_services').delete().eq('entity_id', entityId);
                                                                            if (error) throw error;
                                                                            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم تصفير البيانات! قم بتحديث الصفحة وسيعود الذكاء لبروفايلك الحالي.' : '✅ Data cleared! Refresh page to force AI reset.' });
                                                                        } catch (e) {
                                                                            setStatusMsg({ type: 'error', text: 'Error: ' + e.message });
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
