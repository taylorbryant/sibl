"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const darkQuery = "(prefers-color-scheme: dark)";

function readTheme(storageKey: string): Theme {
  try {
    const value = localStorage.getItem(storageKey);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // Storage is best-effort.
  }
  return "system";
}

function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia(darkQuery).matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useDocsTheme(storageKey: string) {
  const [theme, setThemeState] = useState<Theme>("system");
  const changeEvent = `siglum-theme-change:${storageKey}`;

  useEffect(() => {
    const sync = () => {
      const stored = readTheme(storageKey);
      setThemeState(stored);
      applyTheme(stored);
    };
    sync();
    window.addEventListener(changeEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(changeEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, [changeEvent, storageKey]);

  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia(darkQuery);
    const update = () => applyTheme("system");
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage is best-effort.
      }
      window.dispatchEvent(new Event(changeEvent));
    },
    [changeEvent, storageKey],
  );

  return { setTheme, theme };
}

const themeOptions: Array<{ label: string; value: Theme; symbol: string }> = [
  { label: "Light theme", value: "light", symbol: "☀" },
  { label: "System theme", value: "system", symbol: "◐" },
  { label: "Dark theme", value: "dark", symbol: "☾" },
];

export function ThemeToggle({ storageKey }: { storageKey: string }) {
  const { setTheme, theme } = useDocsTheme(storageKey);

  return (
    <fieldset className="siglum-theme-toggle" aria-label="Theme">
      <legend className="siglum-sr-only">Theme</legend>
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
          title={option.label}
        >
          <span aria-hidden="true">{option.symbol}</span>
        </button>
      ))}
    </fieldset>
  );
}
