"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUnits } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { elysiumExplorerTxUrl } from "@/lib/elysium";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import type { LiveVaultConfig } from "@/lib/elysium";
import type { VaultActivityEvent } from "@/lib/vault-analytics";
import { useVaultAnalytics } from "@/hooks/use-vault-analytics";

/**
 * Phase 2F on-chain analytics UI — deliberately restrained. Only values that
 * exist on-chain are shown: vault state reads, real emitted events, and a
 * history series only when replaying those events reproduces the live tip
 * state. No APY, TVL, USD values, performance, or placeholder points exist
 * anywhere in this component. Empty history renders the honest empty state.
 */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="data text-sm font-medium text-fg">{value}</span>
    </div>
  );
}

function formatEventDate(timestamp: bigint | undefined): string | undefined {
  if (timestamp === undefined) return undefined;
  return new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
}

const ACTIVITY_LABELS: Record<
  VaultActivityEvent["kind"],
  { label: string; className: string }
> = {
  deposit: { label: "Deposit", className: "text-positive" },
  withdraw: { label: "Withdrawal", className: "text-negative" },
  invest: { label: "Strategy invest", className: "text-muted" },
  divest: { label: "Strategy divest", className: "text-muted" },
};

export function VaultActivityFeed({ config }: { config: LiveVaultConfig }) {
  const analytics = useVaultAnalytics(config);

  if (analytics.isLoading) {
    return (
      <p className="flex items-center gap-2 py-4 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading activity…
      </p>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <p className="py-4 text-sm text-muted">
        On-chain activity is unavailable right now (RPC). Nothing is shown
        rather than estimated.
      </p>
    );
  }

  const { events } = analytics.data;
  if (events.length === 0) {
    return (
      <p className="py-4 text-sm text-muted">No historical activity yet.</p>
    );
  }

  // Latest first, capped — the vault history is small; show the recent tail.
  const recent = [...events].reverse().slice(0, 8);

  return (
    <ul className="divide-y divide-line">
      {recent.map((event) => {
        const meta = ACTIVITY_LABELS[event.kind];
        const sign = event.kind === "deposit" ? "+" : event.kind === "withdraw" ? "-" : "";
        const assetAmount =
          event.kind === "deposit" || event.kind === "withdraw"
            ? `${sign}${formatTokenAmount(event.assetsRaw, config.assetDecimals)} ${config.assetSymbol}`
            : `${formatTokenAmount(event.assetsRaw, config.assetDecimals)} ${config.assetSymbol}`;
        const shareAmount =
          event.sharesRaw !== undefined
            ? `${formatTokenAmount(event.sharesRaw, config.shareDecimals)} ${config.shareSymbol}`
            : undefined;
        const date = formatEventDate(event.timestamp);

        return (
          <li
            key={`${event.transactionHash}-${event.kind}`}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
          >
            <div className="min-w-0">
              <p className={`text-sm font-medium ${meta.className}`}>
                {meta.label}
                <span className="data ml-2 font-normal text-fg">
                  {assetAmount}
                  {shareAmount ? (
                    <span className="text-faint"> · {shareAmount}</span>
                  ) : null}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-faint">
                {event.owner ? `${shortenAddress(event.owner, 4)} · ` : ""}
                block {event.blockNumber.toString()}
                {date ? ` · ${date}` : ""}
              </p>
            </div>
            <a
              href={elysiumExplorerTxUrl(event.transactionHash)}
              target="_blank"
              rel="noreferrer"
              className="data inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
            >
              tx
              <ExternalLink className="size-3" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function AnalyticsChart({ config }: { config: LiveVaultConfig }) {
  const analytics = useVaultAnalytics(config);
  if (!analytics.data) return null;

  const { validated, unavailableReason, points } = analytics.data.history;

  if (!validated) {
    return (
      <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
        {unavailableReason}
      </p>
    );
  }

  if (points.length < 2) {
    return (
      <p className="mt-4 text-sm text-muted">No historical activity yet.</p>
    );
  }

  const data = points.map((point) => ({
    block: point.blockNumber.toString(),
    assets: Number(formatUnits(point.totalAssetsRaw, config.assetDecimals)),
    date: formatEventDate(point.timestamp),
  }));

  return (
    <div className="mt-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
        Total assets (on-chain, reconstructed from vault events)
      </p>
      <div className="mt-2 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid
              stroke="var(--color-line)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="block"
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              tick={{ fontSize: 10, fill: "var(--color-faint)" }}
              minTickGap={24}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-faint)" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-line-strong)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as (typeof data)[number];
                return (
                  <div className="chart-tooltip rounded-md px-3 py-2">
                    <p className="text-[11px] text-faint">
                      Block {point.block}
                      {point.date ? ` · ${point.date}` : ""}
                    </p>
                    <p className="data mt-0.5 text-sm font-medium text-fg">
                      {point.assets} {config.assetSymbol}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="assets"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Real strategy allocation for a live vault: idle vs strategy assets as a
 * share of the vault's current on-chain assets. Zeros are displayed as
 * zeros; the mock Phase 1 allocation data is never used on live pages.
 */
export function VaultAllocationReal({ config }: { config: LiveVaultConfig }) {
  const analytics = useVaultAnalytics(config);

  if (analytics.isLoading) {
    return (
      <p className="flex items-center gap-2 py-4 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" />
Loading allocation…
      </p>
    );
  }
  if (analytics.isError || !analytics.data) {
    return (
      <p className="py-4 text-sm text-muted">
        On-chain allocation is unavailable right now (RPC).
      </p>
    );
  }

  const idle = analytics.data.state.idleAssetsRaw;
  const strategy = analytics.data.state.strategyAssetsRaw;
  const total = idle + strategy;
  const idlePct = total > 0n ? Number((idle * 100n) / total) : 0;
  const strategyPct = total > 0n ? 100 - idlePct : 0;

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-background"
        role="img"
        aria-label={
          total > 0n
            ? `Idle assets ${idlePct}%, strategy assets ${strategyPct}%`
            : "No assets currently held"
        }
      >
        {idlePct > 0 ? (
          <div className="h-full bg-accent" style={{ width: `${idlePct}%` }} />
        ) : null}
        {strategyPct > 0 ? (
          <div className="h-full bg-info" style={{ width: `${strategyPct}%` }} />
        ) : null}
      </div>
      <ul className="mt-4 space-y-2.5">
        <li className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full bg-accent" />
            Idle assets
          </span>
          <span className="data text-fg">
            {formatTokenAmount(idle, config.assetDecimals)} {config.assetSymbol}
            {total > 0n ? (
              <span className="text-faint"> · {idlePct}%</span>
            ) : null}
          </span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full bg-info" />
            Strategy assets
          </span>
          <span className="data text-fg">
            {formatTokenAmount(strategy, config.assetDecimals)} {config.assetSymbol}
            {total > 0n ? (
              <span className="text-faint"> · {strategyPct}%</span>
            ) : null}
          </span>
        </li>
      </ul>
      {total === 0n ? (
        <p className="mt-3 text-xs text-faint">
          No assets currently held — the vault is fully withdrawn. Zero is the
          real on-chain value, not a placeholder.
        </p>
      ) : null}
    </div>
  );
}

export function VaultAnalyticsSection({
  config,
}: {
  config: LiveVaultConfig;
}) {
  const analytics = useVaultAnalytics(config);

  return (
    <Card className="border-line bg-surface">
      <CardHeader>
        <CardTitle>On-chain analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.isLoading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Loading analytics…
          </p>
        ) : analytics.isError || !analytics.data ? (
          <p className="py-4 text-sm text-muted">
            On-chain analytics are unavailable right now (RPC). Nothing is
            shown rather than estimated.
          </p>
        ) : (
          <>
            <div>
              <Metric
                label="Total assets (on-chain)"
                value={formatTokenAmount(
                  analytics.data.state.totalAssetsRaw,
                  config.assetDecimals,
                )}
              />
              <Metric
                label="Total shares"
                value={`${formatTokenAmount(
                  analytics.data.state.totalSharesRaw,
                  config.shareDecimals,
                )} ${config.shareSymbol}`}
              />
              <Metric
                label="Assets per share (live)"
                value={formatUnits(
                  analytics.data.state.assetsPerWholeShareRaw,
                  config.assetDecimals,
                )}
              />
              <Metric
                label="Idle assets"
                value={`${formatTokenAmount(
                  analytics.data.state.idleAssetsRaw,
                  config.assetDecimals,
                )} ${config.assetSymbol}`}
              />
              <Metric
                label="Strategy assets"
                value={`${formatTokenAmount(
                  analytics.data.state.strategyAssetsRaw,
                  config.assetDecimals,
                )} ${config.assetSymbol}`}
              />
            </div>
            <AnalyticsChart config={config} />
            <p className="mt-4 text-xs leading-relaxed text-faint">
              Derived values are reconstructed from real vault events and
              validated against the live chain state at fetch time. Idle
              assets are held by the vault itself; strategy assets are the
              vault-side investment ledger. No APY, yield, or USD valuation
              exists on-chain and none is shown.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
