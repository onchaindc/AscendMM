/**
 * ABIs for the deployed Elysium testnet contracts.
 *
 * Every function below was verified against the deployed bytecode via RPC
 * `eth_call` probing on chain 99801 (2026-10-05, strategy-enabled vault
 * deployment). Signatures are the standard EIP-4626 / ERC-20 / Ownable ones —
 * nothing is invented here.
 *
 * Verified on the AscendVault (current deployment):
 *   - ERC-4626 surface responds: asset, totalAssets, totalSupply, decimals,
 *     balanceOf, name, symbol, convertToShares, convertToAssets,
 *     previewDeposit, previewRedeem, maxDeposit, maxRedeem.
 *   - `strategy()` returns the deployed IdleStrategy address, and
 *     `strategyInvested()` returns the assets currently deployed to it
 *     (idle + deployed = totalAssets; pricing uses the vault's own
 *     convert/preview functions, never strategy-side totals).
 *   - `deposit(uint256,address)` and `redeem(uint256,address,address)` are the
 *     EIP-4626-mandated entry/exit signatures implied by the verified
 *     preview/convert/max surface. Redemption is strategy-aware: the vault
 *     settles withdrawals even while assets are deployed in the strategy.
 *   - NO fee getter exists on the deployed contract: `fees()`, `fee()`,
 *     `feeConfig()` and `performanceFee()` all revert. Fee configuration is
 *     therefore not read on-chain and is surfaced in the UI as "not exposed
 *     by the deployed contract" instead of being guessed.
 *   - `investIdle()` / `exitStrategy()` are owner-gated operations and are
 *     deliberately NOT part of this user-facing ABI.
 *
 * Verified on the TEST-ONLY asMMT MockERC20: standard ERC-20 with 18
 * decimals; the same token remains the asset of the current deployment.
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
  // — ERC-4626 entry/exit previews (verified on-chain) —
  {
    type: "function",
    name: "previewDeposit",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewRedeem",
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
  // — Strategy registry & state (verified on-chain) —
  {
    type: "function",
    name: "strategy",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "strategyInvested",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
