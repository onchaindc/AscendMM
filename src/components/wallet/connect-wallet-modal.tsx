"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert, Wallet } from "lucide-react";
import { useConnect, useDisconnect, type Connector } from "wagmi";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { getWalletErrorMessage } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/format";
import {
  ELYSIUM_CHAIN_ID,
  ELYSIUM_NETWORK_LABEL,
  ELYSIUM_RPC_URL,
} from "@/lib/elysium";

/**
 * Real wallet connection modal for Elysium testnet. Lists browser wallets
 * detected via EIP-6963 plus WalletConnect-compatible wallets, connects on
 * request, and doubles as the account panel while a wallet is connected
 * (address, network guard, disconnect).
 */

/** User-facing name for a connector (never expose internal plumbing terms). */
function connectorDisplayName(name: string): string {
  if (/injected/i.test(name)) return "Browser wallet";
  return name;
}
export function ConnectWalletModal() {
  const {
    connectModalOpen,
    setConnectModalOpen,
    address,
    isConnected,
    chainId,
    onWrongNetwork,
    switchToElysium,
    isSwitching,
  } = useWallet();

  const { connectors, connectAsync, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Only offer connectors that are usable in this browser session.
  const usableConnectors = connectors.filter((c) => c.ready ?? true);

  React.useEffect(() => {
    if (!connectModalOpen) {
      setConnectingId(null);
      setError(null);
    }
  }, [connectModalOpen]);

  async function handleConnect(connector: Connector) {
    setError(null);
    setConnectingId(connector.uid);
    try {
      await connectAsync({ connector });
    } catch (err) {
      setError(getWalletErrorMessage(err));
    } finally {
      setConnectingId(null);
    }
  }

  function handleDisconnect() {
    disconnect();
    setConnectModalOpen(false);
  }

  return (
    <Modal open={connectModalOpen} onOpenChange={setConnectModalOpen}>
      <ModalContent>
        {isConnected && address ? (
          <>
            <ModalHeader>
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface-2">
                <Wallet className="size-5 text-accent" />
              </div>
              <ModalTitle>Wallet connected</ModalTitle>
              <ModalDescription>
                {ELYSIUM_NETWORK_LABEL} · chain {ELYSIUM_CHAIN_ID}
              </ModalDescription>
            </ModalHeader>

            <div className="flex items-center justify-between rounded-md border border-line bg-background px-3 py-2.5">
              <span className="data text-sm text-fg">{shortenAddress(address, 6)}</span>
              <CopyButton value={address} label="Copy wallet address" />
            </div>

            {onWrongNetwork ? (
              <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
                <span className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                  Your wallet is on chain {chainId}. AscendMM runs on{" "}
                  {ELYSIUM_NETWORK_LABEL} (chain {ELYSIUM_CHAIN_ID}).
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-positive/25 bg-positive/10 px-3 py-2.5 text-xs leading-relaxed text-positive">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                Connected to {ELYSIUM_NETWORK_LABEL} (chain {ELYSIUM_CHAIN_ID}).
              </div>
            )}

            <ModalFooter>
              {onWrongNetwork ? (
                <Button onClick={switchToElysium} disabled={isSwitching}>
                  {isSwitching ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Switch to {ELYSIUM_NETWORK_LABEL}
                </Button>
              ) : null}
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader>
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface-2">
                <Wallet className="size-5 text-accent" />
              </div>
              <ModalTitle>Connect a wallet</ModalTitle>
              <ModalDescription>
                Connect a browser wallet or any WalletConnect-compatible wallet
                to use AscendMM on {ELYSIUM_NETWORK_LABEL}.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-2">
              {usableConnectors.length === 0 ? (
                <p className="rounded-md border border-line bg-background px-3 py-3 text-sm text-muted">
                  No wallet detected. Install an EVM browser wallet (e.g. MetaMask)
                  to continue.
                </p>
              ) : (
                usableConnectors.map((connector) => {
                  const isConnecting = connectingId === connector.uid;
                  return (
                    <button
                      key={connector.uid}
                      type="button"
                      disabled={connectPending || connectingId !== null}
                      onClick={() => handleConnect(connector)}
                      className="flex w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-3 text-sm text-fg transition-colors hover:border-accent/40 hover:bg-surface-2 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="inline-flex size-7 items-center justify-center overflow-hidden rounded border border-line bg-surface-2">
                          {connector.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={connector.icon}
                              alt=""
                              width={16}
                              height={16}
                            />
                          ) : (
                            <Wallet className="size-3.5 text-muted" />
                          )}
                        </span>
                        {connectorDisplayName(connector.name)}
                      </span>
                      {isConnecting ? (
                        <Loader2 className="size-4 animate-spin text-accent" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {error ? (
              <p className="mt-3 flex items-start gap-2 rounded-md border border-negative/25 bg-negative/10 px-3 py-2.5 text-xs leading-relaxed text-negative">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            ) : null}

            <ModalFooter>
              <p className="text-[11px] leading-relaxed text-faint">
                {ELYSIUM_NETWORK_LABEL} · RPC {ELYSIUM_RPC_URL.replace("https://", "")}
              </p>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
