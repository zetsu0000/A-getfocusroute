import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "./env-public";

export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig("createBrowserClient");
  return createBrowserClient(url, anonKey);
}
