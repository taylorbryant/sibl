"use client";

import type { ReactNode } from "react";
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
  const changeEvent = `sibl-theme-change:${storageKey}`;

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

const themeOptions: Array<{ icon: ReactNode; label: string; value: Theme }> = [
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System theme",
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect height="13" rx="2" width="18" x="3" y="4" />
        <path d="M8 21h8m-4-4v4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    ),
  },
];

export function ThemeToggle({ storageKey }: { storageKey: string }) {
  const { setTheme, theme } = useDocsTheme(storageKey);

  return (
    <fieldset className="sibl-theme-toggle" aria-label="Theme">
      <legend className="sibl-sr-only">Theme</legend>
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </fieldset>
  );
}
