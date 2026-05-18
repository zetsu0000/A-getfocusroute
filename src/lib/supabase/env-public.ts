/**
 * Validates Supabase public env for browser + server anon clients.
 * Never log or throw secret values (anon key contents stay opaque).
 */

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

function assertHttpsProjectUrl(rawUrl: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      `${label}: NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://<project-ref>.supabase.co).`,
    );
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${label}: NEXT_PUBLIC_SUPABASE_URL must use https.`);
  }
  if (!/^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname)) {
    throw new Error(
      `${label}: NEXT_PUBLIC_SUPABASE_URL hostname must be <project-ref>.supabase.co`,
    );
  }
  const expectedRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
  if (expectedRef) {
    const hostRef = parsed.hostname.replace(/\.supabase\.co$/i, "");
    if (hostRef !== expectedRef) {
      throw new Error(
        `${label}: URL points to project ref "${hostRef}" but NEXT_PUBLIC_SUPABASE_PROJECT_REF is "${expectedRef}".`,
      );
    }
  }
  return parsed;
}

/**
 * @param caller — short label for errors e.g. "createBrowserClient"
 */
export function getPublicSupabaseConfig(caller: string): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      `${caller}: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add both to .env.local (see README).`,
    );
  }
  assertHttpsProjectUrl(url, caller);
  return { url, anonKey };
}

/** Server-only admin client: URL must match Supabase project shape; service role checked separately. */
export function getSupabaseProjectUrlForAdmin(caller: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      `${caller}: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local (see README).`,
    );
  }
  assertHttpsProjectUrl(url, caller);
  return url;
}

export function getServiceRoleKey(caller: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      `${caller}: Missing SUPABASE_SERVICE_ROLE_KEY (server-only, never expose to the client). See README.`,
    );
  }
  return key;
}
