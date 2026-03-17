import { supabase } from './supabaseService';

/**
 * Saves or updates a concierge conversation in Supabase
 */
export const saveConciergeConversation = async (userId, messages, ticketId = null) => {
    try {
        if (!userId) return { success: false, error: 'User ID required' };

        const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
        
        // Find existing conversation for this user that isn't closed (simplified logic)
        const { data: existing } = await supabase
            .from('concierge_conversations')
            .select('id')
            .eq('user_id', userId)
            .is('ticket_id', ticketId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existing) {
            const { data, error } = await supabase
                .from('concierge_conversations')
                .update({
                    messages,
                    last_message: lastMessage,
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
                    ticket_id: ticketId
                }])
                .select()
                .single();
            
            if (error) throw error;
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
