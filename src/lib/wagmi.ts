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

import { ELYSIUM_RPC_URL, elysiumTestnet } from "./elysium";

export const wagmiConfig = createConfig({
  chains: [elysiumTestnet],
  connectors: [injected({ shimDisconnect: true })],
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
