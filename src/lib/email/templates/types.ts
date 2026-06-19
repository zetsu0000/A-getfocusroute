import type { ResultEmailMessage } from "@/lib/email/types";

export type TransactionalTemplateKey = "result_ready";

export type MarketingTemplateKey =
  | "result_follow_up"
  | "assessment_abandonment"
  | "checkout_abandonment"
  | "focusroute_value";

export type EmailTemplateClassification = "transactional" | "marketing";

export type BuiltEmailTemplate = ResultEmailMessage & {
  templateKey: TransactionalTemplateKey | MarketingTemplateKey;
  classification: EmailTemplateClassification;
};
