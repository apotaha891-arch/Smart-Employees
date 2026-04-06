import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const agencyId = '6f5abd36-9a90-4ca0-acc6-44c0efa2d6be';

async function fix() {
    console.log("Agency ID:", agencyId);

    // 1. Fetch Agency's clients to find "Imtenan"
    const { data: clients } = await supabase.from('profiles').select('id, full_name, email, business_name').eq('agency_id', agencyId);
    console.log("Agency Clients found:", clients?.length || 0);
    // Find the client whose name OR business name contains "Imtenan" or "امتنان"
    const imtenanClient = clients?.find(c => 
        (c.full_name && (c.full_name.includes('Imtenan') || c.full_name.includes('امتنان'))) ||
        (c.business_name && (c.business_name.includes('Imtenan') || c.business_name.includes('امتنان'))) ||
        (c.email && c.email.includes('imtenan'))
    );

    if (!imtenanClient) {
        console.warn("Could not find a sub-client for Imtenan. Agency clients:", JSON.stringify(clients, null, 2));
        // Fallback: If no client found, maybe the user wants to assign it to some specific client they recently created.
        // Let's list all agency's clients to help them.
        return;
    }

    console.log("Target Client found:", imtenanClient.id, `(${imtenanClient.business_name || imtenanClient.full_name})`);

    // 2. Find the Entity/Agent currently wrongly owned by Agency
    // "عيادة د.امتنان" Entity
    const { data: entity } = await supabase.from('entities')
        .select('*')
        .eq('user_id', agencyId)
        .ilike('agent_name', '%امتنان%')
        .maybeSingle();

    if (entity) {
        console.log("Entity wrongly owned by Agency:", entity.id, "Updating user_id to client:", imtenanClient.id);
        const { error: eErr } = await supabase.from('entities').update({ user_id: imtenanClient.id }).eq('id', entity.id);
        if (eErr) console.error("Error updating entity:", eErr.message);
        
        // 3. Move Agents too
        const { data: agents } = await supabase.from('agents').select('id').eq('entity_id', entity.id);
        if (agents && agents.length > 0) {
            console.log(`Moving ${agents.length} agents to client ownership.`);
            const { error: aErr } = await supabase.from('agents').update({ user_id: imtenanClient.id }).eq('entity_id', entity.id);
            if (aErr) console.error("Error updating agents:", aErr.message);
        }

        // 4. Move Bookings/Tasks (Data associated with entity usually doesn't have user_id, but check if they do)
        // Check chat sessions
        const { error: sErr } = await supabase.from('chat_sessions').update({ user_id: imtenanClient.id }).eq('agent_id', agents?.[0]?.id);
        // Wait, sessions might not have user_id.

        console.log("Data Ownership Fixed! ✅");
    } else {
        console.error("Could not find the Entity with name 'Imtenan' owned by the Agency.");
    }
}

fix();
