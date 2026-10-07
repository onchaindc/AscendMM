"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { getAddress, zeroAddress, type Address } from "viem";

import { ProtocolRiskBadge } from "@/components/ui/protocol-risk-badge";
import {
  useStrategyRegistryEntry,
  useStrategyRegistryList,
} from "@/hooks/use-strategy-registry";
import { useStrategyOnChain } from "@/hooks/use-strategy-contract";
import {
  ASMMT_VAULT_CONFIG,
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  HYPE_VAULT_CONFIG,
  STRATEGY_REGISTRY_ADDRESS,
  elysiumExplorerAddressUrl,
  type LiveVaultConfig,
} from "@/lib/elysium";
import {
  ASMMT_IDLE_STRATEGY_ID,
  HYPE_IDLE_STRATEGY_ID,
  KINETIQ_STRATEGY_ID,
} from "@/lib/registry";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Registry-driven strategy discovery for `/strategies`.
 *
 * Data sources, strictly:
 *   1. The two deployed idle strategies (native HYPE track + ERC-20 asMMT
 *      track) — always listed, read live from the strategy contracts
 *      (`IStrategy` surface) and, when a StrategyRegistry is configured,
 *      enriched with registry metadata.
 *   2. Additional registered strategies — only when
 *      `NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS` is set.
 *   3. The Kinetiq kHYPE adapter — implemented in the contracts repo but
 *      deliberately NOT deployed on Elysium (chain 99801); rendered as
 *      PREPARED / INACTIVE with no address, no TVL, and no APY.
 *
 * No yield, APY, or performance numbers are rendered anywhere — the deployed
 * idle strategies generate no yield and the adapter is inactive.
 */

function DiscoveryChip({
  tone,
  children,
}: {
  tone: "positive" | "muted" | "accent" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    positive: "border-positive/25 bg-positive/10 text-positive",
    muted: "border-line bg-surface-2/60 text-muted",
    accent: "border-accent/35 bg-accent-muted text-accent",
    warning: "border-warning/40 bg-warning/10 text-warning",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function MetricCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <div className="data mt-1 text-sm font-medium text-fg">{children}</div>
    </div>
  );
}

function UnknownValue() {
  return <span className="text-faint">—</span>;
}

/** Registry-driven status chip — active/paused only ever comes from the registry. */
function RegistryStatusChip({
  registered,
  active,
}: {
  registered: boolean | undefined;
  active: boolean | undefined;
}) {
  if (registered === undefined) {
    return <DiscoveryChip tone="muted">Registry unavailable</DiscoveryChip>;
  }
  if (!registered) {
    return <DiscoveryChip tone="muted">Not registered</DiscoveryChip>;
  }
  return active ? (
    <DiscoveryChip tone="positive">Active</DiscoveryChip>
  ) : (
    <DiscoveryChip tone="warning">Paused</DiscoveryChip>
  );
}

/**
 * One deployed idle strategy (native HYPE or ERC-20 asMMT track). Identity
 * and behavior descriptions come from the verified contract source; the
 * numbers come from the strategy contract itself.
 */
function LiveStrategyDiscoveryCard({
  config,
  strategyId,
  name,
  behavior,
}: {
  config: LiveVaultConfig;
  strategyId: string;
  name: string;
  behavior: string;
}) {
  const registry = useStrategyRegistryEntry(config.strategyAddress);
  const onChain = useStrategyOnChain(config.strategyAddress);

  return (
    <div className="glass-panel glow-hover flex flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">{name}</p>
          <p className="mt-0.5 text-xs text-faint">{config.assetLabel}</p>
        </div>
        <DiscoveryChip tone={config.kind === "native" ? "accent" : "muted"}>
          Idle — custody
        </DiscoveryChip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DiscoveryChip tone="positive">
          <span className="size-1.5 rounded-full bg-positive" />
          Live — {ELYSIUM_NETWORK_LABEL}
        </DiscoveryChip>
        <RegistryStatusChip
          registered={registry.registered}
          active={registry.entry?.active}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">{behavior}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
        <MetricCell label="Total assets (self-reported)">
          {onChain.totalAssets === undefined ? (
            <UnknownValue />
          ) : (
            `${formatTokenAmount(onChain.totalAssets, config.assetDecimals)} ${config.assetSymbol}`
          )}
        </MetricCell>
        <MetricCell label="Bound vault">
          <Link
            href={`/vaults/${config.id}`}
            className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
          >
            {shortenAddress(config.vaultAddress, 4)}
            <ExternalLink className="size-3" />
          </Link>
        </MetricCell>
        <MetricCell label="Risk class">
          {registry.entry?.riskClass ? (
            <ProtocolRiskBadge risk={registry.entry.riskClass} />
          ) : (
            <ProtocolRiskBadge risk="UNRATED" />
          )}
        </MetricCell>
        <MetricCell label="Yield">
          <span className="text-xs text-faint">None — idle custody</span>
        </MetricCell>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <a
          href={elysiumExplorerAddressUrl(config.strategyAddress)}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
        >
          {shortenAddress(config.strategyAddress, 6)}
          <ExternalLink className="size-3" />
        </a>
        <Link
          href={`/strategies/${strategyId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
        >
          Strategy detail
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Registry entry for a strategy that is not one of the two known idle
 * deployments. Rendered only while a StrategyRegistry is configured; the
 * strategy contract itself is read live (registration validates deployment
 * and the vault/asset binding).
 */
function RegistryStrategyCard({
  strategyAddress,
}: {
  strategyAddress: Address;
}) {
  const registry = useStrategyRegistryEntry(strategyAddress);
  const onChain = useStrategyOnChain(strategyAddress);

  const entry = registry.entry;
  const displayName =
    entry?.label && entry.label !== ""
      ? entry.label
      : shortenAddress(strategyAddress, 8);

  return (
    <div className="glass-panel flex flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">{displayName}</p>
          <p className="mt-0.5 text-xs text-faint">
            {entry?.typeLabel ?? "Strategy"}
          </p>
        </div>
        <DiscoveryChip tone="muted">Registered strategy</DiscoveryChip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <RegistryStatusChip
          registered={registry.registered}
          active={entry?.active}
        />
        {entry?.riskClass ? (
          <ProtocolRiskBadge risk={entry.riskClass} />
        ) : (
          <ProtocolRiskBadge risk="UNRATED" />
        )}
        {entry?.versionLabel ? (
          <DiscoveryChip tone="muted">v{entry.versionLabel}</DiscoveryChip>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
        <MetricCell label="Total assets (self-reported)">
          {onChain.totalAssets === undefined ? (
            <UnknownValue />
          ) : (
            formatTokenAmount(onChain.totalAssets)
          )}
        </MetricCell>
        <MetricCell label="Bound vault">
          {entry && entry.vault !== zeroAddress ? (
            <a
              href={elysiumExplorerAddressUrl(entry.vault)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
            >
              {shortenAddress(entry.vault, 4)}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <UnknownValue />
          )}
        </MetricCell>
        <MetricCell label="Underlying asset">
          {onChain.asset !== undefined && onChain.asset !== zeroAddress ? (
            <a
              href={elysiumExplorerAddressUrl(onChain.asset)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
            >
              {shortenAddress(onChain.asset, 4)}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <UnknownValue />
          )}
        </MetricCell>
        <MetricCell label="Yield">
          <span className="text-xs text-faint">Not claimed on-chain</span>
        </MetricCell>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <a
          href={elysiumExplorerAddressUrl(strategyAddress)}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
        >
          {shortenAddress(strategyAddress, 6)}
          <ExternalLink className="size-3" />
        </a>
        <span className="text-xs text-faint">
          Detail page not yet available
        </span>
      </div>
    </div>
  );
}

/**
 * Kinetiq kHYPE adapter — PREPARED / INACTIVE.
 *
 * Implemented in the contracts repo (commit 42f252f) but deliberately NOT
 * deployed and NOT registered on Elysium (chain 99801): kHYPE, the
 * StakingManager and the StakingAccountant have no published Elysium
 * addresses. No contract address, no total assets, and no yield are shown —
 * none exist.
 */
function KinetiqPreparedCard() {
  return (
    <div className="glass-panel flex flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">
            KinetiqLstStrategy — kHYPE LST adapter
          </p>
          <p className="mt-0.5 text-xs text-faint">HYPE (native, ERC-7535)</p>
        </div>
        <DiscoveryChip tone="warning">LST adapter</DiscoveryChip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DiscoveryChip tone="warning">
          <span className="size-1.5 rounded-full border border-warning bg-warning/40" />
          Prepared / Inactive
        </DiscoveryChip>
        <DiscoveryChip tone="muted">Not deployed on Elysium</DiscoveryChip>
        <DiscoveryChip tone="muted">Not registered</DiscoveryChip>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        Adapter for Kinetiq&apos;s kHYPE liquid staking, prepared for a future
        Elysium deployment. kHYPE, the StakingManager and the StakingAccountant
        are not deployed on chain {ELYSIUM_CHAIN_ID}, so the adapter is
        deliberately unregistered and inactive — kHYPE yield is NOT currently
        available through AscendMM.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
        <MetricCell label="Total assets">
          <span className="text-xs text-faint">— (not deployed)</span>
        </MetricCell>
        <MetricCell label="Bound vault">
          <span className="text-xs text-faint">None</span>
        </MetricCell>
        <MetricCell label="Risk class">
          <ProtocolRiskBadge risk="UNRATED" />
        </MetricCell>
        <MetricCell label="Yield">
          <span className="text-xs text-faint">None — inactive</span>
        </MetricCell>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="data text-xs text-muted">No contract address</span>
        <Link
          href={`/strategies/${KINETIQ_STRATEGY_ID}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
        >
          Strategy detail
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function RegistryUnavailableNote() {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
      Strategy registry not configured in this environment — discovery falls
      back to the deployed strategy contracts, read directly from{" "}
      {ELYSIUM_NETWORK_LABEL} (chain {ELYSIUM_CHAIN_ID}). Set{" "}
      <span className="data text-fg">
        NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS
      </span>{" "}
      to enable registry-driven strategy discovery.
    </div>
  );
}

const HYPE_IDLE_NAME = "HypeIdleStrategy — native HYPE idle custody";
const ASMMT_IDLE_NAME = "IdleStrategy — asMMT idle custody (TEST-ONLY)";

const IDLE_BEHAVIOR =
  "Custody-holds the bound vault's asset without deploying it: invest() " +
  "receives assets from the vault only, totalAssets() is the raw asset " +
  "balance, and harvest()/report() are flat no-ops. Generates no yield — " +
  "no APY exists on-chain.";

export function StrategyDiscovery() {
  const registryList = useStrategyRegistryList();

  // Registry entries beyond the two known idle deployments (checksummed
  // comparison against the verified strategy addresses).
  const registryOnlyStrategies =
    registryList.strategies?.filter((strategy) => {
      const normalized = getAddress(strategy);
      return (
        normalized !== HYPE_VAULT_CONFIG.strategyAddress &&
        normalized !== ASMMT_VAULT_CONFIG.strategyAddress
      );
    }) ?? [];

  return (
    <div className="space-y-6">
      {/* Registry status strip — always honest about the data source. */}
      {registryList.configured ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          {registryList.isLoading ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              Reading strategy registry from chain {ELYSIUM_CHAIN_ID}…
            </p>
          ) : registryList.isError ? (
            <p className="text-xs text-warning">
              Strategy registry did not respond — registry-driven discovery is
              unavailable. Deployed strategy reads continue below.
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-positive" />
              Strategy registry connected:
              {STRATEGY_REGISTRY_ADDRESS ? (
                <a
                  href={elysiumExplorerAddressUrl(STRATEGY_REGISTRY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                >
                  {shortenAddress(STRATEGY_REGISTRY_ADDRESS, 6)}
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
              <span>
                · {registryList.strategyCount?.toString() ?? "—"} registered
                strateg{registryList.strategyCount === 1n ? "y" : "ies"}
              </span>
            </p>
          )}
        </div>
      ) : (
        <RegistryUnavailableNote />
      )}

      {/* Deployed strategies — always the primary surface. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LiveStrategyDiscoveryCard
          config={HYPE_VAULT_CONFIG}
          strategyId={HYPE_IDLE_STRATEGY_ID}
          name={HYPE_IDLE_NAME}
          behavior={IDLE_BEHAVIOR}
        />
        <LiveStrategyDiscoveryCard
          config={ASMMT_VAULT_CONFIG}
          strategyId={ASMMT_IDLE_STRATEGY_ID}
          name={ASMMT_IDLE_NAME}
          behavior={IDLE_BEHAVIOR}
        />
      </div>

      {/* Registry-only strategies (when configured and present). */}
      {registryOnlyStrategies.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {registryOnlyStrategies.map((strategy) => (
            <RegistryStrategyCard key={strategy} strategyAddress={strategy} />
          ))}
        </div>
      ) : null}

      {/* Prepared-but-inactive adapter — the only static entry, clearly
          labeled and deliberately addressless. */}
      <KinetiqPreparedCard />
    </div>
  );
}
