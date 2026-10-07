"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { getAddress, zeroAddress, type Address } from "viem";
import { useReadContract } from "wagmi";

import { useWallet } from "@/components/wallet/wallet-provider";
import { ProtocolRiskBadge } from "@/components/ui/protocol-risk-badge";
import {
  useVaultRegistryEntry,
  useVaultRegistryList,
} from "@/hooks/use-vault-registry";
import { vaultReadsAbi } from "@/lib/abis";
import {
  ASMMT_VAULT_CONFIG,
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  HYPE_VAULT_CONFIG,
  NATIVE_ASSET_SENTINEL,
  VAULT_REGISTRY_ADDRESS,
  elysiumExplorerAddressUrl,
  type LiveVaultConfig,
} from "@/lib/elysium";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Registry-driven vault discovery for `/vaults`.
 *
 * Data sources, strictly:
 *   1. The two verified deployed vaults (ERC-20 asMMT track + native HYPE
 *      track) — always listed, with on-chain reads (total assets, user
 *      shares) and, when a VaultRegistry is configured, its registry
 *      metadata (active/paused, risk class) overlaid.
 *   2. Additional registered vaults — only when `NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS`
 *      is set; these come from the registry's own `allVaults()`/`getVault()`.
 *
 * No APY, performance, or placeholder statistics are rendered anywhere —
 * metrics that cannot be read on-chain are omitted, not invented. Registry
 * metadata appears only from the registry itself; without it the cards show
 * an explicit "registry not configured" state.
 */

function CardChip({
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

/** Registry-driven status chip: Active/Paused only ever comes from the registry. */
function RegistryStatusChip({
  registered,
  active,
}: {
  registered: boolean | undefined;
  active: boolean | undefined;
}) {
  if (registered === undefined) {
    return <CardChip tone="muted">Registry unavailable</CardChip>;
  }
  if (!registered) {
    return <CardChip tone="muted">Not registered</CardChip>;
  }
  return active ? (
    <CardChip tone="positive">Active</CardChip>
  ) : (
    <CardChip tone="warning">Paused</CardChip>
  );
}

function LiveVaultDiscoveryCard({ config }: { config: LiveVaultConfig }) {
  const { address, isConnected } = useWallet();
  const registry = useVaultRegistryEntry(config.vaultAddress);

  // On-chain total assets — the only honest "TVL" this UI can show (asset
  // units; no USD pricing oracle exists on-chain).
  const totalAssets = useReadContract({
    abi: vaultReadsAbi,
    address: config.vaultAddress,
    functionName: "totalAssets",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: true },
  });
  // Connected user's share balance — their position in this vault.
  const userShares = useReadContract({
    abi: vaultReadsAbi,
    address: config.vaultAddress,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: isConnected && address !== undefined },
  });

  const hasRegistryRisk = registry.registered && registry.entry?.riskClass;

  return (
    <div className="glass-panel glow-hover flex flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">
            {config.vaultName}
          </p>
          <p className="mt-0.5 text-xs text-faint">{config.assetLabel}</p>
        </div>
        <CardChip tone={config.kind === "native" ? "accent" : "muted"}>
          {config.kind === "native" ? "Native HYPE" : "ERC-20"}
        </CardChip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CardChip tone="positive">
          <span className="size-1.5 rounded-full bg-positive" />
          Live — {ELYSIUM_NETWORK_LABEL}
        </CardChip>
        <RegistryStatusChip
          registered={registry.registered}
          active={registry.entry?.active}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
        <MetricCell label="Total assets (on-chain)">
          {totalAssets.data === undefined ? (
            <UnknownValue />
          ) : (
            `${formatTokenAmount(totalAssets.data, config.assetDecimals)} ${config.assetSymbol}`
          )}
        </MetricCell>
        <MetricCell label="Strategy">
          <a
            href={elysiumExplorerAddressUrl(config.strategyAddress)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
          >
            {shortenAddress(config.strategyAddress, 4)}
            <ExternalLink className="size-3" />
          </a>
        </MetricCell>
        <MetricCell label="Risk class">
          {hasRegistryRisk ? (
            <ProtocolRiskBadge risk={registry.entry!.riskClass!} />
          ) : (
            <ProtocolRiskBadge risk="UNRATED" />
          )}
        </MetricCell>
        <MetricCell label="Your position">
          {isConnected ? (
            userShares.data === undefined ? (
              <Loader2 className="size-3.5 animate-spin text-faint" />
            ) : (
              `${formatTokenAmount(userShares.data, config.shareDecimals)} ${config.shareSymbol}`
            )
          ) : (
            <span className="text-xs text-faint">Connect wallet</span>
          )}
        </MetricCell>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <a
          href={elysiumExplorerAddressUrl(config.vaultAddress)}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
        >
          {shortenAddress(config.vaultAddress, 6)}
          <ExternalLink className="size-3" />
        </a>
        <Link
          href={`/vaults/${config.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
        >
          Open vault
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Registry entry for a vault that is not one of the two known live
 * deployments. Rendered only while a VaultRegistry is configured. The vault
 * is a real contract (registration validates deployment + asset()), so
 * name/total assets/decimals are read live from it.
 */
function RegistryVaultDiscoveryCard({ vaultAddress }: { vaultAddress: Address }) {
  const { address, isConnected } = useWallet();
  const registry = useVaultRegistryEntry(vaultAddress);

  const name = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "name",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: true },
  });
  const totalAssets = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "totalAssets",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: true },
  });
  const decimals = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "decimals",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: true },
  });
  const userShares = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: isConnected && address !== undefined },
  });

  const entry = registry.entry;
  const isNativeAsset =
    entry !== undefined && getAddress(entry.asset) === NATIVE_ASSET_SENTINEL;

  return (
    <div className="glass-panel flex flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data text-[15px] font-semibold text-fg">
            {name.data ?? shortenAddress(vaultAddress, 8)}
          </p>
          <p className="mt-0.5 text-xs text-faint">
            {isNativeAsset
              ? "Underlying asset: HYPE (native sentinel)"
              : entry
                ? `Underlying asset: ${shortenAddress(entry.asset, 6)}`
                : "—"}
          </p>
        </div>
        <CardChip tone="muted">Registered vault</CardChip>
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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
        <MetricCell label="Total assets (on-chain)">
          {totalAssets.data === undefined || decimals.data === undefined ? (
            <UnknownValue />
          ) : (
            formatTokenAmount(totalAssets.data, decimals.data)
          )}
        </MetricCell>
        <MetricCell label="Strategy">
          {entry === undefined || entry.strategy === zeroAddress ? (
            <span className="text-xs text-faint">None recorded</span>
          ) : (
            <a
              href={elysiumExplorerAddressUrl(entry.strategy)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
            >
              {shortenAddress(entry.strategy, 4)}
              <ExternalLink className="size-3" />
            </a>
          )}
        </MetricCell>
        <MetricCell label="Vault type">
          {entry?.vaultTypeLabel ?? <UnknownValue />}
        </MetricCell>
        <MetricCell label="Metadata / version">
          {entry?.metadataLabel ?? <UnknownValue />}
        </MetricCell>
      </div>

      {isConnected ? (
        <p className="mt-4 border-t border-line pt-4 text-xs text-faint">
          Your shares:{" "}
          <span className="data text-fg">
            {userShares.data === undefined || decimals.data === undefined
              ? "…"
              : formatTokenAmount(userShares.data, decimals.data)}
          </span>
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <a
          href={elysiumExplorerAddressUrl(vaultAddress)}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
        >
          {shortenAddress(vaultAddress, 6)}
          <ExternalLink className="size-3" />
        </a>
        <span className="text-xs text-faint">
          Detail page not yet available
        </span>
      </div>
    </div>
  );
}

function RegistryUnavailableNote() {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
      Vault registry not configured in this environment — discovery falls back
      to the two verified deployed vaults, read directly from{" "}
      {ELYSIUM_NETWORK_LABEL} (chain {ELYSIUM_CHAIN_ID}). Set{" "}
      <span className="data text-fg">NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS</span>{" "}
      to enable registry-driven discovery.
    </div>
  );
}

export function VaultDiscovery() {
  const registryList = useVaultRegistryList();

  // Registry entries beyond the two known live deployments. Comparison is
  // checksum-normalized; the known vaults are always rendered from their
  // LiveVaultConfig (registry metadata overlays them via per-card reads).
  const registryOnlyVaults =
    registryList.vaults?.filter((vault) => {
      const normalized = getAddress(vault);
      return (
        normalized !== ASMMT_VAULT_CONFIG.vaultAddress &&
        normalized !== HYPE_VAULT_CONFIG.vaultAddress
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
              Reading vault registry from chain {ELYSIUM_CHAIN_ID}…
            </p>
          ) : registryList.isError ? (
            <p className="text-xs text-warning">
              Vault registry did not respond — registry-driven discovery is
              unavailable. Deployed vault reads continue below.
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-positive" />
              Vault registry connected:
              {VAULT_REGISTRY_ADDRESS ? (
                <a
                  href={elysiumExplorerAddressUrl(VAULT_REGISTRY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                >
                  {shortenAddress(VAULT_REGISTRY_ADDRESS, 6)}
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
              <span>
                · {registryList.vaultCount?.toString() ?? "—"} registered
                vault{registryList.vaultCount === 1n ? "" : "s"}
              </span>
            </p>
          )}
        </div>
      ) : (
        <RegistryUnavailableNote />
      )}

      {/* Live deployments — always the primary discovery surface. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LiveVaultDiscoveryCard config={HYPE_VAULT_CONFIG} />
        <LiveVaultDiscoveryCard config={ASMMT_VAULT_CONFIG} />
      </div>

      {/* Registry-only entries (when configured and present). */}
      {registryOnlyVaults.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {registryOnlyVaults.map((vault) => (
            <RegistryVaultDiscoveryCard key={vault} vaultAddress={vault} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
