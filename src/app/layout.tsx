import type { Metadata, Viewport } from "next";

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ConnectWalletModal } from "@/components/wallet/connect-wallet-modal";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export const metadata: Metadata = {
  title: {
    default: "AscendMM — Professional liquidity for Elysium",
    template: "%s · AscendMM",
  },
  description:
    "Actively managed market-making and strategy vaults for the Elysium ecosystem. Live on Elysium Testnet.",
};

export const viewport: Viewport = {
  themeColor: "#0b0e13",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <WalletProvider>
          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ConnectWalletModal />
        </WalletProvider>
      </body>
    </html>
  );
}
