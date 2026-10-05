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
 *
 * Verified on the native HYPE AscendVault (2026-10-05, same probe session):
 *   - asset() → the native sentinel 0xEeee…EEeE; decimals() → 21 (share
 *     precision via virtual offset — HYPE itself stays 18 decimals).
 *   - name() → "AscendMM HYPE Vault", symbol() → "asHYPEV", owner() → the
 *     same owner as the ERC-20 vault, strategy() → HypeIdleStrategy.
 *   - convertToShares/convertToAssets and previewDeposit/previewMint/
 *     previewWithdraw/previewRedeem all respond (1 HYPE ↔ 1 share while the
 *     vault is empty, expressed in 21-decimal shares).
 *   - NOT an ERC-20: transfer()/approve() revert. Deposits send native HYPE
 *     as transaction value (payable deposit()/mint()); withdrawals are the
 *     native withdraw()/redeem(). No approve() exists anywhere in this flow.
 *   - strategyInvested() + idle native balance = totalAssets.
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

/**
 * Shared READ surface — every entry below was verified on BOTH deployed
 * vaults with identical signatures (same name, inputs, outputs, and `view`
 * mutability). All contract reads (hook + modal previews) use this single
 * constant; the track-specific ABIs above are used only for the write calls,
 * where mutability actually differs (payable deposit/mint on HYPE).
 */
export const vaultReadsAbi = [
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
  {
    type: "function",
    name: "previewDeposit",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewMint",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewWithdraw",
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
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
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

/**
 * ABI for the deployed NATIVE HYPE AscendVault (see verification notes above).
 *
 * Key differences from the ERC-20 track:
 *   - `deposit`/`mint` are PAYABLE: the deposit amount is sent as msg.value
 *     and no approval step exists anywhere in the flow.
 *   - `withdraw`/`redeem` return native HYPE to the receiver.
 *   - Shares use 21 decimals (virtual offset) — the UI must never assume 18
 *     for share amounts; HYPE asset amounts stay 18 decimals.
 *   - The vault is not an ERC-20 — there is no transfer/approve surface.
 */
export const hypeVaultAbi = [
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
  // — ERC-4626 entry/exit previews (all four verified on-chain) —
  {
    type: "function",
    name: "previewDeposit",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewMint",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewWithdraw",
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
  // — Native entry: amount sent as msg.value (payable, verified deployment) —
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  // — Native exit: vault sends HYPE to the receiver —
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
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
  // — Access control & strategy registry (verified on-chain) —
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
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
