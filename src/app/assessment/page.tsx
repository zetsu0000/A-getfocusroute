import AssessmentClient from "./AssessmentClient";
import {
  shouldAutoStartAssessment,
  type AssessmentSearchParams,
} from "@/lib/assessment/autostart";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<AssessmentSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AssessmentClient
      autoStartQuiz={shouldAutoStartAssessment(params)}
    />
  );
}
