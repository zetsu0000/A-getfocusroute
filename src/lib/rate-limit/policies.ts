export type RateLimitPolicyName =
  | "createPaymentIntent"
  | "createSubscription"
  | "verifyPaymentMalformed"
  | "verifyPayment"
  | "quizResult"
  | "analytics"
  | "resultEmailRequest";

export type RateLimitIdentifier =
  | "network"
  | "emailProduct"
  | "paymentObject"
  | "email"
  | "session"
  | "sessionEvent"
  | "resultRequest"
  | "userAccount";

export type RateLimitFailureMode = "deny" | "drop";

export type RateLimitBucket = {
  name: string;
  identifier: RateLimitIdentifier;
  limit: number;
  windowSeconds: number;
};

export type RateLimitPolicy = {
  name: RateLimitPolicyName;
  route: string;
  method: "POST";
  backendFailure: RateLimitFailureMode;
  buckets: readonly RateLimitBucket[];
};

export const RATE_LIMIT_POLICIES = {
  createPaymentIntent: {
    name: "createPaymentIntent",
    route: "/api/create-payment-intent",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_burst", identifier: "network", limit: 8, windowSeconds: 10 * 60 },
      { name: "email_product", identifier: "emailProduct", limit: 4, windowSeconds: 30 * 60 },
    ],
  },
  createSubscription: {
    name: "createSubscription",
    route: "/api/create-subscription",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_burst", identifier: "network", limit: 5, windowSeconds: 10 * 60 },
      { name: "email_product", identifier: "emailProduct", limit: 3, windowSeconds: 30 * 60 },
    ],
  },
  verifyPaymentMalformed: {
    name: "verifyPaymentMalformed",
    route: "/api/verify-payment",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_malformed", identifier: "network", limit: 30, windowSeconds: 10 * 60 },
    ],
  },
  verifyPayment: {
    name: "verifyPayment",
    route: "/api/verify-payment",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_poll", identifier: "network", limit: 80, windowSeconds: 10 * 60 },
      { name: "payment_object", identifier: "paymentObject", limit: 12, windowSeconds: 15 * 60 },
    ],
  },
  quizResult: {
    name: "quizResult",
    route: "/api/quiz-result",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_submit", identifier: "network", limit: 20, windowSeconds: 60 * 60 },
      { name: "email_submit", identifier: "email", limit: 6, windowSeconds: 60 * 60 },
    ],
  },
  analytics: {
    name: "analytics",
    route: "/api/analytics",
    method: "POST",
    backendFailure: "drop",
    buckets: [
      { name: "network_events", identifier: "network", limit: 300, windowSeconds: 10 * 60 },
      { name: "session_events", identifier: "session", limit: 180, windowSeconds: 10 * 60 },
      { name: "session_event_name", identifier: "sessionEvent", limit: 80, windowSeconds: 10 * 60 },
    ],
  },
  resultEmailRequest: {
    name: "resultEmailRequest",
    route: "/api/result-email/request",
    method: "POST",
    backendFailure: "deny",
    buckets: [
      { name: "network_burst", identifier: "network", limit: 10, windowSeconds: 10 * 60 },
      { name: "result_request", identifier: "resultRequest", limit: 3, windowSeconds: 60 * 60 },
      { name: "user_request", identifier: "userAccount", limit: 5, windowSeconds: 24 * 60 * 60 },
    ],
  },
} satisfies Record<RateLimitPolicyName, RateLimitPolicy>;

export function getRateLimitPolicy(name: RateLimitPolicyName): RateLimitPolicy {
  return RATE_LIMIT_POLICIES[name];
}
