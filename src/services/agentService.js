import { supabase } from './supabaseService';

/**
 * Agent Service - Handles all agent-related operations
 * Replaces scattered agent logic from components and supabaseService
 */

// Get all agent templates
export const getAgentTemplates = async () => {
    try {
        // TODO: Fetch from database when templates table is created
        // For now, return hardcoded templates from component
        return {
            success: true,
            data: []
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
                    template_id: templateId,
                    name: configuration.name,
                    tone: configuration.tone,
                    working_hours: configuration.workingHours,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    ...configuration
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
    addServiceToAgent,
    removeServiceFromAgent
};

export default agentService;
