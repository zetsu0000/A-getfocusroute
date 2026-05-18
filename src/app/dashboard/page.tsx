import { DashboardHomeView } from "@/components/dashboard/DashboardHomeView";
import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";

export const metadata = {
  title: "Dashboard · FocusRoute",
  description: "Your Brain Profile, protocol, bonuses, and membership — tied to your account.",
};

export default async function DashboardPage() {
  const snap = await requireDashboardLogin();
  return <DashboardHomeView snap={snap} />;
}
