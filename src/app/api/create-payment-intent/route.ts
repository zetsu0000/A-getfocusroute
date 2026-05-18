import Stripe from "stripe";

import { buildStripeFunnelMetadata } from "@/lib/stripe/metadata";
import { resolveOneTimeProductKey } from "@/lib/stripe/productKeyPolicy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const priceId = body.priceId;
    const email = typeof body.email === "string" ? body.email : "";
    const funnel_step =
      typeof body.funnel_step === "string" ? body.funnel_step : "";
    const quiz_result_id =
      typeof body.quiz_result_id === "string" ? body.quiz_result_id : "";
    const user_name =
      typeof body.user_name === "string" ? body.user_name : "";

    if (typeof priceId !== "string" || !priceId) {
      return Response.json({ error: "priceId required" }, { status: 400 });
    }
    if (!funnel_step) {
      return Response.json({ error: "funnel_step required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const productKey = resolveOneTimeProductKey(priceId, funnel_step);
    if (!productKey) {
      return Response.json(
        { error: "Invalid priceId for this funnel_step" },
        { status: 400 },
      );
    }

    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount!;

    const emailNorm = email.trim().toLowerCase();
    const funnelMeta = buildStripeFunnelMetadata({
      product_key: productKey,
      email: emailNorm,
      funnel_step,
      quiz_result_id,
      user_name,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: emailNorm,
      metadata: {
        ...funnelMeta,
        priceId,
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}