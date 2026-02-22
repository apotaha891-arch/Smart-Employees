import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { google } from "npm:googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // This function is intended to be called by a Supabase Database Webhook (Trigger)
    // Payload structure expected from Supabase Webhook on Insert:
    // { type: 'INSERT', table: 'bookings', record: { id, user_id, customer_name, ... } }

    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response('Event ignored', { status: 200, headers: corsHeaders });
    }

    const newRecord = payload.record;
    const ownerUserId = newRecord.user_id;

    // 1. Initialize Supabase Client (Service Role to bypass RLS for internal tasks)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch the Google Sheets Integration for this user
    const { data: integrations, error: intError } = await supabaseClient
      .from('integrations')
      .select('credentials')
      .eq('user_id', ownerUserId)
      .eq('provider', 'google_sheets')
      .eq('status', 'connected')
      .single();

    if (intError || !integrations || !integrations.credentials) {
      console.log('No active Google Sheets integration found for user:', ownerUserId);
      return new Response('No integration found', { status: 200, headers: corsHeaders });
    }

    const sheetsCreds = integrations.credentials;
    const spreadsheetId = sheetsCreds.spreadsheet_id; // Added during OAuth setup

    if (!spreadsheetId) {
      console.log('No Spreadsheet ID specified in credentials.');
      return new Response('Configuration missing', { status: 200, headers: corsHeaders });
    }

    // 3. Initialize Google Sheets API
    const auth = new google.auth.OAuth2();
    auth.setCredentials(sheetsCreds);
    const sheets = google.sheets({ version: 'v4', auth });

    // 4. Prepare data to append
    // Map the database record to columns in the sheet
    const rowData = [
      newRecord.id,
      newRecord.created_at,
      newRecord.customer_name || 'N/A',
      newRecord.customer_phone || 'N/A',
      newRecord.service || 'N/A',
      newRecord.date || 'N/A',
      newRecord.time || 'N/A',
      newRecord.status || 'pending'
    ];

    // 5. Append Row to Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:H', // Adjust range/sheet name as needed
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(\`Successfully synced record \${newRecord.id} to Google Sheets.\`);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    } catch (error: any) {
        console.error('Error in Sheets Sync:', error);
        return new Response(JSON.stringify({ success: false, error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
