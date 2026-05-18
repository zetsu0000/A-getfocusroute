import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseConfig } from "./env-public";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseConfig("createServerClient");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without mutable cookies; middleware refreshes session.
        }
      },
    },
  });
}
