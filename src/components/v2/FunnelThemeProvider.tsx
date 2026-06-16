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
 * SSR renders the default (light) and the stored value is applied after mount,
 * so there is no hydration mismatch — only a one-frame correction for returning
 * users who picked dark.
 */

export type FunnelTheme = "light" | "dark";

const STORAGE_KEY = "focusroute-funnel-theme";

type FunnelThemeContextValue = {
  theme: FunnelTheme;
  setTheme: (theme: FunnelTheme) => void;
  toggleTheme: () => void;
};

const FunnelThemeContext = createContext<FunnelThemeContextValue | null>(null);

export function FunnelThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<FunnelTheme>("light");

  // Apply the stored preference after hydration (client-only).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of the persisted theme from localStorage on mount
        setThemeState(stored);
      }
    } catch {
      /* localStorage may be unavailable (private mode) — keep the default. */
    }
  }, []);

  const setTheme = useCallback((next: FunnelTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
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
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useFunnelTheme();
  const isLight = theme === "light";

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
        transition: "color 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
      }}
    >
      {isLight ? <Moon size={17} strokeWidth={2.1} /> : <Sun size={17} strokeWidth={2.1} />}
    </button>
  );
}
