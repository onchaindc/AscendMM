import { cn } from "@/lib/utils";
import type { VaultAllocationSlice } from "@/lib/types";

/** Asset color slots — restrained, data-oriented palette. */
const SLICE_COLORS = [
  "bg-accent",
  "bg-info",
  "bg-positive",
  "bg-warning",
];

/**
 * Vault asset allocation: one stacked bar + legend.
 * Deterministic colors by position keep the palette consistent.
 */
export function VaultAllocation({ allocation }: { allocation: VaultAllocationSlice[] }) {
  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-background"
        role="img"
        aria-label={allocation
          .map((a) => `${a.asset} ${a.percentage}%`)
          .join(", ")}
      >
        {allocation.map((slice, i) => (
          <div
            key={slice.asset}
            className={cn(SLICE_COLORS[i % SLICE_COLORS.length], "h-full")}
            style={{ width: `${slice.percentage}%` }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {allocation.map((slice, i) => (
          <li
            key={slice.asset}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "size-2 rounded-[3px]",
                  SLICE_COLORS[i % SLICE_COLORS.length],
                )}
              />
              <span className="data text-fg">{slice.asset}</span>
            </span>
            <span className="data text-muted">
              {slice.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
