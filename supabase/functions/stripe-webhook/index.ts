import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  // 1. Validate signature
  const signature = req.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    return new Response("Webhook Error: Missing secret or signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    // Optional: initialize supabase client (Bypassing RLS by using service role key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Handle specific Stripe Events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Get user and plan metadata from checkout session
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id; // e.g., 'starter' or 'pro'

        if (userId && planId) {
          // Update User Profile with limits
          const limit = planId === 'starter' ? 2000 : 5000;

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_plan: planId,
              message_limit: limit,
              stripe_subscription_id: session.subscription
            })
            .eq('id', userId);

          if (error) console.error("Error updating profile: ", error);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        // Occurs every month when subscription renews
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // We need to look up which user owns this subscription and reset their limit
        if (subscriptionId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_plan')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (profile) {
            const limit = profile.subscription_plan === 'starter' ? 2000 : 5000;
            await supabase.from('profiles').update({ message_limit: limit }).eq('id', profile.id);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        // When subscription is cancelled or expires
        const subscription = event.data.object;
        await supabase
          .from('profiles')
          .update({ subscription_plan: 'free_tier', message_limit: 0 })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
