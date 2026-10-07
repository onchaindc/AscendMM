"use client";

import type { Address } from "viem";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import {
  ASMMT_VAULT_CONFIG,
  HYPE_VAULT_CONFIG,
} from "@/lib/elysium";
import { CopyButton } from "@/components/ui/copy-button";

function PositionRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="data text-sm text-fg">{value}</dd>
    </div>
  );
}

/**
 * Portfolio view backed by real wallet + contract state. The two deployed
 * Elysium testnet vaults are the only live position sources — the ERC-20
 * asMMT vault and the native HYPE vault — each read through its own config.
 * Historical cost-basis/PnL tracking requires an indexer and is intentionally
 * omitted rather than simulated.
 */
export function PortfolioView() {
  const { address, isConnected, openConnectModal } = useWallet();

  // Both live tracks read independently through their own configs.
  const asMMT = useVaultContract(address, ASMMT_VAULT_CONFIG);
  const hype = useVaultContract(address, HYPE_VAULT_CONFIG);

  if (!isConnected || !address) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface-2">
            <Wallet className="size-5 text-accent" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-fg">
              Connect your wallet to view your portfolio.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Your asMMT balance, asMMV shares, native HYPE balance, and asHYPEV
              shares across the deployed Elysium testnet vaults will appear
              here.
            </p>
          </div>
          <Button onClick={openConnectModal}>
            <Wallet className="size-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Current value of each position in assets, converted by the vault itself
  // (convertToAssets(userShares)) — strategy-aware by construction. 1:1 while
  // a vault is empty; 0 when no shares are held.
  const asMMTValueRaw =
    asMMT.user.assetValue ??
    (asMMT.user.shares !== undefined ? 0n : undefined);
  const hypeValueRaw =
    hype.user.assetValue ?? (hype.user.shares !== undefined ? 0n : undefined);
  const hasAsMMTPosition = asMMT.user.shares !== undefined && asMMT.user.shares > 0n;
  const hasHypePosition = hype.user.shares !== undefined && hype.user.shares > 0n;
  const hasAnyPosition = hasAsMMTPosition || hasHypePosition;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="asMMT Balance"
          value={asMMT.isLoading ? "…" : formatTokenAmount(asMMT.user.assetBalance)}
        />
        <StatCard
          label="asMMV Shares"
          value={asMMT.isLoading ? "…" : formatTokenAmount(asMMT.user.shares)}
        />
        <StatCard
          label="Native HYPE"
          value={hype.isLoading ? "…" : formatTokenAmount(hype.user.assetBalance)}
        />
        <StatCard
          label="asHYPEV Shares (21-dec)"
          value={hype.isLoading ? "…" : formatTokenAmount(hype.user.shares, 21)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAnyPosition ? (
            <dl className="divide-y divide-line">
              <PositionRow
                label="AscendMM Vault (asMMT) — Elysium Testnet"
                value={
                  asMMT.isLoading ? "…" : `${formatTokenAmount(asMMT.user.shares)} asMMV`
                }
              />
              <PositionRow
                label="Underlying value (asMMT)"
                value={
                  asMMT.isLoading ? "…" : `${formatTokenAmount(asMMTValueRaw)} asMMT`
                }
              />
              <PositionRow
                label="AscendMM HYPE Vault (native HYPE) — Elysium Testnet"
                value={
                  hype.isLoading
                    ? "…"
                    : `${formatTokenAmount(hype.user.shares, 21)} asHYPEV`
                }
              />
              <PositionRow
                label="Underlying value (HYPE)"
                value={
                  hype.isLoading ? "…" : `${formatTokenAmount(hypeValueRaw)} HYPE`
                }
              />
            </dl>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {asMMT.isLoading || hype.isLoading
                ? "Reading your on-chain positions…"
                : "No vault shares yet. Deposit asMMT or native HYPE on Elysium Testnet to open a position."}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-faint">
        Live on-chain data from Elysium Testnet. Historical cost-basis and PnL
        tracking will be added as more history accumulates on-chain.
      </p>
    </div>
  );
}
