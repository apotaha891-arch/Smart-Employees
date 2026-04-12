import { supabase } from './supabaseService';

/**
 * Fetches the affiliate record for the current user
 */
export const getMyPartnerData = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('academy_affiliates')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('getMyPartnerData error:', e.message);
        return null;
    }
};

/**
 * Fetches leads referred by the current partner
 */
export const getPartnerLeads = async (partnerId) => {
    try {
        const { data, error } = await supabase
            .from('academy_leads')
            .select('*')
            .eq('referrer_id', partnerId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('getPartnerLeads error:', e.message);
        return [];
    }
};

/**
 * Checks if a user has paid for academy (to unlock dashboard)
 */
export const checkAcademyAccess = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('academy_access')
            .select('status')
            .eq('user_id', userId)
            .maybeSingle();
        
        return data?.status === 'active';
    } catch (e) {
        return false;
    }
};
