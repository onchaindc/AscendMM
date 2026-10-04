/**
 * Vault catalog: the live Elysium testnet vault plus the Phase 1 preview
 * entries.
 *
 * The live entry's contract addresses come from `src/lib/elysium.ts` and its
 * on-chain state (TVL, share price, strategy) is read live by the client —
 * the static numbers here are only the initial render for SEO/SSG and are
 * labeled accordingly. Preview entries remain mock placeholders.
 */

import type { PerformancePoint, Vault } from "./types";
import {
  ASCEND_VAULT_ADDRESS,
  ASMMT_TOKEN_ADDRESS,
  LIVE_VAULT_ID,
} from "./elysium";
import { MOCK_VAULTS } from "./mock-data";

/** Flat performance placeholder for the live vault — no history exists yet. */
function flatPerformance(): PerformancePoint[] {
  return Array.from({ length: 30 }, (_, day) => ({
    day,
    label: `Day ${day + 1}`,
    value: 100,
  }));
}

export const LIVE_TESTNET_VAULT: Vault = {
  id: LIVE_VAULT_ID,
  name: "AscendMM Vault",
  assets: ["asMMT"],
  type: "Single-Sided",
  description:
    "The deployed AscendMM market-making vault on Elysium testnet, holding the TEST-ONLY asMMT mock asset. All stats below are read live from chain 99801.",
  tvl: 0,
  apy: 0,
  change24h: 0,
  risk: "Moderate",
  status: "Active",
  strategy: {
    name: "Market Making — strategy pending",
    status: "Active",
    risk: "Moderate",
    style:
      "The vault owner has not assigned a strategy contract yet (strategy() returns the zero address on-chain).",
    performanceFee: 0,
  },
  allocation: [{ asset: "asMMT", percentage: 100 }],
  stats: {
    totalAssets: 0,
    totalShares: 0,
    sharePrice: 1,
    depositors: 0,
    apy: 0,
    perf30d: 0,
  },
  activity: [],
  contract: {
    vaultAddress: ASCEND_VAULT_ADDRESS,
    underlyingAddress: ASMMT_TOKEN_ADDRESS,
    network: "Elysium Testnet",
    status: "Live — Elysium Testnet",
    standard: "ERC-4626",
  },
  performance: flatPerformance(),
};

export const ALL_VAULTS: Vault[] = [LIVE_TESTNET_VAULT, ...MOCK_VAULTS];
