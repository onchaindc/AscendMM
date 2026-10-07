import {
  formatUnits,
  parseAbiItem,
  type Address,
  type PublicClient,
} from "viem";

import type { LiveVaultConfig } from "./elysium";

/**
 * On-chain analytics data layer (Phase 2F).
 *
 * Every value in this module is derived from REAL chain data — event logs
 * emitted by the deployed vaults (verified in the contracts source: OZ
 * ERC-4626 `Deposit`/`Withdraw` on the ERC-20 track, the identical surface
 * declared in `IERC4626Hype` on the native track, plus the per-track
 * strategy allocation events) and live state reads at the tip. Nothing is
 * interpolated, estimated, or fabricated:
 *
 *   - Cumulative asset/share totals are reconstructed by replaying
 *     `Deposit` (+assets, +shares) and `Withdraw` (−assets, −shares) in
 *     block/log order. The ERC-4626 `Withdraw` event reports GROSS assets
 *     (verified in source); with fees at 0 gross equals net.
 *   - Strategy allocation history replays `StrategyInvested` /
 *     `StrategyDivested` (`HypeStrategyInvested` / `HypeStrategyDivested`
 *     on the native track).
 *   - The reconstruction is validated against live reads
 *     (`totalAssets`, `totalSupply`, `strategyInvested`) at the tip. If the
 *     tip does not match — e.g. assets were transferred directly to the
 *     vault, which events cannot see — the historical series is WITHHELD
 *     with a reason instead of being shown inaccurately.
 *   - Metrics that cannot be derived (APY, yield, USD values, performance)
 *     simply do not exist in this layer.
 *
 * RPC discipline: reads are sequential with inter-call pacing and retry on
 * the Elysium RPC's rate-limit responses; results are React-Query cached by
 * the hooks layer. A full history scan is ONE `eth_getLogs` call per event
 * type (address+topic filtered from genesis) — the chain never needs a
 * long-running block scan.
 */

/** Minimal viem-client surface the analytics layer needs. */
export type AnalyticsRpcClient = Pick<
  PublicClient,
  "getLogs" | "getBlock" | "readContract" | "getBalance"
>;

const DEPOSIT_EVENT = parseAbiItem(
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
);
const WITHDRAW_EVENT = parseAbiItem(
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
);
const INVEST_EVENT = parseAbiItem(
  "event StrategyInvested(address indexed strategy, uint256 assets)",
);
const DIVEST_EVENT = parseAbiItem(
  "event StrategyDivested(address indexed strategy, uint256 assets)",
);
const HYPE_INVEST_EVENT = parseAbiItem(
  "event HypeStrategyInvested(address indexed strategy, uint256 assets)",
);
const HYPE_DIVEST_EVENT = parseAbiItem(
  "event HypeStrategyDivested(address indexed strategy, uint256 assets)",
);

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "who", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const VAULT_TIP_ABI = [
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "strategyInvested",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Pacing / retry — the Elysium testnet RPC is rate-limited.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const INTER_CALL_DELAY_MS = 300;
const MAX_RPC_ATTEMPTS = 4;

async function pacedRead<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RPC_ATTEMPTS; attempt += 1) {
    try {
      const result = await run();
      await sleep(INTER_CALL_DELAY_MS);
      return result;
    } catch (error) {
      lastError = error;
      const message = String(
        (error as { details?: string })?.details ??
          (error as { shortMessage?: string })?.shortMessage ??
          error,
      );
      if (/rate limit/i.test(message) && attempt < MAX_RPC_ATTEMPTS) {
        await sleep(1500 * attempt);
        continue;
      }
      break;
    }
  }
  throw new Error(`RPC read failed (${label})`, { cause: lastError });
}

// Block timestamps are fetched once per block and cached across pages.
const blockTimestampCache = new Map<string, bigint>();

async function blockTimestamp(
  client: AnalyticsRpcClient,
  blockNumber: bigint,
): Promise<bigint | undefined> {
  const key = blockNumber.toString();
  const cached = blockTimestampCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const block = await pacedRead(`block ${key}`, () =>
      client.getBlock({ blockNumber }),
    );
    blockTimestampCache.set(key, block.timestamp);
    return block.timestamp;
  } catch {
    // A missing timestamp is cosmetic — activity rows fall back to the
    // block number. Never fail the whole analytics fetch for it.
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export type VaultActivityKind = "deposit" | "withdraw" | "invest" | "divest";

export interface VaultActivityEvent {
  kind: VaultActivityKind;
  blockNumber: bigint;
  /** undefined when the block timestamp could not be fetched (cosmetic). */
  timestamp: bigint | undefined;
  transactionHash: `0x${string}`;
  /** Deposit owner / withdrawal owner (undefined for strategy events). */
  owner: Address | undefined;
  assetsRaw: bigint;
  /** Deposit/withdraw shares; strategy events carry no share amount. */
  sharesRaw: bigint | undefined;
}

export interface VaultHistoryPoint {
  blockNumber: bigint;
  timestamp: bigint | undefined;
  /** Cumulative vault assets after the event (raw asset units). */
  totalAssetsRaw: bigint;
  /** Cumulative share supply after the event (raw share units). */
  totalSharesRaw: bigint;
  /**
   * Asset-raw units per ONE whole share at this point
   * (assets * 10^shareDecimals / shares). undefined while supply is 0.
   */
  assetsPerWholeShareRaw: bigint | undefined;
}

export interface VaultAllocationPoint {
  blockNumber: bigint;
  timestamp: bigint | undefined;
  /** Strategy ledger balance after the event (raw asset units). */
  investedRaw: bigint;
}

export interface VaultAnalyticsState {
  totalAssetsRaw: bigint;
  totalSharesRaw: bigint;
  idleAssetsRaw: bigint;
  strategyAssetsRaw: bigint;
  /** Vault-authoritative price for one whole share (raw asset units). */
  assetsPerWholeShareRaw: bigint;
}

export interface VaultAnalytics {
  state: VaultAnalyticsState;
  /** Chronological on-chain activity (oldest first). */
  events: VaultActivityEvent[];
  history: {
    /**
     * True when the event replay reproduces the live tip state exactly —
     * only then are the derived series rendered.
     */
    validated: boolean;
    /** Why the derived series is withheld (when validation fails). */
    unavailableReason: string | undefined;
    points: VaultHistoryPoint[];
    allocation: VaultAllocationPoint[];
  };
}

// ---------------------------------------------------------------------------
// Fetch + derive
// ---------------------------------------------------------------------------

export async function fetchVaultAnalytics(
  client: AnalyticsRpcClient,
  config: LiveVaultConfig,
): Promise<VaultAnalytics> {
  const isNative = config.kind === "native";
  const vault = config.vaultAddress;
  const investEvent = isNative ? HYPE_INVEST_EVENT : INVEST_EVENT;
  const divestEvent = isNative ? HYPE_DIVEST_EVENT : DIVEST_EVENT;

  const oneShare = 10n ** BigInt(config.shareDecimals);

  // One eth_getLogs per event type, filtered by vault address, from genesis.
  const depositLogs = await pacedRead("deposit logs", () =>
    client.getLogs({
      address: vault,
      event: DEPOSIT_EVENT,
      fromBlock: 0n,
      toBlock: "latest",
    }),
  );
  const withdrawLogs = await pacedRead("withdraw logs", () =>
    client.getLogs({
      address: vault,
      event: WITHDRAW_EVENT,
      fromBlock: 0n,
      toBlock: "latest",
    }),
  );
  const investLogs = await pacedRead("strategy invest logs", () =>
    client.getLogs({
      address: vault,
      event: investEvent,
      fromBlock: 0n,
      toBlock: "latest",
    }),
  );
  const divestLogs = await pacedRead("strategy divest logs", () =>
    client.getLogs({
      address: vault,
      event: divestEvent,
      fromBlock: 0n,
      toBlock: "latest",
    }),
  );

  const events: VaultActivityEvent[] = [
    ...depositLogs.map((log) => ({
      kind: "deposit" as const,
      blockNumber: log.blockNumber,
      timestamp: undefined as bigint | undefined,
      transactionHash: log.transactionHash,
      owner: log.args.owner,
      assetsRaw: log.args.assets ?? 0n,
      sharesRaw: log.args.shares ?? 0n,
    })),
    ...withdrawLogs.map((log) => ({
      kind: "withdraw" as const,
      blockNumber: log.blockNumber,
      timestamp: undefined as bigint | undefined,
      transactionHash: log.transactionHash,
      owner: log.args.owner,
      assetsRaw: log.args.assets ?? 0n,
      sharesRaw: log.args.shares ?? 0n,
    })),
    ...investLogs.map((log) => ({
      kind: "invest" as const,
      blockNumber: log.blockNumber,
      timestamp: undefined as bigint | undefined,
      transactionHash: log.transactionHash,
      owner: undefined as Address | undefined,
      assetsRaw: log.args.assets ?? 0n,
      sharesRaw: undefined,
    })),
    ...divestLogs.map((log) => ({
      kind: "divest" as const,
      blockNumber: log.blockNumber,
      timestamp: undefined as bigint | undefined,
      transactionHash: log.transactionHash,
      owner: undefined as Address | undefined,
      assetsRaw: log.args.assets ?? 0n,
      sharesRaw: undefined,
    })),
  ].sort((a, b) =>
    a.blockNumber === b.blockNumber
      ? 0
      : a.blockNumber < b.blockNumber
        ? -1
        : 1,
  );

  // Timestamps for the (few) distinct event blocks — cached module-level.
  const distinctBlocks = [...new Set(events.map((e) => e.blockNumber))];
  for (const blockNumber of distinctBlocks) {
    const ts = await blockTimestamp(client, blockNumber);
    for (const event of events) {
      if (event.blockNumber === blockNumber) event.timestamp = ts;
    }
  }

  // Sequential reconstruction from real events.
  let assets = 0n;
  let shares = 0n;
  let invested = 0n;
  const points: VaultHistoryPoint[] = [];
  const allocation: VaultAllocationPoint[] = [];

  for (const event of events) {
    switch (event.kind) {
      case "deposit":
        assets += event.assetsRaw;
        shares += event.sharesRaw ?? 0n;
        break;
      case "withdraw":
        assets -= event.assetsRaw;
        shares -= event.sharesRaw ?? 0n;
        break;
      case "invest":
        invested += event.assetsRaw;
        break;
      case "divest":
        invested -= event.assetsRaw;
        break;
    }
    if (event.kind === "deposit" || event.kind === "withdraw") {
      points.push({
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
        totalAssetsRaw: assets,
        totalSharesRaw: shares,
        assetsPerWholeShareRaw:
          shares > 0n ? (assets * oneShare) / shares : undefined,
      });
    } else {
      allocation.push({
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
        investedRaw: invested,
      });
    }
  }

  // Live tip state (vault-authoritative).
  const [liveTotalAssets, liveTotalSupply, liveInvested, priceRaw] = await Promise.all([
    pacedRead("totalAssets", () =>
      client.readContract({
        address: vault,
        abi: VAULT_TIP_ABI,
        functionName: "totalAssets",
      }),
    ),
    pacedRead("totalSupply", () =>
      client.readContract({
        address: vault,
        abi: VAULT_TIP_ABI,
        functionName: "totalSupply",
      }),
    ),
    pacedRead("strategyInvested", () =>
      client.readContract({
        address: vault,
        abi: VAULT_TIP_ABI,
        functionName: "strategyInvested",
      }),
    ),
    pacedRead("convertToAssets(1 share)", () =>
      client.readContract({
        address: vault,
        abi: VAULT_TIP_ABI,
        functionName: "convertToAssets",
        args: [oneShare],
      }),
    ),
  ]);

  // Idle assets: the vault's own asset balance — native HYPE balance for the
  // native track, the underlying ERC-20 balance for the asMMT track.
  const idleRaw = isNative
    ? await pacedRead("vault native balance", () =>
        client.getBalance({ address: vault }),
      )
    : await pacedRead("vault ERC-20 balance", () =>
        client.readContract({
          address: config.assetAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [vault],
        }),
      );

  const validated =
    assets === liveTotalAssets && shares === liveTotalSupply;

  return {
    state: {
      totalAssetsRaw: liveTotalAssets,
      totalSharesRaw: liveTotalSupply,
      idleAssetsRaw: idleRaw,
      strategyAssetsRaw: liveInvested,
      assetsPerWholeShareRaw: priceRaw,
    },
    events,
    history: {
      validated,
      unavailableReason: validated
        ? undefined
        : "Event reconstruction does not match the vault's current on-chain state (assets may have been transferred directly to the vault). The derived history is withheld rather than shown inaccurately.",
      points,
      allocation,
    },
  };
}

export { formatUnits };
