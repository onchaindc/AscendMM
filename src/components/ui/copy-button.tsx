"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  label?: string;
}

/** Copies a value to the clipboard and briefly confirms with a check icon. */
export function CopyButton({ value, className, label }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label ?? "Copy to clipboard"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-transparent text-faint transition-colors hover:border-line hover:bg-surface-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-positive" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
