/**
 * AscendMM — domain types.
 *
 * These interfaces describe the data the UI needs. In a later phase they will be
 * populated by contract reads (ERC-4626 vaults), an indexer/API, and wallet state
 * instead of the values in `src/lib/mock-data.ts`. Components should accept these
 * types as props — never import mock values directly.
 */

export type VaultType = "Volatile" | "Stable" | "Single-Sided";

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export type StrategyStatus = "Active" | "Rebalancing" | "Paused";

export interface VaultAllocationSlice {
  /** Asset symbol, e.g. "USDC" */
  asset: string;
  /** Percentage of vault TVL allocated to the asset (0–100) */
  percentage: number;
}

export interface VaultActivityItem {
  id: string;
  type: "Deposit" | "Withdrawal";
  /** Formatted amount string, e.g. "5,000.00 USDC" */
  amount: string;
  /** Shortened mock address, e.g. "0x3f9c…a21b" */
  address: string;
  /** Relative time label, e.g. "4m ago" */
  time: string;
}

export interface VaultContractInfo {
  /** Mock vault proxy address (placeholder until contracts deploy) */
  vaultAddress: string;
  /** Mock underlying asset address (placeholder until contracts deploy) */
  underlyingAddress: string;
  /** Human-readable network label */
  network: string;
  /** Contract deployment status for the current phase */
  status: string;
  /** Intended vault standard */
  standard: string;
}

export interface VaultStrategySummary {
  name: string;
  status: StrategyStatus;
  risk: RiskLevel;
  /** Management style description */
  style: string;
  /** Performance fee in percent */
  performanceFee: number;
}

export interface PerformancePoint {
  /** Day index within the series */
  day: number;
  /** Date label, e.g. "Aug 4" */
  label: string;
  /** Normalized index value (100 = series start) */
  value: number;
}

export interface VaultStats {
  totalAssets: number;
  totalShares: number;
  sharePrice: number;
  depositors: number;
  apy: number;
  perf30d: number;
}

export interface Vault {
  id: string;
  name: string;
  /** Asset symbols held by the vault, e.g. ["ASCEND", "HYPE"] */
  assets: string[];
  type: VaultType;
  /** Short one-line description of the vault's mandate */
  description: string;
  tvl: number;
  apy: number;
  change24h: number;
  risk: RiskLevel;
  status: StrategyStatus;
  strategy: VaultStrategySummary;
  allocation: VaultAllocationSlice[];
  stats: VaultStats;
  activity: VaultActivityItem[];
  contract: VaultContractInfo;
  /** Deterministic mock performance series (index, 100 = start) */
  performance: PerformancePoint[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  /** 30-day return in percent */
  return30d: number;
  /** Total TVL managed by the strategy */
  tvlManaged: number;
  risk: RiskLevel;
  /** Performance fee in percent */
  performanceFee: number;
  /** Number of vaults allocated to this strategy */
  vaultCount: number;
  /** IDs of vaults running this strategy */
  vaultIds: string[];
  status: StrategyStatus;
}

export interface Position {
  vaultId: string;
  vaultName: string;
  vaultType: VaultType;
  deposited: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  apy: number;
  shares: number;
}

export interface PortfolioSummaryData {
  totalValue: number;
  totalPnl: number;
  pnl24h: number;
  activePositions: number;
}
