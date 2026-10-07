"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ProtocolRiskBadge } from "@/components/ui/protocol-risk-badge";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import { useStrategyRegistryEntry } from "@/hooks/use-strategy-registry";
import {
  ELYSIUM_CHAIN_ID,
  getLiveVaultConfig,
  elysiumExplorerAddressUrl,
} from "@/lib/elysium";
import {
  ASMMT_IDLE_STRATEGY_ID,
  HYPE_IDLE_STRATEGY_ID,
} from "@/lib/registry";
import { formatTokenAmount, shortenAddress } from "@/lib/format";

/**
 * Live strategy section for a deployed testnet vault (ERC-20 asMMT track or
 * native HYPE track). All values come from the vault contract itself
 * (strategy()/strategyInvested()) — visually secondary to the deposit/redeem
 * experience.
 *
 * Both deployed strategies are idle strategies: they hold assets without
 * deploying them and generate NO yield. investIdle()/exitStrategy() are
 * owner-only operations and are deliberately not exposed as user actions.
 */

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function StrategyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm text-fg">{children}</dd>
    </div>
  );
}

export function LiveStrategyCard({ vaultId }: { vaultId: string }) {
  const { address } = useWallet();
  const config = getLiveVaultConfig(vaultId);
  const { vault, isLoading } = useVaultContract(address, config);
  // Registry overlay for this strategy (active flag, risk class, version) —
  // enabled only while a StrategyRegistry address is configured.
  const registry = useStrategyRegistryEntry(config?.strategyAddress);

  const strategySet = vault.strategy !== undefined && vault.strategy !== ZERO_ADDRESS;
  const assetSymbol = config?.assetSymbol ?? "asMMT";
  const strategyDetailHref =
    config?.kind === "native" ? `/strategies/${HYPE_IDLE_STRATEGY_ID}` : `/strategies/${ASMMT_IDLE_STRATEGY_ID}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Strategy</CardTitle>
          <Badge variant="muted" className="gap-1.5 border-line-strong">
            No yield strategy
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && vault.strategy === undefined ? (
          <p className="flex items-center gap-2 py-3 text-sm text-muted">
            <Loader2 className="size-3.5 animate-spin" />
            Reading strategy from chain {ELYSIUM_CHAIN_ID}…
          </p>
        ) : (
          <dl className="divide-y divide-line">
            <StrategyRow label="Status">
              {strategySet ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-positive" />
                  Active
                </span>
              ) : (
                "Not set"
              )}
            </StrategyRow>
            <StrategyRow label="Type">Idle</StrategyRow>
            <StrategyRow label="Deployed assets">
              <span className="data">
                {formatTokenAmount(vault.strategyInvested, config?.assetDecimals ?? 18)}{" "}
                {assetSymbol}
              </span>
            </StrategyRow>
            <StrategyRow label="Strategy address">
              <span className="inline-flex items-center gap-1.5">
                <a
                  href={
                    config
                      ? elysiumExplorerAddressUrl(config.strategyAddress)
                      : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                >
                  {config ? shortenAddress(config.strategyAddress, 6) : "—"}
                  <ExternalLink className="size-3" />
                </a>
                {config ? (
                  <CopyButton
                    value={config.strategyAddress}
                    label="Copy strategy address"
                  />
                ) : null}
              </span>
            </StrategyRow>
            <StrategyRow label="Deployment state">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-positive" />
                Live — deployed on Elysium (chain {ELYSIUM_CHAIN_ID})
              </span>
            </StrategyRow>
            <StrategyRow label="Protocol dependency">
              None — assets are custody-held by the strategy itself
            </StrategyRow>
            <StrategyRow label="Risk class (registry)">
              {registry.entry?.riskClass ? (
                <ProtocolRiskBadge risk={registry.entry.riskClass} />
              ) : (
                <ProtocolRiskBadge risk="UNRATED" />
              )}
            </StrategyRow>
            {registry.entry?.versionLabel ? (
              <StrategyRow label="Version (registry)">
                <span className="data">{registry.entry.versionLabel}</span>
              </StrategyRow>
            ) : null}
            {registry.configured ? (
              <StrategyRow label="Registry status">
                {registry.registered === undefined
                  ? "…"
                  : registry.registered
                    ? registry.entry?.active
                      ? "Registered — active"
                      : "Registered — paused"
                    : "Not registered"}
              </StrategyRow>
            ) : null}
          </dl>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <Link
            href={strategyDetailHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
          >
            View strategy detail
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          The current idle strategy holds {assetSymbol} without deploying it and
          generates no yield — no APY or performance is shown because none
          exists on-chain yet. Deposits stay idle in the vault;{" "}
          <span className="text-muted">
            investing idle capital and exiting the strategy are owner-only
            operations, not user actions.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
