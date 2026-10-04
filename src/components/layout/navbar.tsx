"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldAlert, Wallet, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { ELYSIUM_CHAIN_ID, ELYSIUM_NETWORK_LABEL } from "@/lib/elysium";
import { shortenAddress } from "@/lib/format";

const NAV_LINKS = [
  { href: "/vaults", label: "Vaults" },
  { href: "/strategies", label: "Strategies" },
  { href: "/portfolio", label: "Portfolio" },
];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="AscendMM home">
      <span className="flex size-7 items-center justify-center rounded-md border border-accent/30 bg-accent-muted">
        {/* Ascend mark: three ascending steps */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1.5 12.5L5 8l3 2.5L12.5 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          />
          <path
            d="M8.5 3h4v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        Ascend<span className="text-accent">MM</span>
      </span>
    </Link>
  );
}

function NetworkChip({ className }: { className?: string }) {
  const { isConnected, onWrongNetwork, switchToElysium, isSwitching } = useWallet();

  // While connected on the wrong chain the chip becomes a fix-it affordance;
  // otherwise it is the static Elysium Testnet label.
  if (isConnected && onWrongNetwork) {
    return (
      <button
        type="button"
        onClick={switchToElysium}
        disabled={isSwitching}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs text-warning transition-colors hover:bg-warning/15 disabled:opacity-60",
          className,
        )}
        title={`Wallet is on another chain — switch to ${ELYSIUM_NETWORK_LABEL} (${ELYSIUM_CHAIN_ID})`}
      >
        <ShieldAlert className="size-3" />
        Wrong network
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-muted",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-positive opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
      </span>
      {ELYSIUM_NETWORK_LABEL}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { address, isConnected, setConnectModalOpen } = useWallet();

  // Close the mobile menu whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/vaults" ? pathname.startsWith("/vaults") : pathname.startsWith(href);

  const walletLabel = isConnected && address ? shortenAddress(address, 4) : "Connect Wallet";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Wordmark />
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive(link.href)
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:bg-surface-2/60 hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NetworkChip />
          <Button
            variant={isConnected ? "secondary" : "default"}
            size="sm"
            onClick={() => setConnectModalOpen(true)}
            aria-haspopup="dialog"
          >
            <Wallet className="size-3.5" />
            {walletLabel}
          </Button>
        </div>

        {/* Mobile: network chip + menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <NetworkChip className="hidden sm:inline-flex" />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {mobileOpen ? (
        <div className="animate-fade-in border-t border-line bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm",
                  isActive(link.href)
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:bg-surface-2/60 hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <NetworkChip />
            <Button
              size="sm"
              variant={isConnected ? "secondary" : "default"}
              onClick={() => setConnectModalOpen(true)}
            >
              <Wallet className="size-3.5" />
              {walletLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
