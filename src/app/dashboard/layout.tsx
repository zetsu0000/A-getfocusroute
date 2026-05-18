import { headers } from "next/headers";
import type { ReactNode } from "react";

import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const snap = await requireDashboardLogin();
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";

  return (
    <div style={{ minHeight: "100dvh", padding: "0 16px 64px", background: "var(--color-bg-page)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <DashboardNav snap={snap} pathname={pathname} />
        {children}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 2 }}>
            <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</a>
            {" · "}
            <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
            {" · "}
            <a href="/refund-policy" style={{ color: "inherit", textDecoration: "none" }}>Refund Policy</a>
            {" · "}
            <a href="/disclaimer" style={{ color: "inherit", textDecoration: "none" }}>Disclaimer</a>
          </p>
        </div>
      </div>
    </div>
  );
}
