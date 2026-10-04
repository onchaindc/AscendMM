import { StatCard } from "@/components/ui/stat-card";
import { Delta } from "@/components/ui/delta";
import { formatCompact, formatPercent, formatUsdCents } from "@/lib/format";
import type { PortfolioSummaryData } from "@/lib/types";

/** Top-level portfolio metrics. */
export function PortfolioSummary({ summary }: { summary: PortfolioSummaryData }) {
  const totalPnlPercent =
    summary.totalValue > 0 ? (summary.totalPnl / summary.totalValue) * 100 : 0;
  const pnl24hPercent =
    summary.totalValue > 0 ? (summary.pnl24h / summary.totalValue) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Value"
        value={formatUsdCents(summary.totalValue)}
        className="col-span-2 lg:col-span-1"
      />
      <StatCard
        label="Total PnL"
        value={formatUsdCents(summary.totalPnl)}
        hint={
          <span className="data">
            {formatPercent(totalPnlPercent)} all time
          </span>
        }
      />
      <StatCard
        label="24h PnL"
        value={<Delta value={pnl24hPercent} withIcon />}
        hint={<span className="data">{formatUsdCents(summary.pnl24h)} today</span>}
      />
      <StatCard
        label="Active Positions"
        value={formatCompact(summary.activePositions)}
      />
    </div>
  );
}