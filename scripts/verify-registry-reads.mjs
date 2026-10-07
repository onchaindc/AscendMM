import { createPublicClient, http, getAddress } from "viem";

// Phase 2E: read-only verification of the deployed AscendMM registries
// against the exact read surface the frontend hooks use
// (src/lib/abis.ts: registryReadsAbi / strategyRegistryReadsAbi).
// Never writes, never signs — pure view calls on chain 99801.

const rpc = "https://testnet-rpc.elysium.kinetiq.xyz";
const client = createPublicClient({ transport: http(rpc) });

const ZERO = "0x0000000000000000000000000000000000000000";

const VAULTS = [
  "0x8C68b40C6c553b41824F6F8d5E995FCBf809B2e7", // HYPE vault
  "0xa49Ef74F7de5022340bE2f7DeD7bD2c54b344480", // asMMT vault
];
const STRATEGIES = [
  "0x5bC48661a4CD27FF226295e3D226c11E7C06Ed97", // HypeIdleStrategy
  "0xE6662124835F0927245697459fd90e77ac58329a", // IdleStrategy
];

const addressListAbi = [
  { type: "function", name: "allVaults", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "allStrategies", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "vaultCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "strategyCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "RISK_LOW", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
];

const vaultEntryAbi = [
  {
    type: "function",
    name: "getVault",
    stateMutability: "view",
    inputs: [{ name: "vault", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "vault", type: "address" },
          { name: "asset", type: "address" },
          { name: "active", type: "bool" },
          { name: "vaultType", type: "bytes32" },
          { name: "strategy", type: "address" },
          { name: "riskClass", type: "bytes32" },
          { name: "metadata", type: "bytes32" },
        ],
      },
    ],
  },
];

const boolAbi = (name, inputName) => [
  { type: "function", name, stateMutability: "view", inputs: [{ name: inputName, type: "address" }], outputs: [{ type: "bool" }] },
];

const strategyEntryAbi = [
  {
    type: "function",
    name: "getStrategy",
    stateMutability: "view",
    inputs: [{ name: "strategy", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "strategy", type: "address" },
          { name: "vault", type: "address" },
          { name: "asset", type: "address" },
          { name: "active", type: "bool" },
          { name: "strategyType", type: "bytes32" },
          { name: "riskClass", type: "bytes32" },
          { name: "version", type: "bytes32" },
          { name: "label", type: "string" },
        ],
      },
    ],
  },
];

const chainId = await client.getChainId();
console.log("chainId:", chainId);

// The public Elysium RPC is rate-limited (Conduit). Pace every contract read
// and retry on explicit rate-limit responses instead of failing the probe.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const readPaced = async (params) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const result = await client.readContract(params);
      await sleep(450);
      return result;
    } catch (error) {
      const message = String(error?.details ?? error?.shortMessage ?? error);
      if (/rate limit/i.test(message) && attempt < 5) {
        console.log(`rate-limited on ${params.functionName}, retrying (${attempt}/4)…`);
        await sleep(4000 * attempt);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`unreachable: ${params.functionName}`);
};

// The provided addresses must be normalized to their EIP-55 checksummed form
// (viem rejects non-canonical casing; on-chain identity is the lowercase
// bytes). Any *character* typo would show up below as missing bytecode or a
// reverted call — nothing is invented past that point.
const normalize = (label, value) => {
  const canonical = getAddress(value.toLowerCase());
  if (canonical !== getAddress(value) && value !== canonical) {
    console.log(`NOTE: ${label} normalized ${value} -> ${canonical}`);
  }
  return canonical;
};

const REG_V = normalize("REG_V", "0xEf46f925BCC546ECAB7Dae5DF965E3980fd4B6b8");
const REG_S = normalize("REG_S", "0x14Af880C9d471C00077C9919035574d003D92bFf");

for (const [label, addr] of [
  ["VaultRegistry", REG_V],
  ["StrategyRegistry", REG_S],
]) {
  const code = await client.getBytecode({ address: addr });
  console.log(`${label} ${addr} bytecode present:`, code !== undefined && code !== "0x", code ? `(${code.length} chars)` : "(none)");
  if (!code || code === "0x") {
    console.log(`${label}: NO CONTRACT AT ADDRESS — aborting, nothing invented`);
    process.exitCode = 1;
    process.exit(1);
  }
}

const allVaults = await readPaced({ address: REG_V, abi: addressListAbi, functionName: "allVaults" });
const vaultCount = await readPaced({ address: REG_V, abi: addressListAbi, functionName: "vaultCount" });
const allStrategies = await readPaced({ address: REG_S, abi: addressListAbi, functionName: "allStrategies" });
const strategyCount = await readPaced({ address: REG_S, abi: addressListAbi, functionName: "strategyCount" });
const riskLow = await readPaced({ address: REG_V, abi: addressListAbi, functionName: "RISK_LOW" });

console.log("VaultRegistry.allVaults:", allVaults);
console.log("VaultRegistry.vaultCount:", String(vaultCount));
console.log("StrategyRegistry.allStrategies:", allStrategies);
console.log("StrategyRegistry.strategyCount:", String(strategyCount));
console.log("VaultRegistry.RISK_LOW constant:", riskLow);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log("FAIL:", msg);
};
const check = (label, actual, expected) => {
  const ok = actual === expected;
  if (!ok) fail(`${label} expected ${expected} got ${actual}`);
  console.log(`${ok ? "OK  " : "MISMATCH"} ${label}`);
};

check("vault list contains HYPE vault", allVaults.some((a) => getAddress(a) === VAULTS[0]), true);
check("vault list contains asMMT vault", allVaults.some((a) => getAddress(a) === VAULTS[1]), true);
check("vault list length is 2", allVaults.length === 2, true);
check("vaultCount matches list", String(vaultCount), "2");

check("strategy list contains HypeIdleStrategy", allStrategies.some((a) => getAddress(a) === STRATEGIES[0]), true);
check("strategy list contains IdleStrategy", allStrategies.some((a) => getAddress(a) === STRATEGIES[1]), true);
check("strategy list length is 2", allStrategies.length === 2, true);
check("strategyCount matches list", String(strategyCount), "2");

for (const vault of VAULTS) {
  const entry = await readPaced({ address: REG_V, abi: vaultEntryAbi, functionName: "getVault", args: [vault] });
  const active = await readPaced({ address: REG_V, abi: boolAbi("isActive", "vault"), functionName: "isActive", args: [vault] });
  const registered = await readPaced({ address: REG_V, abi: boolAbi("isRegistered", "vault"), functionName: "isRegistered", args: [vault] });
  console.log(
    `getVault ${vault.slice(0, 10)}… => vault=${entry.vault} asset=${entry.asset} active=${entry.active} ` +
      `vaultType=${entry.vaultType} strategy=${entry.strategy} riskClass=${entry.riskClass} metadata=${entry.metadata} ` +
      `| isActive=${active} isRegistered=${registered}`,
  );

  check(`vault entry roundtrip ${vault}`, getAddress(entry.vault), getAddress(vault));
  check(`vault isActive ${vault}`, active, true);
  check(`vault isRegistered ${vault}`, registered, true);

  if (getAddress(entry.strategy) !== ZERO) {
    // Existing Phase 2C cross-check the UI performs:
    // vaultEntry.strategy -> StrategyRegistry.getStrategy(strategy)
    const sEntry = await readPaced({ address: REG_S, abi: strategyEntryAbi, functionName: "getStrategy", args: [entry.strategy] });
    const sActive = await readPaced({ address: REG_S, abi: boolAbi("isActive", "strategy"), functionName: "isActive", args: [entry.strategy] });
    console.log(
      `  cross-check getStrategy ${entry.strategy} => strategy=${sEntry.strategy} vault=${sEntry.vault} asset=${sEntry.asset} ` +
        `active=${sEntry.active} strategyType=${sEntry.strategyType} riskClass=${sEntry.riskClass} version=${sEntry.version} label=${JSON.stringify(sEntry.label)} | isActive=${sActive}`,
    );
    check(`cross-check strategy roundtrip for ${vault}`, getAddress(sEntry.strategy), getAddress(entry.strategy));
    check(`cross-check strategy boundVault matches ${vault}`, getAddress(sEntry.vault), getAddress(vault));
    check(`cross-check strategy active ${entry.strategy}`, sActive, true);
  }
}

for (const strategy of STRATEGIES) {
  const entry = await readPaced({ address: REG_S, abi: strategyEntryAbi, functionName: "getStrategy", args: [strategy] });
  const active = await readPaced({ address: REG_S, abi: boolAbi("isActive", "strategy"), functionName: "isActive", args: [strategy] });
  const registered = await readPaced({ address: REG_S, abi: boolAbi("isRegistered", "strategy"), functionName: "isRegistered", args: [strategy] });
  console.log(
    `getStrategy ${strategy.slice(0, 10)}… => strategy=${entry.strategy} vault=${entry.vault} asset=${entry.asset} ` +
      `active=${entry.active} strategyType=${entry.strategyType} riskClass=${entry.riskClass} version=${entry.version} ` +
      `label=${JSON.stringify(entry.label)} | isActive=${active} isRegistered=${registered}`,
  );
  check(`strategy entry roundtrip ${strategy}`, getAddress(entry.strategy), getAddress(strategy));
  check(`strategy isActive ${strategy}`, active, true);
  check(`strategy isRegistered ${strategy}`, registered, true);
}

console.log(failures === 0 ? "REGISTRY_PROBE_OK" : `REGISTRY_PROBE_FAILURES=${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
