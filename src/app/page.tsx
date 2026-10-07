import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ScanLine,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import {
  ASMMT_VAULT_CONFIG,
  HYPE_VAULT_CONFIG,
} from "@/lib/elysium";

/**
 * Homepage — one dominant hero, one quiet explainer, one clean featured row.
 * Every claim is a fact about the deployed Elysium testnet protocol; no
 * metrics that cannot be read on-chain are rendered.
 */

const VAULT_ROWS = [
  {
    id: HYPE_VAULT_CONFIG.id,
    name: HYPE_VAULT_CONFIG.vaultName,
    asset: "Native HYPE",
    detail: "Payable deposits — no approval step",
  },
  {
    id: ASMMT_VAULT_CONFIG.id,
    name: ASMMT_VAULT_CONFIG.vaultName,
    asset: "asMMT (testnet asset)",
    detail: "ERC-4626 share vault — approve, deposit, redeem",
  },
] as const;

const STEPS = [
  {
    icon: ScanLine,
    title: "Connect any wallet",
    body: "Browser wallets connect directly. Mobile wallets scan a WalletConnect QR — no extension required.",
  },
  {
    icon: Waypoints,
    title: "Deposit into a vault",
    body: "Every vault is a deployed ERC-4626 contract on Elysium. Shares mint 1:1 while the vault is empty and prices are read live from chain.",
  },
  {
    icon: ShieldCheck,
    title: "Withdraw on your terms",
    body: "Redemptions are strategy-aware and settle on-chain. The current idle strategies generate no yield — nothing is promised.",
  },
] as const;

export default function HomePage() {
  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <PageContainer className="py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted backdrop-blur-sm"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-positive opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
              </span>
              Live on Elysium Testnet
            </span>

            <h1
              className="mt-8 animate-fade-up text-5xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "60ms" }}
            >
              Market-making vaults,
              <br />
              <span className="text-gold-gradient">built for Elysium.</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              Deposit native HYPE or asMMT into deployed vaults, hold strategy
              shares, and redeem anytime — every state read live from chain
              99801.
            </p>

            <div
              className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/vaults">
                  Explore vaults
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/strategies">View strategies</Link>
              </Button>
            </div>

            <p
              className="mt-8 animate-fade-up text-xs leading-relaxed text-faint"
              style={{ animationDelay: "240ms" }}
            >
              Testnet deployment · assets have no value · no yield is currently
              generated
            </p>
          </div>
        </PageContainer>
      </section>

      {/* How it works — one quiet section, real facts only ------------------ */}
      <section className="border-t border-line">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="max-w-sm">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2">
                  <Icon className="size-4 text-accent" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-fg">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Featured vaults — the two live deployments ------------------------- */}
      <section className="border-t border-line">
        <PageContainer className="py-16 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                Deployed vaults
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                Two vaults are live and transactable on Elysium Testnet. Their
                total assets, share prices, and your positions are read
                directly from the contracts.
              </p>
            </div>
            <Link
              href="/vaults"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              All vaults
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VAULT_ROWS.map(({ id, name, asset, detail }) => (
              <Link
                key={id}
                href={`/vaults/${id}`}
                className="glass-panel glow-hover group flex flex-col rounded-xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-fg">
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">{asset}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-positive/25 bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
                    <span className="size-1.5 rounded-full bg-positive" />
                    Live
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {detail}
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors group-hover:text-accent">
                  Open vault
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
