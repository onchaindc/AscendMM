/**
 * Vault catalog: the two live Elysium testnet vaults (ERC-20 asMMT track and
 * native HYPE track) plus the Phase 1 preview entries.
 *
 * The live entries' contract addresses come from `src/lib/elysium.ts` and
 * their on-chain state (TVL, share price, strategy) is read live by the
 * client — the static numbers here are only the initial render for SEO/SSG
 * and are labeled accordingly. Preview entries remain mock placeholders.
 */

import type { PerformancePoint, Vault } from "./types";
import {
  ASCEND_VAULT_ADDRESS,
  ASMMT_TOKEN_ADDRESS,
  HYPE_VAULT_ADDRESS,
  HYPE_VAULT_ID,
  LIVE_VAULT_ID,
  NATIVE_ASSET_SENTINEL,
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
    "The deployed, strategy-enabled AscendMM vault on Elysium testnet, holding the TEST-ONLY asMMT mock asset. All stats below are read live from chain 99801.",
  tvl: 0,
  apy: 0,
  change24h: 0,
  risk: "Moderate",
  status: "Active",
  strategy: {
    name: "Idle — No yield strategy",
    status: "Active",
    risk: "Moderate",
    style:
      "The vault's IdleStrategy holds deposited assets idle on-chain and generates no yield. The strategy address is set on-chain and verified.",
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

/**
 * The native HYPE vault: the second live deployment. Deposits carry native
 * HYPE as transaction value (no ERC-20 approval) and shares use a 21-decimal
 * virtual offset — verified on-chain. tvl/apy stay honestly at 0.
 */
export const LIVE_HYPE_VAULT: Vault = {
  id: HYPE_VAULT_ID,
  name: "AscendMM HYPE Vault",
  assets: ["HYPE"],
  type: "Single-Sided",
  description:
    "The deployed native HYPE vault on Elysium testnet. Deposits send native HYPE directly to the vault — no ERC-20 approval — and shares use a 21-decimal virtual offset. All stats below are read live from chain 99801.",
  tvl: 0,
  apy: 0,
  change24h: 0,
  risk: "Moderate",
  status: "Active",
  strategy: {
    name: "Idle — No yield strategy",
    status: "Active",
    risk: "Moderate",
    style:
      "The vault's HypeIdleStrategy holds deposited HYPE idle on-chain and generates no yield. The strategy address is set on-chain and verified.",
    performanceFee: 0,
  },
  allocation: [{ asset: "HYPE", percentage: 100 }],
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
    vaultAddress: HYPE_VAULT_ADDRESS,
    underlyingAddress: NATIVE_ASSET_SENTINEL,
    network: "Elysium Testnet",
    status: "Live — Elysium Testnet",
    standard: "ERC-4626 (native)",
  },
  performance: flatPerformance(),
};

export const ALL_VAULTS: Vault[] = [
  LIVE_TESTNET_VAULT,
  LIVE_HYPE_VAULT,
  ...MOCK_VAULTS,
];
