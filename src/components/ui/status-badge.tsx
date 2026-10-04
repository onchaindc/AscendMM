import { cn } from "@/lib/utils";
import type { StrategyStatus } from "@/lib/types";

const STATUS_STYLES: Record<StrategyStatus, { dot: string; text: string; label: string }> = {
  Active: { dot: "bg-positive", text: "text-positive", label: "Active" },
  Rebalancing: { dot: "bg-warning", text: "text-warning", label: "Rebalancing" },
  Paused: { dot: "bg-faint", text: "text-muted", label: "Paused" },
};

/** Small status indicator: colored dot + label. */
export function StatusBadge({
  status,
  className,
}: {
  status: StrategyStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      <span className={s.text}>{s.label}</span>
    </span>
  );
}
