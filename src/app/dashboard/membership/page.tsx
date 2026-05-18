import Link from "next/link";

import { LockedMembership, MembershipView } from "@/components/dashboard/MembershipView";
import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";
import { hasMembershipAccess, hasRetakeQuizAccess } from "@/lib/dashboard/unlock";

export const metadata = {
  title: "Membership · FocusRoute",
};

export default async function DashboardMembershipPage() {
  const snap = await requireDashboardLogin();
  const unlocked = hasMembershipAccess(snap.entitlementSet);

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {unlocked ? (
        <MembershipView
          hasRetakeQuiz={hasRetakeQuizAccess(snap.entitlementSet)}
          subscriptions={snap.subscriptions}
          email={snap.user.email}
        />
      ) : (
        <LockedMembership />
      )}
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