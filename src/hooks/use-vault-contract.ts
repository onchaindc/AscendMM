"use client";

import { erc20Abi, zeroAddress, type Address } from "viem";
import { useReadContract } from "wagmi";

import { ascendVaultAbi } from "@/lib/abis";
import {
  ASCEND_VAULT_ADDRESS,
  ASMMT_TOKEN_ADDRESS,
  ELYSIUM_CHAIN_ID,
} from "@/lib/elysium";

/**
 * Live on-chain reads for the deployed AscendVault on Elysium testnet.
 *
 * Every read is pinned to chain 99801 (`chainId: ELYSIUM_CHAIN_ID`) so the UI
 * never depends on whichever network the connected wallet happens to have
 * active — data is always read through the public Elysium testnet RPC.
 *
 * Strategy-aware accounting: idleAssets = vault's underlying-token balance,
 * deployedAssets = strategyInvested(), and idle + deployed = totalAssets.
 * Pricing always comes from the vault's own convert/preview functions —
 * never from strategy-side totals.
 *
 * User-scoped reads (balances/allowance/asset value) are disabled until a
 * wallet is connected; protocol-level reads always run.
 */

const ONE_SHARE = 10n ** 18n;

export function useVaultContract(userAddress: Address | undefined) {
  // Pinned read chain — deliberately NOT the wallet's active chain.
  const chainId = ELYSIUM_CHAIN_ID;
  const connected = userAddress !== undefined;
  const userArg: readonly [Address] = [userAddress ?? zeroAddress];

  // — Protocol-level vault state —
  const asset = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "asset",
    chainId,
  });
  const totalAssets = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "totalAssets",
    chainId,
  });
  const totalSupply = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "totalSupply",
    chainId,
  });
  const decimals = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "decimals",
    chainId,
  });
  const name = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "name",
    chainId,
  });
  const symbol = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "symbol",
    chainId,
  });
  const owner = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "owner",
    chainId,
  });
  const strategy = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "strategy",
    chainId,
  });
  const strategyInvested = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "strategyInvested",
    chainId,
  });
  // Idle assets: the underlying token balance held directly by the vault.
  const idleAssets = useReadContract({
    abi: erc20Abi,
    address: ASMMT_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [ASCEND_VAULT_ADDRESS],
    chainId,
  });
  // Price of one share (1e18 raw) in assets — 1:1 while the vault is empty.
  const sharePrice = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "convertToAssets",
    args: [ONE_SHARE],
    chainId,
  });

  // — Connected user state (disabled until a wallet is connected) —
  const assetBalance = useReadContract({
    abi: erc20Abi,
    address: ASMMT_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: userArg,
    chainId,
    query: { enabled: connected },
  });
  const shares = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "balanceOf",
    args: userArg,
    chainId,
    query: { enabled: connected },
  });
  const allowance = useReadContract({
    abi: erc20Abi,
    address: ASMMT_TOKEN_ADDRESS,
    functionName: "allowance",
    args: [userArg[0], ASCEND_VAULT_ADDRESS],
    chainId,
    query: { enabled: connected },
  });
  // User's position value in assets, converted by the vault itself
  // (convertToAssets(userShares)) — strategy-aware by construction.
  const sharesRaw = shares.data;
  const userAssetValue = useReadContract({
    abi: ascendVaultAbi,
    address: ASCEND_VAULT_ADDRESS,
    functionName: "convertToAssets",
    args: [sharesRaw ?? 0n],
    chainId,
    query: { enabled: connected && sharesRaw !== undefined && sharesRaw > 0n },
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
    idleAssets,
    sharePrice,
    assetBalance,
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
      idleAssets: idleAssets.data,
      sharePrice: sharePrice.data,
    },
    user: {
      assetBalance: assetBalance.data,
      shares: shares.data,
      allowance: allowance.data,
      assetValue: userAssetValue.data,
    },
    isLoading: all.some((query) => query.isLoading),
    refetchAll,
  };
}
