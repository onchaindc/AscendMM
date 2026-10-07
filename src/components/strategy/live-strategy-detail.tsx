"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { getAddress } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ProtocolRiskBadge } from "@/components/ui/protocol-risk-badge";
import { useStrategyOnChain } from "@/hooks/use-strategy-contract";
import { useStrategyRegistryEntry } from "@/hooks/use-strategy-registry";
import {
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  NATIVE_ASSET_SENTINEL,
  elysiumExplorerAddressUrl,
  type LiveVaultConfig,
} from "@/lib/elysium";
import { formatTokenAmount, shortenAddress } from "@/lib/format";

/**
 * Detail page body for one deployed idle strategy (native HYPE or ERC-20
 * asMMT track). Every value is read from the strategy contract (IStrategy
 * surface — verified in the contracts repo) or from the StrategyRegistry
 * when configured; nothing is hardcoded that the chain can answer, and
 * nothing is shown that does not exist (no APY, no performance, no fees —
 * the idle strategies generate no yield and the interface defines none).
 *
 * The `name`/`behavior` props are static descriptions derived from the
 * verified contract source, passed in by the page.
 */

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm text-fg">{children}</dd>
    </div>
  );
}

function LinkRow({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <a
          href={elysiumExplorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
        >
          {shortenAddress(address, 6)}
          <ExternalLink className="size-3" />
        </a>
        <CopyButton value={address} label={`Copy ${label}`} />
      </span>
    </div>
  );
}

export function LiveStrategyDetail({
  config,
  name,
  behavior,
}: {
  config: LiveVaultConfig;
  name: string;
  behavior: string;
}) {
  const registry = useStrategyRegistryEntry(config.strategyAddress);
  const onChain = useStrategyOnChain(config.strategyAddress);

  const isNative = config.kind === "native";
  const vaultBindingMatches =
    onChain.vault !== undefined &&
    getAddress(onChain.vault) === config.vaultAddress;
  const assetMatches =
    onChain.asset !== undefined &&
    getAddress(onChain.asset) === config.assetAddress;

  return (
    <div>
      <Link
        href="/strategies"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        All strategies
      </Link>

      {/* Header ---------------------------------------------------------- */}
      <div className="mt-5 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-medium text-muted">
            Idle — custody
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
            <span className="size-1.5 rounded-full bg-positive" />
            Live — {ELYSIUM_NETWORK_LABEL}
          </span>
          {registry.registered === undefined ? (
            <span className="rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
              Registry unavailable
            </span>
          ) : registry.registered ? (
            registry.entry?.active ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                Active (registry)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                <span className="size-1.5 rounded-full bg-warning" />
                Paused (registry)
              </span>
            )
          ) : (
            <span className="rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
              Not registered
            </span>
          )}
        </div>
        <h1 className="data mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {name}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {behavior}
        </p>
      </div>

      {/* Detail grid ------------------------------------------------------ */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strategy overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line">
              <DetailRow label="Type">
                Idle (custodial) — no external protocol
              </DetailRow>
              <DetailRow label="Underlying asset">
                <span className="data">{config.assetLabel}</span>
              </DetailRow>
              <DetailRow
                label={isNative ? "Asset (self-reported)" : "Asset contract"}
              >
                {onChain.asset === undefined ? (
                  "…"
                ) : assetMatches ? (
                  <span className="inline-flex items-center gap-1.5">
                    <a
                      href={elysiumExplorerAddressUrl(onChain.asset)}
                      target="_blank"
                      rel="noreferrer"
                      className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                    >
                      {isNative
                        ? "Native sentinel (verified)"
                        : shortenAddress(onChain.asset, 6)}
                      <ExternalLink className="size-3" />
                    </a>
                  </span>
                ) : (
                  <span className="text-warning">
                    Unexpected asset on-chain
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Current assets (self-reported)">
                <span className="data">
                  {onChain.totalAssets === undefined
                    ? "…"
                    : `${formatTokenAmount(onChain.totalAssets, config.assetDecimals)} ${config.assetSymbol}`}
                </span>
              </DetailRow>
              <DetailRow label="Investment cap">
                {onChain.cap === undefined
                  ? "…"
                  : onChain.cap === 0n
                    ? "No cap set (unbounded)"
                    : `${formatTokenAmount(onChain.cap, config.assetDecimals)} ${config.assetSymbol}`}
              </DetailRow>
              <DetailRow label="Deployment state">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-positive" />
                  Live — deployed on Elysium (chain {ELYSIUM_CHAIN_ID})
                </span>
              </DetailRow>
              <DetailRow label="Risk class (registry)">
                {registry.entry?.riskClass ? (
                  <ProtocolRiskBadge risk={registry.entry.riskClass} />
                ) : (
                  <ProtocolRiskBadge risk="UNRATED" />
                )}
              </DetailRow>
              {registry.entry?.versionLabel ? (
                <DetailRow label="Version (registry)">
                  <span className="data">{registry.entry.versionLabel}</span>
                </DetailRow>
              ) : null}
              {registry.entry?.typeLabel ? (
                <DetailRow label="Registry type id">
                  <span className="data">{registry.entry.typeLabel}</span>
                </DetailRow>
              ) : null}
              <DetailRow label="Yield">
                None — the idle strategy claims no yield and exposes no APY
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract transparency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-line">
              <LinkRow
                label="Strategy contract"
                address={config.strategyAddress}
              />
              <DetailRow label="Bound vault (self-reported)">
                {onChain.vault === undefined ? (
                  "…"
                ) : vaultBindingMatches ? (
                  <Link
                    href={`/vaults/${config.id}`}
                    className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                  >
                    {shortenAddress(onChain.vault, 6)}
                    <ExternalLink className="size-3" />
                  </Link>
                ) : (
                  <span className="text-warning">
                    Binding mismatch on-chain
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Bound vault (verified deployment)">
                <Link
                  href={`/vaults/${config.id}`}
                  className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                >
                  {shortenAddress(config.vaultAddress, 6)}
                  <ExternalLink className="size-3" />
                </Link>
              </DetailRow>
              <LinkRow label="Underlying asset" address={config.assetAddress} />
              <DetailRow label="Network">
                {ELYSIUM_NETWORK_LABEL} · chain {ELYSIUM_CHAIN_ID}
              </DetailRow>
              <DetailRow label="Asset precision">
                <span className="data">
                  {config.assetDecimals} decimals ({config.assetSymbol})
                </span>
              </DetailRow>
              {!registry.configured ? (
                <DetailRow label="Strategy registry">
                  <span className="text-xs text-faint">
                    Not configured — set NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS
                    to surface registry metadata
                  </span>
                </DetailRow>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading / notes --------------------------------------------------- */}
      {onChain.isLoading ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin" />
          Reading strategy contract from chain {ELYSIUM_CHAIN_ID}…
        </p>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-faint">
        Assets under management are the strategy&apos;s self-reported{" "}
        <span className="data">totalAssets()</span> — for the idle strategies
        this is the raw asset balance of the strategy contract. The vault never
        prices shares off this value (its own ledger is the source of truth).
        invest/divest are vault-only operations; investIdle()/exitStrategy()
        are owner actions, not user actions. Registry metadata (active flag,
        risk class, version) is protocol bookkeeping only and is not consulted
        by the deployed vaults&apos; accounting.
      </p>
    </div>
  );
}
