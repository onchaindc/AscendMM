import { createPublicClient, http, getAddress, parseAbiItem, formatUnits } from "viem";

// Phase 2F probe: verify the vault event set exists on-chain, count events,
// reconstruct cumulative asset/share totals from real logs, and validate the
// reconstruction against the live vault state at the tip. Read-only.

const rpc = "https://testnet-rpc.elysium.kinetiq.xyz";
const client = createPublicClient({ transport: http(rpc) });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const paced = async (label, fn) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const result = await fn();
      await sleep(450);
      return result;
    } catch (error) {
      const message = String(error?.details ?? error?.shortMessage ?? error);
      if (/rate limit/i.test(message) && attempt < 5) {
        console.log(`rate-limited on ${label}, retrying (${attempt}/4)…`);
        await sleep(4000 * attempt);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`unreachable: ${label}`);
};

const DEPOSIT = parseAbiItem("event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)");
const WITHDRAW = parseAbiItem("event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)");
const INVEST = parseAbiItem("event StrategyInvested(address indexed strategy, uint256 assets)");
const DIVEST = parseAbiItem("event StrategyDivested(address indexed strategy, uint256 assets)");
const HYPE_INVEST = parseAbiItem("event HypeStrategyInvested(address indexed strategy, uint256 assets)");
const HYPE_DIVEST = parseAbiItem("event HypeStrategyDivested(address indexed strategy, uint256 assets)");

const VAULTS = [
  {
    label: "HYPE vault",
    address: "0x8C68b40C6c553b41824F6F8d5E995FCBf809B2e7",
    assetDecimals: 18,
    shareDecimals: 21,
    native: true,
    invest: HYPE_INVEST,
    divest: HYPE_DIVEST,
  },
  {
    label: "asMMT vault",
    address: "0xa49Ef74F7de5022340bE2f7DeD7bD2c54b344480",
    assetDecimals: 18,
    shareDecimals: 18,
    native: false,
    asset: "0xaeB1Eb6928a1980830eEAE86e70CF751f0D4CEd6",
    invest: INVEST,
    divest: DIVEST,
  },
];

const vaultAbi = [
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "strategyInvested", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "convertToAssets", stateMutability: "view", inputs: [{ name: "shares", type: "uint256" }], outputs: [{ type: "uint256" }] },
];
const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "who", type: "address" }], outputs: [{ type: "uint256" }] },
];

const latest = await paced("latest block", () => client.getBlockNumber());
console.log("latest block:", String(latest));

const blockCache = new Map();
const blockTime = async (n) => {
  if (blockCache.has(n)) return blockCache.get(n);
  const block = await paced(`block ${n}`, () => client.getBlock({ blockNumber: n }));
  blockCache.set(n, block.timestamp);
  return block.timestamp;
};

let failures = 0;
for (const v of VAULTS) {
  console.log(`\n=== ${v.label} ${v.address} ===`);
  const deposits = await paced("Deposit logs", () =>
    client.getLogs({ address: v.address, event: DEPOSIT, fromBlock: 0n, toBlock: latest }));
  const withdrawals = await paced("Withdraw logs", () =>
    client.getLogs({ address: v.address, event: WITHDRAW, fromBlock: 0n, toBlock: latest }));
  const invests = await paced("invest logs", () =>
    client.getLogs({ address: v.address, event: v.invest, fromBlock: 0n, toBlock: latest }));
  const divests = await paced("divest logs", () =>
    client.getLogs({ address: v.address, event: v.divest, fromBlock: 0n, toBlock: latest }));
  console.log(`deposits=${deposits.length} withdrawals=${withdrawals.length} invests=${invests.length} divests=${divests.length}`);
  const all = [
    ...deposits.map((l) => ({ kind: "deposit", l })),
    ...withdrawals.map((l) => ({ kind: "withdraw", l })),
    ...invests.map((l) => ({ kind: "invest", l })),
    ...divests.map((l) => ({ kind: "divest", l })),
  ].sort((a, b) => Number(a.l.blockNumber - b.l.blockNumber) || a.l.logIndex - b.l.logIndex);

  if (all.length > 0) {
    console.log(`event range: block ${String(all[0].l.blockNumber)} → ${String(all[all.length - 1].l.blockNumber)} (${all.length} total events)`);
  }

  // Sequential reconstruction from real events (gross assets per ERC-4626).
  let assets = 0n;
  let shares = 0n;
  const points = [];
  for (const { kind, l } of all) {
    if (kind === "deposit") { assets += l.args.assets; shares += l.args.shares; }
    if (kind === "withdraw") { assets -= l.args.assets; shares -= l.args.shares; }
    points.push({
      block: l.blockNumber,
      kind,
      assets,
      shares,
      owner: l.args.owner ?? l.args.sender,
      tx: l.transactionHash,
    });
  }

  // Strategy ledger reconstruction.
  let invested = 0n;
  for (const { kind, l } of all) {
    if (kind === "invest") invested += l.args.assets;
    if (kind === "divest") invested -= l.args.assets;
  }

  // Live tip reads for validation.
  const liveTotalAssets = await paced("totalAssets", () => client.readContract({ address: v.address, abi: vaultAbi, functionName: "totalAssets" }));
  const liveTotalSupply = await paced("totalSupply", () => client.readContract({ address: v.address, abi: vaultAbi, functionName: "totalSupply" }));
  const liveInvested = await paced("strategyInvested", () => client.readContract({ address: v.address, abi: vaultAbi, functionName: "strategyInvested" }));
  const liveIdle = v.native
    ? (await paced("getBalance", () => client.getBalance({ address: v.address })))
    : (await paced("asset balanceOf", () => client.readContract({ address: v.asset, abi: erc20Abi, functionName: "balanceOf", args: [v.address] })));

  const fmt = (x, d) => formatUnits(x, d);
  console.log(`reconstructed: assets=${fmt(assets, v.assetDecimals)} shares=${fmt(shares, v.shareDecimals)} invested=${fmt(invested, v.assetDecimals)}`);
  console.log(`live tip:      totalAssets=${fmt(liveTotalAssets, v.assetDecimals)} totalSupply=${fmt(liveTotalSupply, v.shareDecimals)} invested=${fmt(liveInvested, v.assetDecimals)} idle=${fmt(liveIdle, v.assetDecimals)}`);

  const assetsOk = assets === liveTotalAssets;
  const sharesOk = shares === liveTotalSupply;
  const investedOk = invested === liveInvested;
  console.log(`validation: assets=${assetsOk ? "MATCH" : "MISMATCH"} shares=${sharesOk ? "MATCH" : "MISMATCH"} invested=${investedOk ? "MATCH" : "MISMATCH"}`);
  if (!assetsOk || !sharesOk) failures += 1;

  const tip = points[points.length - 1];
  if (tip) {
    const ts = await blockTime(tip.block);
    console.log(`last event: ${tip.kind} block ${String(tip.block)} ts=${String(ts)} tx=${tip.tx} owner=${tip.owner}`);
  }

  // Show a sample of activity with decoded args (honesty check on decoding).
  for (const { kind, l } of all.slice(0, 4)) {
    console.log(`  ${kind} blk=${String(l.blockNumber)} assets=${fmt(l.args.assets ?? 0n, v.assetDecimals)} shares=${fmt(l.args.shares ?? 0n, v.shareDecimals)} owner=${l.args.owner ?? "-"} tx=${l.transactionHash?.slice(0, 18)}…`);
  }
}

console.log(failures === 0 ? "\nEVENT_PROBE_OK" : `\nEVENT_PROBE_VALIDATION_FAILURES=${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
