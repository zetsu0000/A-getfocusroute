import Link from "next/link";

import { LockedRoadmapPreview, RoadmapProtocolView } from "@/components/dashboard/RoadmapProtocolView";
import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";
import { hasRoadmapAccess } from "@/lib/dashboard/unlock";

export const metadata = {
  title: "28-Day FocusRoute · FocusRoute",
};

export default async function DashboardRoadmapPage() {
  const snap = await requireDashboardLogin();
  const unlocked = hasRoadmapAccess(snap.entitlementSet);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {unlocked ? <RoadmapProtocolView /> : <LockedRoadmapPreview />}
      <Link
        href="/dashboard"
        prefetch={false}
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-primary)",
          textDecoration: "none",
        }}
      >
        ← Back to overview
      </Link>
    </div>
  );
}