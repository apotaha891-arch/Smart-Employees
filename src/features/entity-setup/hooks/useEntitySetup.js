import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabaseService';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../LanguageContext';
import { 
    getEntityConfig, 
    saveEntityConfig, 
    getServices as getEntityServices, 
    addService as addEntityService, 
    updateService as updateEntityService, 
    deleteService as deleteEntityService, 
    updateAgent,
    submitWhiteLabelRequest as sendWhiteLabelRequest
} from '../../../services/supabaseService';
import { AI_LOADING_MESSAGES } from '../constants';

export const useEntitySetup = () => {
    const { user, isAgencyAdmin, isImpersonating, effectiveUser } = useAuth();
    const { language, t } = useLanguage();
    const currentUserId = effectiveUser?.id || user?.id;

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [entityId, setEntityId] = useState(null);
    const [agentId, setAgentId] = useState(null);
    const [activeTab, setActiveTab] = useState('sources');
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: '',
        description: '',
        phone: '',
        address: '',
        website: '',
        position: '',
        mission_statement: '',
        target_audience: '',
        brand_voice_details: '',
        sop_instructions: '',
        booking_requires_confirmation: false,
        faq_data: [],
        workingHours: {
            isCustom: false,
            shifts: [{ start: '09:00', end: '22:00' }],
            days: null
        }
    });

    // Services
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });
    const [editingService, setEditingService] = useState(null);

    // Integrations
    const [integrationKeys, setIntegrationKeys] = useState({});
    const [integrationDraft, setIntegrationDraft] = useState({});
    const [expandedIntegration, setExpandedIntegration] = useState(null);
    const [integrationSaving, setIntegrationSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Custom Request (White-label)
    const [requestToolName, setRequestToolName] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [requestContactName, setRequestContactName] = useState('');
    const [requestContactPhone, setRequestContactPhone] = useState('');
    const [requestContactEmail, setRequestContactEmail] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);

    // AI Extraction
    const [aiLoading, setAiLoading] = useState(false);
    const [aiLoadingMsg, setAiLoadingMsg] = useState(0);
    const [aiFiles, setAiFiles] = useState([]);
    const [aiUrl, setAiUrl] = useState('');
    const [aiUrlsList, setAiUrlsList] = useState([]);
    const [extractedProfile, setExtractedProfile] = useState(null);
    const [newFaq, setNewFaq] = useState({ q: '', a: '' });
    const [activeFieldGuide, setActiveFieldGuide] = useState(null);

    // Integration Tests
    const [isTestingSheets, setIsTestingSheets] = useState(false);
    const [isTestingCalendar, setIsTestingCalendar] = useState(false);

    // --- initialization ---
    const checkUser = useCallback(async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            // Get Config
            const res = await getEntityConfig(currentUserId);
            if (res.success && res.data) {
                const config = res.data;
                setEntityId(config.id);
                setFormData({
                    businessName: config.business_name || '',
                    businessType: config.business_type || '',
                    description: config.description || '',
                    phone: config.phone || '',
                    address: config.address || '',
                    website: config.website || '',
                    position: config.position || '',
                    mission_statement: config.mission_statement || '',
                    target_audience: config.target_audience || '',
                    brand_voice_details: config.brand_voice_details || '',
                    sop_instructions: config.sop_instructions || '',
                    booking_requires_confirmation: config.booking_requires_confirmation || false,
                    faq_data: config.faq_data || [],
                    workingHours: config.working_hours || { isCustom: false, shifts: [{ start: '09:00', end: '22:00' }] }
                });

                // Set Integration Keys
                setIntegrationKeys({
                    whatsapp_api_key: config.whatsapp_api_key,
                    whatsapp_number: config.whatsapp_number,
                    whatsapp_waba_id: config.whatsapp_waba_id,
                    instagram_token: config.instagram_token,
                    instagram_account_id: config.instagram_account_id,
                    telegram_token: config.telegram_token,
                    google_sheets_id: config.google_sheets_id,
                    google_calendar_id: config.google_calendar_id,
                    welcome_message: config.welcome_message,
                    widget_color: config.widget_color,
                    website: config.website
                });
            }

            // Get Services
            const sRes = await getEntityServices(currentUserId);
            setServices(sRes.success ? sRes.data : []);

            // Get Agent ID (to find widget code)
            const { data: agentData } = await supabase
                .from('agents')
                .select('id')
                .eq('user_id', currentUserId)
                .limit(1)
                .single();
            if (agentData) setAgentId(agentData.id);

        } catch (err) {
            console.error('Error loading entity setup:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        checkUser();
    }, [checkUser]);

    // AI Loading Message Rotation
    useEffect(() => {
        let interval;
        if (aiLoading) {
            interval = setInterval(() => {
                setAiLoadingMsg(prev => (prev + 1) % AI_LOADING_MESSAGES[language].length);
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [aiLoading, language]);

    // --- Handlers ---

    // Save Main Config
    const handleSave = async () => {
        setLoading(true);
        try {
            const dataToSave = {
                business_name: formData.businessName,
                business_type: formData.businessType,
                description: formData.description,
                phone: formData.phone,
                address: formData.address,
                website: formData.website,
                position: formData.position,
                mission_statement: formData.mission_statement,
                target_audience: formData.target_audience,
                brand_voice_details: formData.brand_voice_details,
                sop_instructions: formData.sop_instructions,
                booking_requires_confirmation: formData.booking_requires_confirmation,
                faq_data: formData.faq_data,
                working_hours: formData.workingHours
            };

            await saveEntityConfig(currentUserId, dataToSave);
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم حفظ التغييرات بنجاح!' : '✅ Changes saved successfully!' });
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Services Handlers
    const handleAddService = async () => {
        if (!newService.name || !newService.price) return;
        try {
            const res = await addEntityService({ ...newService, entity_id: entityId });
            if (res.success) {
                setServices([...services, res.data]);
                setNewService({ name: '', price: '', duration: '60' });
            }
        } catch (err) {
            console.error('Error adding service:', err);
        }
    };

    const handleUpdateService = async (id, data) => {
        try {
            const res = await updateEntityService(id, data);
            if (res.success) {
                setServices(services.map(s => s.id === id ? { ...s, ...data } : s));
                setEditingService(null);
            }
        } catch (err) {
            console.error('Error updating service:', err);
        }
    };

    const handleDeleteService = async (id) => {
        try {
            const res = await deleteEntityService(id);
            if (res.success) {
                setServices(services.filter(s => s.id !== id));
            }
        } catch (err) {
            console.error('Error deleting service:', err);
        }
    };

    // Integration Handlers
    const openIntegration = (id, fields) => {
        setExpandedIntegration(id);
        const draft = {};
        fields.forEach(f => { draft[f.key] = integrationKeys[f.key] || ''; });
        setIntegrationDraft(draft);
    };

    const handleSaveIntegration = async () => {
        if (expandedIntegration === 'custom_request') {
            return submitWhiteLabelRequest();
        }

        setIntegrationSaving(true);
        setSaveSuccess(false);
        try {
            await saveEntityConfig(currentUserId, integrationDraft);
            setIntegrationKeys(prev => ({ ...prev, ...integrationDraft }));
            setSaveSuccess(true);
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم تحديث بيانات الربط!' : '✅ Integration keys saved!' });
            setTimeout(() => { setSaveSuccess(false); setExpandedIntegration(null); }, 2000);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setIntegrationSaving(false);
        }
    };

    const submitWhiteLabelRequest = async () => {
        if (!requestToolName) return;
        setIntegrationSaving(true);
        try {
            const res = await sendWhiteLabelRequest(currentUserId, {
                tool_name: requestToolName,
                reason: requestReason,
                contact_name: requestContactName,
                contact_phone: requestContactPhone,
                contact_email: requestContactEmail
            });
            if (res.success) {
                setRequestSuccess(true);
            } else {
                setStatusMsg({ type: 'error', text: res.error });
            }
            setTimeout(() => {
                setExpandedIntegration(null);
                setRequestSuccess(false);
                setRequestToolName('');
            }, 3000);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setIntegrationSaving(false);
        }
    };

    // AI Extraction Handlers
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAiFiles([...aiFiles, ...files]);
    };

    const removeFile = (index) => {
        setAiFiles(aiFiles.filter((_, i) => i !== index));
    };

    const handleAddUrl = () => {
        if (!aiUrl) return;
        setAiUrlsList([...aiUrlsList, aiUrl]);
        setAiUrl('');
    };

    const removeUrl = (index) => {
        setAiUrlsList(aiUrlsList.filter((_, i) => i !== index));
    };

    const handleAiGenerate = async () => {
        setAiLoading(true);
        setAiLoadingMsg(0);
        try {
            // Upload files to storage (temp)
            const uploadedUrls = [];
            for (const file of aiFiles) {
                const path = `temp-ai-input/${currentUserId}/${Date.now()}_${file.name}`;
                const { data, error } = await supabase.storage.from('client-assets').upload(path, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('client-assets').getPublicUrl(path);
                uploadedUrls.push(publicUrl);
            }

            // Call edge function
            const { data, error } = await supabase.functions.invoke('analyze-entity-profile', {
                body: { 
                    fileUrls: uploadedUrls, 
                    webUrls: aiUrlsList,
                    language 
                }
            });

            if (error) throw error;
            setExtractedProfile(data.profile);
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✨ تم استخراج البيانات بنجاح!' : '✨ Data extracted successfully!' });
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setAiLoading(false);
        }
    };

    const handleConfirmProfile = async () => {
        setLoading(true);
        try {
            const profile = extractedProfile;
            const dataToSave = {
                business_name: profile.businessName,
                business_type: profile.businessType,
                description: profile.description,
                phone: profile.phone,
                address: profile.address,
                website: profile.website,
                mission_statement: profile.mission_statement,
                target_audience: profile.target_audience,
                brand_voice_details: profile.brand_voice,
                sop_instructions: profile.procedures
            };

            await saveEntityConfig(currentUserId, dataToSave);
            
            // Save extracted services
            if (profile.extracted_services && profile.extracted_services.length > 0) {
                for (const svc of profile.extracted_services) {
                    await addEntityService(entityId, {
                        name: svc.name,
                        price: svc.price,
                        duration: String(svc.duration || '60')
                    });
                }
                const newSvcs = await getEntityServices(currentUserId);
                setServices(newSvcs);
            }

            setFormData(prev => ({ ...prev, ...dataToSave }));
            setExtractedProfile(null);
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم حفظ بروفايل المنشأة والخدمات!' : '✅ Business profile and services saved!' });
            setActiveTab('identity');
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Integration Tests
    const handleTestSheetsConnection = async () => {
        if (!integrationKeys.google_sheets_id) return;
        setIsTestingSheets(true);
        try {
            const { data, error } = await supabase.functions.invoke('google-sheets-handler', {
                body: {
                    action: 'append_row',
                    spreadsheetId: integrationKeys.google_sheets_id,
                    values: [["Test Name", "Test Email", "Test Message", new Date().toISOString()]]
                }
            });
            if (error) throw error;
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم إرسال بيانات تجريبية بنجاح!' : '✅ Test data sent successfully!' });
        } catch (err) {
            setStatusMsg({ type: 'error', text: (language === 'ar' ? '❌ فشل الاختبار: تأكد من مشاركة الجدول.' : '❌ Test Failed: Make sure you shared the sheet.') });
        } finally {
            setIsTestingSheets(false);
        }
    };

    const handleTestCalendarConnection = async () => {
        if (!integrationKeys.google_calendar_id) return;
        setIsTestingCalendar(true);
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            
            const endTime = new Date(tomorrow);
            endTime.setHours(11, 0, 0, 0);

            const { data, error } = await supabase.functions.invoke('google-calendar-handler', {
                body: {
                    action: 'create_event',
                    calendarId: integrationKeys.google_calendar_id,
                    event: {
                        summary: 'Test Appointment from Smart Employee',
                        description: 'This is a test event created during setup.',
                        start: { dateTime: tomorrow.toISOString() },
                        end: { dateTime: endTime.toISOString() }
                    }
                }
            });
            if (error) throw error;
            setStatusMsg({ type: 'success', text: language === 'ar' ? '✅ تم إنشاء موعد تجريبي بنجاح!' : '✅ Test event created successfully!' });
        } catch (err) {
            setStatusMsg({ type: 'error', text: (language === 'ar' ? '❌ فشل الاختبار: تأكد من الصلاحيات والبريد.' : '❌ Test Failed: Check permissions and email.') });
        } finally {
            setIsTestingCalendar(false);
        }
    };

    return {
        // State
        loading, entityId, agentId, activeTab, setStatusMsg, statusMsg, paymentSuccess, setPaymentSuccess,
        formData, setFormData, services, newService, setNewService, editingService, setEditingService,
        integrationKeys, integrationDraft, setIntegrationDraft, expandedIntegration, setExpandedIntegration,
        integrationSaving, saveSuccess, requestToolName, setRequestToolName, requestReason, setRequestReason,
        requestContactName, setRequestContactName, requestContactPhone, setRequestContactPhone, 
        requestContactEmail, setRequestContactEmail, requestSuccess,
        aiLoading, aiLoadingMsg, aiFiles, aiUrl, setAiUrl, aiUrlsList, extractedProfile, setExtractedProfile,
        newFaq, setNewFaq,
        activeFieldGuide, setActiveFieldGuide,
        isTestingSheets, isTestingCalendar,
        
        // Context/Helper
        language, t, currentUserId, isAgencyAdmin, isImpersonating,
        
        // Handlers
        setActiveTab, handleSave, handleAddService, handleUpdateService, handleDeleteService,
        openIntegration, handleSaveIntegration, handleFileChange, removeFile, handleAddUrl, removeUrl,
        handleAiGenerate, handleConfirmProfile, handleTestSheetsConnection, handleTestCalendarConnection
    };
};
