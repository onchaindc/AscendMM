/* =============================================================================
 * ⚠️  MOCK DATA — TEMPORARY FRONTEND PLACEHOLDERS ⚠️
 * =============================================================================
 *
 * EVERY value in this file is a hand-written placeholder for the AscendMM
 * Phase 1 product preview. None of these numbers, addresses, or vaults are
 * real. No vault contracts are deployed yet, and none of these APYs, TVLs,
 * returns, or wallet addresses represent live protocol state.
 *
 * This file is the ONLY place UI-facing mock values may live. In a later
 * phase every export below will be replaced by:
 *   - contract reads against ERC-4626 vaults on Elysium,
 *   - an indexer / API feed, and
 *   - connected-wallet state.
 *
 * Components must consume this data through props/types (`src/lib/types.ts`),
 * so swapping `MOCK_VAULTS` for a `useVaults()` hook should be a one-line
 * change per page.
 * ========================================================================== */

import type {
  PortfolioSummaryData,
  PerformancePoint,
  Position,
  Strategy,
  Vault,
  VaultActivityItem,
} from "./types";

/* -----------------------------------------------------------------------------
 * Deterministic helpers (no randomness — server and client must agree)
 * -------------------------------------------------------------------------- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Builds a deterministic mock performance series (index, 100 = series start).
 * `seed` only shapes the wiggle pattern; `endValue` is hit exactly on day 90.
 */
function buildPerformanceSeries(
  seed: number,
  endValue: number,
  volatility: number,
): PerformancePoint[] {
  const days = 90;
  const start = Date.UTC(2026, 6, 5); // Jul 5, 2026
  const points: PerformancePoint[] = [];

  for (let day = 0; day <= days; day++) {
    const n = Math.sin(seed * 12.9898 + day * 78.233) * 43758.5453;
    const noise = (n - Math.floor(n) - 0.5) * 2; // -1..1
    const t = day / days;
    const trend = Math.pow(endValue / 100, t);
    const wiggle = volatility * noise * Math.sin(Math.PI * t);
    const value = 100 * trend * (1 + wiggle);

    const date = new Date(start + day * 86_400_000);
    points.push({
      day,
      label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`,
      value: Math.round(value * 100) / 100,
    });
  }
  return points;
}

/** Mock activity entry factory — amounts/addresses are placeholder strings. */
function makeActivity(
  entries: Array<[VaultActivityItem["type"], string, string, string]>,
): VaultActivityItem[] {
  return entries.map(([type, amount, address, time], i) => ({
    id: `activity-${i + 1}`,
    type,
    amount,
    address,
    time,
  }));
}

/* -----------------------------------------------------------------------------
 * ⚠️ MOCK VAULTS — six placeholder vaults. Not deployed. Not real. ⚠️
 * -------------------------------------------------------------------------- */

export const MOCK_VAULTS: Vault[] = [
  {
    id: "ascend-hype",
    name: "ASCEND / HYPE",
    assets: ["ASCEND", "HYPE"],
    type: "Volatile",
    description:
      "Two-asset market-making vault quoting ASCEND against HYPE depth.",
    tvl: 84291,
    apy: 18.42,
    change24h: 2.14,
    risk: "Moderate",
    status: "Active",
    strategy: {
      name: "Market Maker Alpha",
      status: "Active",
      risk: "Moderate",
      style: "Inventory-aware quoting with adaptive spread bands.",
      performanceFee: 10,
    },
    allocation: [
      { asset: "ASCEND", percentage: 51.2 },
      { asset: "HYPE", percentage: 48.8 },
    ],
    stats: {
      totalAssets: 84291.44,
      totalShares: 81197.12,
      sharePrice: 1.0381,
      depositors: 34,
      apy: 18.42,
      perf30d: 6.12,
    },
    activity: makeActivity([
      ["Deposit", "5,000.00 ASCEND", "0x3f9c1a84b2e0d7c6f5a3b9c2d4e6f8a0b1c3d5e7", "4m ago"],
      ["Withdrawal", "1,250.00 HYPE", "0x7d21c9f0a4b6e8d2c5a7b9d1f3e5c7a9b2d4f6e8", "27m ago"],
      ["Deposit", "12,000.00 ASCEND", "0x9b45e2d8f0a6c4b2d8e6f4a2c8b0d6e4f2a8c6d0", "1h ago"],
      ["Deposit", "800.00 HYPE", "0x5e83a1c7b9d2f4e6a8c0b2d4f6e8a1c3b5d7f9e1", "3h ago"],
      ["Withdrawal", "2,400.00 ASCEND", "0x1c64e8a0d2f4b6c8e0a2d4f6b8c0e2a4d6f8b0c2", "6h ago"],
      ["Deposit", "9,600.00 ASCEND", "0x4a92b6d0e8f2a4c6b8d0e2f4a6c8d0e2f4a6b8d0", "11h ago"],
    ]),
    contract: {
      vaultAddress: "0xa5c91d7e3b8f2a4c6d0e8b2f4a6c8d0e2b4f6a8c1",
      underlyingAddress: "0xd4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(11, 112.4, 0.006),
  },
  {
    id: "usdc-usdt",
    name: "USDC / USDT",
    assets: ["USDC", "USDT"],
    type: "Stable",
    description:
      "Pegged-pair vault harvesting spread between USDC and USDT.",
    tvl: 142840,
    apy: 8.21,
    change24h: 0.42,
    risk: "Low",
    status: "Active",
    strategy: {
      name: "Stable Spread Harvester",
      status: "Active",
      risk: "Low",
      style: "Tight-spread quoting across pegged assets.",
      performanceFee: 8,
    },
    allocation: [
      { asset: "USDC", percentage: 49.8 },
      { asset: "USDT", percentage: 50.2 },
    ],
    stats: {
      totalAssets: 142840.02,
      totalShares: 138210.55,
      sharePrice: 1.0334,
      depositors: 58,
      apy: 8.21,
      perf30d: 2.61,
    },
    activity: makeActivity([
      ["Deposit", "10,000.00 USDC", "0x8b36d4f2a0c8e6b4d2f0a8c6e4b2d0f8a6c4e2d0", "12m ago"],
      ["Deposit", "25,000.00 USDT", "0x2f74a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2", "48m ago"],
      ["Withdrawal", "6,400.00 USDC", "0x6d18e2a4c6b8d0f2e4a6c8d0b2f4e6a8c0d2f4b6", "2h ago"],
      ["Deposit", "15,500.00 USDT", "0x0c58f6a8d0e2b4c6d8e0f2a4c6b8d0e2f4a6c8d0", "5h ago"],
      ["Withdrawal", "3,100.00 USDT", "0xb924c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8c0", "9h ago"],
      ["Deposit", "40,000.00 USDC", "0x3e61b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2", "14h ago"],
    ]),
    contract: {
      vaultAddress: "0xf2a4c6d8e0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e4",
      underlyingAddress: "0xa0c2e4b6d8f0a2b4c6d8e0f2a4b6c8d0e2f4a6c8",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(23, 104.2, 0.0012),
  },
  {
    id: "hype-single",
    name: "HYPE",
    assets: ["HYPE"],
    type: "Single-Sided",
    description:
      "Single-asset HYPE vault with inventory-aware directional quoting.",
    tvl: 61402,
    apy: 14.87,
    change24h: 1.73,
    risk: "Moderate",
    status: "Active",
    strategy: {
      name: "Momentum Rotation",
      status: "Active",
      risk: "Moderate",
      style: "Concentrates inventory into trending assets with risk caps.",
      performanceFee: 12,
    },
    allocation: [{ asset: "HYPE", percentage: 100 }],
    stats: {
      totalAssets: 61402.77,
      totalShares: 59204.1,
      sharePrice: 1.0371,
      depositors: 21,
      apy: 14.87,
      perf30d: 4.03,
    },
    activity: makeActivity([
      ["Deposit", "2,200.00 HYPE", "0x5e83a1c7b9d2f4e6a8c0b2d4f6e8a1c3b5d7f9e1", "9m ago"],
      ["Withdrawal", "600.00 HYPE", "0x7d21c9f0a4b6e8d2c5a7b9d1f3e5c7a9b2d4f6e8", "1h ago"],
      ["Deposit", "1,800.00 HYPE", "0x9b45e2d8f0a6c4b2d8e6f4a2c8b0d6e4f2a8c6d0", "4h ago"],
      ["Deposit", "950.00 HYPE", "0x1c64e8a0d2f4b6c8e0a2d4f6b8c0e2a4d6f8b0c2", "8h ago"],
      ["Withdrawal", "1,100.00 HYPE", "0x4a92b6d0e8f2a4c6b8d0e2f4a6c8d0e2f4a6b8d0", "20h ago"],
    ]),
    contract: {
      vaultAddress: "0xb8d0e2f4a6c8d0e2f4a6b8c0d2e4f6a8c0d2e4f6a2",
      underlyingAddress: "0xe4b6c8d0f2a4b6c8d0e2f4a6c8d0e2f4a6b8c0d2",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(37, 109.1, 0.004),
  },
  {
    id: "eth-usdc",
    name: "ETH / USDC",
    assets: ["ETH", "USDC"],
    type: "Volatile",
    description: "ETH/USDC market-making vault operating a laddered grid.",
    tvl: 38910,
    apy: 12.05,
    change24h: -0.31,
    risk: "Moderate",
    status: "Active",
    strategy: {
      name: "Range Grid v2",
      status: "Active",
      risk: "Moderate",
      style: "Laddered orders that harvest range-bound volatility.",
      performanceFee: 10,
    },
    allocation: [
      { asset: "ETH", percentage: 49.6 },
      { asset: "USDC", percentage: 50.4 },
    ],
    stats: {
      totalAssets: 38910.3,
      totalShares: 37988.44,
      sharePrice: 1.0243,
      depositors: 17,
      apy: 12.05,
      perf30d: 2.44,
    },
    activity: makeActivity([
      ["Deposit", "4,000.00 USDC", "0x0c58f6a8d0e2b4c6d8e0f2a4c6b8d0e2f4a6c8d0", "23m ago"],
      ["Deposit", "1.20 ETH", "0xb924c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8c0", "2h ago"],
      ["Withdrawal", "2,000.00 USDC", "0x3e61b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2", "7h ago"],
      ["Deposit", "0.85 ETH", "0x3f9c1a84b2e0d7c6f5a3b9c2d4e6f8a0b1c3d5e7", "16h ago"],
    ]),
    contract: {
      vaultAddress: "0xd0f2a4c6b8d0e2f4a6c8d0e2f4a6b8c0d2e4f6a8c4",
      underlyingAddress: "0xc2e4b6d8f0a2c4b6d8e0f2a4b6c8d0e2f4a6c8d0",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(53, 102.8, 0.003),
  },
  {
    id: "ascend-usdc",
    name: "ASCEND / USDC",
    assets: ["ASCEND", "USDC"],
    type: "Volatile",
    description:
      "ASCEND/USDC vault tuned for high-volatility quoting windows.",
    tvl: 27484,
    apy: 21.63,
    change24h: 3.02,
    risk: "Elevated",
    status: "Rebalancing",
    strategy: {
      name: "Market Maker Alpha",
      status: "Rebalancing",
      risk: "Elevated",
      style: "Inventory-aware quoting with adaptive spread bands.",
      performanceFee: 10,
    },
    allocation: [
      { asset: "ASCEND", percentage: 47.5 },
      { asset: "USDC", percentage: 52.5 },
    ],
    stats: {
      totalAssets: 27484.91,
      totalShares: 25760.02,
      sharePrice: 1.0669,
      depositors: 12,
      apy: 21.63,
      perf30d: 8.71,
    },
    activity: makeActivity([
      ["Deposit", "8,000.00 USDC", "0x2f74a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2", "18m ago"],
      ["Withdrawal", "1,900.00 ASCEND", "0x8b36d4f2a0c8e6b4d2f0a8c6e4b2d0f8a6c4e2d0", "3h ago"],
      ["Deposit", "6,400.00 ASCEND", "0x6d18e2a4c6b8d0f2e4a6c8d0b2f4e6a8c0d2f4b6", "12h ago"],
    ]),
    contract: {
      vaultAddress: "0xa6c8d0e2f4b6c8d0e2f4a6c8d0e2f4a6b8c0d2e4f6",
      underlyingAddress: "0xb4c6d8e0f2a4b6c8d0e2f4a6c8d0e2f4a6c8d0e2",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(71, 114.9, 0.008),
  },
  {
    id: "usdc-single",
    name: "USDC",
    assets: ["USDC"],
    type: "Single-Sided",
    description:
      "Single-sided USDC vault deployed into stable basis strategies.",
    tvl: 19850,
    apy: 6.94,
    change24h: 0.11,
    risk: "Low",
    status: "Paused",
    strategy: {
      name: "Stable Spread Harvester",
      status: "Paused",
      risk: "Low",
      style: "Tight-spread quoting across pegged assets.",
      performanceFee: 8,
    },
    allocation: [{ asset: "USDC", percentage: 100 }],
    stats: {
      totalAssets: 19850.0,
      totalShares: 19850.0,
      sharePrice: 1.0,
      depositors: 9,
      apy: 6.94,
      perf30d: 1.58,
    },
    activity: makeActivity([
      ["Deposit", "5,000.00 USDC", "0x0c58f6a8d0e2b4c6d8e0f2a4c6b8d0e2f4a6c8d0", "2d ago"],
      ["Withdrawal", "1,500.00 USDC", "0xb924c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8c0", "2d ago"],
      ["Deposit", "10,000.00 USDC", "0x3e61b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2", "3d ago"],
    ]),
    contract: {
      vaultAddress: "0xc8d0e2f4a6b8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8",
      underlyingAddress: "0xd2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0",
      network: "Elysium Testnet",
      status: "Not yet deployed",
      standard: "ERC-4626",
    },
    performance: buildPerformanceSeries(89, 102.1, 0.0008),
  },
];

/* --------------------------------------------------------------------------
 * ⚠️ MOCK STRATEGIES — placeholder strategy marketplace entries. ⚠️
 * ------------------------------------------------------------------------ */

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "market-maker-alpha",
    name: "Market Maker Alpha",
    description: "Inventory-aware market making for volatile pairs.",
    return30d: 9.6,
    tvlManaged: 111775,
    risk: "Moderate",
    performanceFee: 10,
    vaultCount: 2,
    vaultIds: ["ascend-hype", "ascend-usdc"],
    status: "Active",
  },
  {
    id: "stable-spread-harvester",
    name: "Stable Spread Harvester",
    description: "Tight-spread quoting across pegged asset pairs.",
    return30d: 2.9,
    tvlManaged: 162690,
    risk: "Low",
    performanceFee: 8,
    vaultCount: 2,
    vaultIds: ["usdc-usdt", "usdc-single"],
    status: "Active",
  },
  {
    id: "momentum-rotation",
    name: "Momentum Rotation",
    description:
      "Concentrates inventory into trending assets with strict risk caps.",
    return30d: 5.1,
    tvlManaged: 61402,
    risk: "Moderate",
    performanceFee: 12,
    vaultCount: 1,
    vaultIds: ["hype-single"],
    status: "Active",
  },
  {
    id: "range-grid-v2",
    name: "Range Grid v2",
    description: "Laddered orders that harvest range-bound volatility.",
    return30d: 1.8,
    tvlManaged: 38910,
    risk: "Moderate",
    performanceFee: 10,
    vaultCount: 1,
    vaultIds: ["eth-usdc"],
    status: "Paused",
  },
];

/* --------------------------------------------------------------------------
 * ⚠️ MOCK PROTOCOL METRICS — TVL / active vault count are derived from the
 * mock vault list above; 24h volume is a standalone invented number. ⚠️
 * ------------------------------------------------------------------------ */

export const MOCK_PROTOCOL_METRICS = {
  totalValueLocked: MOCK_VAULTS.reduce((sum, v) => sum + v.tvl, 0),
  activeVaults: MOCK_VAULTS.filter((v) => v.status !== "Paused").length,
  volume24h: 1842300, // invented standalone figure — replace with indexer data
  averageApy:
    MOCK_VAULTS.reduce((sum, v) => sum + v.apy * v.tvl, 0) /
    MOCK_VAULTS.reduce((sum, v) => sum + v.tvl, 0),
};

/** Landing page highlights three representative mock vaults. */
export const FEATURED_VAULT_IDS = ["ascend-hype", "usdc-usdt", "hype-single"];

/* --------------------------------------------------------------------------
 * ⚠️ MOCK PORTFOLIO — two placeholder wallets used to demonstrate the UI's
 * connected states. No wallet connection exists yet. ⚠️
 * ------------------------------------------------------------------------ */

export const MOCK_PORTFOLIO_SUMMARY: PortfolioSummaryData = {
  totalValue: 47728.14,
  totalPnl: 2228.14,
  pnl24h: 214.37,
  activePositions: 3,
};

export const MOCK_POSITIONS: Position[] = [
  {
    vaultId: "ascend-hype",
    vaultName: "ASCEND / HYPE",
    vaultType: "Volatile",
    deposited: 12500,
    currentValue: 13412.8,
    pnl: 912.8,
    pnlPercent: 7.3,
    apy: 18.42,
    shares: 12031.55,
  },
  {
    vaultId: "usdc-usdt",
    vaultName: "USDC / USDT",
    vaultType: "Stable",
    deposited: 25000,
    currentValue: 25684.1,
    pnl: 684.1,
    pnlPercent: 2.74,
    apy: 8.21,
    shares: 24586.9,
  },
  {
    vaultId: "hype-single",
    vaultName: "HYPE",
    vaultType: "Single-Sided",
    deposited: 8000,
    currentValue: 8631.24,
    pnl: 631.24,
    pnlPercent: 7.89,
    apy: 14.87,
    shares: 7646.1,
  },
];

export const MOCK_PORTFOLIO_SUMMARY_EMPTY: PortfolioSummaryData = {
  totalValue: 0,
  totalPnl: 0,
  pnl24h: 0,
  activePositions: 0,
};


