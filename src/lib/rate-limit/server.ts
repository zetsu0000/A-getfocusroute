import {
  hmacIdentifier,
  identityContext,
  rateLimitHashSecret,
  safeHashPrefix,
  type RateLimitIdentityInput,
  type RateLimitIdentityContext,
} from "@/lib/rate-limit/identifiers";
import {
  getRateLimitPolicy,
  type RateLimitBucket,
  type RateLimitPolicy,
  type RateLimitPolicyName,
} from "@/lib/rate-limit/policies";
import {
  createRateLimitStoreFromEnv,
  type RateLimitStore,
} from "@/lib/rate-limit/store";

export type RateLimitDecision =
  | { ok: true }
  | {
      ok: false;
      kind: "limited";
      retryAfterSeconds: number;
      policyName: RateLimitPolicyName;
      bucketName: string;
      identifierHash: string;
    }
  | {
      ok: false;
      kind: "backend_error" | "configuration_missing";
      policyName: RateLimitPolicyName;
      failureMode: RateLimitPolicy["backendFailure"];
    };

export type EnforceRateLimitOptions = {
  store?: RateLimitStore | null;
  env?: NodeJS.ProcessEnv;
};

function environment(env: NodeJS.ProcessEnv): string {
  return env.VERCEL_ENV ?? env.NODE_ENV ?? "unknown";
}

function safeLog(
  event: "rate_limit_blocked" | "rate_limit_backend_error" | "rate_limit_configuration_missing" | "suspicious_object_probe",
  context: Record<string, unknown>,
) {
  const payload = {
    event,
    ...context,
  };
  if (event === "rate_limit_backend_error") {
    console.error("[rate-limit]", payload);
    return;
  }
  console.warn("[rate-limit]", payload);
}

function bucketApplies(
  bucket: RateLimitBucket,
  context: RateLimitIdentityContext,
): boolean {
  switch (bucket.identifier) {
    case "resultRequest":
      return Boolean(context.resultId);
    case "userAccount":
      return Boolean(context.userId);
    default:
      return true;
  }
}

function identifierMaterial(
  bucket: RateLimitBucket,
  context: RateLimitIdentityContext,
): string {
  switch (bucket.identifier) {
    case "network":
      return `network:${context.network}`;
    case "emailProduct":
      return `email_product:${context.email ?? "missing-email"}:${context.productKey ?? "missing-product"}`;
    case "paymentObject":
      return `payment_object:${context.paymentIntentId ?? "missing-pi"}:${context.subscriptionId ?? "no-subscription"}`;
    case "email":
      return `email:${context.email ?? "missing-email"}`;
    case "session":
      return `session:${context.sessionId ?? "missing-session"}:${context.network}`;
    case "sessionEvent":
      return `session_event:${context.sessionId ?? "missing-session"}:${context.eventName ?? "missing-event"}:${context.network}`;
    case "resultRequest":
      return `result_request:${context.resultId}:${context.network}`;
    case "userAccount":
      return `user_account:${context.userId}`;
  }
}

function keyForBucket(input: {
  policy: RateLimitPolicy;
  bucket: RateLimitBucket;
  context: RateLimitIdentityContext;
  secret: string;
}): { key: string; hash: string } {
  const material = [
    input.policy.route,
    input.policy.method,
    input.policy.name,
    input.bucket.name,
    identifierMaterial(input.bucket, input.context),
  ].join("|");
  const hash = hmacIdentifier(material, input.secret);
  return {
    key: `fr:rl:${input.policy.name}:${input.bucket.name}:${hash}`,
    hash,
  };
}

function backendFailureDecision(
  policy: RateLimitPolicy,
  kind: "backend_error" | "configuration_missing",
): RateLimitDecision {
  return {
    ok: false,
    kind,
    policyName: policy.name,
    failureMode: policy.backendFailure,
  };
}

export async function enforceRateLimit(
  policyName: RateLimitPolicyName,
  identityInput: Omit<RateLimitIdentityInput, "route">,
  options: EnforceRateLimitOptions = {},
): Promise<RateLimitDecision> {
  const policy = getRateLimitPolicy(policyName);
  const env = options.env ?? process.env;
  const production = env.NODE_ENV === "production";
  const secret = rateLimitHashSecret(env);
  const store =
    options.store !== undefined ? options.store : createRateLimitStoreFromEnv(env);

  if (!secret || !store) {
    safeLog("rate_limit_configuration_missing", {
      route: policy.route,
      method: policy.method,
      policy: policy.name,
      environment: environment(env),
      reason: !secret ? "missing_hmac_secret" : "missing_backend",
    });
    if (!production) return { ok: true };
    return backendFailureDecision(policy, "configuration_missing");
  }

  const context = identityContext({ ...identityInput, route: policy.route });
  for (const bucket of policy.buckets) {
    if (!bucketApplies(bucket, context)) continue;
    const { key, hash } = keyForBucket({ policy, bucket, context, secret });
    try {
      const result = await store.increment({
        key,
        windowSeconds: bucket.windowSeconds,
      });
      if (result.count > bucket.limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(result.ttlMs / 1000),
        );
        safeLog("rate_limit_blocked", {
          route: policy.route,
          method: policy.method,
          policy: policy.name,
          bucket: bucket.name,
          environment: environment(env),
          reason: "threshold_exceeded",
          identifier_hash_prefix: safeHashPrefix(hash),
        });
        if (policy.name === "verifyPayment" && bucket.identifier === "paymentObject") {
          safeLog("suspicious_object_probe", {
            route: policy.route,
            method: policy.method,
            policy: policy.name,
            environment: environment(env),
            reason: "object_bucket_exceeded",
            identifier_hash_prefix: safeHashPrefix(hash),
          });
        }
        return {
          ok: false,
          kind: "limited",
          retryAfterSeconds,
          policyName: policy.name,
          bucketName: bucket.name,
          identifierHash: hash,
        };
      }
    } catch {
      safeLog("rate_limit_backend_error", {
        route: policy.route,
        method: policy.method,
        policy: policy.name,
        bucket: bucket.name,
        environment: environment(env),
        reason: "backend_unavailable",
      });
      if (!production) return { ok: true };
      return backendFailureDecision(policy, "backend_error");
    }
  }

  return { ok: true };
}

export function rateLimitResponse(decision: Extract<RateLimitDecision, { kind: "limited" }>): Response {
  return Response.json(
    { error: "rate_limited", code: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function temporaryUnavailableResponse(): Response {
  return Response.json(
    { error: "temporarily_unavailable", code: "temporarily_unavailable" },
    {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
