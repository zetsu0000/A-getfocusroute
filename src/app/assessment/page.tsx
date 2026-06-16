import AssessmentClient from "./AssessmentClient";
import { FunnelThemeProvider } from "@/components/v2/FunnelThemeProvider";
import {
  isPaidAssessmentTraffic,
  shouldAutoStartAssessment,
  type AssessmentSearchParams,
} from "@/lib/assessment/autostart";
import { isUpgradeNeed } from "@/lib/dashboard/upgrade-handoff";

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

  // Authenticated dashboard upgrade handoff (?upgrade=…). Treated like an entry
  // step so the client opens in a checking state and never flashes Q1 before the
  // server-verified handoff resolves.
  const rawUpgrade = params.upgrade;
  const upgrade = Array.isArray(rawUpgrade) ? rawUpgrade[0] : rawUpgrade;
  const hasUpgradeHandoff = isUpgradeNeed(upgrade);

  return (
    <FunnelThemeProvider>
      <AssessmentClient
        paidAutoStart={paidAutoStart}
        hasEntryStep={hasEntryStep}
        hasUpgradeHandoff={hasUpgradeHandoff}
      />
    </FunnelThemeProvider>
  );
}
