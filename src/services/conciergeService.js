import { supabase } from './supabaseService';
import { extractConciergeInsights } from './geminiService';
import { getPlatformSettings } from './adminService';

/**
 * Saves or updates a concierge conversation in Supabase
 */
export const saveConciergeConversation = async (userId, messages, ticketId = null, metadata = {}) => {
    try {
        if (!userId) return { success: false, error: 'User ID required' };

        const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
        
        // Find existing conversation for this user
        const { data: existing } = await supabase
            .from('concierge_conversations')
            .select('id, metadata')
            .eq('user_id', userId)
            .is('ticket_id', ticketId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Merge metadata if existing
        const finalMetadata = existing?.metadata ? { ...existing.metadata, ...metadata } : metadata;

        if (existing) {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .update({
                    messages,
                    last_message: lastMessage,
                    metadata: finalMetadata,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .insert([{
                    user_id: userId,
                    messages,
                    last_message: lastMessage,
                    metadata: finalMetadata,
                    ticket_id: ticketId
                }])
                .select()
                .single();
            
            if (error) throw error;

            // --- NOTIFICATION LOGIC ---
            // If it's a new conversation, notify admin
            try {
                const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'محادثة جديدة';
                
                // 1. Dashboard Notification
                await supabase.rpc('notify_admin', {
                    p_type: 'new_chat',
                    p_title: 'محادثة جديدة مع نورة',
                    p_message: `بدأ العميل محادثة: "${firstUserMsg.substring(0, 50)}..."`,
                    p_link: '/admin/concierge',
                    p_metadata: { conversation_id: data.id, user_id: userId }
                });

                // 2. Webhook (N8N) Notification if configured
                const integrations = await getPlatformSettings('external_integrations');
                const n8n = integrations?.find(i => i.id === 'n8n' && i.status === 'connected');
                if (n8n?.credentials?.webhook_url) {
                    fetch(n8n.credentials.webhook_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'new_concierge_chat',
                            conversation_id: data.id,
                            user_id: userId,
                            message: firstUserMsg,
                            timestamp: new Date().toISOString()
                        })
                    }).catch(e => console.error('N8N Webhook failed:', e));
                }
            } catch (notifyErr) {
                console.warn('Notification failed (non-critical):', notifyErr.message);
            }

            return { success: true, data };
        }
    } catch (error) {
        console.error('Error saving concierge conversation:', error);
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
        // 1. Create the ticket
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
            .select()
            .single();
        
        if (ticketErr) throw ticketErr;

        // 2. Link the conversation to the ticket if conversationId provided
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
