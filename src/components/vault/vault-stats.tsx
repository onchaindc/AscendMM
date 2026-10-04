import { StatCard } from "@/components/ui/stat-card";
import { Delta } from "@/components/ui/delta";
import {
  formatCompact,
  formatPercent,
  formatUsdCents,
} from "@/lib/format";
import type { VaultStats as VaultStatsData } from "@/lib/types";

/** Key vault statistics, straight off the (eventual) ERC-4626 reads. */
export function VaultStats({ stats }: { stats: VaultStatsData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total Assets"
        value={formatUsdCents(stats.totalAssets)}
      />
      <StatCard label="Total Shares" value={formatCompact(stats.totalShares)} />
      <StatCard label="Share Price" value={formatUsdCents(stats.sharePrice)} />
      <StatCard label="Depositors" value={formatCompact(stats.depositors)} />
      <StatCard label="Current APY" value={formatPercent(stats.apy)} />
      <StatCard
        label="30D Performance"
        value={<Delta value={stats.perf30d} />}
      />
    </div>
  );
}
