"use client";

import * as React from "react";

const STORAGE_KEY = "theme";
const MEDIA = "(prefers-color-scheme: dark)";

export type ThemeContextValue = {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  themes: string[];
  resolvedTheme?: string;
  systemTheme?: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const BASE_THEMES = ["light", "dark"] as const;

function getSystemTheme(e?: MediaQueryList | MediaQueryListEvent): "light" | "dark" {
  const mq = e ?? window.matchMedia(MEDIA);
  return mq.matches ? "dark" : "light";
}

function readStoredTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "system";
  } catch {
    return "system";
  }
}

function resolveAppliedTheme(theme: string): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : (theme as "light" | "dark");
}

function applyDom(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove(...BASE_THEMES);
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<string>(() =>
    typeof window === "undefined" ? "system" : readStoredTheme()
  );

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return resolveAppliedTheme(readStoredTheme());
  });

  React.useEffect(() => {
    const resolved = resolveAppliedTheme(theme);
    setResolvedTheme(resolved);
    applyDom(resolved);
  }, [theme]);

  React.useEffect(() => {
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      const sys = getSystemTheme(mq);
      setResolvedTheme(sys);
      if (theme === "system") {
        applyDom(sys);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setThemeState(e.newValue ?? "system");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = React.useCallback((value: React.SetStateAction<string>) => {
    setThemeState((prev) => {
      const next = typeof value === "function" ? (value as (p: string) => string)(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme === "system" ? resolvedTheme : theme,
      themes: [...BASE_THEMES, "system"],
      systemTheme: resolvedTheme,
    }),
    [theme, setTheme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
