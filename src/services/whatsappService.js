/**
 * WhatsApp Service for direct communication with Meta Cloud API.
 * Replaces n8n WhatsApp nodes.
 */

export const sendWhatsAppMessage = async (to, text, integrationSettings) => {
    try {
        const { key: accessToken, url: phoneId } = integrationSettings || {};

        if (!accessToken || !phoneId) {
            throw new Error('WhatsApp Access Token or Phone Number ID is missing in settings');
        }

        const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: {
                    preview_url: false,
                    body: text
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
        }

        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp Service Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Validates the WhatsApp credentials by sending a test message
 */
export const testWhatsAppConnection = async (to, integrationSettings) => {
    return await sendWhatsAppMessage(to, "Elite Agents: تم توصيل نظام واتساب بنجاح! ✅", integrationSettings);
};
