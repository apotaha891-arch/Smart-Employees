import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fbAppId = Deno.env.get('IG_APP_ID');
    const fbAppSecret = Deno.env.get('IG_APP_SECRET');

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const redirectUri = `${supabaseUrl}/functions/v1/instagram-auth/callback`;

    // 1. Authorize: Redirect to Facebook/Instagram Login
    if (path === 'authorize') {
        const userId = url.searchParams.get('user_id');
        if (!userId) return new Response('Missing user_id', { status: 400 });

        const scope = [
            'instagram_basic',
            'instagram_manage_messages',
            'pages_manage_metadata',
            'pages_show_list',
            'public_profile'
        ].join(',');

        const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${userId}`;
        
        return Response.redirect(authUrl, 302);
    }

    // 2. Callback: Handle redirect from Facebook
    if (path === 'callback') {
        const code = url.searchParams.get('code');
        const userId = url.searchParams.get('state'); // We passed user_id as state

        if (!code || !userId) {
            return new Response('Missing code or state', { status: 400, headers: corsHeaders });
        }

        try {
            // A. Exchange code for short-lived token
            const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`);
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok) throw new Error(tokenData.error?.message || 'Token exchange failed');

            const shortToken = tokenData.access_token;

            // B. Exchange for long-lived token (60 days)
            const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${fbAppId}&client_secret=${fbAppSecret}&fb_exchange_token=${shortToken}`);
            const longTokenData = await longTokenRes.json();
            
            if (!longTokenRes.ok) throw new Error(longTokenData.error?.message || 'Long-lived token exchange failed');

            const accessToken = longTokenData.access_token;

            // C. Update Database
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
            const { error: dbError } = await supabase
                .from('salon_configs')
                .update({ 
                    instagram_token: accessToken,
                    instagram_settings: { 
                        connected_at: new Date().toISOString(),
                        token_type: 'long-lived'
                    }
                })
                .eq('user_id', userId);

            if (dbError) throw dbError;

            // D. Redirect back to frontend
            const origin = url.origin.includes('localhost') ? 'http://localhost:5173' : 'https://24shift.solutions';
            return Response.redirect(`${origin}/setup?tab=integrations&connection=success&provider=instagram`, 302);

        } catch (err: any) {
            console.error('OAuth Callback Error:', err.message);
            const origin = url.origin.includes('localhost') ? 'http://localhost:5173' : 'https://24shift.solutions';
            return Response.redirect(`${origin}/setup?tab=integrations&connection=error&provider=instagram&message=${encodeURIComponent(err.message)}`, 302);
        }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
});
