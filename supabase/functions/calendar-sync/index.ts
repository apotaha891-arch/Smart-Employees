import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import { google } from "googleapis/";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, calendar_id, user_id, event } = payload;

    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Auth with Google Service Account
    const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyJson) {
      return new Response(JSON.stringify({ success: false, error: 'SERVER_CONFIG_ERROR: Missing Service Account Key' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
    const auth = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      ['https://www.googleapis.com/auth/calendar.events']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // 3. Create Event
    try {
      const response = await calendar.events.insert({
        calendarId: calendar_id || 'primary',
        requestBody: event,
      });

      console.log(`Successfully created event: ${response.data.id}`);
      return new Response(JSON.stringify({ success: true, event: response.data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (apiError: any) {
      console.error('Google Calendar API Error:', apiError);
      const errMsg = apiError.message || String(apiError);
      
      if (errMsg.includes('403') || errMsg.includes('forbidden')) {
        return new Response(JSON.stringify({ success: false, error: 'عذراً، لا نملك صلاحية الوصول. يرجى التأكد من مشاركة التقويم مع البريد الإلكتروني google-sheet@...' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (errMsg.includes('404')) {
        return new Response(JSON.stringify({ success: false, error: 'المعرّف (ID) الخاص بالتقويم غير صحيح.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      return new Response(JSON.stringify({ success: false, error: `Google API Error: ${errMsg}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('Error in Calendar Sync:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || String(error) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
