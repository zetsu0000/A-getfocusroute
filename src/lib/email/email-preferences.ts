import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailUnsubscribeSecret } from "@/lib/email/config";
import { hashEmailForPreferences } from "@/lib/email/unsubscribe-token";

export type MarketingStatus = "unknown" | "consented" | "unsubscribed";

export function canSendMarketingEmail(status: MarketingStatus): boolean {
  return status === "consented";
}

export async function getMarketingStatusForUser(input: {
  userId?: string | null;
  resultId?: string | null;
  email?: string | null;
}): Promise<MarketingStatus> {
  const admin = createAdminClient();
  if (input.userId) {
    const { data } = await admin
      .from("email_preferences")
      .select("marketing_status")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (data?.marketing_status) return data.marketing_status as MarketingStatus;
  }

  if (input.resultId) {
    const { data } = await admin
      .from("email_preferences")
      .select("marketing_status")
      .eq("result_id", input.resultId)
      .maybeSingle();
    if (data?.marketing_status) return data.marketing_status as MarketingStatus;
  }

  const secret = getEmailUnsubscribeSecret();
  if (secret && input.email) {
    const emailHash = hashEmailForPreferences(input.email, secret);
    const { data } = await admin
      .from("email_preferences")
      .select("marketing_status")
      .eq("email_hash", emailHash)
      .maybeSingle();
    if (data?.marketing_status) return data.marketing_status as MarketingStatus;
  }

  return "unknown";
}

export async function recordMarketingConsent(input: {
  userId?: string | null;
  resultId?: string | null;
  email: string;
  consentSource: string;
  consentVersion: string;
}): Promise<void> {
  const secret = getEmailUnsubscribeSecret();
  if (!secret) throw new Error("email_preferences_configuration_missing");

  const admin = createAdminClient();
  const emailHash = hashEmailForPreferences(input.email, secret);
  const now = new Date().toISOString();

  const { error } = await admin.from("email_preferences").insert({
    user_id: input.userId ?? null,
    result_id: input.resultId ?? null,
    email_hash: emailHash,
    marketing_status: "consented",
    consent_source: input.consentSource,
    consent_version: input.consentVersion,
    consented_at: now,
    unsubscribed_at: null,
  });

  if (error) throw new Error("email_preferences_write_failed");
}

export async function recordMarketingUnsubscribe(input: {
  emailHash: string;
  userId?: string | null;
  resultId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const filters = input.userId
    ? { column: "user_id", value: input.userId }
    : input.resultId
      ? { column: "result_id", value: input.resultId }
      : { column: "email_hash", value: input.emailHash };

  const { data: existing } = await admin
    .from("email_preferences")
    .select("id")
    .eq(filters.column, filters.value)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("email_preferences")
      .update({ marketing_status: "unsubscribed", unsubscribed_at: now })
      .eq("id", existing.id);
    return;
  }

  await admin.from("email_preferences").insert({
    user_id: input.userId ?? null,
    result_id: input.resultId ?? null,
    email_hash: input.emailHash,
    marketing_status: "unsubscribed",
    unsubscribed_at: now,
  });
}
