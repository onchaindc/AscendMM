"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useChainId, useSwitchChain } from "wagmi";
import type { Address } from "viem";

import { ELYSIUM_CHAIN_ID } from "@/lib/elysium";
import { wagmiConfig } from "@/lib/wagmi";

/**
 * Real wallet state for the Elysium testnet integration, built on wagmi.
 * Keeps the Phase 1 provider shape (a single `useWallet` context plus the
 * connect modal state) so existing consumers only swap the import.
 *
 * Connection, reconnection, and account persistence are handled by wagmi;
 * this context adds the connect-modal state and a network guard that detects
 * wallets sitting on a chain other than 99801 and offers a one-click switch.
 */

interface WalletContextValue {
  /** Connected account address, if any. */
  address: Address | undefined;
  isConnected: boolean;
  /** True while wagmi restores a previous session. */
  isReconnecting: boolean;
  /** Chain the wallet is currently on (may differ from 99801). */
  chainId: number | undefined;
  /** True when connected but not on Elysium testnet (99801). */
  onWrongNetwork: boolean;
  /** Ask the wallet to switch (and add) Elysium testnet. */
  switchToElysium: () => void;
  /** True while the switch request is in flight. */
  isSwitching: boolean;
  connectModalOpen: boolean;
  setConnectModalOpen: (open: boolean) => void;
  /** Convenience opener for the connect modal. */
  openConnectModal: () => void;
}

const WalletContext = React.createContext<WalletContextValue | null>(null);

function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const [connectModalOpen, setConnectModalOpen] = React.useState(false);
  const { address, isConnected, isReconnecting, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const onWrongNetwork = isConnected && chainId !== ELYSIUM_CHAIN_ID;

  const switchToElysium = React.useCallback(() => {
    switchChain({ chainId: ELYSIUM_CHAIN_ID });
  }, [switchChain]);

  const openConnectModal = React.useCallback(() => {
    setConnectModalOpen(true);
  }, []);

  const value = React.useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected,
      isReconnecting,
      chainId,
      onWrongNetwork,
      switchToElysium,
      isSwitching,
      connectModalOpen,
      setConnectModalOpen,
      openConnectModal,
    }),
    [
      address,
      isConnected,
      isReconnecting,
      chainId,
      onWrongNetwork,
      switchToElysium,
      isSwitching,
      connectModalOpen,
      openConnectModal,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // One QueryClient for the whole app; wagmi hooks are react-query backed.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <WalletStateProvider>{children}</WalletStateProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export function useWallet() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
