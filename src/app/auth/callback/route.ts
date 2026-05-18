import { claimEmailProductGrantsForUser } from "@/lib/access/entitlements";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        try {
          await claimEmailProductGrantsForUser(user.id, user.email);
        } catch (e) {
          console.error("[auth/callback] claimEmailProductGrantsForUser", e);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (isLocal) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
      if (forwardedHost) {
        return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}
