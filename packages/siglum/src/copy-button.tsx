"use client";

import { useRef, useState } from "react";

export function CopyButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const root = buttonRef.current?.closest("[data-siglum-code-block]");
    const source = root?.querySelector("pre code")?.textContent;
    if (!source) return;

    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      ref={buttonRef}
      className="siglum-copy-button"
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied code" : "Copy code"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
