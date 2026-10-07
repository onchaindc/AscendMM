/**
 * Registry label helpers — Phase 2C discovery layer.
 *
 * Everything here is derived from the verified contract source in the
 * contracts repo (commit 42f252f):
 *
 *   - `VaultRegistry` / `StrategyRegistry` classify entries with four
 *     explicit protocol buckets whose on-chain ids are
 *     `keccak256("RISK_LOW" | "RISK_MEDIUM" | "RISK_HIGH" | "RISK_EXPERIMENTAL")`.
 *     The bucket ids are COMPUTED here with the same keccak-256 primitive
 *     (viem) instead of pasting hex constants — identical, deterministic, and
 *     traceable to the contract source.
 *   - Vault type, strategy type, version, and metadata fields are `bytes32`
 *     identifiers. Where they hold plain text (e.g. `bytes32("V1")`) we decode
 *     it for display; where they hold hashes we show a shortened hex id and
 *     never guess a meaning.
 *
 * No registry state is duplicated or fabricated: these helpers only translate
 * raw on-chain bytes into labels, and return `undefined` when the value does
 * not match a known bucket or printable text.
 */

import { hexToString, keccak256, toBytes, type Hex } from "viem";

import {
  ASMMT_VAULT_CONFIG,
  HYPE_VAULT_CONFIG,
  type LiveVaultConfig,
} from "./elysium";

// ---------------------------------------------------------------------------
// Risk classification buckets (protocol metadata — NOT audited risk ratings)
// ---------------------------------------------------------------------------

/** On-chain bytes32 id of the LOW bucket (keccak256("RISK_LOW")). */
export const RISK_LOW_ID = keccak256(toBytes("RISK_LOW"));
/** On-chain bytes32 id of the MEDIUM bucket (keccak256("RISK_MEDIUM")). */
export const RISK_MEDIUM_ID = keccak256(toBytes("RISK_MEDIUM"));
/** On-chain bytes32 id of the HIGH bucket (keccak256("RISK_HIGH")). */
export const RISK_HIGH_ID = keccak256(toBytes("RISK_HIGH"));
/** On-chain bytes32 id of the EXPERIMENTAL bucket (keccak256("RISK_EXPERIMENTAL")). */
export const RISK_EXPERIMENTAL_ID = keccak256(toBytes("RISK_EXPERIMENTAL"));

/** The four protocol risk buckets, exactly as defined by the registries. */
export type RegistryRiskClass = "LOW" | "MEDIUM" | "HIGH" | "EXPERIMENTAL";

const RISK_BUCKETS_BY_ID: Readonly<Record<Hex, RegistryRiskClass>> = {
  [RISK_LOW_ID]: "LOW",
  [RISK_MEDIUM_ID]: "MEDIUM",
  [RISK_HIGH_ID]: "HIGH",
  [RISK_EXPERIMENTAL_ID]: "EXPERIMENTAL",
};

/**
 * Maps a raw registry `riskClass` bytes32 to one of the four protocol buckets.
 * Returns `undefined` for unknown values — callers must render an honest
 * "unrated/unknown" state, never a guessed classification.
 */
export function registryRiskFromBytes32(
  riskClass: Hex | undefined,
): RegistryRiskClass | undefined {
  if (!riskClass) return undefined;
  return RISK_BUCKETS_BY_ID[riskClass];
}

// ---------------------------------------------------------------------------
// bytes32 decoding for display (vault/strategy type, version, metadata)
// ---------------------------------------------------------------------------

const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Decodes a bytes32 registry identifier to display text when it holds
 * printable ASCII (trailing zero bytes stripped, e.g. `bytes32("V1")` →
 * "V1"). Returns `undefined` for zero values, hashes, and anything
 * non-printable — callers fall back to a shortened hex id.
 */
export function bytes32ToText(value: Hex | undefined): string | undefined {
  if (!value || value === ZERO_BYTES32) return undefined;
  const stripped = value.slice(2).replace(/(00)+$/, "");
  if (stripped === "") return undefined;
  let text: string;
  try {
    text = hexToString(`0x${stripped}` as Hex);
  } catch {
    return undefined;
  }
  // Printable ASCII only — registry identifiers are text or hashes.
  if (!/^[\x20-\x7E]+$/.test(text)) return undefined;
  return text;
}

/**
 * Display label for an opaque bytes32 identifier: decoded text when possible,
 * otherwise a shortened hex id (e.g. `0x1234…abcd`). Returns `undefined` for
 * zero values (callers omit the row).
 */
export function bytes32DisplayLabel(value: Hex | undefined): string | undefined {
  const text = bytes32ToText(value);
  if (text !== undefined) return text;
  if (!value || value === ZERO_BYTES32) return undefined;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Strategy detail routes — frontend slugs for the deployed strategies
// ---------------------------------------------------------------------------

/** Detail-route id for the native HYPE track's HypeIdleStrategy. */
export const HYPE_IDLE_STRATEGY_ID = "hype-idle";

/** Detail-route id for the ERC-20 (asMMT) track's IdleStrategy. */
export const ASMMT_IDLE_STRATEGY_ID = "asmmt-idle";

/**
 * Detail-route id for the Kinetiq kHYPE adapter. The adapter is implemented
 * in the contracts repo (commit 42f252f) but deliberately NOT deployed and
 * NOT registered on Elysium (chain 99801) — kHYPE, the StakingManager and the
 * StakingAccountant have no published Elysium addresses. It is presented as
 * PREPARED / INACTIVE and has no contract address anywhere in this app.
 */
export const KINETIQ_STRATEGY_ID = "kinetiq-khype-lst";

/** Strategy ids with live on-chain contract instances (deployed + bound). */
export const LIVE_STRATEGY_IDS = [
  HYPE_IDLE_STRATEGY_ID,
  ASMMT_IDLE_STRATEGY_ID,
] as const;

export type LiveStrategyId = (typeof LIVE_STRATEGY_IDS)[number];

/**
 * The vault-track config a live strategy detail page operates on. The
 * strategy itself is reached through the track's verified
 * `LiveVaultConfig.strategyAddress` — there is no second source of addresses.
 */
export function getLiveStrategyTrack(id: string): LiveVaultConfig | undefined {
  switch (id) {
    case HYPE_IDLE_STRATEGY_ID:
      return HYPE_VAULT_CONFIG;
    case ASMMT_IDLE_STRATEGY_ID:
      return ASMMT_VAULT_CONFIG;
    default:
      return undefined;
  }
}

/**
 * Reverse mapping: which detail-route id describes a given strategy address.
 * Used to deduplicate registry strategy entries against the known live ones.
 */
export function getLiveStrategyIdForAddress(
  strategyAddress: Hex,
): LiveStrategyId | undefined {
  if (strategyAddress === HYPE_VAULT_CONFIG.strategyAddress) {
    return HYPE_IDLE_STRATEGY_ID;
  }
  if (strategyAddress === ASMMT_VAULT_CONFIG.strategyAddress) {
    return ASMMT_IDLE_STRATEGY_ID;
  }
  return undefined;
}
