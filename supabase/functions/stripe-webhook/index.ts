import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req: any) => {
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
        const planId = session.metadata?.plan_id;
        const paymentType = session.metadata?.payment_type;

        if (userId && planId) {
          if (paymentType === 'refill') {
            const refillAmount = planId === 'addon_1k' ? 1000 : 5000;
            // Use the new RPC to add to topup_balance (legacy message_limit sync kept for safety)
            await supabase.rpc('fn_add_topup_credits', { p_user_id: userId, p_amount: refillAmount });
            console.log(`Refill successful: Added ${refillAmount} to user ${userId}`);
          } else {
            // New subscription start: Call renewal RPC to initialize package credits
            if (paymentType === 'white_label') {
                await supabase
                  .from('profiles')
                  .update({ 
                    is_white_label_paid: true,
                    white_label_sub_id: session.subscription 
                  })
                  .eq('id', userId);
                console.log(`White label activated for agency: ${userId}`);
            } else {
                await supabase.rpc('fn_renew_user_subscription', { 
                  p_user_id: userId, 
                  p_plan_id: planId 
                });
                
                // Link Stripe Subscription ID to profile
                await supabase
                  .from('profiles')
                  .update({ stripe_subscription_id: session.subscription })
                  .eq('id', userId);
                
                console.log(`New subscription started for ${userId}: ${planId}`);
            }
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        // Occurs every month when subscription renews
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // We need to look up which user owns this subscription and renew their package
        if (subscriptionId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_plan')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (profile) {
            // CALL RENEWAL RPC: Reset package credits to quota, keep topup
            await supabase.rpc('fn_renew_user_subscription', { 
              p_user_id: profile.id, 
              p_plan_id: profile.subscription_plan 
            });
            console.log(`Monthly renewal successful for user ${profile.id} on plan ${profile.subscription_plan}`);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        // When subscription is cancelled or expires
        const subscription = event.data.object;
        await supabase
          .from('profiles')
          .update({ subscription_plan: 'free_tier' })
          .eq('stripe_subscription_id', subscription.id);
        
        // Optionally reset package_balance to 0 in wallet_credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (profile) {
          await supabase.from('wallet_credits').update({ package_balance: 0 }).eq('user_id', profile.id);
        }

        // Handle White Label cancellation specifically
        const { data: wlProfile } = await supabase
          .from('profiles')
          .select('id, white_label_config')
          .eq('white_label_sub_id', subscription.id)
          .single();
        
        if (wlProfile) {
          await supabase
            .from('profiles')
            .update({ 
              is_white_label_paid: false, 
              white_label_sub_id: null,
              white_label_config: { ...wlProfile.white_label_config, hide_credits: false } 
            })
            .eq('id', wlProfile.id);
          console.log(`White label deactivated for user ${wlProfile.id} due to subscription deletion.`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
