import Link from "next/link";
import { ArrowRight, Activity, Gauge, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { VaultCard } from "@/components/vault/vault-card";
import { ALL_VAULTS } from "@/lib/vaults";
import { HYPE_VAULT_ID, LIVE_VAULT_ID } from "@/lib/elysium";
import {
  MOCK_PROTOCOL_METRICS,
} from "@/lib/mock-data";
import { formatPercent, formatUsdCompact } from "@/lib/format";

/**
 * Homepage figures come from the Phase 1 preview metrics; the featured grid
 * leads with the live Elysium testnet vault followed by two preview entries.
 */

const FEATURED_IDS = [LIVE_VAULT_ID, HYPE_VAULT_ID, "usdc-usdt"];

const CAPABILITIES = [
  {
    icon: Activity,
    title: "Active Market Making",
    body: "Liquidity can eventually be actively managed instead of sitting passively in a pool.",
  },
  {
    icon: Layers,
    title: "Strategy Vaults",
    body: "Capital can be allocated to specialized market-making strategies.",
  },
  {
    icon: Gauge,
    title: "Elysium Native",
    body: "Designed around Elysium's high-frequency trading environment.",
  },
];

const METRICS = [
  {
    label: "Total Value Locked",
    value: formatUsdCompact(MOCK_PROTOCOL_METRICS.totalValueLocked),
  },
  { label: "Active Vaults", value: String(MOCK_PROTOCOL_METRICS.activeVaults) },
  { label: "24h Volume", value: formatUsdCompact(MOCK_PROTOCOL_METRICS.volume24h) },
  { label: "Average APY", value: formatPercent(MOCK_PROTOCOL_METRICS.averageApy) },
];

export default function HomePage() {
  const featured = FEATURED_IDS.map((id) =>
    ALL_VAULTS.find((vault) => vault.id === id),
  ).filter((vault): vault is (typeof ALL_VAULTS)[number] => Boolean(vault));

  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <section className="border-b border-line">
        <PageContainer className="py-16 sm:py-24">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-positive" />
              Live on Elysium Testnet · chain 99801
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Professional liquidity
              <br />
              for <span className="text-gold-gradient">Elysium.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Actively managed vaults built for high-frequency markets.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" asChild>
                <Link href="/vaults/ascend-asmmt-testnet">
                  Open the Live Vault
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/vaults">Explore Vaults</Link>
              </Button>
            </div>
          </div>

          {/* Protocol metrics */}
          <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {METRICS.map((metric) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Preview figures for the upcoming vault lineup. The AscendMM Vault
            and the AscendMM HYPE Vault are live on Elysium testnet (chain
            99801) — asMMT is a TEST-ONLY mock asset; the HYPE vault holds
            native HYPE — see the vault pages for live on-chain stats.
          </p>
        </PageContainer>
      </section>

      {/* Capabilities ----------------------------------------------------- */}
      <section className="border-b border-line">
        <PageContainer>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Built for active liquidity
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">
              AscendMM is being built as the professional market-making layer for
              Elysium — where liquidity is managed by strategy, not left idle.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="glass-panel glow-hover rounded-xl p-6"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2 backdrop-blur-sm">
                  <Icon className="size-4 text-accent" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-fg">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Featured vaults -------------------------------------------------- */}
      <section>
        <PageContainer>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                Featured vaults
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-[15px]">
                The live testnet vault plus a preview of the lineup coming at
                launch.
              </p>
            </div>
            <Link
              href="/vaults"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              View all vaults
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((vault) => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}