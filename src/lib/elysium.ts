/**
 * Elysium Testnet (chain 99801) — central network + deployed-contract config.
 *
 * Single source of truth for the Kinetiq Elysium testnet integration. The
 * addresses below are the deployed testnet contracts and are pinned to the
 * deployment in the contracts repo — they must not be changed here.
 *
 * Network facts verified against the live RPC (2026-10-04):
 *   - eth_chainId → 99801 (0x185d9)
 *   - Native gas token: HYPE (18 decimals)
 *   - Block explorer: https://elysium.kinetiq.xyz/testnet-explorer
 *   - The RPC serves permissive CORS, so direct browser reads work.
 */

import { getAddress, type Chain } from "viem";

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
 * Deployed AscendVault (ERC-4626) on Elysium testnet. Verified on-chain:
 * asset() → the TEST-ONLY asMMT MockERC20, owner() → VAULT_OWNER_ADDRESS,
 * decimals() → 18.
 */
export const ASCEND_VAULT_ADDRESS = getAddress(
  "0x3633E203A2E46C565E72d386c350ba7378384b49",
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

/**
 * The vault page id backed by the deployed testnet contract. Its on-chain
 * state is read live; every other vault entry remains a Phase 1 placeholder.
 */
export const LIVE_VAULT_ID = "ascend-asmmt-testnet";

/** True when the vault id maps to the deployed testnet contract. */
export function isLiveVaultId(id: string): boolean {
  return id === LIVE_VAULT_ID;
}

/** Explorer URL for a transaction hash on Elysium testnet. */
export function elysiumExplorerTxUrl(txHash: string): string {
  return `${ELYSIUM_EXPLORER_URL}/transaction/${txHash}`;
}

/** Explorer URL for an address on Elysium testnet. */
export function elysiumExplorerAddressUrl(address: string): string {
  return `${ELYSIUM_EXPLORER_URL}/address/${address}`;
}
