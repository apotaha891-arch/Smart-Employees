import { supabase } from './supabaseService';
import * as adminService from './adminService';

/**
 * Service to handle communications with Native Integrations (Supabase Edge Functions)
 */

export const triggerIntegration = async (agentId, sessionId, message) => {
    try {
        // Native Call to our secure Edge Function
        // This replaces the old n8n webhook and handles everything natively
        const { data, error } = await supabase.functions.invoke('agent-handler', {
            body: {
                message,
                sessionId,
                agentId
            }
        });

        if (error) throw new Error(error.message);

        return { success: true, text: data?.text };
    } catch (error) {
        console.error(`Edge Function Error:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Trigger a specific dynamic event to n8n
 */
export const triggerEvent = async (eventType, data) => {
    return await triggerIntegration('n8n', {
        type: 'DYNAMIC_TRIGGER',
        event: eventType,
        data: data
    });
};

/**
 * Station 3: Availability Check (Calendar)
 */
export const checkAvailability = async (patient, dateTime) => {
    return await triggerEvent('AVAILABILITY_CHECK', { patient, dateTime });
};

/**
 * Station 4: The Triple Strike (CRM, Finance, Inventory)
 */
export const processTransaction = async (details) => {
    return await triggerEvent('TRANSACTION_TRIPLE_STRIKE', details);
};

/**
 * Station 5: Final Confirmation (WhatsApp Closing)
 */
export const sendFinalConfirmation = async (patientId, details) => {
    return await triggerEvent('FINAL_CLOSING_CONFIRMATION', { patientId, ...details });
};

/**
 * Specifically for Google Sheets (sending leads)
 */
export const exportLeadsToSheets = async (leads) => {
    return await triggerIntegration('google_sheets', {
        type: 'LEAD_EXPORT',
        data: leads
    });
};
