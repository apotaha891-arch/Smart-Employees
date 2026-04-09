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
    const { planId, successUrl, cancelUrl } = await req.json();
    console.log(`[checkout] Request received — planId: ${planId}`);

    // 1. Get User ID from Auth Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const jwt = authHeader.replace('Bearer ', '').trim();
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser(jwt);
    if (userError || !user) throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`);

    console.log(`[checkout] Authenticated user: ${user.id}`);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch User Profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;
    const userEmail = profile?.email || user.email || '';

    // 3. Create Stripe Customer if missing (only needed for subscriptions)
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
      console.log(`[checkout] Created new Stripe customer: ${customerId}`);
    }

    // 4. Determine Price and Payment Mode
    let priceId = '';
    let couponId = '';
    let mode: 'subscription' | 'payment' = 'subscription';
    const isAddon = planId.startsWith('addon_');

    if (planId === 'starter') {
      priceId = Deno.env.get('STRIPE_PRICE_STARTER') || '';
      couponId = Deno.env.get('STRIPE_COUPON_STARTER') || '';
    } else if (planId === 'pro') {
      priceId = Deno.env.get('STRIPE_PRICE_PRO') || '';
      couponId = Deno.env.get('STRIPE_COUPON_PRO') || '';
    } else if (planId === 'addon_1k') {
      priceId = Deno.env.get('STRIPE_PRICE_ADDON_1K') || '';
      mode = 'payment';
    } else if (planId === 'addon_5k') {
      priceId = Deno.env.get('STRIPE_PRICE_ADDON_5K') || '';
      mode = 'payment';
    } else if (planId === 'agency_white_label') {
      // 1. Try to fetch dynamic price from DB first
      const { data: dbSetting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'agency_white_label_price_id')
        .maybeSingle();
      
      priceId = dbSetting?.value || Deno.env.get('STRIPE_PRICE_WHITE_LABEL') || '';
      mode = 'subscription';
    } else {
      throw new Error(`Invalid Plan: ${planId}`);
    }

    console.log(`[checkout] priceId: ${priceId}, mode: ${mode}`);

    if (!priceId) throw new Error(`Stripe Price ID not configured for plan: ${planId}`);

    // 5. Build Session Config
    // For one-time payments (addons), use customer_email instead of customer
    // to avoid conflicts with subscription-mode customers
    const sessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?refill=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
        payment_type: planId === 'agency_white_label' ? 'white_label' : (isAddon ? 'refill' : 'subscription')
      }
    };

    if (isAddon) {
      // One-time payment: attach customer by email to avoid mode conflicts
      sessionConfig.customer_email = userEmail;
    } else {
      // Subscription: use the stored customer object
      sessionConfig.customer = customerId;
      if (couponId) sessionConfig.discounts = [{ coupon: couponId }];
    }

    console.log(`[checkout] Creating Stripe session...`);
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log(`[checkout] Session created: ${session.id}, url: ${session.url?.slice(0, 60)}...`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    // Log the full Stripe error details
    const stripeCode = err?.raw?.code || err?.code || '';
    const stripeType = err?.raw?.type || err?.type || '';
    const stripeMsg  = err?.raw?.message || err?.message || 'Unknown error';

    console.error(`[checkout] ERROR — type: ${stripeType}, code: ${stripeCode}, message: ${stripeMsg}`);
    console.error(`[checkout] Stack:`, err.stack);

    // Return a user-friendly + debuggable error
    return new Response(
      JSON.stringify({
        error: stripeMsg,
        stripe_code: stripeCode,
        stripe_type: stripeType,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
