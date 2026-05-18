import { BonusLibraryView } from "@/components/dashboard/BonusLibraryView";
import { getExplainScriptBundle } from "@/data/bonuses";
import { requireDashboardEntitlement } from "@/lib/dashboard/require-dashboard";
import { hasBonusesAccess } from "@/lib/dashboard/unlock";

export const metadata = {
  title: "Bonuses · FocusRoute",
};

export default async function DashboardBonusesPage() {
  const snap = await requireDashboardEntitlement(hasBonusesAccess, "bonus_toolkit");
  const kinds = snap.entitlementSet;

  const signatureName =
    snap.latestQuizResult &&
    typeof snap.latestQuizResult.signature_name === "string" &&
    snap.latestQuizResult.signature_name.trim()
      ? snap.latestQuizResult.signature_name.trim()
      : null;

  const explainScriptBundle = getExplainScriptBundle(signatureName);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <BonusLibraryView
        hasExplainScript={kinds.has("bonus_explain_script")}
        hasToolkit={kinds.has("bonus_toolkit")}
        hasAudio={kinds.has("bonus_audio")}
        explainScriptBundle={explainScriptBundle}
      />
    </div>
  );
}
