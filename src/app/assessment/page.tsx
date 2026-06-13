import AssessmentClient from "./AssessmentClient";
import {
  isPaidAssessmentTraffic,
  shouldAutoStartAssessment,
  type AssessmentSearchParams,
} from "@/lib/assessment/autostart";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<AssessmentSearchParams>;
}) {
  const params = await searchParams;
  // The assessment now always opens directly on Q1 (the redundant intro screen
  // was removed), so there is no longer an "auto start vs. show intro" decision
  // to pass down. We still classify paid traffic so paid_auto_started fires.
  const paidAutoStart =
    shouldAutoStartAssessment(params) && isPaidAssessmentTraffic(params);
  const rawStep = params.step;
  const step = Array.isArray(rawStep) ? rawStep[0] : rawStep;
  const hasEntryStep =
    step === "paywall" ||
    step === "upsell" ||
    step === "subscription" ||
    step === "success";

  return (
    <AssessmentClient paidAutoStart={paidAutoStart} hasEntryStep={hasEntryStep} />
  );
}
