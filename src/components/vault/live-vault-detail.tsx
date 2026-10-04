"use client";

import { useWallet } from "@/components/wallet/wallet-provider";
import { useVaultContract } from "@/hooks/use-vault-contract";
import { VaultActions } from "@/components/vault/vault-actions";
import { isLiveVaultId } from "@/lib/elysium";
import type { Vault } from "@/lib/types";

/**
 * Client wrapper binding the deployed testnet vault's live reads to the real
 * transaction flows. For preview (not-deployed) vault entries it renders a
 * passive state — they must never transact against the live contract.
 */
export function LiveVaultDetail({ vault }: { vault: Vault }) {
  const { address, isConnected } = useWallet();
  const isLive = isLiveVaultId(vault.id);
  // Reads only bind when this is the live vault; preview entries never touch
  // the deployed contract addresses.
  const { vault: vaultData, user } = useVaultContract(
    isLive ? address : undefined,
  );

  if (!isLive) {
    return (
      <div>
        <VaultActions
          vault={vault}
          userAddress={undefined}
          userAssetBalance={undefined}
          userShares={undefined}
          userAllowance={undefined}
          sharePriceRaw={undefined}
        />
        <p className="mt-2 text-xs text-faint">
          Preview vault — not deployed. Deposits are available on the live
          Elysium testnet vault.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VaultActions
        vault={vault}
        userAddress={address}
        userAssetBalance={user.assetBalance}
        userShares={user.shares}
        userAllowance={user.allowance}
        sharePriceRaw={vaultData.sharePrice}
      />
      {!isConnected ? (
        <p className="text-xs leading-relaxed text-faint">
          Connect an Elysium wallet to deposit TEST-ONLY asMMT or redeem asMMV
          shares.
        </p>
      ) : null}
    </div>
  );
}
