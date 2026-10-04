import Link from "next/link";
import { Layers } from "lucide-react";

import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Delta } from "@/components/ui/delta";
import { formatPercent, formatUsdCompact } from "@/lib/format";
import type { Strategy, Vault } from "@/lib/types";

interface StrategyCardProps {
  strategy: Strategy;
  /** Linked vaults (resolved by the page from MOCK_VAULTS / future hook). */
  vaults: Vault[];
}

/** Strategy marketplace card, driven entirely by passed-in data. */
export function StrategyCard({ strategy, vaults }: StrategyCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-fg">
            {strategy.name}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {strategy.description}
          </p>
        </div>
        <StatusBadge status={strategy.status} className="shrink-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            30D Return
          </p>
          <Delta value={strategy.return30d} className="mt-1" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            Managed
          </p>
          <p className="data mt-1 text-sm font-medium text-fg">
            {formatUsdCompact(strategy.tvlManaged)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            Risk
          </p>
          <div className="mt-1">
            <RiskBadge risk={strategy.risk} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            Performance Fee
          </p>
          <p className="data mt-1 text-sm font-medium text-fg">
            {formatPercent(strategy.performanceFee, 0)}
          </p>
        </div>
      </div>

      {vaults.length > 0 ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
            <Layers className="size-3" />
            {strategy.vaultCount} vault{strategy.vaultCount === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vaults.map((vault) => (
              <Link
                key={vault.id}
                href={`/vaults/${vault.id}`}
                className="data rounded-md border border-line px-2 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {vault.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
