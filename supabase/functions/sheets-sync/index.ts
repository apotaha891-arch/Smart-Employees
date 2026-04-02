import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import { google } from "googleapis/";

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
      if (payload.test_spreadsheet_id) {
        console.log('Using test_spreadsheet_id override');
      } else {
        console.log('No active Google Sheets integration found for user:', ownerUserId);
        return new Response(JSON.stringify({ success: false, error: 'لم يتم العثور على ربط نشط. تأكد من حفظ البيانات أولاً.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const sheetsCreds = integrations?.credentials || {};
    // Use test_spreadsheet_id if provided (from the UI test button), otherwise use from DB
    const spreadsheetId = payload.test_spreadsheet_id || sheetsCreds.spreadsheet_id;

    if (!spreadsheetId) {
      console.log('No Spreadsheet ID specified in credentials.');
      return new Response(JSON.stringify({ success: false, error: 'معرّف الجدول غير موجود في الإعدادات المحفوظة.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Initialize Google Sheets API using Service Account
    const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyJson) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
      return new Response(JSON.stringify({ success: false, error: 'SERVER_CONFIG_ERROR: يرجى إعداد مفتاح GOOGLE_SERVICE_ACCOUNT_KEY في إعدادات Supabase.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
    const auth = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. GET SPREADSHEET METADATA (To find the first sheet name automatically)
    let firstSheetName = 'Sheet1';
    try {
      const spreadsheetData = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });
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
      newRecord.service || 'N/A',
      newRecord.date || 'N/A',
      newRecord.time || 'N/A',
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
