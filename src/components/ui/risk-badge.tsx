import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

const RISK_VARIANTS: Record<RiskLevel, string> = {
  Low: "border-info/30 bg-info/10 text-info",
  Moderate: "border-warning/30 bg-warning/10 text-warning",
  Elevated: "border-negative/30 bg-negative/10 text-negative",
  High: "border-negative/40 bg-negative/15 text-negative",
};

/** Tonal badge communicating a vault or strategy risk level. */
export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        RISK_VARIANTS[risk],
        className,
      )}
    >
      {risk}
    </span>
  );
}
