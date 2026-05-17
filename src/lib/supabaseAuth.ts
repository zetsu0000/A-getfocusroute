export type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  user?: {
    id: string;
    email?: string;
  };
};

type SupabaseError = {
  msg?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xhzpmeplpsgnhfzgleaz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_FxngIFU7zF6TGflS1R7D4Q_1V-Vw4cH";

const SESSION_STORAGE_KEY = "focusroute.supabase.session";

function getErrorMessage(body: SupabaseError, fallback: string) {
  return (
    body.error_description ??
    body.message ??
    body.msg ??
    body.error ??
    fallback
  );
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(getErrorMessage(body as SupabaseError, fallback));
  }

  return body as T;
}

export async function signInWithOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Enter your email address.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      create_user: true,
      should_create_user: true,
    }),
  });

  await parseResponse<Record<string, never>>(
    response,
    "Unable to send the login code. Please try again."
  );

  return { email: normalizedEmail };
}

export async function verifyOtp(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedToken = token.trim();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!normalizedToken) {
    throw new Error("Enter the code from your email.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "email",
      email: normalizedEmail,
      token: normalizedToken,
    }),
  });

  const session = await parseResponse<SupabaseSession>(
    response,
    "Unable to verify the code. Please check it and try again."
  );

  saveSession(session);
  return session;
}

export function saveSession(session: SupabaseSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as SupabaseSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function getCurrentUser() {
  const session = getStoredSession();

  if (!session?.access_token) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  return parseResponse<{ id: string; email?: string }>(
    response,
    "Unable to load the current user."
  );
}

export async function logout() {
  const session = getStoredSession();

  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => undefined);
  }

  clearSession();
}