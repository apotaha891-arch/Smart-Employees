import { supabase } from './supabaseService';

// ─── Admin data via SECURITY DEFINER RPCs (bypasses RLS) ─────────────────────
// These RPCs verify the caller is admin via app_metadata inside the DB function.

export const getAllCustomers = async () => {
    // Try admin RPC first (bypasses RLS)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_clients');
    if (!rpcErr && rpcData?.length) return rpcData;

    if (rpcErr) console.warn('get_admin_clients RPC failed:', rpcErr.message, '— trying fallback');

    // Fallback: salon_configs is usually readable without RLS issues
    const { data: configs, error: cfgErr } = await supabase
        .from('salon_configs')
        .select('id, user_id, business_type, agent_name, created_at')
        .order('created_at', { ascending: false });

    if (cfgErr) console.warn('salon_configs fallback also failed:', cfgErr.message);

    return (configs || []).map(c => ({
        id: c.user_id,
        full_name: c.agent_name || '—',
        email: '—',
        subscription_tier: 'basic',
        business_type: c.business_type,
        created_at: c.created_at,
    }));
};

export const getAllAgents = async () => {
    const { data, error } = await supabase.rpc('get_admin_agents');
    if (!error && data) return data;
    console.warn('get_admin_agents RPC failed:', error?.message);
    // Fallback: direct query (limited by RLS to own agents)
    const { data: fallback } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    return fallback || [];
};

export const getAllBookings = async () => {
    const { data, error } = await supabase.rpc('get_admin_bookings');
    if (!error && data) return data;
    console.warn('get_admin_bookings RPC failed:', error?.message);
    const { data: fallback } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(300);
    return fallback || [];
};

export const getAllSalonConfigs = async () => {
    const { data, error } = await supabase.rpc('get_admin_salon_configs');
    if (!error && data) return data;
    console.warn('get_admin_salon_configs RPC failed:', error?.message);
    const { data: fallback } = await supabase.from('salon_configs').select('id, user_id, business_type, agent_name, telegram_token, whatsapp_number, whatsapp_api_key, created_at').order('created_at', { ascending: false });
    return fallback || [];
};

export const updateClientPlan = async (clientId, plan) => {
    const { error } = await supabase.rpc('admin_update_client_plan', { client_id: clientId, new_plan: plan });
    if (error) {
        console.warn('admin_update_client_plan RPC failed, trying direct:', error.message);
        await supabase.from('profiles').update({ subscription_tier: plan }).eq('id', clientId);
    }
    return true;
};

// ─── Platform Settings ────────────────────────────────────────────────────────
export const getPlatformSettings = async (key) => {
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (error || !data) return null;
        return data.value;
    } catch (e) {
        logSystemEvent('error', 'system', `Failed to fetch setting: ${key}`, { error: e.message });
        return null;
    }
};

export const updatePlatformSettings = async (key, value) => {
    try {
        const { error } = await supabase
            .from('platform_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        logSystemEvent('audit', 'system', `Updated platform setting: ${key}`);
        return true;
    } catch (e) {
        logSystemEvent('error', 'system', `Failed to update setting: ${key}`, { error: e.message });
        return false;
    }
};

// ─── System Logging ───────────────────────────────────────────────────────────
export const logSystemEvent = async (level, category, message, details = null) => {
    try {
        const { error } = await supabase.rpc('log_system_event', {
            p_level: level,
            p_category: category,
            p_message: message,
            p_details: details
        });
        if (error) console.error('Logging failed:', error.message);
    } catch (e) {
        console.error('Logging error:', e);
    }
};

// ─── Templates ────────────────────────────────────────────────────────────────
export const getTemplates = async () => {
    const { data, error } = await supabase.from('agent_templates').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
};

export const saveTemplate = async (template) => {
    const { data, error } = await supabase.from('agent_templates').upsert(template).select().single();
    if (error) throw error;
    return data;
};

export const deleteTemplate = async (id) => {
    const { error } = await supabase.from('agent_templates').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// ─── All Settings ─────────────────────────────────────────────────────────────
export const getAllSettings = async () => {
    const { data, error } = await supabase.from('platform_settings').select('*').order('key');
    if (error) return [];
    return data || [];
};

export const saveSetting = async (key, value) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select().maybeSingle();
    if (error) throw error;
    return data;
};

export const deleteSetting = async (key) => {
    const { error } = await supabase.from('platform_settings').delete().eq('key', key);
    if (error) throw error;
    return true;
};

// ─── Support & Concierge ───────────────────────────────────────────────────
export const getAllTickets = async () => {
    const { data, error } = await supabase.rpc('get_admin_tickets');
    if (!error && data) return data;
    console.warn('get_admin_tickets RPC failed:', error?.message);
    // Fallback: limited query
    const { data: fallback } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    return fallback || [];
};

export const getAllConciergeConversations = async () => {
    try {
        const { data, error } = await supabase.rpc('get_admin_concierge_conversations');
        if (!error && data) return data;
        console.warn('get_admin_concierge_conversations RPC failed:', error?.message);
        // Fallback: try direct table query
        const { data: fallback, error: fbErr } = await supabase
            .from('concierge_conversations')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(100);
        if (!fbErr) return fallback || [];
        console.warn('concierge_conversations table also unavailable:', fbErr?.message);
        return [];
    } catch (e) {
        console.warn('getAllConciergeConversations error (non-critical):', e.message);
        return [];
    }
};

export const getAllNotifications = async () => {
    try {
        const { data, error } = await supabase
            .from('platform_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            console.warn('platform_notifications unavailable:', error.message);
            return [];
        }
        return data || [];
    } catch (e) {
        console.warn('getAllNotifications error (non-critical):', e.message);
        return [];
    }
};

export const markNotificationAsRead = async (id) => {
    const { error } = await supabase
        .from('platform_notifications')
        .update({ is_read: true })
        .eq('id', id);
    if (error) console.error('Error marking notification as read:', error.message);
    return !error;
};

// ─── Blogs ──────────────────────────────────────────────────────────────────
export const getBlogPosts = async () => {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching blog posts:', error.message);
        return [];
    }
    return data || [];
};

export const saveBlogPost = async (post) => {
    const { data, error } = await supabase
        .from('blog_posts')
        .upsert(post, { onConflict: 'id' })
        .select()
        .single();
    if (error) throw error;
    logSystemEvent('audit', 'blog', `Saved blog post: ${post.title_en || post.slug}`);
    return data;
};

export const deleteBlogPost = async (id) => {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
    if (error) throw error;
    logSystemEvent('audit', 'blog', `Deleted blog post: ${id}`);
    return true;
};

export const getBlogSettings = async () => {
    const { data, error } = await supabase.from('blog_settings').select('*').eq('id', 1).maybeSingle();
    if (error) console.error('Error fetching blog settings:', error.message);
    return data;
};

export const updateBlogSettings = async (settings) => {
    const { error } = await supabase.from('blog_settings').upsert({ ...settings, id: 1 }, { onConflict: 'id' });
    if (error) throw error;
    logSystemEvent('audit', 'blog', 'Updated blog settings/banners');
    return true;
};

// Legacy export for backward compat
export const getAllCustomers_legacy = getAllCustomers;
