import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import { google } from "googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.time("sheets-sync-init");
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Processing sheets-sync payload:", payload.type);

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

    // 2. Resolve Spreadsheet ID
    // Priority: 1. Manual test ID, 2. Passed in record (Easy Sync), 3. Integrations table (OAuth)
    let spreadsheetId = payload.test_spreadsheet_id || newRecord.google_sheets_id;

    if (!spreadsheetId) {
      const { data: integrations } = await supabaseClient
        .from('integrations')
        .select('credentials')
        .eq('user_id', ownerUserId)
        .eq('provider', 'google_sheets')
        .eq('status', 'connected')
        .maybeSingle();
      
      spreadsheetId = integrations?.credentials?.spreadsheet_id;
    }

    if (!spreadsheetId) {
      console.log('No Spreadsheet ID found for user:', ownerUserId);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'لم يتم العثور على معرّف جدول جوجل شيت. يرجى التأكد من حفظ الإعدادات في صفحة الربط.' 
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let auth: any = null;
    const { data: googleIntegration } = await supabaseClient
      .from('integrations')
      .select('credentials')
      .eq('user_id', ownerUserId)
      .eq('provider', 'google')
      .eq('status', 'connected')
      .maybeSingle();

    if (googleIntegration?.credentials?.access_token) {
      console.log(`Trying OAuth2 Auth for user ${ownerUserId}`);
      const oauth2Client = new google.auth.OAuth2(
        Deno.env.get('GOOGLE_CLIENT_ID') || '',
        Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
      );
      oauth2Client.setCredentials({
        access_token: googleIntegration.credentials.access_token,
        refresh_token: googleIntegration.credentials.refresh_token,
      });
      
      try {
        // Proactively test token validity
        await oauth2Client.getAccessToken();
        auth = oauth2Client;
        console.log(`OAuth2 Auth successful for user ${ownerUserId}`);
      } catch (authErr: any) {
        console.warn(`OAuth token invalid (${authErr.message}). Falling back to Service Account.`);
        auth = null;
      }
    }

    if (!auth) {
      console.log(`Using Service Account Auth for user ${ownerUserId}`);
      const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
      if (!serviceAccountKeyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
      
      const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
      auth = new google.auth.JWT(
        serviceAccountKey.client_email,
        null,
        serviceAccountKey.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
      );
    }

    let sheets = google.sheets({ version: 'v4', auth });
    console.timeEnd("sheets-sync-init");

    // 4. GET SPREADSHEET METADATA (To find the first sheet name automatically)
    let firstSheetName = 'Sheet1';
    let spreadsheetData;
    
    try {
      spreadsheetData = await sheets.spreadsheets.get({ spreadsheetId });
    } catch (metaError: any) {
      // If OAuth was used and it fails with auth errors, fall back to Service Account and retry
      if (googleIntegration?.credentials?.access_token && (metaError.message.includes('invalid_client') || metaError.message.includes('invalid_grant') || metaError.message.includes('401'))) {
         console.warn(`OAuth failed during API call (${metaError.message}). Forcing Service Account fallback.`);
         const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
         if (!serviceAccountKeyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
         const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
         auth = new google.auth.JWT(
           serviceAccountKey.client_email,
           null,
           serviceAccountKey.private_key,
           ['https://www.googleapis.com/auth/spreadsheets']
         );
         sheets = google.sheets({ version: 'v4', auth });
         spreadsheetData = await sheets.spreadsheets.get({ spreadsheetId }); // Retry
      } else {
         throw metaError;
      }
    }
    
    try {
      firstSheetName = spreadsheetData.data.sheets?.[0]?.properties?.title || 'Sheet1';
      console.log(`Using auto-detected sheet: ${firstSheetName}`);
    } catch (metaError: any) {
      console.error('Error fetching spreadsheet metadata:', metaError);
      const errMsg = metaError.message || String(metaError);
      if (errMsg.includes('403')) return new Response(JSON.stringify({ success: false, error: 'عذراً، لا نملك صلاحية الوصول. يرجى التأكد من مشاركة الجدول مع البريد الإلكتروني google-sheet@...' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (errMsg.includes('404')) return new Response(JSON.stringify({ success: false, error: 'المعرّف (ID) الخاص بالجدول غير صحيح.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw metaError;
    }

    // 4. Prepare data to append
    const rowData = [
      newRecord.id,
      newRecord.created_at,
      newRecord.customer_name || 'N/A',
      newRecord.customer_phone || 'N/A',
      newRecord.service_requested || 'N/A',
      newRecord.booking_date || 'N/A',
      newRecord.booking_time || 'N/A',
      newRecord.status || 'pending'
    ];

    // 5. Append Row to Sheet using the detected name
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${firstSheetName}!A:H`, 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`Successfully synced record ${newRecord.id} to Google Sheets [${firstSheetName}].`);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error: any) {
    console.error('Error in Sheets Sync:', error);
    const apiError = error.response?.data?.error?.message || error.message || String(error);
    return new Response(JSON.stringify({ success: false, error: `فشل الاتصال بجوجل: ${apiError}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
});
