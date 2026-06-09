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

  return (
    <AssessmentClient
      autoStartQuiz={autoStartQuiz}
      paidAutoStart={autoStartQuiz && isPaidAssessmentTraffic(params)}
    />
  );
}
