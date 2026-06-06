import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily instantiate the Stripe SDK at runtime.
 *
 * Instantiating at module scope (`const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)`)
 * makes `next build` fail during "Collecting page data" when STRIPE_SECRET_KEY is
 * absent (e.g. CI), because the Stripe constructor throws on a missing key. Deferring
 * construction to the first call inside a request handler keeps build-time module
 * evaluation side-effect-free; the key is present at runtime.
 *
 * Throws a clear error if the key is missing — callers' try/catch turns that into a
 * controlled error response instead of crashing the build.
 */
export function getStripeClient(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    client = new Stripe(apiKey);
  }
  return client;
}
