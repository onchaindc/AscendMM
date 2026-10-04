import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Delta } from "@/components/ui/delta";
import { formatUsdCompact, formatPercent } from "@/lib/format";
import type { Vault } from "@/lib/types";

/**
 * Data-driven vault card. Receives a `Vault` object — never mock values
 * directly — so it can be reused with live data later.
 */
export function VaultCard({ vault }: { vault: Vault }) {
  return (
    <Link
      href={`/vaults/${vault.id}`}
      className="group flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors duration-150 hover:border-accent/40 hover:bg-surface-2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">{vault.name}</p>
          <p className="mt-0.5 text-xs text-faint">{vault.assets.join(" · ")}</p>
        </div>
        <span className="rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-medium text-muted">
          {vault.type}
        </span>
      </div>

      {vault.contract.status.startsWith("Live") ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
          <span className="size-1.5 rounded-full bg-positive" />
          Live on Elysium Testnet · TEST-ONLY asMMT
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            TVL
          </p>
          <p className="data mt-1 text-sm font-medium text-fg">
            {formatUsdCompact(vault.tvl)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            APY
          </p>
          <p className="data mt-1 text-sm font-medium text-fg">
            {formatPercent(vault.apy)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
            24h
          </p>
          <Delta value={vault.change24h} className="mt-1 text-sm" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={vault.status} />
          <RiskBadge risk={vault.risk} />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-accent">
          View Vault
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
