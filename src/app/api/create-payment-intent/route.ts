import Stripe from "stripe";
import { compactStripeMetadata, resolveProductKey } from "@/lib/access/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      priceId,
      email,
      product_key,
      productKey,
      funnel_step,
      funnelStep,
      quiz_result_id,
      quizResultId,
      user_name,
      userName,
    } = body;

    const resolvedProductKey = resolveProductKey({ productKey: productKey ?? product_key, priceId });
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!priceId) {
      return Response.json({ error: "priceId is required" }, { status: 400 });
    }

    if (!normalizedEmail) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount;

    if (!amount) {
      return Response.json({ error: "Stripe price must have a unit_amount" }, { status: 400 });
    }

    const metadata = compactStripeMetadata({
      product_key: resolvedProductKey,
      email: normalizedEmail,
      funnel_step: funnelStep ?? funnel_step ?? resolvedProductKey,
      quiz_result_id: quizResultId ?? quiz_result_id,
      user_name: userName ?? user_name,
      priceId,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: price.currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: normalizedEmail,
      metadata,
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
