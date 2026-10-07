import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { LiveStrategyCard } from "@/components/vault/live-strategy-card";
import { LiveVaultDetail } from "@/components/vault/live-vault-detail";
import { LiveVaultPanel } from "@/components/vault/live-vault-panel";
import {
  LiveVaultRegistryBadges,
  VaultRegistryStatusCard,
} from "@/components/vault/registry-status-card";
import { RiskMetadataDisclaimer } from "@/components/ui/protocol-risk-badge";
import { VaultActivity } from "@/components/vault/vault-activity";
import {
  VaultActivityFeed,
  VaultAllocationReal,
  VaultAnalyticsSection,
} from "@/components/vault/vault-analytics-section";
import { VaultAllocation } from "@/components/vault/vault-allocation";
import { VaultContractCard } from "@/components/vault/vault-contract-card";
import { VaultPerformanceChart } from "@/components/vault/vault-performance-chart";
import { VaultStats } from "@/components/vault/vault-stats";
import { ALL_VAULTS } from "@/lib/vaults";
import {
  ELYSIUM_NETWORK_LABEL,
  getLiveVaultConfig,
  isLiveVaultId,
} from "@/lib/elysium";
import { formatPercent, formatUsdCompact } from "@/lib/format";

interface VaultDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Label/value row used by the Strategy section. */
function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={mono ? "data text-right text-sm text-fg" : "text-right text-sm text-fg"}>
        {value}
      </dd>
    </div>
  );
}

export async function generateStaticParams() {
  return ALL_VAULTS.map((vault) => ({ id: vault.id }));
}

export async function generateMetadata({
  params,
}: VaultDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const vault = ALL_VAULTS.find((v) => v.id === id);
  return {
    title: vault ? vault.name : "Vault",
    description: vault?.description,
  };
}

export default async function VaultDetailPage({ params }: VaultDetailPageProps) {
  const { id } = await params;
  const vault = ALL_VAULTS.find((v) => v.id === id);

  if (!vault) notFound();

  const isLive = isLiveVaultId(vault.id);
  const liveConfig = getLiveVaultConfig(vault.id);
  const isNative = liveConfig?.kind === "native";

  return (
    <PageContainer>
      <Link
        href="/vaults"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        All vaults
      </Link>

      {/* Header --------------------------------------------------------- */}
      <div className="mt-5 flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              /* Live vaults: registry-driven badges only — active/paused and
                 risk class come from the VaultRegistry when configured. */
              <LiveVaultRegistryBadges vaultId={vault.id} />
            ) : (
              <>
                <span className="rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-medium text-muted">
                  {vault.type}
                </span>
                <StatusBadge status={vault.status} />
                <RiskBadge risk={vault.risk} />
              </>
            )}
          </div>
          <h1 className="data mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {vault.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {vault.description}
          </p>
          <p className="mt-1 text-xs text-faint">
            Assets: <span className="data">{vault.assets.join(" · ")}</span>
          </p>
        </div>

        <div className="lg:pt-1">
          <LiveVaultDetail vault={vault} />
          {isLive ? (
            <p className="mt-2 text-xs text-faint">
              {isNative
                ? `Real transactions on ${ELYSIUM_NETWORK_LABEL} — deposits carry native HYPE as transaction value (no approval); withdrawals return HYPE.`
                : `Real transactions on ${ELYSIUM_NETWORK_LABEL} — approve, deposit, and redeem hit the deployed contracts.`}
            </p>
          ) : null}
        </div>
      </div>

      {/* Headline stats -------------------------------------------------- */}
      {isLive ? (
        <div className="mt-6 rounded-lg border border-line bg-surface px-5 py-4">
          <p className="text-sm leading-relaxed text-muted">
            All vault figures are read live from the vault contract on{" "}
            <span className="font-medium text-fg">{ELYSIUM_NETWORK_LABEL}</span>
            {" "}in the panel below. The current idle strategy generates no
            yield.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="TVL" value={formatUsdCompact(vault.tvl)} />
          <StatCard label="APY" value={formatPercent(vault.apy)} />
          <StatCard
            label="24h Performance"
            value={<Delta value={vault.change24h} withIcon />}
          />
          <StatCard label="Risk" value={<RiskBadge risk={vault.risk} />} />
        </div>
      )}

      {/* Performance ----------------------------------------------------- */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLive ? (
            <p className="py-8 text-center text-sm text-muted">
              No performance history — this vault was freshly deployed and its
              IdleStrategy generates no yield. Performance tracking will appear
              once real strategy returns exist on-chain.
            </p>
          ) : (
            <VaultPerformanceChart series={vault.performance} />
          )}
        </CardContent>
      </Card>

      {/* Allocation + Strategy ------------------------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vault Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLive && liveConfig ? (
              <VaultAllocationReal config={liveConfig} />
            ) : (
              <VaultAllocation allocation={vault.allocation} />
            )}
          </CardContent>
        </Card>

        {isLive ? (
          <LiveStrategyCard vaultId={vault.id} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-line">
                <DetailRow label="Strategy name" value={vault.strategy.name} mono />
                <DetailRow
                  label="Status"
                  value={<StatusBadge status={vault.strategy.status} />}
                />
                <DetailRow
                  label="Risk level"
                  value={<RiskBadge risk={vault.strategy.risk} />}
                />
                <DetailRow label="Management style" value={vault.strategy.style} />
                <DetailRow
                  label="Performance fee"
                  value={formatPercent(vault.strategy.performanceFee, 0)}
                  mono
                />
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Live chain state ------------------------------------------------ */}
      {isLive ? (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg">
            Live chain state — {ELYSIUM_NETWORK_LABEL}
          </h2>
          <LiveVaultPanel vaultId={vault.id} />
        </section>
      ) : null}

      {/* Statistics (preview vaults only — the live vault shows real chain
          state in the panel above) */}
      {!isLive ? (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg">
            Vault Statistics
          </h2>
          <VaultStats stats={vault.stats} />
        </section>
      ) : null}

      {/* Activity + Contract -------------------------------------------- */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLive && liveConfig ? (
              <VaultActivityFeed config={liveConfig} />
            ) : (
              <VaultActivity items={vault.activity} />
            )}
          </CardContent>
        </Card>

        {isLive ? (
          <VaultRegistryStatusCard vaultId={vault.id} />
        ) : (
          <VaultContractCard contract={vault.contract} />
        )}
      </div>

      {isLive && liveConfig ? (
        <div className="mt-8">
          <VaultAnalyticsSection config={liveConfig} />
        </div>
      ) : null}

      {isLive ? <RiskMetadataDisclaimer className="mt-8" /> : null}
      <p
        className={
          isLive
            ? "mt-2 text-xs leading-relaxed text-faint"
            : "mt-8 text-xs leading-relaxed text-faint"
        }
      >
        {isNative
          ? `All data is read live from ${ELYSIUM_NETWORK_LABEL}. HYPE is held as native value — deposits carry HYPE directly, with no approval step.`
          : isLive
            ? `All data is read live from ${ELYSIUM_NETWORK_LABEL}. asMMT is a testnet asset with no value.`
            : "This vault is a preview entry. Contract reads, share balances, and live performance indexing will be connected once the ERC-4626 vaults are deployed to Elysium testnet."}
      </p>
    </PageContainer>
  );
}
