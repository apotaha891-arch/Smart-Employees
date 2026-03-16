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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, successUrl, cancelUrl } = await req.json();

    // 1. Get User ID from Auth Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    // Service role key needed to bypass RLS to read/write stripe_customer_id on profiles table
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Extract the JWT from the Bearer string
    const jwt = authHeader.replace('Bearer ', '').trim();

    // Client for verifying user JWT token
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser(jwt);
    if (userError || !user) {
      console.error("Auth Error:", userError);
      throw new Error(`Unauthorized. JWT issue: ${userError?.message || 'No user found'}.`);
    }

    // Client for DB operations (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch User Profile to get Customer ID
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single();

    if (profileError) {
      console.error("Profile Error:", profileError);
    }

    let customerId = profile?.stripe_customer_id;

    // 3. Create Stripe Customer if it doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      // Save to DB
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // 4. Determine Price and Payment Mode based on planId
    let priceId = '';
    let couponId = '';
    let mode: 'subscription' | 'payment' = 'subscription';

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
    } else {
      throw new Error("Invalid Plan Selection");
    }

    if (!priceId) {
        throw new Error(`Stripe Price ID not configured for plan: ${planId}`);
    }

    // 5. Create Checkout Session
    const sessionConfig: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?refill=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
        payment_type: mode === 'payment' ? 'refill' : 'subscription'
      }
    };

    if (couponId && mode === 'subscription') {
      sessionConfig.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("CATCH BLOCK ERROR:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
