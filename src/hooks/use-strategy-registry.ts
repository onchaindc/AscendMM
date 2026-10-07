"use client";

import { zeroAddress, getAddress, type Address } from "viem";
import { useReadContract } from "wagmi";

import { strategyRegistryReadsAbi } from "@/lib/abis";
import { ELYSIUM_CHAIN_ID, STRATEGY_REGISTRY_ADDRESS } from "@/lib/elysium";
import { bytes32DisplayLabel, registryRiskFromBytes32 } from "@/lib/registry";

/**
 * StrategyRegistry discovery hooks — the registry-driven strategy allowlist.
 *
 * Same contract as `use-vault-registry.ts`: reads are pinned to chain 99801
 * against the deployed StrategyRegistry (`STRATEGY_REGISTRY_ADDRESS` in
 * `src/lib/elysium.ts` — the verified canonical deployment, overridable via
 * `NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS`). The address is always set, so
 * the list/entry queries are always enabled; a read failure surfaces as
 * `isError` and strategy discovery continues on direct strategy-contract
 * reads (see `use-strategy-contract.ts`) with registry-only fields rendered
 * as honestly unavailable. A zeroed entry means "not registered" and is
 * surfaced as such. Nothing is invented.
 *
 * RPC discipline: one `allStrategies()` call for the list plus one
 * `getStrategy(strategy)` call per entry, React Query cached and deduped.
 */

export interface UseStrategyRegistryListResult {
  /** True when a registry address is configured (reads enabled). */
  configured: boolean;
  /** Registered strategy addresses (undefined while loading or unconfigured). */
  strategies: readonly Address[] | undefined;
  /** Registered strategy count (registry-side). */
  strategyCount: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Refetch the registry list. */
  refetch: () => void;
}

export function useStrategyRegistryList(): UseStrategyRegistryListResult {
  const configured = STRATEGY_REGISTRY_ADDRESS !== undefined;
  const address = STRATEGY_REGISTRY_ADDRESS ?? zeroAddress;

  const strategies = useReadContract({
    abi: strategyRegistryReadsAbi,
    address,
    functionName: "allStrategies",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: configured },
  });
  const strategyCount = useReadContract({
    abi: strategyRegistryReadsAbi,
    address,
    functionName: "strategyCount",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: configured },
  });

  return {
    configured,
    strategies: strategies.data,
    strategyCount: strategyCount.data,
    isLoading: strategies.isLoading || strategyCount.isLoading,
    isError: strategies.isError || strategyCount.isError,
    refetch: () => {
      void strategies.refetch();
      void strategyCount.refetch();
    },
  };
}

export interface StrategyRegistryEntryView {
  /** Checksummed strategy address of the entry. */
  strategy: Address;
  /** Vault the strategy is bound to (pinned at registration). */
  vault: Address;
  /** Underlying asset (may be the ERC-7528 native sentinel). */
  asset: Address;
  /** Registry active/paused flag (informational; vaults do not consult it). */
  active: boolean;
  /** Decoded strategy type (text when printable, short hex for hashes). */
  typeLabel: string | undefined;
  /** Protocol risk bucket (LOW/MEDIUM/HIGH/EXPERIMENTAL) when recognized. */
  riskClass: "LOW" | "MEDIUM" | "HIGH" | "EXPERIMENTAL" | undefined;
  /** Decoded version identifier (text when printable, short hex for hashes). */
  versionLabel: string | undefined;
  /** Human-readable registration label ("" when registered without one). */
  label: string;
}

export interface UseStrategyRegistryEntryResult {
  /** True when a registry address is configured (read enabled). */
  configured: boolean;
  /** The registry entry view — undefined while loading, unconfigured, or on error. */
  entry: StrategyRegistryEntryView | undefined;
  /**
   * Registration status: true when registered, false for a zeroed entry (not
   * registered), undefined when the state cannot be known (unconfigured /
   * loading / error).
   */
  registered: boolean | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Full registry entry for one strategy address. A zeroed entry (strategy
 * field = 0x0) means "not registered" — surfaced as `registered: false`,
 * never rendered as real metadata.
 */
export function useStrategyRegistryEntry(
  strategyAddress: Address | undefined,
): UseStrategyRegistryEntryResult {
  const configured = STRATEGY_REGISTRY_ADDRESS !== undefined;
  const enabled = configured && strategyAddress !== undefined;
  const query = useReadContract({
    abi: strategyRegistryReadsAbi,
    address: STRATEGY_REGISTRY_ADDRESS ?? zeroAddress,
    functionName: "getStrategy",
    args: [strategyAddress ?? zeroAddress],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });

  const raw = query.data;
  let entry: StrategyRegistryEntryView | undefined;
  let registered: boolean | undefined;
  if (raw !== undefined) {
    registered = getAddress(raw.strategy) !== zeroAddress;
    if (registered) {
      entry = {
        strategy: getAddress(raw.strategy),
        vault: getAddress(raw.vault),
        asset: getAddress(raw.asset),
        active: raw.active,
        typeLabel: bytes32DisplayLabel(raw.strategyType),
        riskClass: registryRiskFromBytes32(raw.riskClass),
        versionLabel: bytes32DisplayLabel(raw.version),
        label: raw.label,
      };
    }
  }

  return {
    configured,
    entry,
    registered: raw !== undefined ? registered : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
