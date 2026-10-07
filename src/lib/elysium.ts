/**
 * Elysium Testnet (chain 99801) — central network + deployed-contract config.
 *
 * Single source of truth for the Kinetiq Elysium testnet integration. The
 * addresses below are the deployed testnet contracts — the strategy-enabled
 * ERC-20 (asMMT) vault and the native HYPE vault — and are pinned to the
 * current deployments in the contracts repo; they must not be changed here.
 *
 * Network facts verified against the live RPC (2026-10-05):
 *   - eth_chainId → 99801 (0x185d9)
 *   - Native gas token: HYPE (18 decimals)
 *   - Block explorer: https://elysium.kinetiq.xyz/testnet-explorer
 *   - The RPC serves permissive CORS, so direct browser reads work.
 */

import { getAddress, type Address, type Chain } from "viem";

export const ELYSIUM_CHAIN_ID = 99801;

export const ELYSIUM_RPC_URL = "https://testnet-rpc.elysium.kinetiq.xyz";

export const ELYSIUM_NETWORK_LABEL = "Elysium Testnet";

export const ELYSIUM_EXPLORER_URL = "https://elysium.kinetiq.xyz/testnet-explorer";

/** Native gas currency of Elysium. */
export const ELYSIUM_NATIVE_CURRENCY = {
  name: "HYPE",
  symbol: "HYPE",
  decimals: 18,
} as const;

/** viem chain definition for Elysium testnet. */
export const elysiumTestnet = {
  id: ELYSIUM_CHAIN_ID,
  name: ELYSIUM_NETWORK_LABEL,
  testnet: true,
  nativeCurrency: ELYSIUM_NATIVE_CURRENCY,
  rpcUrls: {
    default: { http: [ELYSIUM_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Elysium Explorer",
      url: ELYSIUM_EXPLORER_URL,
      apiUrl: "",
    },
  },
} as const satisfies Chain;

/**
 * Deployed AscendVault (ERC-4626, ERC-20 asMMT asset) on Elysium testnet —
 * the strategy-enabled ERC-20 track. Verified on-chain (2026-10-05):
 * asset() → the TEST-ONLY asMMT MockERC20, strategy() → STRATEGY_ADDRESS,
 * owner() → VAULT_OWNER_ADDRESS, decimals() → 18, and strategyInvested(),
 * previewDeposit()/previewRedeem() all respond.
 */
export const ASCEND_VAULT_ADDRESS = getAddress(
  "0xa49Ef74F7de5022340bE2f7DeD7bD2c54b344480",
);

/**
 * The vault's deployed strategy contract (IdleStrategy), verified on-chain via
 * strategy(). It holds idle assets without deploying them and generates NO
 * yield — the UI must always label it as a no-yield strategy.
 */
export const STRATEGY_ADDRESS = getAddress(
  "0xE6662124835F0927245697459fd90e77ac58329a",
);

/**
 * TEST-ONLY MockERC20 underlying asset ("asMMT" / "AscendMM Test Asset").
 * This is a mock token deployed purely for testnet integration — it has no
 * value and must always be labeled as TEST-ONLY in the UI.
 */
export const ASMMT_TOKEN_ADDRESS = getAddress(
  "0xaeB1Eb6928a1980830eEAE86e70CF751f0D4CEd6",
);

/** Owner/deployer of the AscendVault (verified via owner() on-chain). */
export const VAULT_OWNER_ADDRESS = getAddress(
  "0x550C5DDab8f8D5b57275db3048d9D327Ea748D1b",
);

// ---------------------------------------------------------------------------
// Native HYPE vault — second live deployment (verified on-chain 2026-10-05)
// ---------------------------------------------------------------------------

/**
 * Deployed native HYPE AscendVault on Elysium testnet. Verified on-chain:
 * asset() → NATIVE_ASSET_SENTINEL (0xEeee…EEeE), decimals() → 21 (share
 * precision via virtual offset — HYPE itself stays 18), name() →
 * "AscendMM HYPE Vault", symbol() → "asHYPEV", strategy() →
 * HYPE_STRATEGY_ADDRESS, and all convert/preview functions respond. The vault
 * is NOT an ERC-20: transfer()/approve() revert. Deposits carry native HYPE
 * as transaction value (payable deposit()/mint()) — no approval exists in
 * this flow.
 */
export const HYPE_VAULT_ADDRESS = getAddress(
  "0x8C68b40C6c553b41824F6F8d5E995FCBf809B2e7",
);

/**
 * The HYPE vault's deployed strategy contract (HypeIdleStrategy), verified
 * on-chain via strategy(). Like the ERC-20 vault's IdleStrategy it holds
 * assets idle and generates NO yield — always labeled as a no-yield strategy.
 */
export const HYPE_STRATEGY_ADDRESS = getAddress(
  "0x5bC48661a4CD27FF226295e3D226c11E7C06Ed97",
);

/**
 * Canonical native-asset sentinel returned by the HYPE vault's asset(). This
 * is a convention address — HYPE is never treated as an ERC-20 in this app.
 */
export const NATIVE_ASSET_SENTINEL = getAddress(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
);

/**
 * Share decimals of the native HYPE vault, verified on-chain via decimals().
 * The 21-decimal precision comes from the virtual share offset — never
 * hardcode 18 for HYPE vault shares. HYPE the asset stays 18 decimals.
 */
export const HYPE_SHARE_DECIMALS = 21;

/**
 * The vault page id backed by the deployed ERC-20 (asMMT) testnet vault. Its
 * on-chain state is read live; preview vault entries remain Phase 1
 * placeholders.
 */
export const LIVE_VAULT_ID = "ascend-asmmt-testnet";

/** The vault page id backed by the deployed native HYPE vault. */
export const HYPE_VAULT_ID = "hype-native-testnet";

// ---------------------------------------------------------------------------
// Live vault registry — both deployed testnet tracks
// ---------------------------------------------------------------------------

export type LiveVaultKind = "erc20" | "native";

/**
 * Per-vault integration config for a deployed testnet vault. Everything the
 * reads/writes hooks and the UI need to talk to one live vault without
 * hardcoding asset/share symbols or decimals anywhere else.
 */
export interface LiveVaultConfig {
  id: string;
  kind: LiveVaultKind;
  vaultAddress: Address;
  strategyAddress: Address;
  /** Underlying asset address: the token contract, or the native sentinel. */
  assetAddress: Address;
  /** Asset symbol as held by the wallet (HYPE native balance / asMMT). */
  assetSymbol: string;
  /** Vault share symbol (verified on-chain via symbol()). */
  shareSymbol: string;
  /** Decimals for parsing/formatting the ASSET (18 for both tracks). */
  assetDecimals: number;
  /** Share decimals (verified on-chain: 21 for HYPE, 18 for asMMT). */
  shareDecimals: number;
  /** Human label for the underlying asset row. */
  assetLabel: string;
  /** On-chain vault name (verified via name()). */
  vaultName: string;
}

/** The ERC-20/asMMT live vault configuration. */
export const ASMMT_VAULT_CONFIG: LiveVaultConfig = {
  id: LIVE_VAULT_ID,
  kind: "erc20",
  vaultAddress: ASCEND_VAULT_ADDRESS,
  strategyAddress: STRATEGY_ADDRESS,
  assetAddress: ASMMT_TOKEN_ADDRESS,
  assetSymbol: "asMMT",
  shareSymbol: "asMMV",
  assetDecimals: 18,
  shareDecimals: 18,
  assetLabel: "asMMT (TEST-ONLY)",
  vaultName: "AscendMM Vault",
};

/** The native HYPE live vault configuration. */
export const HYPE_VAULT_CONFIG: LiveVaultConfig = {
  id: HYPE_VAULT_ID,
  kind: "native",
  vaultAddress: HYPE_VAULT_ADDRESS,
  strategyAddress: HYPE_STRATEGY_ADDRESS,
  assetAddress: NATIVE_ASSET_SENTINEL,
  assetSymbol: "HYPE",
  shareSymbol: "asHYPEV",
  assetDecimals: 18,
  shareDecimals: HYPE_SHARE_DECIMALS,
  assetLabel: "HYPE (native)",
  vaultName: "AscendMM HYPE Vault",
};

const LIVE_VAULT_CONFIGS: Record<string, LiveVaultConfig> = {
  [LIVE_VAULT_ID]: ASMMT_VAULT_CONFIG,
  [HYPE_VAULT_ID]: HYPE_VAULT_CONFIG,
};

/** Config for a live vault id, or undefined for preview/mock vault ids. */
export function getLiveVaultConfig(id: string): LiveVaultConfig | undefined {
  return LIVE_VAULT_CONFIGS[id];
}

/** True when the vault id maps to a deployed testnet contract. */
export function isLiveVaultId(id: string): boolean {
  return id === LIVE_VAULT_ID || id === HYPE_VAULT_ID;
}

// ---------------------------------------------------------------------------
// Registries — Phase 2C discovery layer (env-configurable, never invented)
// ---------------------------------------------------------------------------

/**
 * The contracts repo (commit 42f252f) ships `VaultRegistry` and
 * `StrategyRegistry` as bookkeeping-only discovery layers, but NEITHER has a
 * recorded Elysium testnet deployment: the repo contains no registry deploy
 * script and no broadcast artifacts, so no trustworthy address exists yet.
 *
 * Per the integration ground rules these addresses are therefore supplied
 * through environment configuration and are NEVER invented here:
 *
 *   - NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS
 *   - NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS
 *
 * When unset (or malformed) the value is `undefined` and every registry-driven
 * UI surface degrades gracefully: discovery falls back to the two verified
 * deployed vaults read directly from chain 99801, and registry-specific rows
 * render an honest "registry not configured" state instead of fabricated
 * metadata.
 */

/**
 * Parses an optional checksummed address from the environment. Empty or
 * malformed values disable the corresponding registry integration (with a
 * console warning) rather than throwing — a typo must never take down the app.
 */
function parseOptionalAddress(raw: string | undefined): Address | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  try {
    return getAddress(trimmed);
  } catch {
    console.warn(
      `[elysium] Ignoring malformed registry address in environment: "${trimmed}"`,
    );
    return undefined;
  }
}

/**
 * Deployed VaultRegistry address (owner-controlled vault directory: asset,
 * active flag, vault type, strategy, risk class, metadata/version). Set
 * `NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS` to enable registry-driven vault
 * discovery; `undefined` keeps discovery on direct vault reads only.
 */
export const VAULT_REGISTRY_ADDRESS = parseOptionalAddress(
  process.env.NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS,
);

/**
 * Deployed StrategyRegistry address (owner-controlled strategy allowlist:
 * vault binding, asset, active flag, strategy type, risk class, version,
 * human-readable label). Set `NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS` to
 * enable registry-driven strategy discovery; `undefined` keeps strategy
 * discovery on direct strategy-contract reads only.
 */
export const STRATEGY_REGISTRY_ADDRESS = parseOptionalAddress(
  process.env.NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS,
);

/** True when the VaultRegistry integration is configured for this environment. */
export function isVaultRegistryConfigured(): boolean {
  return VAULT_REGISTRY_ADDRESS !== undefined;
}

/** True when the StrategyRegistry integration is configured for this environment. */
export function isStrategyRegistryConfigured(): boolean {
  return STRATEGY_REGISTRY_ADDRESS !== undefined;
}

/** Explorer URL for a transaction hash on Elysium testnet. */
export function elysiumExplorerTxUrl(txHash: string): string {
  return `${ELYSIUM_EXPLORER_URL}/transaction/${txHash}`;
}

/** Explorer URL for an address on Elysium testnet. */
export function elysiumExplorerAddressUrl(address: string): string {
  return `${ELYSIUM_EXPLORER_URL}/address/${address}`;
}
