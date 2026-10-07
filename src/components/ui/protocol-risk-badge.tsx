import { cn } from "@/lib/utils";

/**
 * Protocol risk classification badge — renders ONLY the four explicit buckets
 * defined by the on-chain registries (LOW / MEDIUM / HIGH / EXPERIMENTAL) plus
 * an honest "Unrated" state for entries whose classification is unavailable.
 *
 * These labels are protocol metadata, never numerical scores and never audited
 * risk ratings. Any component showing one of these badges on a
 * registry-driven surface must be accompanied by the
 * `RiskMetadataDisclaimer` below.
 */

const RISK_STYLES: Record<"LOW" | "MEDIUM" | "HIGH" | "EXPERIMENTAL" | "UNRATED", string> = {
  LOW: "border-info/30 bg-info/10 text-info",
  MEDIUM: "border-warning/30 bg-warning/10 text-warning",
  HIGH: "border-negative/40 bg-negative/15 text-negative",
  // Dashed border: the bucket itself means "not yet reviewed for production".
  EXPERIMENTAL: "border-warning/40 border-dashed bg-warning/10 text-warning",
  UNRATED: "border-line bg-surface-2/60 text-muted",
};

export function ProtocolRiskBadge({
  risk,
  className,
}: {
  risk: "LOW" | "MEDIUM" | "HIGH" | "EXPERIMENTAL" | "UNRATED";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        RISK_STYLES[risk],
        className,
      )}
    >
      {risk === "UNRATED" ? "Unrated" : risk}
    </span>
  );
}

/**
 * Required companion copy for every surface that renders protocol risk
 * classifications. Kept as a single component so the exact wording stays
 * consistent across /vaults, /strategies, and the detail pages.
 */
export function RiskMetadataDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-faint", className)}>
      Risk classifications are protocol metadata and are not audited risk
      ratings.
    </p>
  );
}
