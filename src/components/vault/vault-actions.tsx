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
import {
  ascendVaultAbi,
  hypeVaultAbi,
  vaultReadsAbi,
} from "@/lib/abis";
import {
  ASMMT_TOKEN_ADDRESS,
  ASCEND_VAULT_ADDRESS,
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  getLiveVaultConfig,
} from "@/lib/elysium";
import { formatTokenAmount } from "@/lib/format";
import type { Vault } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Real deposit/withdraw flows against the two deployed AscendVaults on
 * Elysium testnet (chain 99801) — the ERC-20 asMMT vault and the native HYPE
 * vault. Approvals, deposits, and redemptions are genuine contract
 * interactions — no simulation anywhere in this file.
 *
 * ERC-20 track (asMMT): the deposit flow reads `previewDeposit(assets)` and
 * the withdraw flow reads `previewRedeem(shares)` (debounced while typing).
 * When the asMMT allowance is insufficient, an approval is broadcast first
 * and must confirm on-chain before the deposit is sent.
 *
 * Native HYPE track: HYPE is NOT an ERC-20 — there is no approve() anywhere.
 * `deposit()`/`mint()` are payable and send the HYPE amount as msg.value
 * (mint sends the exact `previewMint(shares)` value), and `withdraw()`/
 * `redeem()` return native HYPE to the receiver. Share amounts use the
 * vault's 21-decimal precision (virtual offset) — never hardcoded 18 — while
 * HYPE asset amounts stay 18 decimals. Wallets are also warned to keep HYPE
 * aside for gas since the deposit itself consumes the native balance.
 *
 * Transaction states: wallet confirmation → pending → success / failure.
 * After every confirmed transaction all contract reads are invalidated by the
 * shared transaction hook, so balances and vault state refresh automatically.
 *
 * All user/contract figures arrive via props from `LiveVaultDetail`, which
 * only binds them for the two deployed testnet vaults — preview vaults can
 * never transact against the live contracts.
 *
 * Every `functionName` below is a string literal so wagmi's per-hook type
 * inference stays cheap (a union functionName forces deep type instantiation
 * and makes `tsc` hang); reads that don't apply to the active direction are
 * simply disabled and never hit the RPC.
 */

const QUICK_PERCENTS = [25, 50, 75, 100];

type TxPhase = "idle" | "confirming" | "pending" | "success" | "error";

/** Entry direction inside the deposit modal (asset-in vs share-in). */
type DepositDirection = "deposit" | "mint";
/** Exit direction inside the withdraw modal (share-in vs asset-in). */
type WithdrawDirection = "redeem" | "withdraw";

interface ActionModalProps {
  vault: Vault;
  mode: "deposit" | "withdraw";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Connected wallet (undefined → not connected / not a live vault). */
  userAddress: Address | undefined;
  /** Asset balance: ERC-20 asMMT balance, or native HYPE for the HYPE vault. */
  userAssetBalance: bigint | undefined;
  userShares: bigint | undefined;
  userAllowance: bigint | undefined;
  /** Live price of ONE SHARE in assets at the vault's own share precision. */
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
        Confirm in wallet…
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
        <span>
          {error} You can adjust the details and try again.
        </span>
      </div>
    );
  }
  return null;
}

function DirectionTabs({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-line bg-surface-2 p-0.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.key)}
          className={cn(
            "flex-1 rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40",
            value === option.key
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
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
  const [direction, setDirection] = React.useState<DepositDirection | WithdrawDirection>(
    isDeposit ? "deposit" : "redeem",
  );

  // Live-vault config for this vault id — defines track kind, symbols, and
  // decimals. Undefined only for preview vaults, which never render modals.
  const config = getLiveVaultConfig(vault.id);
  const isNative = config?.kind === "native";
  const assetSymbol = config?.assetSymbol ?? "asMMT";
  const shareSymbol = config?.shareSymbol ?? "asMMV";
  const assetDecimals = config?.assetDecimals ?? 18;
  const shareDecimals = config?.shareDecimals ?? 18;
  const vaultAddress = config?.vaultAddress ?? ASCEND_VAULT_ADDRESS;

  // Reset the direction toggle when the modal reopens for the other mode.
  React.useEffect(() => {
    setDirection(isDeposit ? "deposit" : "redeem");
  }, [isDeposit, mode]);

  // Asset amounts are 18 decimals on both tracks (HYPE and asMMT); share
  // amounts use the vault's own share precision (21 for HYPE, 18 for asMMT).
  const assetIn = direction === "deposit" || direction === "withdraw";
  const inputDecimals = assetIn ? assetDecimals : shareDecimals;

  const parsed = React.useMemo(() => {
    try {
      if (!amount.trim()) return undefined;
      const value = parseUnits(amount, inputDecimals);
      return value > 0n ? value : undefined;
    } catch {
      return undefined;
    }
  }, [amount, inputDecimals]);

  // Debounced copy of the parsed amount so live preview reads don't fire on
  // every keystroke against the public RPC.
  const [debouncedParsed, setDebouncedParsed] = React.useState<bigint | undefined>(
    undefined,
  );
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedParsed(parsed), 350);
    return () => clearTimeout(timer);
  }, [parsed]);

  // Real on-chain previews for the entered amount — one literal-name read per
  // direction (only the active one is enabled; the rest never hit the RPC):
  //   deposit  → previewDeposit(assets) = shares received
  //   mint     → previewMint(shares)    = HYPE required as msg.value
  //   redeem   → previewRedeem(shares)  = assets returned
  //   withdraw → previewWithdraw(assets) = shares burned
  const previewEnabled =
    debouncedParsed !== undefined && userAddress !== undefined && !isWaiting;
  const previewDeposit = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "previewDeposit",
    args: [debouncedParsed ?? 0n],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: previewEnabled && direction === "deposit" },
  });
  const previewMint = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "previewMint",
    args: [debouncedParsed ?? 0n],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: previewEnabled && direction === "mint" },
  });
  const previewRedeem = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "previewRedeem",
    args: [debouncedParsed ?? 0n],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: previewEnabled && direction === "redeem" },
  });
  const previewWithdraw = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "previewWithdraw",
    args: [debouncedParsed ?? 0n],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: previewEnabled && direction === "withdraw" },
  });
  // Exchange rate for the asset-in direction (convertToShares of 1 asset).
  const sharesPerAsset = useReadContract({
    abi: vaultReadsAbi,
    address: vaultAddress,
    functionName: "convertToShares",
    args: [10n ** BigInt(assetDecimals)],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: isDeposit },
  });

  const previewData =
    direction === "deposit"
      ? previewDeposit.data
      : direction === "mint"
        ? previewMint.data
        : direction === "withdraw"
          ? previewWithdraw.data
          : previewRedeem.data;

  // Balance for the entered direction: asset balance for asset-in entries,
  // share balance for share-in entries.
  const balanceRaw = assetIn ? userAssetBalance : userShares;
  const exceedsBalance =
    parsed !== undefined && balanceRaw !== undefined && parsed > balanceRaw;

  // ERC-20-only concept — the native HYPE flow has no approve() step at all.
  const needsApproval =
    !isNative &&
    isDeposit &&
    parsed !== undefined &&
    (userAllowance ?? 0n) < parsed;

  const amountValid = parsed !== undefined && !exceedsBalance && userAddress !== undefined;

  // Live share price from the vault contract, formatted at the vault's own
  // share precision (21 for HYPE — never assume 18).
  const sharePriceLabel = sharePriceRaw
    ? formatTokenAmount(sharePriceRaw, shareDecimals)
    : "—";
  const estimateValue = previewData;

  React.useEffect(() => {
    if (!open) {
      setAmount("");
      reset();
    }
  }, [open, reset]);

  function applyAmountFromRaw(raw: bigint) {
    reset();
    setAmount(formatTokenAmount(raw, inputDecimals));
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
    if (!amountValid || !parsed || !userAddress || !config) return;

    if (isDeposit) {
      if (isNative) {
        // Native HYPE entry — value IS the deposit amount. No approve() exists
        // anywhere in this flow; the vault contract is never treated as an
        // ERC-20 and HYPE is never used as a token contract.
        if (direction === "mint") {
          // mint() requires msg.value = previewMint(shares). The live preview
          // read above is the exact required native value; without it the tx
          // would underpay and revert.
          const mintValue = previewData;
          if (mintValue === undefined) return;
          await execute(() =>
            writeContractAsync({
              address: vaultAddress,
              abi: hypeVaultAbi,
              functionName: "mint",
              args: [parsed, userAddress],
              value: mintValue,
              chainId: ELYSIUM_CHAIN_ID,
            }),
          );
        } else {
          await execute(() =>
            writeContractAsync({
              address: vaultAddress,
              abi: hypeVaultAbi,
              functionName: "deposit",
              args: [parsed, userAddress],
              value: parsed,
              chainId: ELYSIUM_CHAIN_ID,
            }),
          );
        }
      } else {
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
      }
    } else if (isNative) {
      if (direction === "withdraw") {
        // Native exit by target asset amount — the vault sends HYPE back.
        await execute(() =>
          writeContractAsync({
            address: vaultAddress,
            abi: hypeVaultAbi,
            functionName: "withdraw",
            args: [parsed, userAddress, userAddress],
            chainId: ELYSIUM_CHAIN_ID,
          }),
        );
      } else {
        // Native exit by shares — the vault sends HYPE back.
        await execute(() =>
          writeContractAsync({
            address: vaultAddress,
            abi: hypeVaultAbi,
            functionName: "redeem",
            args: [parsed, userAddress, userAddress],
            chainId: ELYSIUM_CHAIN_ID,
          }),
        );
      }
    } else {
      // ERC-20 exit by shares (unchanged asMMT flow, strategy-aware).
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

  // The ERC-20 vault's user-facing ABI is the previously verified surface
  // (deposit/redeem only); mint/withdraw tabs exist on the HYPE track where
  // those selectors were verified on-chain.
  const directionTabs: Array<{ key: string; label: string }> = isDeposit
    ? isNative
      ? [
          { key: "deposit", label: `Deposit ${assetSymbol}` },
          { key: "mint", label: `Mint ${shareSymbol}` },
        ]
      : [{ key: "deposit", label: `Deposit ${assetSymbol}` }]
    : isNative
      ? [
          { key: "redeem", label: `Redeem ${shareSymbol}` },
          { key: "withdraw", label: `Withdraw ${assetSymbol}` },
        ]
      : [{ key: "redeem", label: `Redeem ${shareSymbol}` }];

  const estimateLabel =
    direction === "deposit"
      ? "Estimated shares received"
      : direction === "mint"
        ? "HYPE required (msg.value)"
        : direction === "withdraw"
          ? "Shares to be burned"
          : "Estimated assets returned";

  const estimateDecimals =
    direction === "deposit"
      ? shareDecimals
      : direction === "mint"
        ? assetDecimals
        : direction === "withdraw"
          ? shareDecimals
          : assetDecimals;

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
            {isNative
              ? isDeposit
                ? "Send native HYPE to the AscendMM HYPE vault. No approval — the deposit carries HYPE as transaction value."
                : `Redeem ${shareSymbol} shares for native HYPE.`
              : isDeposit
                ? "Deposit asMMT into the AscendMM vault."
                : `Redeem vault shares (${shareSymbol}) for asMMT.`}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {directionTabs.length > 1 ? (
            <DirectionTabs
              options={directionTabs}
              value={direction}
              onChange={(key) => {
                reset();
                setAmount("");
                setDirection(key as DepositDirection | WithdrawDirection);
              }}
              disabled={isWaiting}
            />
          ) : null}

          <div>
            <label
              htmlFor={`${mode}-${direction}-amount`}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint"
            >
              Amount ({assetIn ? assetSymbol : shareSymbol})
            </label>
            <div className="relative">
              <Input
                id={`${mode}-${direction}-amount`}
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
                {assetIn ? assetSymbol : shareSymbol}
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
                {assetIn ? `${assetSymbol} balance` : `${shareSymbol} shares`}:{" "}
                <span className="data">
                  {formatTokenAmount(balanceRaw, assetIn ? assetDecimals : shareDecimals)}
                </span>
              </p>
            </div>
            {exceedsBalance ? (
              <p className="mt-1.5 text-xs text-negative">
                Amount exceeds your {assetIn ? `${assetSymbol} balance` : `${shareSymbol} share balance`}.
              </p>
            ) : null}
            {isNative && isDeposit ? (
              <p className="mt-1.5 text-xs text-faint">
                Deposits are native HYPE transfers — keep a little HYPE in your
                wallet for gas.
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{estimateLabel}</span>
              <span className="data text-fg">
                {estimateValue !== undefined
                  ? formatTokenAmount(estimateValue, estimateDecimals)
                  : "—"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">
                {isDeposit ? "Exchange rate" : "Share price"}
              </span>
              <span className="data text-fg">
                {isDeposit
                  ? `1 ${assetSymbol} = ${formatTokenAmount(sharesPerAsset.data, shareDecimals)} ${shareSymbol}`
                  : sharePriceLabel}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">
                {isNative && isDeposit
                  ? "Approval"
                  : isDeposit
                    ? "Current allowance"
                    : "Redemption fee"}
              </span>
              <span className="data text-fg">
                {isNative && isDeposit
                  ? "Not required — native deposit"
                  : isDeposit
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
                ? "Transaction pending — your deposit is being confirmed on Elysium Testnet…"
                : "Transaction pending — your redemption is being confirmed on Elysium Testnet…"
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
                    : isNative && direction === "mint"
                      ? "Mint shares"
                      : "Deposit"
                  : direction === "withdraw"
                    ? "Withdraw"
                    : "Redeem"}
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
 * Deposit/Withdraw buttons for the live testnet vaults. While disconnected
 * the buttons open the connect modal; on the wrong chain they request a
 * network switch to Elysium 99801.
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
