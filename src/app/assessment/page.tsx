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
  const autoStartQuiz = shouldAutoStartAssessment(params);
  const rawStep = params.step;
  const step = Array.isArray(rawStep) ? rawStep[0] : rawStep;
  const hasEntryStep =
    step === "paywall" ||
    step === "upsell" ||
    step === "subscription" ||
    step === "success";

  return (
    <AssessmentClient
      autoStartQuiz={autoStartQuiz}
      paidAutoStart={autoStartQuiz && isPaidAssessmentTraffic(params)}
      hasEntryStep={hasEntryStep}
    />
  );
}
