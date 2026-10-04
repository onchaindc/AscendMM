"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { ELYSIUM_CHAIN_ID, elysiumExplorerTxUrl } from "@/lib/elysium";
import { getWalletErrorMessage } from "@/lib/wagmi";

type TxHash = `0x${string}`;

/**
 * Shared write/confirmation state machine for vault transactions
 * (approve → deposit / redeem) on Elysium testnet.
 *
 * Phases: idle → confirming (wallet popup open) → pending (broadcast, waiting
 * for the receipt) → success | error. On a confirmed receipt every contract
 * read in the app is invalidated so balances and vault state refresh.
 */

export type VaultTxPhase = "idle" | "confirming" | "pending" | "success" | "error";

export function useVaultTransaction() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [phase, setPhase] = React.useState<VaultTxPhase>("idle");
  const [txHash, setTxHash] = React.useState<TxHash | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Intermediate steps (e.g. ERC-20 approve) return the form to idle instead
  // of the terminal success state so the main action can proceed in-session.
  const autoResetRef = React.useRef(false);

  const receipt = useWaitForTransactionReceipt({
    chainId: ELYSIUM_CHAIN_ID,
    hash: txHash ?? undefined,
    query: { enabled: txHash !== null },
  });

  React.useEffect(() => {
    if (txHash && receipt.isSuccess) {
      if (autoResetRef.current) {
        autoResetRef.current = false;
        setPhase("idle");
        setError(null);
      } else {
        setPhase("success");
      }
      // Refresh all contract reads so balances/vault state reflect the tx.
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "readContract" ||
          query.queryKey[0] === "readContracts",
      });
    }
  }, [txHash, receipt.isSuccess, queryClient]);

  React.useEffect(() => {
    if (txHash && receipt.isError) {
      setPhase("error");
      setError(
        receipt.error
          ? getWalletErrorMessage(receipt.error)
          : "Transaction failed on-chain.",
      );
    }
  }, [txHash, receipt.isError, receipt.error]);

  const execute = React.useCallback(
    async (
      write: () => Promise<TxHash>,
      options?: { resetOnSuccess?: boolean },
    ): Promise<TxHash | null> => {
      autoResetRef.current = options?.resetOnSuccess ?? false;
      setPhase("confirming");
      setError(null);
      setTxHash(null);
      try {
        const hash = await write();
        setTxHash(hash);
        setPhase("pending");
        return hash;
      } catch (err) {
        setError(getWalletErrorMessage(err));
        setPhase("error");
        return null;
      }
    },
    [],
  );

  const reset = React.useCallback(() => {
    setPhase("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return {
    phase,
    txHash,
    error,
    execute,
    reset,
    explorerUrl: txHash ? elysiumExplorerTxUrl(txHash) : null,
    isWaiting: phase === "confirming" || phase === "pending",
  };
}
