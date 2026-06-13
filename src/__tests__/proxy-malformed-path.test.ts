import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  paidHomepageRedirectPath: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/assessment/autostart", () => ({
  paidHomepageRedirectPath: mocks.paidHomepageRedirectPath,
}));

import { config, proxy } from "@/proxy";

function request(path: string) {
  return new NextRequest(`https://focusroute.test${path}`);
}

function parsedLocation(response: Response) {
  const location = response.headers.get("location");
  expect(location).toBeTruthy();
  return new URL(location ?? "", "https://focusroute.test");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_test";
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mocks.createServerClient.mockReturnValue({
    auth: { getUser: mocks.getUser },
  });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("proxy malformed backslash path guard", () => {
  it("matches malformed paths so the proxy can guard them", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/login%5C",
      }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/api%5Cverify-payment",
      }),
    ).toBe(true);
  });

  it("redirects trailing encoded backslashes with status 308 on the same origin", async () => {
    const response = await proxy(request("/login%5C"));
    const location = parsedLocation(response);

    expect(response.status).toBe(308);
    expect(location.origin).toBe("https://focusroute.test");
    expect(location.pathname).toBe("/login");
    expect(location.search).toBe("");
    expect(mocks.paidHomepageRedirectPath).not.toHaveBeenCalled();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("preserves query strings and paid attribution on trailing-path redirects", async () => {
    const response = await proxy(
      request("/assessment%5C?utm_source=meta&utm_medium=paid_social&value=%5C"),
    );
    const location = parsedLocation(response);

    expect(response.status).toBe(308);
    expect(location.pathname).toBe("/assessment");
    expect(location.search).toBe("?utm_source=meta&utm_medium=paid_social&value=%5C");
    expect(mocks.paidHomepageRedirectPath).not.toHaveBeenCalled();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("removes multiple trailing encoded backslashes without a redirect loop", async () => {
    const response = await proxy(request("/assessment%5C%5c"));
    const location = parsedLocation(response);

    expect(response.status).toBe(308);
    expect(location.pathname).toBe("/assessment");
    expect(location.href).not.toContain("%5C");
    expect(location.href).not.toContain("%5c");
  });

  it("rejects interior encoded backslashes with a generic no-store 400", async () => {
    const response = await proxy(request("/foo%5Cbar"));

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("Bad Request");
    expect(mocks.paidHomepageRedirectPath).not.toHaveBeenCalled();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("rejects malformed API paths before route handling", async () => {
    const response = await proxy(request("/api%5Cverify-payment"));

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.paidHomepageRedirectPath).not.toHaveBeenCalled();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("allows query-only backslashes and valid Stripe return query values", async () => {
    const response = await proxy(
      request(
        "/assessment?step=success&payment_intent=pi_1234567890abcdef&redirect_status=succeeded&subscription_id=sub_1234567890abcdef&value=%5C",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(mocks.paidHomepageRedirectPath).toHaveBeenCalledTimes(1);
    const [pathname, params] = mocks.paidHomepageRedirectPath.mock.calls[0] as [
      string,
      URLSearchParams,
    ];
    expect(pathname).toBe("/assessment");
    expect(params.get("payment_intent")).toBe("pi_1234567890abcdef");
    expect(params.get("subscription_id")).toBe("sub_1234567890abcdef");
    expect(params.get("value")).toBe("\\");
    expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });

  it("preserves valid paid homepage routing", async () => {
    mocks.paidHomepageRedirectPath.mockReturnValueOnce(
      "/assessment?utm_source=meta&utm_medium=paid_social&fbclid=abc123",
    );

    const response = await proxy(
      request("/?utm_source=meta&utm_medium=paid_social&fbclid=abc123"),
    );
    const location = parsedLocation(response);

    expect(location.origin).toBe("https://focusroute.test");
    expect(location.pathname).toBe("/assessment");
    expect(location.search).toBe("?utm_source=meta&utm_medium=paid_social&fbclid=abc123");
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
