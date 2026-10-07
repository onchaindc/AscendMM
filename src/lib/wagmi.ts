/**
 * wagmi configuration — Elysium testnet (chain 99801) only.
 *
 * The app talks exclusively to the deployed Elysium testnet contracts, so the
 * config carries a single chain. `ssr: true` keeps prerendering safe (wallet
 * state hydrates on the client), and reads use the public HTTP RPC directly —
 * the testnet RPC serves permissive CORS, so browser-side reads work without
 * a proxy. Writes always go through the connected wallet.
 */

import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/connectors/injected";
import { walletConnect } from "@wagmi/connectors/walletConnect";

import { ELYSIUM_RPC_URL, elysiumTestnet } from "./elysium";

/**
 * Public WalletConnect Cloud project ID (NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).
 * It is a public client identifier — never a secret — but it is still provided
 * through the environment rather than hardcoded. When it is not configured the
 * WalletConnect option is simply omitted and browser wallets keep working, so
 * a missing variable can never break the app.
 */
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || undefined;

const connectors = [
  injected({ shimDisconnect: true }),
  // WalletConnect-compatible wallets (mobile wallets, QR / deep links).
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: "AscendMM",
            description:
              "Market-making and strategy vaults on the Elysium ecosystem.",
            url: "https://ascendmm.xyz",
            icons: [],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [elysiumTestnet],
  connectors,
  transports: {
    [elysiumTestnet.id]: http(ELYSIUM_RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

/** Maps wallet/RPC errors to a short, user-facing message. */
export function getWalletErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.name === "UserRejectedRequestError" ||
      /reject|denied|4001/i.test(error.message)
    ) {
      return "Request rejected in wallet.";
    }
    const shortMessage = (error as { shortMessage?: string }).shortMessage;
    if (shortMessage) return shortMessage;
    if (error.message.length <= 160) return error.message;
  }
  return "Something went wrong. Please try again.";
}
