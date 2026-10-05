import * as React from "react";

import { cn } from "@/lib/utils";

interface StatCardProps extends React.ComponentProps<"div"> {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

/**
 * Displays a single key metric on a dark glass panel: muted uppercase label,
 * large tabular value, optional secondary hint line (e.g. a delta or footnote).
 */
export function StatCard({ label, value, hint, className, ...props }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-panel glow-hover rounded-xl px-4 py-4",
        className,
      )}
      {...props}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <div className="mt-1.5">
        <span className="data text-lg font-semibold text-fg sm:text-xl">
          {value}
        </span>
      </div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
