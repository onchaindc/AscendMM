import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { deltaTone, formatDelta } from "@/lib/format";

interface DeltaProps {
  /** Percentage change, e.g. 2.14 or -0.31 */
  value: number;
  digits?: number;
  withIcon?: boolean;
  className?: string;
}

/**
 * Renders a signed percentage in semantic green/red. Color is used only for
 * data — never for decoration.
 */
export function Delta({ value, digits = 2, withIcon = false, className }: DeltaProps) {
  const tone = deltaTone(value);
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "data inline-flex items-center gap-0.5 text-sm",
        tone === "positive" && "text-positive",
        tone === "negative" && "text-negative",
        tone === "neutral" && "text-muted",
        className,
      )}
    >
      {withIcon && value !== 0 ? <Icon className="size-3.5" /> : null}
      {formatDelta(value, digits)}
    </span>
  );
}
