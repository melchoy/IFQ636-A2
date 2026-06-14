import Stripe from "stripe";
import { PaymentValidationError } from "./payment.errors.js";
import { env } from "../../config/env.js";

const stripe = new Stripe(env.stripeSecretKey);


  function getPaymentIntentId(
    paymentIntent: string | { id: string } | null,
  ) {
    if (!paymentIntent) {
      return null;
    }
  
    return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
  }

export async function createCheckoutSession(input: {
  cancelUrl: string;
  customerEmail: string;
  items: { lineTotal: number; name: string; quantity: number }[];
  orderId: string;
  successUrl: string;
}) {
  return stripe.checkout.sessions.create({
    cancel_url: input.cancelUrl,
    client_reference_id: input.orderId,
    customer_email: input.customerEmail,
    line_items: input.items.map((item) => ({
      price_data: {
        currency: "aud",
        product_data: { name: item.name },
        unit_amount: Math.round((item.lineTotal / item.quantity) * 100),
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId: input.orderId,
    },
    mode: "payment",
    payment_method_types: ["card"],
    success_url: input.successUrl,
  });
}

export async function verifyCheckoutSession(input: {
  expectedTotal: number;
  orderId: string;
  sessionId: string;
}) {
  const session = await stripe.checkout.sessions.retrieve(input.sessionId);
  const expectedAmount = Math.round(input.expectedTotal * 100);

  if (
    session.payment_status !== "paid" ||
    session.client_reference_id !== input.orderId ||
    session.amount_total !== expectedAmount ||
    session.currency !== "aud"
  ) {
    throw new PaymentValidationError("Payment could not be verified");
  }

  return {
      amount: session.amount_total! / 100,
      currency: session.currency!,
      paymentReference: getPaymentIntentId(session.payment_intent),
      providerSessionId: session.id,
    };
}
