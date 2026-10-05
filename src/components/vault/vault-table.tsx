import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Delta } from "@/components/ui/delta";
import { formatPercent, formatUsdCompact } from "@/lib/format";
import type { Vault } from "@/lib/types";

/** Desktop vault table. Each row navigates to the vault detail page. */
export function VaultTable({ vaults }: { vaults: Vault[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Vault</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">TVL</TableHead>
          <TableHead className="text-right">APY</TableHead>
          <TableHead className="text-right">24h</TableHead>
          <TableHead>Risk</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vaults.map((vault) => {
          // The live testnet vault has no yield and no performance history
          // yet — show that honestly instead of a fabricated 0%.
          const isLive = vault.contract.status.startsWith("Live");

          return (
            <TableRow key={vault.id}>
              <TableCell>
                <Link
                  href={`/vaults/${vault.id}`}
                  className="group flex flex-col gap-0.5"
                >
                  <span className="data text-sm font-medium text-fg transition-colors group-hover:text-accent">
                    {vault.name}
                  </span>
                  <span className="text-xs text-faint">{vault.strategy.name}</span>
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted">{vault.type}</span>
              </TableCell>
              <TableCell className="data text-right text-sm text-fg">
                {formatUsdCompact(vault.tvl)}
              </TableCell>
              <TableCell className="data text-right text-sm text-fg">
                {isLive ? "No yield" : formatPercent(vault.apy)}
              </TableCell>
              <TableCell className="text-right">
                {isLive ? (
                  <span className="data text-sm text-fg">—</span>
                ) : (
                  <Delta
                    value={vault.change24h}
                    withIcon={false}
                    className="justify-end"
                  />
                )}
              </TableCell>
              <TableCell>
                <RiskBadge risk={vault.risk} />
              </TableCell>
              <TableCell>
                <StatusBadge status={vault.status} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/vaults/${vault.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-accent"
                >
                  View Vault
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
