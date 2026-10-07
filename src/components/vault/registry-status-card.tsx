"use client";

import { ExternalLink, Loader2, ShieldCheck, ShieldOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocolRiskBadge } from "@/components/ui/protocol-risk-badge";
import { useVaultRegistryEntry } from "@/hooks/use-vault-registry";
import {
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  getLiveVaultConfig,
  elysiumExplorerAddressUrl,
} from "@/lib/elysium";
import { shortenAddress } from "@/lib/format";

/**
 * Registry transparency for the vault detail page.
 *
 * `LiveVaultRegistryBadges` replaces the static Phase 1 header badges on live
 * vaults: active/paused and the risk class now come ONLY from the VaultRegistry
 * (when configured) — never from hardcoded frontend metadata.
 *
 * `VaultRegistryStatusCard` is the contract-transparency block: registry
 * state for this vault plus the full address surface (vault, strategy,
 * asset/sentinel, chain) with explorer links. When no registry is configured
 * it says exactly that instead of showing invented metadata.
 */

function RegistryChip({
  registered,
  active,
}: {
  registered: boolean | undefined;
  active: boolean | undefined;
}) {
  if (registered === undefined) {
    return (
      <span className="rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
        Registry unavailable
      </span>
    );
  }
  if (!registered) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
        <ShieldOff className="size-3" />
        Not registered
      </span>
    );
  }
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
      <span className="size-1.5 rounded-full bg-positive" />
      Active (registry)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
      <span className="size-1.5 rounded-full bg-warning" />
      Paused (registry)
    </span>
  );
}

function KindChip({ kind }: { kind: "erc20" | "native" }) {
  return (
    <span className="rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-medium text-muted">
      {kind === "native" ? "Native HYPE track" : "ERC-20 track"}
    </span>
  );
}

/** Registry-driven header badges for a live vault (replaces static badges). */
export function LiveVaultRegistryBadges({ vaultId }: { vaultId: string }) {
  const config = getLiveVaultConfig(vaultId);
  const registry = useVaultRegistryEntry(config?.vaultAddress);
  if (!config) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <KindChip kind={config.kind} />
      <span className="inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
        <span className="size-1.5 rounded-full bg-positive" />
        Live — {ELYSIUM_NETWORK_LABEL}
      </span>
      <RegistryChip
        registered={registry.registered}
        active={registry.entry?.active}
      />
      {registry.entry?.riskClass ? (
        <ProtocolRiskBadge risk={registry.entry.riskClass} />
      ) : null}
    </div>
  );
}

function TransparencyRow({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
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
      </span>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-fg">{children}</span>
    </div>
  );
}

/**
 * Registry + contract transparency card for one live vault.
 * Every value is either read from the registry/vault on-chain or comes from
 * the verified deployment config — unavailable values render as honest
 * empty states.
 */
export function VaultRegistryStatusCard({ vaultId }: { vaultId: string }) {
  const config = getLiveVaultConfig(vaultId);
  const registry = useVaultRegistryEntry(config?.vaultAddress);

  if (!config) return null;
  const entry = registry.entry;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Registry & transparency</CardTitle>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
            {registry.isLoading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Reading registry…
              </>
            ) : (
              <>
                <ShieldCheck className="size-3" />
                {ELYSIUM_NETWORK_LABEL} · chain {ELYSIUM_CHAIN_ID}
              </>
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-line">
          {/* — Registry state — */}
          <InfoRow label="Vault registry">
            {registry.configured ? (
              <a
                href={elysiumExplorerAddressUrl(config.vaultAddress)}
                target="_blank"
                rel="noreferrer"
                className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
              >
                Connected
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-xs text-faint">Not registered</span>
            )}
          </InfoRow>
          <InfoRow label="Registration">
            {registry.configured ? (
              registry.registered === undefined ? (
                "…"
              ) : registry.registered ? (
                "Registered"
              ) : (
                "Not registered"
              )
            ) : (
              <span className="text-xs text-faint">Unavailable</span>
            )}
          </InfoRow>
          <InfoRow label="Active / paused (registry)">
            {registry.configured && registry.registered ? (
              entry?.active ? (
                "Active"
              ) : (
                "Paused"
              )
            ) : (
              <span className="text-xs text-faint">Unavailable</span>
            )}
          </InfoRow>
          <InfoRow label="Risk class (registry)">
            {entry?.riskClass ? (
              <ProtocolRiskBadge risk={entry.riskClass} />
            ) : (
              <ProtocolRiskBadge risk="UNRATED" />
            )}
          </InfoRow>
          {entry?.vaultTypeLabel ? (
            <InfoRow label="Vault type">
              <span className="data">{entry.vaultTypeLabel}</span>
            </InfoRow>
          ) : null}
          {entry?.metadataLabel ? (
            <InfoRow label="Metadata / version">
              <span className="data">{entry.metadataLabel}</span>
            </InfoRow>
          ) : null}
          {entry && entry.strategy !== "0x0000000000000000000000000000000000000000" ? (
            <TransparencyRow
              label="Registry-recorded strategy"
              address={entry.strategy}
            />
          ) : null}

          {/* — Contract transparency — */}
          <TransparencyRow label="Vault contract" address={config.vaultAddress} />
          <TransparencyRow
            label="Strategy contract"
            address={config.strategyAddress}
          />
          <TransparencyRow label="Underlying asset" address={config.assetAddress} />
          <InfoRow label="Network">
            {ELYSIUM_NETWORK_LABEL} · chain {ELYSIUM_CHAIN_ID}
          </InfoRow>
          <InfoRow label="Share precision">
            <span className="data">
              {config.shareDecimals} decimals ({config.shareSymbol})
            </span>
          </InfoRow>
          <InfoRow label="Asset precision">
            <span className="data">
              {config.assetDecimals} decimals ({config.assetSymbol})
            </span>
          </InfoRow>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          Registry metadata (active flag, risk class, type, version) is read
          from the on-chain registry when its address is configured — it is
          protocol bookkeeping only and is not consulted by the deployed
          vaults&apos; accounting. Contract addresses above are the verified
          Elysium testnet deployments.
        </p>
      </CardContent>
    </Card>
  );
}
