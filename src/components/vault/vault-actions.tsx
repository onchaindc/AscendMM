"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Info, Loader2 } from "lucide-react";
import { erc20Abi, parseUnits } from "viem";
import type { Address, Hash } from "viem";
import { useReadContract, useWriteContract } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultTransaction } from "@/hooks/use-vault-writes";
import { ascendVaultAbi } from "@/lib/abis";
import {
  ASCEND_VAULT_ADDRESS,
  ASMMT_TOKEN_ADDRESS,
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
} from "@/lib/elysium";
import { formatTokenAmount } from "@/lib/format";
import type { Vault } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Real deposit/withdraw flows against the deployed AscendVault on Elysium
 * testnet (chain 99801). Approvals, deposits, and redemptions are genuine
 * contract interactions — no simulation anywhere in this file.
 *
 * Estimates are real on-chain previews: the deposit modal reads
 * `previewDeposit(assets)` and the withdraw modal reads `previewRedeem(shares)`
 * from the vault (debounced while typing) — no client-side rate math.
 *
 * Transaction states: wallet confirmation → pending → success / failure.
 * Deposit uses the standard ERC-4626 entry: when the asMMT allowance is
 * insufficient, an approval is broadcast first and must confirm on-chain
 * before the deposit is sent. Redemption is strategy-aware: the vault settles
 * withdrawals even while assets are deployed in the strategy. After every
 * confirmed transaction all contract reads are invalidated by the shared
 * transaction hook, so balances and vault state refresh automatically.
 *
 * All user/contract figures arrive via props from `LiveVaultDetail`, which
 * only binds them for the deployed testnet vault — preview vaults can never
 * transact against the live contract.
 */

const ONE_SHARE = 10n ** 18n;
const QUICK_PERCENTS = [25, 50, 75, 100];

type TxPhase = "idle" | "confirming" | "pending" | "success" | "error";

interface ActionModalProps {
  vault: Vault;
  mode: "deposit" | "withdraw";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Connected wallet (undefined → not connected / not the live vault). */
  userAddress: Address | undefined;
  userAssetBalance: bigint | undefined;
  userShares: bigint | undefined;
  userAllowance: bigint | undefined;
  /** Live share price in assets, 1e18 raw base (convertToAssets(1e18)). */
  sharePriceRaw: bigint | undefined;
}

function Spinner() {
  return <Loader2 className="size-3.5 shrink-0 animate-spin" />;
}

function ExplorerLink({ hash }: { hash: Hash }) {
  return (
    <a
      href={`https://elysium.kinetiq.xyz/testnet-explorer/transaction/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="ml-1.5 inline-flex items-center gap-0.5 underline underline-offset-2"
    >
      View on explorer
      <ExternalLink className="size-3" />
    </a>
  );
}

function TxStateBanner({
  phase,
  hash,
  error,
  pendingLabel,
}: {
  phase: TxPhase;
  hash: Hash | null;
  error: string | null;
  pendingLabel: string;
}) {
  if (phase === "confirming") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent-muted px-3 py-2.5 text-xs leading-relaxed text-accent">
        <Spinner />
        Confirm this transaction in your wallet…
      </div>
    );
  }
  if (phase === "pending") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2.5 text-xs leading-relaxed text-info">
        <Spinner />
        <span>
          {pendingLabel}
          {hash ? <ExplorerLink hash={hash} /> : null}
        </span>
      </div>
    );
  }
  if (phase === "success") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-positive/25 bg-positive/10 px-3 py-2.5 text-xs leading-relaxed text-positive">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Transaction confirmed on {ELYSIUM_NETWORK_LABEL}.
          {hash ? <ExplorerLink hash={hash} /> : null}
        </span>
      </div>
    );
  }
  if (phase === "error" && error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-negative/25 bg-negative/10 px-3 py-2.5 text-xs leading-relaxed text-negative">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
        {error}
      </div>
    );
  }
  return null;
}

function ActionModal({
  vault,
  mode,
  open,
  onOpenChange,
  userAddress,
  userAssetBalance,
  userShares,
  userAllowance,
  sharePriceRaw,
}: ActionModalProps) {
  const isDeposit = mode === "deposit";
  const { execute, reset, phase, txHash, error, isWaiting } = useVaultTransaction();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = React.useState("");

  const assetSymbol = "asMMT"; // TEST-ONLY mock asset (verified on-chain)
  const shareSymbol = "asMMV"; // vault share token (verified on-chain)

  const parsed = React.useMemo(() => {
    try {
      if (!amount.trim()) return undefined;
      const value = parseUnits(amount, 18);
      return value > 0n ? value : undefined;
    } catch {
      return undefined;
    }
  }, [amount]);

  // Debounced copy of the parsed amount so live preview reads don't fire on
  // every keystroke against the public RPC.
  const [debouncedParsed, setDebouncedParsed] = React.useState<bigint | undefined>(
    undefined,
  );
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedParsed(parsed), 350);
    return () => clearTimeout(timer);
  }, [parsed]);

  // Real on-chain preview for the entered amount (previewDeposit for the
  // deposit direction, previewRedeem for the withdraw direction).
  const preview = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: isDeposit ? "previewDeposit" : "previewRedeem",
    args: [debouncedParsed ?? 0n],
    chainId: ELYSIUM_CHAIN_ID,
    query: {
      enabled:
        debouncedParsed !== undefined &&
        userAddress !== undefined &&
        !isWaiting,
    },
  });
  // Exchange rate for the deposit direction (convertToShares of 1 asset).
  const sharesPerAsset = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "convertToShares",
    args: [ONE_SHARE],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: isDeposit },
  });

  const balanceRaw = isDeposit ? userAssetBalance : userShares;
  const exceedsBalance =
    parsed !== undefined && balanceRaw !== undefined && parsed > balanceRaw;

  const allowance = userAllowance ?? 0n;
  const needsApproval = isDeposit && parsed !== undefined && allowance < parsed;

  const amountValid = parsed !== undefined && !exceedsBalance && userAddress !== undefined;

  // Live share price from the vault contract (1e18 raw base), shown in the
  // withdraw direction; deposits show the live exchange rate instead.
  const sharePriceLabel = sharePriceRaw
    ? formatTokenAmount(sharePriceRaw)
    : "—";
  const estimateValue = preview.data;

  React.useEffect(() => {
    if (!open) {
      setAmount("");
      reset();
    }
  }, [open, reset]);

  function applyAmountFromRaw(raw: bigint) {
    reset();
    setAmount(formatTokenAmount(raw));
  }

  function setPercent(pct: number) {
    if (balanceRaw === undefined) return;
    if (pct >= 100) {
      applyAmountFromRaw(balanceRaw);
      return;
    }
    applyAmountFromRaw((balanceRaw * BigInt(pct)) / 100n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountValid || !parsed || !userAddress) return;

    if (isDeposit) {
      // Standard ERC-4626 entry: approve only when the current allowance is
      // insufficient. The approval must confirm before the deposit goes out;
      // `resetOnSuccess` returns the form to idle between the two writes.
      if (needsApproval) {
        const approved = await execute(() =>
          writeContractAsync({
            address: ASMMT_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [ASCEND_VAULT_ADDRESS, parsed],
            chainId: ELYSIUM_CHAIN_ID,
          }),
        { resetOnSuccess: true });
        if (!approved) return;
      }
      await execute(() =>
        writeContractAsync({
          address: ASCEND_VAULT_ADDRESS,
          abi: ascendVaultAbi,
          functionName: "deposit",
          args: [parsed, userAddress],
          chainId: ELYSIUM_CHAIN_ID,
        }),
      );
    } else {
      await execute(() =>
        writeContractAsync({
          address: ASCEND_VAULT_ADDRESS,
          abi: ascendVaultAbi,
          functionName: "redeem",
          args: [parsed, userAddress, userAddress],
          chainId: ELYSIUM_CHAIN_ID,
        }),
      );
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {isDeposit ? "Deposit" : "Withdraw"} — {ELYSIUM_NETWORK_LABEL}
          </ModalTitle>
          <ModalDescription>
            {isDeposit
              ? `Deposit TEST-ONLY asMMT into the AscendMM vault (chain ${ELYSIUM_CHAIN_ID}).`
              : `Redeem vault shares (${shareSymbol}) for TEST-ONLY asMMT.`}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={`${mode}-amount`}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint"
            >
              {isDeposit ? `Amount (${assetSymbol})` : `Amount (${shareSymbol} shares)`}
            </label>
            <div className="relative">
              <Input
                id={`${mode}-amount`}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                disabled={isWaiting}
                onChange={(e) => {
                  reset();
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                }}
                className="data pr-16 text-right text-base"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">
                {isDeposit ? assetSymbol : shareSymbol}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {QUICK_PERCENTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    disabled={isWaiting || balanceRaw === undefined || balanceRaw === 0n}
                    onClick={() => setPercent(pct)}
                    className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg disabled:opacity-40"
                  >
                    {pct === 100 ? "Max" : `${pct}%`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-faint">
                {isDeposit ? "Token balance" : "Share balance"}:{" "}
                <span className="data">{formatTokenAmount(balanceRaw)}</span>
              </p>
            </div>
            {exceedsBalance ? (
              <p className="mt-1.5 text-xs text-negative">
                Amount exceeds your {isDeposit ? "token" : "share"} balance.
              </p>
            ) : null}
          </div>

          <div className="rounded-md border border-line bg-background px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {isDeposit ? "Estimated shares received" : "Estimated assets returned"}
              </span>
              <span className="data text-fg">
                {estimateValue !== undefined
                  ? formatTokenAmount(estimateValue)
                  : "—"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">
                {isDeposit ? "Exchange rate" : "Share price"}
              </span>
              <span className="data text-fg">
                {isDeposit
                  ? `1 asMMT = ${formatTokenAmount(sharesPerAsset.data)} asMMV`
                  : sharePriceLabel}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">
                {isDeposit ? "Current allowance" : "Redemption fee"}
              </span>
              <span className="data text-fg">
                {isDeposit
                  ? formatTokenAmount(userAllowance)
                  : "Not exposed on-chain"}
              </span>
            </div>
          </div>

          {!isDeposit ? (
            <div className="flex items-start gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
              Redemptions are strategy-aware: the vault settles withdrawals even
              while assets are deployed in the strategy.
            </div>
          ) : null}

          {needsApproval ? (
            <div className="flex items-start gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
              Your current asMMT allowance is below this amount. You will sign an
              approval first, then the deposit, as two separate transactions.
            </div>
          ) : null}

          <TxStateBanner
            phase={phase}
            hash={txHash}
            error={error}
            pendingLabel={
              isDeposit
                ? "Deposit submitted — waiting for confirmation on Elysium testnet…"
                : "Redemption submitted — waiting for confirmation on Elysium testnet…"
            }
          />

          {phase === "success" ? (
            <ModalFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </ModalFooter>
          ) : (
            <ModalFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={isWaiting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!amountValid || isWaiting}>
                {isWaiting ? <Spinner /> : null}
                {isDeposit
                  ? needsApproval
                    ? "Approve asMMT"
                    : "Deposit"
                  : "Withdraw"}
              </Button>
            </ModalFooter>
          )}
        </form>
      </ModalContent>
    </Modal>
  );
}

interface VaultActionsProps {
  vault: Vault;
  userAddress: Address | undefined;
  userAssetBalance: bigint | undefined;
  userShares: bigint | undefined;
  userAllowance: bigint | undefined;
  sharePriceRaw: bigint | undefined;
  className?: string;
}

/**
 * Deposit/Withdraw buttons for the live testnet vault. While disconnected the
 * buttons open the connect modal; on the wrong chain they request a network
 * switch to Elysium 99801.
 */
export function VaultActions({
  vault,
  userAddress,
  userAssetBalance,
  userShares,
  userAllowance,
  sharePriceRaw,
  className,
}: VaultActionsProps) {
  const [active, setActive] = React.useState<"deposit" | "withdraw" | null>(null);
  const {
    isConnected,
    onWrongNetwork,
    switchToElysium,
    isSwitching,
    setConnectModalOpen,
  } = useWallet();

  function handleOpen(mode: "deposit" | "withdraw") {
    if (!isConnected) {
      setConnectModalOpen(true);
      return;
    }
    if (onWrongNetwork) {
      switchToElysium();
      return;
    }
    setActive(mode);
  }

  const modalBindings = {
    vault,
    userAddress,
    userAssetBalance,
    userShares,
    userAllowance,
    sharePriceRaw,
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button size="sm" onClick={() => handleOpen("deposit")}>
        {isConnected && onWrongNetwork
          ? isSwitching
            ? "Switching…"
            : "Switch network"
          : "Deposit"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!isConnected || onWrongNetwork}
        onClick={() => handleOpen("withdraw")}
      >
        Withdraw
      </Button>

      {userAddress ? (
        <>
          <ActionModal
            {...modalBindings}
            mode="deposit"
            open={active === "deposit"}
            onOpenChange={(open) => !open && setActive(null)}
          />
          <ActionModal
            {...modalBindings}
            mode="withdraw"
            open={active === "withdraw"}
            onOpenChange={(open) => !open && setActive(null)}
          />
        </>
      ) : null}
    </div>
  );
}
