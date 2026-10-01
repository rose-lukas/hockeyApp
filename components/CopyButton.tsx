"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent"
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
