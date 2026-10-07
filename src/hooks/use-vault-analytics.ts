"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { ELYSIUM_CHAIN_ID, type LiveVaultConfig } from "@/lib/elysium";
import { fetchVaultAnalytics, type VaultAnalytics } from "@/lib/vault-analytics";

/**
 * On-chain analytics for one deployed vault (Phase 2F).
 *
 * The full fetch is a small, bounded set of RPC calls (4 event-log reads +
 * a handful of state reads + block timestamps) executed ONCE per vault and
 * cached by React Query — component renders never re-scan the chain. The
 * client is the app's pinned chain-99801 public client, so analytics never
 * depend on the connected wallet's network.
 *
 * Failure is surfaced as `isError` (RPC down / rate-limited beyond retries);
 * the UI renders an honest unavailable state — never fabricated data.
 */
export function useVaultAnalytics(config: LiveVaultConfig | undefined) {
  const publicClient = usePublicClient({ chainId: ELYSIUM_CHAIN_ID });

  return useQuery({
    queryKey: ["vault-analytics", ELYSIUM_CHAIN_ID, config?.vaultAddress],
    queryFn: async ({ signal }): Promise<VaultAnalytics> => {
      if (!publicClient || !config) {
        throw new Error("vault analytics: missing RPC client or vault config");
      }
      return fetchVaultAnalytics(publicClient, config);
    },
    enabled: config !== undefined && publicClient !== undefined,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: (attempt) => 2_000 * attempt,
  });
}
