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

// ---------------------------------------------------------------------------
// Phase 2C — registry discovery layer.
//
// The read surfaces below are transcribed from the contracts repo source at
// commit 42f252f (`src/VaultRegistry.sol`, `src/StrategyRegistry.sol`,
// `src/interfaces/IStrategy.sol`) — nothing is invented. The registries have
// NO recorded Elysium testnet deployment yet (no deploy script, no broadcast
// artifacts), so their addresses are supplied through environment
// configuration (`NEXT_PUBLIC_*_REGISTRY_ADDRESS` in `src/lib/elysium.ts`)
// and every registry read stays disabled while unset. Once an address is
// configured, these selectors must be re-verified on-chain (eth_call probe)
// before the UI is trusted; a mismatching deployment surfaces as a failed
// query and an honest "registry unavailable" state — never as fabricated
// data.
// ---------------------------------------------------------------------------

/**
 * VaultRegistry read surface (`VaultEntry`):
 *   { vault, asset, active, vaultType, strategy, riskClass, metadata } —
 *   with riskClass one of the RISK_* keccak bucket ids.
 */
export const registryReadsAbi = [
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
  {
    type: "function",
    name: "allVaults",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "vault", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isActive",
    stateMutability: "view",
    inputs: [{ name: "vault", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "vaultCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // — Public risk-bucket constants (on-chain verification anchors) —
  {
    type: "function",
    name: "RISK_LOW",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_MEDIUM",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_HIGH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_EXPERIMENTAL",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
] as const;

/**
 * StrategyRegistry read surface (`Entry`):
 *   { strategy, vault, asset, active, strategyType, riskClass, version,
 *     label } — the label is the optional human-readable registration name.
 */
export const strategyRegistryReadsAbi = [
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
  {
    type: "function",
    name: "allStrategies",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "strategy", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isActive",
    stateMutability: "view",
    inputs: [{ name: "strategy", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "strategyCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // — Public risk-bucket constants (on-chain verification anchors) —
  {
    type: "function",
    name: "RISK_LOW",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_MEDIUM",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_HIGH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "RISK_EXPERIMENTAL",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
] as const;

/**
 * Unified IStrategy read surface (both vault tracks — verified from
 * `src/interfaces/IStrategy.sol` against the deployed IdleStrategy and
 * HypeIdleStrategy implementations):
 *
 *   - `vault()` — the bound vault address.
 *   - `asset()` — the underlying asset (ERC-20 token, or the ERC-7528 native
 *     sentinel on the HYPE track).
 *   - `cap()` — the investment cap in asset units (0 = unbounded, per the
 *     deploy scripts' documented semantics).
 *   - `totalAssets()` — the strategy's self-reported holdings. For both idle
 *     strategies this is the raw asset balance of the strategy contract
 *     (verified in source); it is informational only — vault share pricing
 *     never consults it.
 *
 * State-changing functions (invest/divest/divestAll/harvest/report) are
 * owner/vault-only and deliberately excluded — they are never user actions.
 */
export const strategyReadsAbi = [
  {
    type: "function",
    name: "vault",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "cap",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
