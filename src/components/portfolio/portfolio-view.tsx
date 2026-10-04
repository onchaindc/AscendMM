"use client";

import type { Address } from "viem";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
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
 * Portfolio view backed by real wallet + contract state. The deployed Elysium
 * testnet vault is the only live position source; historical cost-basis/PnL
 * tracking requires an indexer and is intentionally omitted rather than
 * simulated.
 */
export function PortfolioView() {
  const { address, isConnected, openConnectModal } = useWallet();
  const { vault, user, isLoading } = useVaultContract(address);

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
              Your asMMT balance, asMMV shares, and allowance for the deployed
              Elysium testnet vault will appear here.
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

  // Current value of the user's shares in assets, via the live share price
  // (1e18 raw base). 1:1 while the vault is empty.
  const positionValueRaw =
    user.shares !== undefined && vault.sharePrice !== undefined
      ? (user.shares * vault.sharePrice) / 10n ** 18n
      : undefined;
  const hasPosition =
    user.shares !== undefined && user.shares > 0n;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="asMMT Balance"
          value={isLoading ? "…" : formatTokenAmount(user.assetBalance)}
        />
        <StatCard
          label="asMMV Shares"
          value={isLoading ? "…" : formatTokenAmount(user.shares)}
        />
        <StatCard
          label="Position Value (asMMT)"
          value={
            isLoading ? "…" : formatTokenAmount(positionValueRaw)
          }
        />
        <StatCard
          label="Wallet"
          value={
            <span className="flex items-center gap-1">
              {shortenAddress(address, 4)}
              <CopyButton value={address as Address} label="Copy address" />
            </span>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {hasPosition ? (
            <dl className="divide-y divide-line">
              <PositionRow
                label="AscendMM Vault (asMMT) — Elysium Testnet"
                value={
                  isLoading ? "…" : `${formatTokenAmount(user.shares)} asMMV`
                }
              />
              <PositionRow
                label="Underlying value"
                value={isLoading ? "…" : `${formatTokenAmount(positionValueRaw)} asMMT`}
              />
            </dl>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {isLoading
                ? "Reading your on-chain position…"
                : "No asMMV shares yet. Deposit TEST-ONLY asMMT into the vault to open a position."}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-faint">
        Live on-chain data from Elysium Testnet (chain 99801). asMMT is a
        TEST-ONLY mock asset with no value. Historical cost-basis and PnL
        tracking will be added with the protocol indexer.
      </p>
    </div>
  );
}
