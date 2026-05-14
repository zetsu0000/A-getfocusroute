import { UserDashboard } from "@/components/dashboard/UserDashboard";

export const metadata = {
  title: "My Account · FocusRoute",
  description: "View your ADHD assessment results and manage your plan.",
};

export default function DashboardPage() {
  return <UserDashboard />;
}
