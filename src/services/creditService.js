import { supabase } from './supabaseService';

/**
 * Credit Service - Handles credit operations and audit logging
 */

// Check and deduct credits
export const checkAndDeductCredits = async (userId, amount, reason = 'operation') => {
    try {
        // Get current profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        const currentCredits = profile?.credits || 0;

        if (currentCredits < amount) {
            return {
                success: false,
                error: 'insufficient_credits',
                message: 'Insufficient credits for this operation',
                currentCredits
            };
        }

        // Deduct credits
        const newCredits = currentCredits - amount;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Log credit transaction
        const { error: logError } = await supabase
            .from('credit_transactions')
            .insert([
                {
                    user_id: userId,
                    amount: -amount,
                    reason,
                    new_balance: newCredits,
                    timestamp: new Date().toISOString()
                }
            ]);

        if (logError) console.warn('Error logging credit transaction:', logError);

        return {
            success: true,
            newCredits,
            transactionId: creditsDeducted.id
        };
    } catch (error) {
        console.error('Error checking and deducting credits:', error);
        return { success: false, error: error.message };
    }
};

// Add credits
export const addCredits = async (userId, amount, reason = 'purchase') => {
    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        const currentCredits = profile?.credits || 0;
        const newCredits = currentCredits + amount;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Log credit transaction
        await supabase
            .from('credit_transactions')
            .insert([
                {
                    user_id: userId,
                    amount,
                    reason,
                    new_balance: newCredits,
                    timestamp: new Date().toISOString()
                }
            ]);

        return { success: true, newCredits };
    } catch (error) {
        console.error('Error adding credits:', error);
        return { success: false, error: error.message };
    }
};

// Get credit balance
export const getCreditBalance = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return { success: true, credits: data?.credits || 0 };
    } catch (error) {
        console.error('Error fetching credit balance:', error);
        return { success: false, error: error.message };
    }
};

// Get credit transaction history
export const getCreditHistory = async (userId, limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { success: true, transactions: data };
    } catch (error) {
        console.error('Error fetching credit history:', error);
        return { success: false, error: error.message };
    }
};

// Get low credit warning
export const checkLowCreditWarning = async (userId, threshold = 5) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const isLow = (data?.credits || 0) <= threshold;

        return {
            success: true,
            isLow,
            currentCredits: data?.credits || 0,
            threshold
        };
    } catch (error) {
        console.error('Error checking credit warning:', error);
        return { success: false, error: error.message };
    }
};

export default {
    checkAndDeductCredits,
    addCredits,
    getCreditBalance,
    getCreditHistory,
    checkLowCreditWarning
};
