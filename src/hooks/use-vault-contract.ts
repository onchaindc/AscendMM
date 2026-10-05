"use client";

import { erc20Abi, zeroAddress, type Address } from "viem";
import { useBalance, useReadContract } from "wagmi";

import { vaultReadsAbi } from "@/lib/abis";
import {
  ELYSIUM_CHAIN_ID,
  type LiveVaultConfig,
} from "@/lib/elysium";

/**
 * Live on-chain reads for one deployed AscendVault on Elysium testnet,
 * selected by its `LiveVaultConfig`:
 *
 *   - `ASMMT_VAULT_CONFIG`  — the ERC-4626 vault holding the TEST-ONLY asMMT
 *     token (user asset balance / allowance are ERC-20 reads).
 *   - `HYPE_VAULT_CONFIG`   — the native HYPE vault (asset = native sentinel;
 *     the wallet's NATIVE HYPE balance is the asset balance; there is no
 *     allowance and no approve() anywhere in the flow).
 *
 * Every read is pinned to chain 99801 (`chainId: ELYSIUM_CHAIN_ID`) so the UI
 * never depends on whichever network the connected wallet happens to have
 * active — data is always read through the public Elysium testnet RPC.
 *
 * Strategy-aware accounting: idleAssets = the vault's own asset balance
 * (ERC-20 balanceOf, or the native balance for the HYPE track),
 * deployedAssets = strategyInvested(), and idle + deployed = totalAssets.
 * Pricing always comes from the vault's own convert/preview functions —
 * never from strategy-side totals.
 *
 * Share precision comes from the vault's decimals(): 18 for the asMMT track,
 * **21 for the native HYPE track (virtual offset)** — callers must format
 * share amounts with `config.shareDecimals`, never a hardcoded 18.
 *
 * User-scoped reads (balances/asset value) are disabled until a wallet is
 * connected; protocol-level reads always run. All reads are disabled when no
 * config is passed (preview/mock vault pages must never touch the contracts).
 */
export function useVaultContract(
  userAddress: Address | undefined,
  config: LiveVaultConfig | undefined,
) {
  // Pinned read chain — deliberately NOT the wallet's active chain.
  const chainId = ELYSIUM_CHAIN_ID;
  const connected = userAddress !== undefined && config !== undefined;
  const userArg: readonly [Address] = [userAddress ?? zeroAddress];
  const isNative = config?.kind === "native";
  // Both deployed vaults expose the identical read surface (verified on-chain);
  // a single constant keeps type resolution fast and the writes track-specific.
  const abi = vaultReadsAbi;
  // 1 whole share at the vault's share precision (18 asMMT track, 21 HYPE).
  const ONE_SHARE = 10n ** BigInt(config?.shareDecimals ?? 18);

  // — Protocol-level vault state (shared surface, verified on both vaults) —
  const asset = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "asset",
    chainId,
    query: { enabled: config !== undefined },
  });
  const totalAssets = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "totalAssets",
    chainId,
    query: { enabled: config !== undefined },
  });
  const totalSupply = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "totalSupply",
    chainId,
    query: { enabled: config !== undefined },
  });
  const decimals = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "decimals",
    chainId,
    query: { enabled: config !== undefined },
  });
  const name = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "name",
    chainId,
    query: { enabled: config !== undefined },
  });
  const symbol = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "symbol",
    chainId,
    query: { enabled: config !== undefined },
  });
  const owner = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "owner",
    chainId,
    query: { enabled: config !== undefined },
  });
  const strategy = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "strategy",
    chainId,
    query: { enabled: config !== undefined },
  });
  const strategyInvested = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "strategyInvested",
    chainId,
    query: { enabled: config !== undefined },
  });

  // Idle assets: what the vault holds directly.
  //   ERC-20 track → underlying token balanceOf(vault).
  //   HYPE track   → the vault's native HYPE balance (it is NOT an ERC-20).
  const erc20IdleAssets = useReadContract({
    abi: erc20Abi,
    address: config?.assetAddress ?? zeroAddress,
    functionName: "balanceOf",
    args: [config?.vaultAddress ?? zeroAddress],
    chainId,
    query: { enabled: config !== undefined && !isNative },
  });
  const nativeIdleAssets = useBalance({
    address: config?.vaultAddress ?? zeroAddress,
    chainId,
    query: { enabled: config !== undefined && isNative },
  });
  const idleAssets = isNative
    ? nativeIdleAssets.data?.value
    : erc20IdleAssets.data;

  // Price of one whole share in assets — 1:1 while the vault is empty.
  const sharePrice = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "convertToAssets",
    args: [ONE_SHARE],
    chainId,
    query: { enabled: config !== undefined },
  });

  // — Connected user state (disabled until a wallet is connected) —
  // Asset balance: ERC-20 token balance, or the wallet's native HYPE balance.
  const erc20AssetBalance = useReadContract({
    abi: erc20Abi,
    address: config?.assetAddress ?? zeroAddress,
    functionName: "balanceOf",
    args: userArg,
    chainId,
    query: { enabled: connected && !isNative },
  });
  const nativeAssetBalance = useBalance({
    address: userAddress,
    chainId,
    query: { enabled: connected && isNative },
  });
  const assetBalance = isNative
    ? nativeAssetBalance.data?.value
    : erc20AssetBalance.data;

  const shares = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "balanceOf",
    args: userArg,
    chainId,
    query: { enabled: connected },
  });
  // ERC-20-only concept — undefined for the native HYPE track (no approvals).
  const allowance = useReadContract({
    abi: erc20Abi,
    address: config?.assetAddress ?? zeroAddress,
    functionName: "allowance",
    args: [userArg[0], config?.vaultAddress ?? zeroAddress],
    chainId,
    query: { enabled: connected && !isNative },
  });
  // User's position value in assets, converted by the vault itself
  // (convertToAssets(userShares)) — strategy-aware by construction.
  const sharesRaw = shares.data;
  const userAssetValue = useReadContract({
    abi,
    address: config?.vaultAddress ?? zeroAddress,
    functionName: "convertToAssets",
    args: [sharesRaw ?? 0n],
    chainId,
    query: {
      enabled: connected && sharesRaw !== undefined && sharesRaw > 0n,
    },
  });

  const all = [
    asset,
    totalAssets,
    totalSupply,
    decimals,
    name,
    symbol,
    owner,
    strategy,
    strategyInvested,
    erc20IdleAssets,
    nativeIdleAssets,
    sharePrice,
    erc20AssetBalance,
    nativeAssetBalance,
    shares,
    allowance,
    userAssetValue,
  ];

  async function refetchAll() {
    await Promise.all(all.map((query) => query.refetch()));
  }

  return {
    vault: {
      asset: asset.data,
      totalAssets: totalAssets.data,
      totalSupply: totalSupply.data,
      decimals: decimals.data,
      name: name.data,
      symbol: symbol.data,
      owner: owner.data,
      strategy: strategy.data,
      strategyInvested: strategyInvested.data,
      idleAssets,
      sharePrice: sharePrice.data,
    },
    user: {
      assetBalance,
      shares: shares.data,
      // Native track: no ERC-20 allowance exists — undefined by design.
      allowance: isNative ? undefined : allowance.data,
      assetValue: userAssetValue.data,
    },
    isLoading: all.some((query) => query.isLoading),
    refetchAll,
  };
}
