import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getServiceRoleKey,
  getSupabaseProjectUrlForAdmin,
} from "./env-public";

/**
 * Service-role client for trusted server code only (webhooks, admin jobs).
 * Never import from Client Components or shared modules used on the client.
 */
export function createAdminClient() {
  const url = getSupabaseProjectUrlForAdmin("createAdminClient");
  const serviceRoleKey = getServiceRoleKey("createAdminClient");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
