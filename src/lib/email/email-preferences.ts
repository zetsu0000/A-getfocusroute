import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailPreferenceHashSecret } from "@/lib/email/config";
import { hashEmailForPreferences } from "@/lib/email/email-hash";
import { normalizeRecipientEmail } from "@/lib/email/validation";

export type MarketingStatus = "unknown" | "consented" | "unsubscribed";

export function canSendMarketingEmail(status: MarketingStatus): boolean {
  return status === "consented";
}

export async function getMarketingStatusForRecipient(input: {
  email: string;
  userId?: string | null;
  resultId?: string | null;
}): Promise<MarketingStatus> {
  void input.userId;
  void input.resultId;

  const hashSecret = getEmailPreferenceHashSecret();
  if (!hashSecret) throw new Error("email_preferences_configuration_missing");

  const normalized = normalizeRecipientEmail(input.email);
  if (!normalized) throw new Error("email_preferences_invalid_recipient");

  const emailHash = hashEmailForPreferences(normalized, hashSecret);
  if (!emailHash) throw new Error("email_preferences_invalid_recipient");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_preferences")
    .select("marketing_status")
    .eq("email_hash", emailHash)
    .maybeSingle();

  if (error) throw new Error("email_preferences_read_failed");
  return (data?.marketing_status as MarketingStatus | undefined) ?? "unknown";
}

export async function recordMarketingConsent(input: {
  email: string;
  consentSource: string;
  consentVersion: string;
  userId?: string | null;
  resultId?: string | null;
}): Promise<void> {
  const hashSecret = getEmailPreferenceHashSecret();
  if (!hashSecret) throw new Error("email_preferences_configuration_missing");

  const normalized = normalizeRecipientEmail(input.email);
  if (!normalized) throw new Error("email_preferences_invalid_recipient");

  const emailHash = hashEmailForPreferences(normalized, hashSecret);
  if (!emailHash) throw new Error("email_preferences_invalid_recipient");

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("email_preferences").upsert(
    {
      email_hash: emailHash,
      user_id: input.userId ?? null,
      result_id: input.resultId ?? null,
      marketing_status: "consented",
      consent_source: input.consentSource,
      consent_version: input.consentVersion,
      consented_at: now,
      unsubscribed_at: null,
    },
    { onConflict: "email_hash" },
  );

  if (error) throw new Error("email_preferences_write_failed");
}

/** Canonical global suppression keyed by email hash. Idempotent. */
export async function recordMarketingUnsubscribe(emailHash: string): Promise<void> {
  if (!emailHash) throw new Error("email_preferences_invalid_recipient");

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("email_preferences").upsert(
    {
      email_hash: emailHash,
      marketing_status: "unsubscribed",
      unsubscribed_at: now,
    },
    { onConflict: "email_hash" },
  );

  if (error) throw new Error("email_preferences_write_failed");
}
