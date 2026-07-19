"use client";

import { useEffect, useRef, useState } from "react";

export function CopyButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    const code = buttonRef.current
      ?.closest("[data-sibl-code-block]")
      ?.querySelector("pre");
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent?.trimEnd() ?? "");
      setCopied(true);
    } catch {
      // Clipboard access is best-effort.
    }
  }

  return (
    <button
      ref={buttonRef}
      className="sibl-copy-button"
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect height="13" rx="2" width="13" x="9" y="9" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
