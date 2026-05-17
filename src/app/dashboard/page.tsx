"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/supabaseAuth";

type DashboardUser = {
  id: string;
  email?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setIsLoading(true);
      setError("");

      try {
        const currentUser = await getCurrentUser();

        if (!isMounted) return;

        if (!currentUser) {
          router.replace("/login?next=/dashboard");
          return;
        }

        setUser(currentUser);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  async function handleLogout() {
    setIsLoading(true);
    await logout();
    router.replace("/login?next=/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#f7f4ef" }}>
      <section style={{ maxWidth: 920, margin: "0 auto", background: "#fff", border: "1px solid #eadfce", borderRadius: 28, padding: 32, boxShadow: "0 24px 80px rgba(37, 29, 20, 0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "#8a6f4d", fontWeight: 700 }}>FocusRoute</p>
            <h1 style={{ margin: "10px 0 0", fontSize: 34, lineHeight: 1.1, color: "#241c15" }}>Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            style={{ border: "1px solid #d8c7b1", borderRadius: 999, padding: "12px 18px", fontWeight: 800, color: "#6d4f2a", background: "#fff", cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            Logout
          </button>
        </div>

        {isLoading && <p role="status" style={{ marginTop: 28, color: "#66594b" }}>Loading your dashboard...</p>}
        {error && <p role="alert" style={{ marginTop: 28, color: "#b42318" }}>{error}</p>}

        {!isLoading && user && (
          <div style={{ marginTop: 28, display: "grid", gap: 16 }}>
            <article style={{ border: "1px solid #eadfce", borderRadius: 20, padding: 20, background: "#fffaf3" }}>
              <h2 style={{ margin: "0 0 8px", color: "#241c15" }}>You’re signed in</h2>
              <p style={{ margin: 0, color: "#66594b", lineHeight: 1.6 }}>
                Email: <strong>{user.email ?? "No email returned"}</strong>
              </p>
              <p style={{ margin: "8px 0 0", color: "#66594b", lineHeight: 1.6 }}>
                User ID: <code>{user.id}</code>
              </p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
