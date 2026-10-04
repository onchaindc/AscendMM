import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Delta } from "@/components/ui/delta";
import { formatPercent, formatUsdCents } from "@/lib/format";
import type { Position } from "@/lib/types";

interface PositionTableProps {
  positions: Position[];
  /** When true, renders the no-positions empty state instead of the table. */
  isEmpty?: boolean;
}

/**
 * Portfolio positions. Renders a dense table on desktop, stacked rows on
 * mobile, and an explicit empty state when the wallet holds no positions.
 */
export function PositionTable({ positions, isEmpty = false }: PositionTableProps) {
  if (isEmpty || positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm font-medium text-fg">No open positions</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          You have no capital deployed in AscendMM vaults yet. Explore the
          <span className="data"> Vaults </span>
          page to review available strategies.
        </p>
        <Link
          href="/vaults"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Explore Vaults
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Vault</TableHead>
              <TableHead className="text-right">Deposited</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">PnL</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead className="text-right">Shares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.vaultId}>
                <TableCell>
                  <Link
                    href={`/vaults/${position.vaultId}`}
                    className="group flex flex-col gap-0.5"
                  >
                    <span className="data text-sm font-medium text-fg transition-colors group-hover:text-accent">
                      {position.vaultName}
                    </span>
                    <span className="text-xs text-faint">{position.vaultType}</span>
                  </Link>
                </TableCell>
                <TableCell className="data text-right text-sm text-muted">
                  {formatUsdCents(position.deposited)}
                </TableCell>
                <TableCell className="data text-right text-sm text-fg">
                  {formatUsdCents(position.currentValue)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <Delta value={position.pnlPercent} />
                    <span className="data text-xs text-faint">
                      {position.pnl >= 0 ? "+" : "-"}
                      {formatUsdCents(Math.abs(position.pnl))}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="data text-right text-sm text-fg">
                  {formatPercent(position.apy)}
                </TableCell>
                <TableCell className="data text-right text-sm text-muted">
                  {position.shares.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-line md:hidden">
        {positions.map((position) => (
          <li key={position.vaultId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/vaults/${position.vaultId}`} className="flex flex-col gap-0.5">
                <span className="data text-sm font-medium text-fg">
                  {position.vaultName}
                </span>
                <span className="text-xs text-faint">{position.vaultType}</span>
              </Link>
              <Delta value={position.pnlPercent} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-faint">Deposited</dt>
                <dd className="data text-muted">
                  {formatUsdCents(position.deposited)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-faint">Value</dt>
                <dd className="data text-fg">
                  {formatUsdCents(position.currentValue)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-faint">APY</dt>
                <dd className="data text-fg">{formatPercent(position.apy)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-faint">Shares</dt>
                <dd className="data text-muted">
                  {position.shares.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}