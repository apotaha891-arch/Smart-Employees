import { supabase, getProfile } from './supabaseService';

/**
 * Agent Service - Handles all agent-related operations
 * Replaces scattered agent logic from components and supabaseService
 */

// Get all agent templates
export const getAgentTemplates = async (userId) => {
    try {
        let industry = 'general';

        if (userId) {
            const profileResult = await getProfile(userId);
            if (profileResult.success && profileResult.data) {
                const type = profileResult.data.business_type?.toLowerCase() || '';
                if (type.includes('طب') || type.includes('صحي') || type.includes('clinic') || type === 'medical') industry = 'medical';
                else if (type.includes('عقار') || type.includes('estate') || type === 'real_estate') industry = 'real_estate';
                else if (type.includes('تجميل') || type.includes('salon') || type.includes('beauty') || type === 'beauty') industry = 'beauty';
                else if (type.includes('مطعم') || type.includes('restau') || type === 'restaurant') industry = 'restaurant';
                else if (type.includes('رياض') || type.includes('gym') || type.includes('club') || type.includes('fit') || type === 'fitness') industry = 'fitness';
            }
        }

        const templatesByIndustry = {
            medical: [
                { id: 'clinic_receptionist', title: 'موظف استقبال مركزي', specialty: 'حجز ومواعيد', icon: '🩺', description: 'ينظم مواعيد المرضى ويجيب على الاستفسارات الطبية الأساسية.' },
                { id: 'medical_followup', title: 'مساعد المتابعة', specialty: 'رعاية صحية', icon: '📝', description: 'يتواصل مع المرضى بعد الزيارات للتأكد من التزامهم بالخطة.' }
            ],
            real_estate: [
                { id: 'property_advisor', title: 'مستشار عقاري', specialty: 'مبيعات وتسويق', icon: '🏢', description: 'يعرض العقارات المناسبة ويجيب على أسئلة المشترين المحتملين.' },
                { id: 'leasing_agent', title: 'وسيط تأجير', specialty: 'تأجير', icon: '🔑', description: 'ينسق جولات المشاهدة ويتابع عقود الإيجار وعمليات التجديد.' }
            ],
            beauty: [
                { id: 'salon_receptionist', title: 'مسؤول حجز الخدمات', specialty: 'استقبال', icon: '💇‍♀️', description: 'يرتب مواعيد الخدمات ويرد على استفسارات الأسعار والباقات.' },
                { id: 'style_consultant', title: 'مستشار الأناقة', specialty: 'استشارات', icon: '💅', description: 'يقدم نصائح للخدمات المناسبة ويقترح منتجات العناية بالبشرة والشعر.' }
            ],
            restaurant: [
                { id: 'order_taker', title: 'موظف تلقي الطلبات', specialty: 'طلبات وتوصيل', icon: '🍔', description: 'يستقبل طلبات التوصيل والاستلام بسرعة ودقة عالية.' },
                { id: 'reservation_host', title: 'منسق الحجوزات', specialty: 'حجز طاولات', icon: '🍽️', description: 'يرتب حجوزات الطاولات ويهتم بالطلبات الخاصة للمناسبات.' }
            ],
            fitness: [
                { id: 'gym_advisor', title: 'مستشار اللياقة', specialty: 'عضويات', icon: '💪', description: 'يشرح تفاصيل العضويات وبرامج التدريب المتاحة للمشتركين بأسلوب محفز.' },
                { id: 'personal_trainer_bot', title: 'مساعد التدريب والتغذية', specialty: 'متابعة رياضية', icon: '🏃‍♂️', description: 'يتابع تقدم المتدربين ويذكرهم بجداول التمارين والأنظمة الغذائية.' }
            ],
            general: [
                { id: 'sales', title: 'موظف مبيعات', specialty: 'مبيعات وتسويق', icon: '🏢', description: 'خبير في إغلاق الصفقات وتحويل العملاء المحتملين.' },
                { id: 'support', title: 'مستشار الدعم الفني', specialty: 'خدمة عملاء', icon: '🎧', description: 'متواجد 24/7 لحل مشاكل العملاء التقنية بذكاء وخبرة.' },
                { id: 'hr', title: 'منسق الموارد البشرية', specialty: 'توظيف', icon: '👥', description: 'يحلل السير الذاتية ويرتب المقابلات بكفاءة.' },
                { id: 'assistant', title: 'مساعد شخصي', specialty: 'تنظيم إداري', icon: '📅', description: 'ينظم جدولك ومواعيدك ورسائلك بكل دقة.' }
            ]
        };

        return {
            success: true,
            data: templatesByIndustry[industry] || templatesByIndustry.general
        };
    } catch (error) {
        console.error('Error fetching agent templates:', error);
        return { success: false, error: error.message };
    }
};

// Get agent template by ID
export const getAgentTemplate = async (templateId) => {
    try {
        // TODO: Implement template fetch from database
        return { success: true, data: null };
    } catch (error) {
        console.error('Error fetching agent template:', error);
        return { success: false, error: error.message };
    }
};

// Create/hire a new agent
export const hireAgent = async (userId, templateId, configuration) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .insert([
                {
                    user_id: userId,
                    name: configuration.name,
                    specialty: configuration.specialty || templateId,
                    branding_tone: configuration.tone || 'professional',
                    status: 'active',
                    created_at: new Date().toISOString(),
                    metadata: {
                        template_id: templateId,
                        working_hours: configuration.workingHours
                    }
                }
            ])
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error hiring agent:', error);
        return { success: false, error: error.message };
    }
};

// Get user's agents
export const getUserAgents = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user agents:', error);
        return { success: false, error: error.message };
    }
};

// Get agent by ID
export const getAgent = async (agentId) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching agent:', error);
        return { success: false, error: error.message };
    }
};

// Update agent configuration
export const updateAgentConfiguration = async (agentId, configuration) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update({
                name: configuration.name,
                tone: configuration.tone,
                working_hours: configuration.workingHours,
                services: configuration.services,
                knowledge_base: configuration.knowledge,
                updated_at: new Date().toISOString()
            })
            .eq('id', agentId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating agent configuration:', error);
        return { success: false, error: error.message };
    }
};

// Delete agent
export const deleteAgent = async (agentId) => {
    try {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting agent:', error);
        return { success: false, error: error.message };
    }
};

// Update agent status
export const updateAgentStatus = async (agentId, status) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update({ status })
            .eq('id', agentId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating agent status:', error);
        return { success: false, error: error.message };
    }
};

// Update agent telegram token
export const updateAgentTelegramToken = async (agentId, token) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update({ telegram_token: token })
            .eq('id', agentId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating telegram token:', error);
        return { success: false, error: error.message };
    }
};

// Add service to agent
export const addServiceToAgent = async (agentId, service) => {
    try {
        // TODO: Implement service management
        return { success: true, data: service };
    } catch (error) {
        console.error('Error adding service:', error);
        return { success: false, error: error.message };
    }
};

// Remove service from agent
export const removeServiceFromAgent = async (agentId, serviceId) => {
    try {
        // TODO: Implement service removal
        return { success: true };
    } catch (error) {
        console.error('Error removing service:', error);
        return { success: false, error: error.message };
    }
};


// Update agent WhatsApp settings
export const updateAgentWhatsAppSettings = async (agentId, whatsappSettings) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update({ whatsapp_settings: whatsappSettings })
            .eq('id', agentId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating WhatsApp settings:', error);
        return { success: false, error: error.message };
    }
};


export const agentService = {
    getAgentTemplates,
    getAgentTemplate,
    hireAgent,
    getUserAgents,
    getAgent,
    updateAgentConfiguration,
    deleteAgent,
    updateAgentStatus,
    updateAgentTelegramToken,
    updateAgentWhatsAppSettings,
    addServiceToAgent,
    removeServiceFromAgent
};

export default agentService;
