import "server-only";

import { formatMoney, PLANS } from "@/lib/billing/plans";
import { escapeHtml } from "@/lib/email/templates/escape";
import type { BuiltEmailTemplate, MarketingTemplateKey } from "@/lib/email/templates/types";
import { isResultEmailMarketingEnabled } from "@/lib/email/config";

const MARKETING_UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";

function planPricingLines(): string {
  const one = PLANS.plan_1week;
  const four = PLANS.plan_4week;
  const twelve = PLANS.plan_12week;
  return [
    `${one.shortName}: ${formatMoney(one.introAmount)} first week, then ${formatMoney(one.renewalAmount)} per month`,
    `${four.shortName} — Most Popular: ${formatMoney(four.introAmount)} first month, then ${formatMoney(four.renewalAmount)} per month`,
    `${twelve.shortName}: ${formatMoney(twelve.introAmount)} first 3 months, then ${formatMoney(twelve.renewalAmount)} every 3 months`,
  ].join("\n");
}

function disabledMarketingTemplate(
  templateKey: MarketingTemplateKey,
  subject: string,
  previewText: string,
  body: string,
): BuiltEmailTemplate {
  return {
    templateKey,
    classification: "marketing",
    subject,
    previewText,
    htmlBody: `<p>${escapeHtml(body)}</p><p><a href="${MARKETING_UNSUBSCRIBE_PLACEHOLDER}">Unsubscribe</a></p>`,
    textBody: `${body}\n\nUnsubscribe: ${MARKETING_UNSUBSCRIBE_PLACEHOLDER}`,
  };
}

/** Disabled lifecycle templates — not scheduled or sent in PR 7B. */
export const LIFECYCLE_EMAIL_TEMPLATES: Record<MarketingTemplateKey, () => BuiltEmailTemplate> = {
  result_follow_up: () =>
    disabledMarketingTemplate(
      "result_follow_up",
      "Pick up where your FocusRoute result left off",
      "A practical next step when you are ready.",
      "Your result is still here when you want a clearer next move. FocusRoute helps you turn patterns into daily actions.",
    ),
  assessment_abandonment: () =>
    disabledMarketingTemplate(
      "assessment_abandonment",
      "Finish your FocusRoute assessment when you are ready",
      "Return to the questions you started.",
      "You can finish the assessment at your pace. FocusRoute turns your answers into a practical focus snapshot.",
    ),
  checkout_abandonment: () =>
    disabledMarketingTemplate(
      "checkout_abandonment",
      "Your FocusRoute plan is still available",
      "Intro pricing and renewal terms are listed below.",
      `If you still want the full system, current plans are:\n${planPricingLines()}`,
    ),
  focusroute_value: () =>
    disabledMarketingTemplate(
      "focusroute_value",
      "What FocusRoute helps you do next",
      "A practical system for focus, not another generic list.",
      "FocusRoute turns your result into a full breakdown, a 28-day action path, and practical tools you can return to.",
    ),
};

export function buildLifecycleTemplate(key: MarketingTemplateKey): BuiltEmailTemplate {
  return LIFECYCLE_EMAIL_TEMPLATES[key]();
}

export function assertLifecycleSendingDisabled(): void {
  if (isResultEmailMarketingEnabled()) {
    throw new Error("marketing_email_sending_disabled_in_pr_7b");
  }
}
