import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import { google } from "googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.time("calendar-sync-init");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, record } = payload;

    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Resolve Calendar ID & User ID
    let calendarId = payload.calendar_id || record?.google_calendar_id;
    const ownerUserId = payload.user_id || record?.user_id;

    if (!calendarId && ownerUserId) {
      const { data: integrations } = await supabaseClient
        .from('integrations')
        .select('credentials')
        .eq('user_id', ownerUserId)
        .eq('provider', 'google_calendar')
        .eq('status', 'connected')
        .maybeSingle();
      
      calendarId = integrations?.credentials?.calendar_id;
    }

    if (!calendarId) {
      console.log('No Calendar ID found for search/payload.');
      // If it's a test from UI, we might want to return error, but if it's a background trigger, we just ignore
      if (payload.calendar_id) {
         return new Response(JSON.stringify({ success: false, error: 'معرّف التقويم غير موجود.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response('Sync skipped: No Calendar ID', { status: 200, headers: corsHeaders });
    }

    // 3. Resolve Event Object
    let event = payload.event;
    if (!event && record) {
      // Mapping for INSERT trigger
      const startTime = `${record.booking_date}T${record.booking_time}`;
      // End time = Start time + 1 hour (Default)
      const startD = new Date(startTime);
      const endD = new Date(startD.getTime() + 60 * 60 * 1000);
      const endTime = endD.toISOString().replace('.000Z', '');

      event = {
        summary: `حجز: ${record.customer_name} (${record.service_requested || 'خدمة'})`,
        description: `هاتف: ${record.customer_phone}\nالحالة: ${record.status}`,
        start: { dateTime: startTime, timeZone: 'Asia/Riyadh' },
        end: { dateTime: endTime, timeZone: 'Asia/Riyadh' },
      };
    }

    if (!event) {
      return new Response(JSON.stringify({ success: false, error: 'بيانات الموعد (Event) غير موجودة.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      if (!serviceAccountKeyJson) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
      }
      
      const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
      auth = new google.auth.JWT(
        serviceAccountKey.client_email,
        null,
        serviceAccountKey.private_key,
        ['https://www.googleapis.com/auth/calendar.events']
      );
    }

    let calendar = google.calendar({ version: 'v3', auth });
    console.timeEnd("calendar-sync-init");

    // 5. Create Event
    let response;
    try {
      response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
      });
    } catch (apiError: any) {
      if (googleIntegration?.credentials?.access_token && (apiError.message.includes('invalid_client') || apiError.message.includes('invalid_grant') || apiError.message.includes('401'))) {
         console.warn(`OAuth failed during API call (${apiError.message}). Forcing Service Account fallback.`);
         const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
         if (!serviceAccountKeyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
         const serviceAccountKey = JSON.parse(serviceAccountKeyJson);
         auth = new google.auth.JWT(
           serviceAccountKey.client_email,
           null,
           serviceAccountKey.private_key,
           ['https://www.googleapis.com/auth/calendar.events']
         );
         calendar = google.calendar({ version: 'v3', auth });
         response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
         }); // Retry
      } else {
         throw apiError;
      }
    }


    console.log(`Successfully created event: ${response.data.id}`);
    return new Response(JSON.stringify({ success: true, event: response.data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in Calendar Sync:', error);
    const apiError = error.response?.data?.error?.message || error.message || String(error);
    
    let userMsg = `فشل المزامنة: ${apiError}`;
    if (apiError.includes('403')) userMsg = 'عذراً، لا نملك صلاحية الوصول. يرجى التأكد من مشاركة التقويم مع البريد الإلكتروني الخاص بالخدمة.';
    if (apiError.includes('404')) userMsg = 'المعرّف (ID) الخاص بالتقويم غير صحيح.';

    return new Response(JSON.stringify({ success: false, error: userMsg }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
