/**
 * Legacy path: forwards to the same verified handler as `/api/stripe/webhook`.
 * Configure Stripe to either URL; both stay supported.
 */
export { POST } from "../stripe/webhook/route";
