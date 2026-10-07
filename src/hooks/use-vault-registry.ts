"use client";

import { zeroAddress, getAddress, type Address } from "viem";
import { useReadContract } from "wagmi";

import { registryReadsAbi } from "@/lib/abis";
import { ELYSIUM_CHAIN_ID, VAULT_REGISTRY_ADDRESS } from "@/lib/elysium";
import { bytes32DisplayLabel, registryRiskFromBytes32 } from "@/lib/registry";

/**
 * VaultRegistry discovery hooks — the registry-driven vault directory.
 *
 * All reads are pinned to chain 99801 against the deployed VaultRegistry
 * (`VAULT_REGISTRY_ADDRESS` in `src/lib/elysium.ts` — the verified canonical
 * deployment, overridable via `NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS`). The
 * address is always set, so the list/entry queries are always enabled; a
 * read failure surfaces as `isError` and callers render the honest
 * fallback (direct vault reads) instead of fabricated metadata. A zeroed
 * entry (vault field = 0x0) means "not registered" and is surfaced as such —
 * registry data is never invented.
 *
 * RPC discipline: the full entry list is one `allVaults()` call; per-vault
 * metadata is one `getVault(vault)` call per entry. Both are React Query
 * cached with the app's shared 15s staleTime, so navigating between pages
 * dedupes instead of re-hitting the rate-limited RPC.
 */

export interface UseVaultRegistryListResult {
  /** True when a registry address is configured (reads enabled). */
  configured: boolean;
  /** Registered vault addresses (undefined while loading or unconfigured). */
  vaults: readonly Address[] | undefined;
  /** Registered vault count (registry-side). */
  vaultCount: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Refetch the registry list (used after registry mutations elsewhere). */
  refetch: () => void;
}

export function useVaultRegistryList(): UseVaultRegistryListResult {
  const configured = VAULT_REGISTRY_ADDRESS !== undefined;
  const address = VAULT_REGISTRY_ADDRESS ?? zeroAddress;

  const vaults = useReadContract({
    abi: registryReadsAbi,
    address,
    functionName: "allVaults",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: configured },
  });
  const vaultCount = useReadContract({
    abi: registryReadsAbi,
    address,
    functionName: "vaultCount",
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled: configured },
  });

  return {
    configured,
    vaults: vaults.data,
    vaultCount: vaultCount.data,
    isLoading: vaults.isLoading || vaultCount.isLoading,
    isError: vaults.isError || vaultCount.isError,
    refetch: () => {
      void vaults.refetch();
      void vaultCount.refetch();
    },
  };
}

export interface VaultRegistryEntryView {
  /** Checksummed vault address of the entry. */
  vault: Address;
  /** Underlying asset as recorded at registration (may be the ERC-7528 sentinel). */
  asset: Address;
  /** Registry active/paused flag (informational; vaults do not consult it). */
  active: boolean;
  /** Decoded vault type (text when printable, short hex for hashes). */
  vaultTypeLabel: string | undefined;
  /** Registry-recorded strategy (zero address when none). */
  strategy: Address;
  /** Protocol risk bucket (LOW/MEDIUM/HIGH/EXPERIMENTAL) when recognized. */
  riskClass: "LOW" | "MEDIUM" | "HIGH" | "EXPERIMENTAL" | undefined;
  /** Decoded metadata/version identifier (text when printable, short hex for hashes). */
  metadataLabel: string | undefined;
}

export interface UseVaultRegistryEntryResult {
  /** True when a registry address is configured (read enabled). */
  configured: boolean;
  /** The registry entry view — undefined while loading, unconfigured, or on error. */
  entry: VaultRegistryEntryView | undefined;
  /**
   * Registration status: true when the registry holds an entry for this
   * vault, false when the registry responded with a zeroed entry (not
   * registered), undefined when the state cannot be known (unconfigured /
   * loading / error).
   */
  registered: boolean | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Full registry entry for one vault address. A zeroed entry (vault field =
 * 0x0) means "not registered" — surfaced as `registered: false`, never
 * rendered as real metadata.
 */
export function useVaultRegistryEntry(
  vaultAddress: Address | undefined,
): UseVaultRegistryEntryResult {
  const configured = VAULT_REGISTRY_ADDRESS !== undefined;
  const enabled = configured && vaultAddress !== undefined;
  const query = useReadContract({
    abi: registryReadsAbi,
    address: VAULT_REGISTRY_ADDRESS ?? zeroAddress,
    functionName: "getVault",
    args: [vaultAddress ?? zeroAddress],
    chainId: ELYSIUM_CHAIN_ID,
    query: { enabled },
  });

  const raw = query.data;
  let entry: VaultRegistryEntryView | undefined;
  let registered: boolean | undefined;
  if (raw !== undefined) {
    registered = getAddress(raw.vault) !== zeroAddress;
    if (registered) {
      entry = {
        vault: getAddress(raw.vault),
        asset: getAddress(raw.asset),
        active: raw.active,
        vaultTypeLabel: bytes32DisplayLabel(raw.vaultType),
        strategy: getAddress(raw.strategy),
        riskClass: registryRiskFromBytes32(raw.riskClass),
        metadataLabel: bytes32DisplayLabel(raw.metadata),
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
