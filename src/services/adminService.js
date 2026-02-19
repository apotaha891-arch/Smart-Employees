import { supabase } from './supabaseService';

export const getTemplates = async () => {
    const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const saveTemplate = async (template) => {
    const { data, error } = await supabase
        .from('agent_templates')
        .upsert(template)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteTemplate = async (id) => {
    const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

export const getPlatformInquiries = async () => {
    const { data, error } = await supabase
        .from('platform_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const getPlatformSettings = async (key) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', key)
        .single();
    if (error) return null;
    return data.value;
};

export const updatePlatformSettings = async (key, value) => {
    const { error } = await supabase
        .from('platform_settings')
        .upsert({ key, value, updated_at: new Date() });
    if (error) throw error;
    return true;
};

export const getAllCustomers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

// ---------- PLATFORM SETTINGS CRUD ----------
export const getAllSettings = async () => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('key', { ascending: true });
    if (error) throw error;
    return data;
};

export const saveSetting = async (key, value) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ key, value, updated_at: new Date() })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteSetting = async (key) => {
    const { error } = await supabase
        .from('platform_settings')
        .delete()
        .eq('key', key);
    if (error) throw error;
    return true;
};
