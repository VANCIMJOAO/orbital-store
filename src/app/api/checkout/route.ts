import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("checkout");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export async function POST(request: NextRequest) {
  try {
    const { items, customerEmail } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: CartItem) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            description: `Tamanho: ${item.size}`,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.productId,
              variant_id: item.variantId,
              size: item.size,
            },
          },
          unit_amount: Math.round(item.price), // Price already in cents from DB
        },
        quantity: item.quantity,
      })
    );

    // Create Stripe Checkout session
    // Cartão de crédito (PIX requer ativação especial com EBANX)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${request.headers.get("origin")}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/checkout/cancelado`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ["BR"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 1500, // R$15,00
              currency: "brl",
            },
            display_name: "Envio Padrão",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 10,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 2500, // R$25,00
              currency: "brl",
            },
            display_name: "Envio Expresso",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 2,
              },
              maximum: {
                unit: "business_day",
                value: 4,
              },
            },
          },
        },
      ],
      locale: "pt-BR",
      metadata: {
        items: JSON.stringify(
          items.map((item: CartItem) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          }))
        ),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    log.error("Stripe checkout error", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout" },
      { status: 500 }
    );
  }
}
