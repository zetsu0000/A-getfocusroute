import "server-only";

import { createHmac } from "crypto";

import { getEmailPreferenceHashSecret } from "@/lib/email/config";
import { normalizeRecipientEmail } from "@/lib/email/validation";

/** Deterministic recipient hash for canonical email_preferences identity. */
export function hashEmailForPreferences(email: string, secret?: string): string | null {
  const configured = secret ?? getEmailPreferenceHashSecret();
  if (!configured) return null;

  const normalized = normalizeRecipientEmail(email);
  if (!normalized) return null;

  return createHmac("sha256", configured).update(normalized).digest("hex");
}
