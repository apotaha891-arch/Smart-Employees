import * as adminService from './adminService';

/**
 * Service to handle communications with external tools (n8n, Google Sheets, etc.)
 */

export const triggerIntegration = async (integrationId, payload) => {
    try {
        const integrations = await adminService.getPlatformSettings('external_integrations');
        if (!integrations) throw new Error('No integrations configured');

        const integ = integrations.find(i => i.id === integrationId);
        if (!integ || !integ.url) throw new Error(`${integrationId} not connected or URL missing`);

        // Real Fetch to External Tool
        const response = await fetch(integ.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': integ.key ? `Bearer ${integ.key}` : undefined
            },
            body: JSON.stringify({
                source: 'EliteAgents_Platform',
                timestamp: new Date().toISOString(),
                ...payload
            })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        return { success: true, status: response.status };
    } catch (error) {
        console.error(`Integration Error (${integrationId}):`, error);
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
