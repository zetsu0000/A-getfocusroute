export type RateLimitStoreResult = {
  count: number;
  ttlMs: number;
};

export interface RateLimitStore {
  increment(input: {
    key: string;
    windowSeconds: number;
    timeoutMs?: number;
  }): Promise<RateLimitStoreResult>;
}

export type RateLimitStoreConfig = {
  url: string;
  token: string;
  fetchFn?: typeof fetch;
};

const INCR_WITH_TTL_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Rate-limit backend request timed out")),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function parseRedisResult(value: unknown): RateLimitStoreResult {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("Unexpected rate-limit backend response");
  }
  const count = Number(value[0]);
  const ttlMs = Number(value[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error("Invalid rate-limit backend response");
  }
  return { count, ttlMs: Math.max(0, ttlMs) };
}

export class RedisRestRateLimitStore implements RateLimitStore {
  private readonly url: string;
  private readonly token: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: RateLimitStoreConfig) {
    this.url = config.url.replace(/\/+$/, "");
    this.token = config.token;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  async increment(input: {
    key: string;
    windowSeconds: number;
    timeoutMs?: number;
  }): Promise<RateLimitStoreResult> {
    const timeoutMs = input.timeoutMs ?? 1200;
    const body = JSON.stringify([
      "EVAL",
      INCR_WITH_TTL_SCRIPT,
      "1",
      input.key,
      String(input.windowSeconds * 1000),
    ]);
    const response = await withTimeout(
      this.fetchFn(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      timeoutMs,
    );
    if (!response.ok) {
      throw new Error("Rate-limit backend request failed");
    }
    const parsed = (await response.json()) as { result?: unknown; error?: unknown };
    if (parsed.error) {
      throw new Error("Rate-limit backend command failed");
    }
    return parseRedisResult(parsed.result);
  }
}

export function createRateLimitStoreFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): RateLimitStore | null {
  const url = env.RATE_LIMIT_REDIS_REST_URL?.trim();
  const token = env.RATE_LIMIT_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new RedisRestRateLimitStore({ url, token });
}
