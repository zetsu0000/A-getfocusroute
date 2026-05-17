import Stripe from "stripe";
import { compactStripeMetadata, resolveProductKey } from "@/lib/access/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      priceId,
      email,
      paymentMethodId,
      product_key,
      productKey,
      funnel_step,
      funnelStep,
      quiz_result_id,
      quizResultId,
      user_name,
      userName,
    } = body;

    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const resolvedProductKey = resolveProductKey({ productKey: productKey ?? product_key, priceId });

    if (!priceId) {
      return Response.json({ error: "priceId is required" }, { status: 400 });
    }

    if (!normalizedEmail) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    if (!paymentMethodId) {
      return Response.json({ error: "paymentMethodId is required" }, { status: 400 });
    }

    const metadata = compactStripeMetadata({
      product_key: resolvedProductKey,
      email: normalizedEmail,
      funnel_step: funnelStep ?? funnel_step ?? resolvedProductKey,
      quiz_result_id: quizResultId ?? quiz_result_id,
      user_name: userName ?? user_name,
      priceId,
    });

    let customer;
    const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
    if (existing.data.length > 0) {
      customer = await stripe.customers.update(existing.data[0].id, { metadata });
    } else {
      customer = await stripe.customers.create({ email: normalizedEmail, metadata });
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
      metadata,
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string };
    const rawPI = invoice?.payment_intent;
    const paymentIntent = typeof rawPI === "string" ? null : (rawPI as Stripe.PaymentIntent | undefined);

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
