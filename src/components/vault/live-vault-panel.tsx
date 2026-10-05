"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { getAddress } from "viem";

import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import {
  ASMMT_TOKEN_ADDRESS,
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  elysiumExplorerAddressUrl,
} from "@/lib/elysium";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live on-chain panel for the deployed AscendVault on Elysium testnet.
 *
 * Replaces the mock "Vault Statistics" numbers on the live vault's detail
 * page with real contract reads (totalAssets, totalSupply, asset, owner,
 * strategy) plus the connected wallet's balances and allowance. Every read is
 * pinned to chain 99801 through the public RPC.
 */

function LiveRow({
  label,
  hint,
  value,
  href,
  tone = "default",
}: {
  label: string;
  hint?: string;
  value: string;
  href?: string;
  tone?: "default" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">
        {label}
        {hint ? <span className="ml-1.5 text-xs text-faint">{hint}</span> : null}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="data inline-flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
        >
          {value}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        <span
          className={cn(
            "data text-sm",
            tone === "muted" ? "text-faint" : "text-fg",
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function LiveVaultPanel() {
  const { address, isConnected } = useWallet();
  const { vault, user, isLoading } = useVaultContract(address);

  const strategySet =
    vault.strategy !== undefined && vault.strategy !== ZERO_ADDRESS;

  return (
    <div className="space-y-4">
      {/* Vault state ----------------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            Live vault state
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
            {isLoading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Reading chain {ELYSIUM_CHAIN_ID}…
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-positive" />
                {ELYSIUM_NETWORK_LABEL} · chain {ELYSIUM_CHAIN_ID}
              </>
            )}
          </span>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Total Assets
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {formatTokenAmount(vault.totalAssets)} asMMT
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Idle Assets
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {formatTokenAmount(vault.idleAssets)} asMMT
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Deployed (Strategy)
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {formatTokenAmount(vault.strategyInvested)} asMMT
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Total Shares
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {formatTokenAmount(vault.totalSupply)} asMMV
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Share Price
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {vault.sharePrice !== undefined
                  ? formatTokenAmount(vault.sharePrice)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Underlying Asset
              </p>
              <p className="data mt-1 text-sm font-medium text-fg">
                {vault.asset
                  ? getAddress(vault.asset) === getAddress(ASMMT_TOKEN_ADDRESS)
                    ? "asMMT (TEST-ONLY)"
                    : "Unknown token"
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line border-t border-line">
            <LiveRow
              label="Asset contract"
              value={shortenAddress(ASMMT_TOKEN_ADDRESS, 6)}
              href={elysiumExplorerAddressUrl(ASMMT_TOKEN_ADDRESS)}
            />
            <LiveRow
              label="Vault owner"
              value={vault.owner ? shortenAddress(vault.owner, 6) : "—"}
              href={vault.owner ? elysiumExplorerAddressUrl(vault.owner) : undefined}
            />
            <LiveRow
              label="Strategy"
              hint={strategySet ? undefined : "(none set by owner yet)"}
              value={
                vault.strategy === undefined
                  ? "—"
                  : strategySet
                    ? shortenAddress(vault.strategy, 6)
                    : "0x0000…0000"
              }
              href={
                strategySet && vault.strategy
                  ? elysiumExplorerAddressUrl(vault.strategy)
                  : undefined
              }
            />
            <LiveRow
              label="Fees"
              hint="(no fee getter on the deployed contract)"
              value="Not exposed"
              tone="muted"
            />
          </div>
        </div>
      </section>

      {/* Wallet-scoped reads --------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            Your position
          </h3>
          {!isConnected ? (
            <span className="text-[11px] text-faint">
              Connect a wallet to view balances
            </span>
          ) : null}
        </div>

        <div className="glass-panel rounded-xl p-5">
          {isConnected && address ?  (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                  asMMT balance
                </p>
                <p className="data mt-1 text-sm font-medium text-fg">
                  {formatTokenAmount(user.assetBalance)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                  Vault allowance
                </p>
                <p className="data mt-1 text-sm font-medium text-fg">
                  {formatTokenAmount(user.allowance)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                  Vault shares
                </p>
                <p className="data mt-1 text-sm font-medium text-fg">
                  {formatTokenAmount(user.shares)} asMMV
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
                  Asset value
                </p>
                <p className="data mt-1 text-sm font-medium text-fg">
                  {formatTokenAmount(user.assetValue ?? (user.shares !== undefined ? 0n : undefined))} asMMT
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Balances and allowances appear here once a wallet is connected.
            </p>
          )}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-faint">
        All figures are read live from the deployed AscendVault contract on{" "}
        {ELYSIUM_NETWORK_LABEL} (chain {ELYSIUM_CHAIN_ID}). Idle assets sit in
        the vault while deployed assets are held by its strategy —
        idle + deployed = total assets. The underlying asMMT token is a
        TEST-ONLY mock asset with no value, and the current IdleStrategy
        generates no yield.
      </p>
    </div>
  );
}
