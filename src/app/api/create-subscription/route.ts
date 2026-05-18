import Stripe from "stripe";

import { buildStripeFunnelMetadata } from "@/lib/stripe/metadata";
import { resolveMembershipProductKey } from "@/lib/stripe/productKeyPolicy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const priceId = body.priceId;
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const paymentMethodId = body.paymentMethodId;
    const funnel_step =
      typeof body.funnel_step === "string" ? body.funnel_step : "subscription";
    const quiz_result_id =
      typeof body.quiz_result_id === "string" ? body.quiz_result_id : "";
    const user_name =
      typeof body.user_name === "string" ? body.user_name : "";

    if (typeof priceId !== "string" || !priceId) {
      return Response.json({ error: "priceId required" }, { status: 400 });
    }
    if (typeof paymentMethodId !== "string" || !paymentMethodId) {
      return Response.json({ error: "paymentMethodId required" }, { status: 400 });
    }
    if (!emailRaw || !emailRaw.includes("@")) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const email = emailRaw.trim().toLowerCase();

    const productKey = resolveMembershipProductKey(priceId);
    if (!productKey) {
      return Response.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const funnelMeta = buildStripeFunnelMetadata({
      product_key: productKey,
      email,
      funnel_step,
      quiz_result_id,
      user_name,
    });

    let customer: Stripe.Customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
      await stripe.customers.update(customer.id, { metadata: funnelMeta });
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: funnelMeta,
      });
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      metadata: funnelMeta,
      expand: ["latest_invoice.payment_intent"],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent | string;
    };
    const rawPI = invoice?.payment_intent;
    const paymentIntent =
      typeof rawPI === "string" ? null : (rawPI as Stripe.PaymentIntent | undefined);

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret ?? null,
      status: subscription.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
