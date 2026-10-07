"use client";

import { zeroAddress, getAddress, type Address } from "viem";
import { useReadContract } from "wagmi";

import { strategyReadsAbi } from "@/lib/abis";
import { ELYSIUM_CHAIN_ID } from "@/lib/elysium";

/**
 * Live on-chain reads for one deployed IStrategy contract (both vault tracks
 * share the unified interface — verified in the contracts repo at commit
 * 42f252f and exercised by the deployed IdleStrategy / HypeIdleStrategy):
 *
 *   - `vault()`  — the vault the strategy reports as its binding.
 *   - `asset()`  — the underlying asset (ERC-20 token, or the ERC-7528 native
 *                  sentinel on the HYPE track).
 *   - `cap()`    — investment cap in asset units (0 = unbounded, per the
 *                  deploy scripts' documented semantics).
 *   - `totalAssets()` — the strategy's SELF-REPORTED holdings. For the idle
 *                  strategies this is the raw asset balance of the strategy
 *                  contract (verified in source). It is informational only:
 *                  the vault never prices shares off it, and the UI must
 *                  label it as self-reported.
 *
 * The hook is disabled until a concrete strategy address is passed, so
 * prepared-but-undeployed strategies (e.g. the Kinetiq adapter, which has no
 * Elysium deployment) never trigger phantom reads.
 */
export function useStrategyOnChain(strategyAddress: Address | undefined) {
  const enabled = strategyAddress !== undefined;
  const address = strategyAddress ?? zeroAddress;

  const vault = useReadContract({
    abi: strategyReadsAbi,
    address,
    functionName: "vault",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });
  const asset = useReadContract({
    abi: strategyReadsAbi,
    address,
    functionName: "asset",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });
  const cap = useReadContract({
    abi: strategyReadsAbi,
    address,
    functionName: "cap",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });
  const totalAssets = useReadContract({
    abi: strategyReadsAbi,
    address,
    functionName: "totalAssets",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });

  return {
    /** Bound vault as the strategy itself reports it (may be 0x0). */
    vault: vault.data !== undefined ? getAddress(vault.data) : undefined,
    /** Asset as the strategy itself reports it (may be 0x0). */
    asset: asset.data !== undefined ? getAddress(asset.data) : undefined,
    /** Investment cap (0 = unbounded per documented deploy semantics). */
    cap: cap.data,
    /** Self-reported total assets under the strategy's control. */
    totalAssets: totalAssets.data,
    isLoading: vault.isLoading || asset.isLoading || cap.isLoading || totalAssets.isLoading,
    isError: vault.isError || asset.isError || cap.isError || totalAssets.isError,
    refetchAll: () => {
      void vault.refetch();
      void asset.refetch();
      void cap.refetch();
      void totalAssets.refetch();
    },
  };
}
