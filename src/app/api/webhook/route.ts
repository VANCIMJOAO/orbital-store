import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";

const log = createLogger("stripe-webhook");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    log.error("Webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.warn(`Payment failed: ${paymentIntent.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Webhook handler error", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const items = JSON.parse(session.metadata?.items || "[]");

  // Create order in database
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_id: null, // Will be linked if user is logged in
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      status: "paid",
      total: session.amount_total ? session.amount_total / 100 : 0,
      shipping_address: session.collected_information?.shipping_details || null,
      customer_email: session.customer_email,
    })
    .select()
    .single();

  if (orderError) {
    log.error("Error creating order", orderError);
    throw orderError;
  }

  // Create order items and update stock
  for (const item of items) {
    // Get variant and product info
    const { data: variant } = await supabaseAdmin
      .from("product_variants")
      .select("id, size, stock, product_id")
      .eq("id", item.variantId)
      .single();

    if (!variant) continue;

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, price")
      .eq("id", item.productId)
      .single();

    // Create order item with correct column names
    await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_variant_id: item.variantId,
      product_name: product?.name || "Produto",
      product_size: variant.size,
      quantity: item.quantity,
      unit_price: product?.price || 0,
    });

    // Decrease stock
    await supabaseAdmin
      .from("product_variants")
      .update({ stock: Math.max(0, variant.stock - item.quantity) })
      .eq("id", item.variantId);
  }

  log.info(`Order created: ${order.id}`);
}
