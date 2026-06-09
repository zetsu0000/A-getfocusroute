export type AssessmentSearchParams = Record<string, string | string[] | undefined>;

const PAID_CAMPAIGN_MARKERS = [
  "acquisition",
  "broad",
  "cold",
  "conversion",
  "conversions",
  "lead",
  "lookalike",
  "paid",
  "prospecting",
  "purchase",
  "retarget",
  "retargeting",
  "sales",
  "warm",
];

function firstParamValue(
  searchParams: URLSearchParams | AssessmentSearchParams,
  key: string,
): string {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key)?.trim().toLowerCase() ?? "";
  }

  const raw = searchParams[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasPaidCampaignIntent(campaign: string): boolean {
  if (!campaign) return false;
  const tokens = campaign.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((token) => PAID_CAMPAIGN_MARKERS.includes(token));
}

export function shouldAutoStartAssessment(
  searchParams: URLSearchParams | AssessmentSearchParams,
): boolean {
  const start = firstParamValue(searchParams, "start");
  const autoStart = firstParamValue(searchParams, "auto_start");
  const utmSource = firstParamValue(searchParams, "utm_source");
  const utmMedium = firstParamValue(searchParams, "utm_medium");
  const utmCampaign = firstParamValue(searchParams, "utm_campaign");

  return (
    start === "quiz" ||
    autoStart === "1" ||
    autoStart === "true" ||
    utmSource === "meta" ||
    utmMedium === "paid_social" ||
    hasPaidCampaignIntent(utmCampaign)
  );
}

export function isPaidAssessmentTraffic(
  searchParams: URLSearchParams | AssessmentSearchParams,
): boolean {
  const utmSource = firstParamValue(searchParams, "utm_source");
  const utmMedium = firstParamValue(searchParams, "utm_medium");
  const utmCampaign = firstParamValue(searchParams, "utm_campaign");

  return (
    utmSource === "meta" ||
    utmMedium === "paid_social" ||
    hasPaidCampaignIntent(utmCampaign)
  );
}
