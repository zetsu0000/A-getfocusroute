import Link from "next/link";

import { BrainProfileView } from "@/components/dashboard/BrainProfileView";
import { getExplainScriptBundle } from "@/data/bonuses";
import { answersFromQuizRow } from "@/lib/dashboard/answers-from-quiz-row";
import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";
import { requireDashboardEntitlement } from "@/lib/dashboard/require-dashboard";
import { hasBrainProfileAccess } from "@/lib/dashboard/unlock";

export const metadata = {
  title: "Brain Profile · FocusRoute",
};

export default async function DashboardProfilePage() {
  const snap = await requireDashboardEntitlement(hasBrainProfileAccess, "brain_profile");
  const answers = answersFromQuizRow(snap.latestQuizResult);

  const sigName =
    typeof snap.latestQuizResult?.signature_name === "string"
      ? snap.latestQuizResult.signature_name
      : null;
  const sigDesc =
    typeof snap.latestQuizResult?.signature_description === "string"
      ? snap.latestQuizResult.signature_description
      : null;

  if (answers.length === 0) {
    return (
      <div
        style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div>
          <h2
            style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", marginBottom: 6 }}
          >
            Brain Profile
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.55 }}>
            Your FocusRoute Brain Profile™ will appear here once your quiz results are on file.
          </p>
        </div>
        <div
          style={{
            borderRadius: 18,
            padding: 22,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}
          >
            No saved quiz on this account yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-body)",
              lineHeight: 1.58,
              marginBottom: 18,
            }}
          >
            Complete the assessment while signed in so we can build your full Brain Profile, Executive
            Function Radar™, and personalised protocol here.
          </p>
          <Link
            href="/assessment"
            prefetch={false}
            style={{
              display: "inline-flex",
              padding: "12px 22px",
              borderRadius: 12,
              background: "var(--color-primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Start the assessment
          </Link>
        </div>
      </div>
    );
  }

  const profile = deriveBrainProfile(answers, sigName, sigDesc);
  const hasExplainScript = snap.entitlementSet.has("bonus_explain_script");
  const explainScriptBundle = getExplainScriptBundle(sigName);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <BrainProfileView
        profile={profile}
        hasExplainScript={hasExplainScript}
        explainScriptBundle={explainScriptBundle}
      />
    </div>
  );
}
