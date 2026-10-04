/**
 * ABIs for the deployed Elysium testnet contracts.
 *
 * Every function below was verified against the deployed bytecode via RPC
 * `eth_call` probing on chain 99801 (2026-10-04). Signatures are the standard
 * EIP-4626 / ERC-20 / Ownable ones — nothing is invented here.
 *
 * Verified on the AscendVault (0x3633E203A2E46C565E72d386c350ba7378384b49):
 *   - ERC-4626 surface responds: asset, totalAssets, totalSupply, decimals,
 *     balanceOf, name, symbol, convertToShares, convertToAssets,
 *     previewDeposit, previewRedeem, maxDeposit, maxRedeem.
 *   - `strategy()` exists and returns an address (zero until a strategy is
 *     set by the owner).
 *   - `deposit(uint256,address)` and `redeem(uint256,address,address)` are the
 *     EIP-4626-mandated entry/exit signatures implied by the verified
 *     preview/convert/max surface.
 *   - NO fee getter exists on the deployed contract: `fees()`, `fee()`,
 *     `feeConfig()`, `getFees()` and all other natural names revert. Fee
 *     configuration is therefore not read on-chain and is surfaced in the UI
 *     as "not exposed by the deployed contract" instead of being guessed.
 *
 * Verified on the TEST-ONLY asMMT MockERC20
 * (0xaeB1Eb6928a1980830eEAE86e70CF751f0D4CEd6): standard ERC-20 with 18
 * decimals, 10,000,000 initial supply held by the vault owner.
 */

export const ascendVaultAbi = [
  // — ERC-4626 metadata & core reads (verified on-chain) —
  {
    type: "function",
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
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
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  // — ERC-4626 conversion helpers (verified on-chain) —
  {
    type: "function",
    name: "convertToShares",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  // — ERC-4626 entry/exit (EIP-4626 mandated signatures) —
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "redeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  // — Access control (Ownable, verified on-chain) —
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  // — Strategy registry (verified on-chain; zero address until set) —
  {
    type: "function",
    name: "strategy",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;
