"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";

/**
 * FunnelThemeProvider — runtime light/dark switch for the FocusRoute funnel.
 *
 * Light is the primary identity (default), but the whole funnel can flip to the
 * original dark "Focus Observatory" world at runtime. The provider:
 *   - persists the choice in localStorage,
 *   - mirrors it onto <html> (the `.v2-light-doc` class + `color-scheme`) so the
 *     document canvas never flashes the wrong shell on overscroll, and
 *   - exposes `theme` + `toggleTheme` for the wrapper class, canvas blending,
 *     and the Stripe Payment Element appearance (which can't read CSS vars).
 *
 * The chosen theme is mirrored to a cookie that the server reads to pick the
 * correct initial theme for SSR, so returning users no longer get a one-frame
 * flash of the default theme. localStorage stays the client store and is
 * reconciled (with the cookie backfilled) on mount for pre-cookie visitors.
 */

export type FunnelTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "focusroute-funnel-theme";
const STORAGE_KEY = THEME_STORAGE_KEY;

/** Persist to localStorage (client store) and a cookie (SSR hint, so the server
 *  can render the correct shell and there is no theme flash). Client-only. */
function persistTheme(next: FunnelTheme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* localStorage may be unavailable (private mode) */
  }
  try {
    document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore cookie failures */
  }
}

type FunnelThemeContextValue = {
  theme: FunnelTheme;
  setTheme: (theme: FunnelTheme) => void;
  toggleTheme: () => void;
};

const FunnelThemeContext = createContext<FunnelThemeContextValue | null>(null);

export function FunnelThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: ReactNode;
  /** Server-resolved theme (from the cookie) so the first paint matches the
   *  user's choice and there is no hydration flash. */
  initialTheme?: FunnelTheme;
}) {
  const [theme, setThemeState] = useState<FunnelTheme>(initialTheme);

  // Reconcile with localStorage on mount: covers visitors who chose a theme
  // before the SSR cookie existed, and backfills the cookie so the next load is
  // flash-free. A no-op when the cookie already matched the stored preference.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const resolved = stored === "light" || stored === "dark" ? stored : initialTheme;
      if (resolved !== initialTheme) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time reconciliation of the persisted theme on mount
        setThemeState(resolved);
      }
      persistTheme(resolved);
    } catch {
      /* localStorage may be unavailable (private mode) — keep the SSR theme. */
    }
  }, [initialTheme]);

  const setTheme = useCallback((next: FunnelTheme) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      persistTheme(next);
      return next;
    });
  }, []);

  // Keep the document shell in sync so short pages / overscroll never reveal the
  // opposite-theme background behind the funnel.
  useEffect(() => {
    const root = document.documentElement;
    const prevColorScheme = root.style.colorScheme;
    if (theme === "light") {
      root.classList.add("v2-light-doc");
    } else {
      root.classList.remove("v2-light-doc");
    }
    root.style.colorScheme = theme;
    return () => {
      root.classList.remove("v2-light-doc");
      root.style.colorScheme = prevColorScheme;
    };
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <FunnelThemeContext.Provider value={value}>
      {children}
    </FunnelThemeContext.Provider>
  );
}

export function useFunnelTheme(): FunnelThemeContextValue {
  const ctx = useContext(FunnelThemeContext);
  if (!ctx) {
    // Safe fallback so a stray render outside the provider stays on the
    // primary (light) identity instead of throwing.
    return { theme: "light", setTheme: () => {}, toggleTheme: () => {} };
  }
  return ctx;
}

/**
 * ThemeToggleButton — floating sun/moon pill. Token-styled, so it reads on both
 * worlds. Fixed to the top-right, clear of notches via env(safe-area-inset-*).
 */
export function ThemeToggleButton({
  /**
   * Checkout mode. When true the pill is shown ONLY near the very top of the
   * page and stays hidden once the user scrolls into the purchase content —
   * it does not return on a small upward scroll. This guarantees it can never
   * float over the plan cards, order summary, social proof, Stripe fields or
   * the final CTA, while theme switching stays reachable near the top.
   *
   * When false (the default, used on the quiz and other funnel screens) the
   * pill auto-hides on downward scroll and returns on scroll-up.
   */
  pinTopOnly = false,
}: {
  pinTopOnly?: boolean;
} = {}) {
  const { theme, toggleTheme } = useFunnelTheme();
  const isLight = theme === "light";

  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const evaluate = () => {
      const y = window.scrollY;
      if (pinTopOnly) {
        // Visible only in the opening band; never reappears over purchase content.
        setHidden(y >= 56);
      } else if (y < 64) {
        setHidden(false);
      } else if (y > last + 4) {
        setHidden(true);
      } else if (y < last - 4) {
        setHidden(false);
      }
      last = y;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        evaluate();
        ticking = false;
      });
    };
    evaluate(); // reconcile immediately (e.g. landing already scrolled)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinTopOnly]);

  const hover = (on: boolean) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    el.style.color = on ? "var(--v2-ink)" : "var(--v2-ink-dim)";
    el.style.borderColor = on ? "var(--v2-signal)" : "var(--v2-line-bright)";
    el.style.transform = on ? "translateY(-1px)" : "translateY(0)";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={!isLight}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : 0}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 14px)",
        right: "calc(env(safe-area-inset-right, 0px) + 14px)",
        zIndex: 80,
        // 44px hit target (WCAG 2.5.5) — the visual pill stays compact via the
        // centred icon, but the tap area clears the mobile minimum.
        width: 44,
        height: 44,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--v2-ink-dim)",
        background: "var(--v2-glass)",
        border: "1px solid var(--v2-line-bright)",
        boxShadow: "var(--v2-shadow-sm)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition:
          "color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, opacity 0.25s ease",
      }}
    >
      {isLight ? <Moon size={17} strokeWidth={2.1} /> : <Sun size={17} strokeWidth={2.1} />}
    </button>
  );
}
