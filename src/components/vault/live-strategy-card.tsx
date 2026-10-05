"use client";

import { ExternalLink, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import {
  ELYSIUM_CHAIN_ID,
  STRATEGY_ADDRESS,
  elysiumExplorerAddressUrl,
} from "@/lib/elysium";
import { formatTokenAmount, shortenAddress } from "@/lib/format";

/**
 * Live strategy section for the deployed testnet vault. All values come from
 * the vault contract itself (strategy()/strategyInvested()) — visually
 * secondary to the deposit/redeem experience.
 *
 * The deployed strategy is an IdleStrategy: it holds assets without deploying
 * them and generates NO yield. investIdle()/exitStrategy() are owner-only
 * operations and are deliberately not exposed as user actions.
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

export function LiveStrategyCard() {
  const { address } = useWallet();
  const { vault, isLoading } = useVaultContract(address);

  const strategySet = vault.strategy !== undefined && vault.strategy !== ZERO_ADDRESS;

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
                {formatTokenAmount(vault.strategyInvested)} asMMT
              </span>
            </StrategyRow>
            <StrategyRow label="Strategy address">
              <span className="inline-flex items-center gap-1.5">
                <a
                  href={elysiumExplorerAddressUrl(STRATEGY_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="data inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-hover"
                >
                  {shortenAddress(STRATEGY_ADDRESS, 6)}
                  <ExternalLink className="size-3" />
                </a>
                <CopyButton value={STRATEGY_ADDRESS} label="Copy strategy address" />
              </span>
            </StrategyRow>
          </dl>
        )}
        <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          The current IdleStrategy holds assets without deploying them and
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
