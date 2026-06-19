import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildResultReadyEmail } from "@/lib/email/templates/result-ready";
import { buildLifecycleTemplate } from "@/lib/email/templates/lifecycle";
import type { ResultEmailPayload } from "@/lib/email/types";

const payload: ResultEmailPayload = {
  resultId: "result-123",
  recipientEmail: "user@example.com",
  recipientName: "Sam",
  patternKey: "Spark",
  patternName: "Fast starts, uneven finish lines",
  focusFrictionScore: { value: 72, minimum: 0, maximum: 100 },
  resultUrl: "https://getfocusroute.com/dashboard/profile",
  dashboardUrl: "https://getfocusroute.com/dashboard",
  locale: "en-US",
  emailType: "transactional",
  idempotencyKey: "result:result-123:1",
};

describe("result-ready template", () => {
  it("uses the approved subject, CTA and score interpretation", () => {
    const template = buildResultReadyEmail(payload);
    expect(template.subject).toBe("Your FocusRoute result is ready");
    expect(template.previewText).toBe("See your focus pattern, score, and what to do next.");
    expect(template.textBody).toContain("View My Result:");
    expect(template.textBody).toContain(payload.resultUrl);
    expect(template.htmlBody).toContain("View My Result");
    expect(template.htmlBody).toContain("72 / 100");
    expect(template.htmlBody).toContain("Not a diagnosis");
    expect(template.htmlBody).not.toContain("Cognitive Signature");
    expect(template.htmlBody).not.toContain("<script");
    expect(template.htmlBody).not.toContain("tracking pixel");
  });

  it("HTML-escapes personalized fields and omits score when unavailable", () => {
    const escaped = buildResultReadyEmail({
      ...payload,
      patternName: 'Test <script>alert("x")</script>',
      focusFrictionScore: null,
    });
    expect(escaped.htmlBody).toContain("Test &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(escaped.htmlBody).not.toContain("<script>");
    expect(escaped.textBody).not.toContain("YOUR FOCUS-FRICTION SCORE");
  });
});

describe("lifecycle templates", () => {
  it("classifies lifecycle templates as marketing with unsubscribe placeholders", () => {
    const template = buildLifecycleTemplate("checkout_abandonment");
    expect(template.classification).toBe("marketing");
    expect(template.textBody).toContain("{{unsubscribe_url}}");
    expect(template.htmlBody).toContain("{{unsubscribe_url}}");
    expect(template.textBody).toContain("$43.50");
    expect(template.textBody).not.toContain("$79.99");
  });
});

describe("email delivery migration", () => {
  it("defines atomic claim, finalize, RLS, claim_token fencing and canonical email_hash uniqueness", () => {
    const migration = readFileSync(
      fileURLToPath(new URL("../../../../supabase/migrations/0004_email_delivery_foundation.sql", import.meta.url)),
      "utf8",
    );
    expect(migration).toContain("email_deliveries");
    expect(migration).toContain("claim_token");
    expect(migration).toContain("claim_email_delivery");
    expect(migration).toContain("finalize_email_delivery");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("grant execute");
    expect(migration).toContain("revoke all");
    expect(migration).toContain("email_preferences_email_hash_unique_idx");
    expect(migration).not.toContain("email_preferences_user_id_unique_idx");
    expect(migration).not.toContain("email_preferences_result_id_unique_idx");
    expect(migration).toContain("on delete set null");
    expect(migration).toContain("revoke all on table public.email_deliveries");
    expect(migration).toContain("revoke all on table public.email_preferences");
    expect(migration).toContain("grant select, insert, update on table public.email_deliveries to service_role");
    expect(migration).toContain("grant select, insert, update on table public.email_preferences to service_role");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("claim_token = p_claim_token");
    expect(migration).toContain("status = 'pending'");
  });

  it("keeps GET unsubscribe as read-only in route source", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../../app/api/email/unsubscribe/route.ts", import.meta.url)),
      "utf8",
    );
    const getSection = source.split("export async function POST")[0] ?? "";
    expect(getSection).not.toContain("recordMarketingUnsubscribe(");
    expect(source).toContain("recordMarketingUnsubscribe(");
  });
});
