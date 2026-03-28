import { supabase } from './supabaseService';
import { extractConciergeInsights } from './geminiService';
import { getPlatformSettings } from './adminService';

/**
 * Internal helper: send admin notification for a new conversation
 */
const _notifyAdmin = async (conversationId, userId, messages) => {
    try {
        const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'محادثة جديدة';

        await supabase.rpc('notify_admin', {
            p_type: 'new_chat',
            p_title: 'محادثة جديدة مع نورة',
            p_message: `بدأ العميل محادثة: "${firstUserMsg.substring(0, 50)}..."`,
            p_link: '/admin/concierge',
            p_metadata: { conversation_id: conversationId, user_id: userId }
        });

        const integrations = await getPlatformSettings('external_integrations');
        const n8n = integrations?.find(i => i.id === 'n8n' && i.status === 'connected');
        if (n8n?.credentials?.webhook_url) {
            fetch(n8n.credentials.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'new_concierge_chat',
                    conversation_id: conversationId,
                    user_id: userId,
                    message: firstUserMsg,
                    timestamp: new Date().toISOString()
                })
            }).catch(e => console.error('N8N Webhook failed:', e));
        }
    } catch (notifyErr) {
        console.warn('Notification failed (non-critical):', notifyErr.message);
    }
};

/**
 * Escalate Noura conversation to humans
 */
export const notifyNouraEscalation = async (insights, messages, userIdOrSession) => {
    try {
        const lastMsg = messages[messages.length - 1]?.content || 'طلب تصعيد';

        // 1. Alert in dashboard
        await supabase.rpc('notify_admin', {
            p_type: 'escalation',
            p_title: 'عاجل: تصعيد بشري (نورة)',
            p_message: `نورة بحاجة لتدخل بشري: "${lastMsg.substring(0, 50)}..."`,
            p_link: '/admin/concierge',
            p_metadata: { insights, user_id: userIdOrSession }
        });

        // 2. Alert via N8N
        const integrations = await getPlatformSettings('external_integrations');
        const n8n = integrations?.find(i => i.id === 'n8n' && i.status === 'connected');
        if (n8n?.credentials?.webhook_url) {
            fetch(n8n.credentials.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'noura_escalation',
                    user_id: userIdOrSession,
                    insights: insights,
                    last_message: lastMsg,
                    timestamp: new Date().toISOString()
                })
            }).catch(e => console.error('N8N Webhook failed (Escalation):', e));
        }
    } catch (err) {
        console.warn('Noura escalation notification failed:', err.message);
    }
};

/**
 * Saves or updates a concierge conversation for an authenticated user
 */
export const saveConciergeConversation = async (userId, messages, ticketId = null, metadata = {}) => {
    try {
        if (!userId) return { success: false, error: 'User ID required' };

        const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';

        const { data: existing } = await supabase
            .from('concierge_conversations')
            .select('id, metadata')
            .eq('user_id', userId)
            .is('ticket_id', ticketId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const finalMetadata = existing?.metadata ? { ...existing.metadata, ...metadata } : metadata;

        if (existing) {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .update({ messages, last_message: lastMessage, metadata: finalMetadata, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select().single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .insert([{ user_id: userId, messages, last_message: lastMessage, metadata: finalMetadata, ticket_id: ticketId }])
                .select().single();
            if (error) throw error;
            await _notifyAdmin(data.id, userId, messages);
            return { success: true, data };
        }
    } catch (error) {
        console.error('Error saving concierge conversation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Saves or updates a concierge conversation for a GUEST (unauthenticated) user.
 * Uses a browser-generated session_id instead of user_id.
 */
export const saveGuestConciergeConversation = async (sessionId, messages, metadata = {}) => {
    try {
        if (!sessionId) return { success: false, error: 'Session ID required' };

        const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';

        const { data: existing } = await supabase
            .from('concierge_conversations')
            .select('id, metadata')
            .eq('session_id', sessionId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const finalMetadata = existing?.metadata
            ? { ...existing.metadata, ...metadata, is_guest: true }
            : { ...metadata, is_guest: true };

        if (existing) {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .update({ messages, last_message: lastMessage, metadata: finalMetadata, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select().single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .insert([{
                    session_id: sessionId,
                    user_id: null,
                    is_guest: true,
                    messages,
                    last_message: lastMessage,
                    metadata: finalMetadata
                }])
                .select().single();
            if (error) throw error;
            // Notify admin about new guest conversation
            await _notifyAdmin(data.id, `guest:${sessionId}`, messages);
            return { success: true, data };
        }
    } catch (error) {
        console.error('Error saving guest concierge conversation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Retrieves the latest conversation for a user
 */
export const getUserConversation = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('concierge_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Creates a support ticket from a conversation
 */
export const createTicketFromConcierge = async (userId, title, description, conversationId) => {
    try {
        const { data: ticket, error: ticketErr } = await supabase
            .from('support_tickets')
            .insert([{
                user_id: userId,
                title,
                description,
                status: 'open',
                priority: 'medium',
                category: 'AI Assistant'
            }])
            .select().single();

        if (ticketErr) throw ticketErr;

        if (conversationId) {
            await supabase
                .from('concierge_conversations')
                .update({ ticket_id: ticket.id })
                .eq('id', conversationId);
        }

        return { success: true, data: ticket };
    } catch (error) {
        console.error('Error creating ticket from concierge:', error);
        return { success: false, error: error.message };
    }
};
