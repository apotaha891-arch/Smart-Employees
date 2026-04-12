import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
        throw new Error("Missing STRIPE_SECRET_KEY in Edge Function Secrets.");
    }

    const body = await req.json();
    const { planId, successUrl, cancelUrl, guestEmail } = body;
    console.log(`[checkout] Request received — planId: ${planId}`);

    // 1. Setup Auth and Admin clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let user: any = null;
    let userEmail = '';
    let customerId = '';

    // Check if user is logged in
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.includes('Bearer')) {
        const jwt = authHeader.replace('Bearer ', '').trim();
        const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data } = await supabaseAuthClient.auth.getUser(jwt);
        user = data?.user;
    }

    // 2. Identify Customer
    if (user) {
        console.log(`[checkout] Identified logged-in user: ${user.id}`);
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('stripe_customer_id, email')
          .eq('id', user.id)
          .maybeSingle();
        
        customerId = profile?.stripe_customer_id || '';
        userEmail = profile?.email || user.email || '';
    } else if (planId === 'academy_access' && guestEmail) {
        console.log(`[checkout] Guest checkout for: ${guestEmail}`);
        userEmail = guestEmail;
    } else {
        throw new Error("Unauthorized: Invalid session or missing guest email.");
    }

    // 3. Create Stripe Customer if missing AND we have a logged in user (for subscriptions)
    const mode: 'subscription' | 'payment' = planId === 'academy_access' || planId.startsWith('addon_') ? 'payment' : 'subscription';

    if (user && !customerId) {
      console.log(`[checkout] Creating Stripe customer for user: ${user.id}`);
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // 4. Determine Price ID
    let priceId = '';
    let couponId = '';

    if (planId === 'starter') {
      priceId = Deno.env.get('STRIPE_PRICE_STARTER') || '';
      couponId = Deno.env.get('STRIPE_COUPON_STARTER') || '';
    } else if (planId === 'pro') {
      priceId = Deno.env.get('STRIPE_PRICE_PRO') || '';
      couponId = Deno.env.get('STRIPE_COUPON_PRO') || '';
    } else if (planId === 'addon_1k') {
      priceId = Deno.env.get('STRIPE_PRICE_ADDON_1K') || '';
    } else if (planId === 'addon_5k') {
      priceId = Deno.env.get('STRIPE_PRICE_ADDON_5K') || '';
    } else if (planId === 'agency_white_label') {
      const { data: dbSetting } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'agency_white_label_price_id').maybeSingle();
      priceId = dbSetting?.value || Deno.env.get('STRIPE_PRICE_WHITE_LABEL') || '';
    } else if (planId === 'academy_access') {
      const { data: dbSetting } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'academy_price_id').maybeSingle();
      priceId = dbSetting?.value || Deno.env.get('STRIPE_PRICE_ACADEMY') || 'price_1TLQyRAWmA1i5IJrQH2W5PE7';
    } else {
      throw new Error(`Invalid Plan: ${planId}`);
    }

    if (!priceId) {
      throw new Error(`Stripe Price ID not configured for plan: ${planId}`);
    }

    // 5. Create Session
    const sessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?refill=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user?.id || 'guest',
        plan_id: planId,
        guest_email: user ? undefined : userEmail
      }
    };

    if (user && customerId) {
        sessionConfig.customer = customerId;
        if (couponId) sessionConfig.discounts = [{ coupon: couponId }];
    } else {
        // Guest checkout or first-time user: use email
        sessionConfig.customer_email = userEmail;
    }

    console.log(`[checkout] Creating Stripe session...`);
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error(`[checkout] ERROR: ${err.message}`);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
