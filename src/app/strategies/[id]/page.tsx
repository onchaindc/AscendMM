import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMetadataDisclaimer } from "@/components/ui/protocol-risk-badge";
import { LiveStrategyDetail } from "@/components/strategy/live-strategy-detail";
import { ELYSIUM_CHAIN_ID } from "@/lib/elysium";
import {
  ASMMT_IDLE_STRATEGY_ID,
  HYPE_IDLE_STRATEGY_ID,
  KINETIQ_STRATEGY_ID,
  getLiveStrategyTrack,
} from "@/lib/registry";

interface StrategyDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [
    { id: HYPE_IDLE_STRATEGY_ID },
    { id: ASMMT_IDLE_STRATEGY_ID },
    { id: KINETIQ_STRATEGY_ID },
  ];
}

const LIVE_STRATEGY_META: Record<string, { name: string; behavior: string }> = {
  [HYPE_IDLE_STRATEGY_ID]: {
    name: "HypeIdleStrategy — native HYPE idle custody",
    behavior:
      "The native HYPE track's idle strategy: custody-holds the vault's HYPE " +
      "without deploying it, generates no yield, and moves value only with " +
      "its bound vault. All figures below are read live from Elysium Testnet.",
  },
  [ASMMT_IDLE_STRATEGY_ID]: {
    name: "IdleStrategy — asMMT idle custody",
    behavior:
      "The ERC-20 track's idle strategy: custody-holds the vault's asMMT " +
      "asset without deploying it, generates no yield, and moves value " +
      "only with its bound vault. All figures below are read live from Elysium Testnet.",
  },
};

export async function generateMetadata({
  params,
}: StrategyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  if (id === KINETIQ_STRATEGY_ID) {
    return {
      title: "KinetiqLstStrategy — Prepared / Inactive",
      description:
        "kHYPE liquid-staking adapter prepared for a future Elysium deployment. Not deployed, not registered, and inactive on chain 99801 — no kHYPE yield is available through AscendMM.",
    };
  }
  const meta = LIVE_STRATEGY_META[id];
  return {
    title: meta ? meta.name : "Strategy",
    description: meta?.behavior,
  };
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm text-fg">{children}</dd>
    </div>
  );
}

/**
 * Kinetiq kHYPE adapter — static PREPARED / INACTIVE detail.
 *
 * The adapter is implemented in the contracts repo (commit 42f252f) but is
 * deliberately NOT deployed and NOT registered on Elysium (chain 99801):
 * kHYPE, the StakingManager and the StakingAccountant have no published
 * Elysium addresses (verified: eth_getCode for the documented kHYPE address
 * returns empty). It therefore has NO contract address, NO total assets, and
 * NO yield — nothing on this page may imply otherwise. The "prepared
 * behavior" section describes verified contract behavior from the audited
 * test suite's source, not a live deployment.
 */
function KinetiqPreparedDetail() {
  return (
    <div>
      <Link
        href="/strategies"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        All strategies
      </Link>

      {/* Header ---------------------------------------------------------- */}
      <div className="mt-5 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-medium text-muted">
            Native-HYPE LST adapter
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
            <span className="size-1.5 rounded-full border border-warning bg-warning/40" />
            Prepared / Inactive
          </span>
          <span className="rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
            Not deployed on Elysium
          </span>
          <span className="rounded-md border border-line bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
            Not registered
          </span>
        </div>
        <h1 className="data mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          KinetiqLstStrategy — kHYPE LST adapter
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          An adapter for Kinetiq&apos;s kHYPE liquid staking, prepared for a
          future Elysium deployment. It is deliberately unregistered and
          inactive until an official Kinetiq deployment exists on chain{" "}
          {ELYSIUM_CHAIN_ID}: kHYPE, the StakingManager, and the
          StakingAccountant have no published Elysium addresses (Kinetiq&apos;s
          documentation lists mainnet deployments only). kHYPE yield is{" "}
          <span className="font-medium text-fg">not currently available</span>{" "}
          through AscendMM.
        </p>
      </div>

      {/* Detail grid ------------------------------------------------------ */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strategy overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line">
              <DetailRow label="Type">
                Native-HYPE LST adapter (ERC-7535 shape)
              </DetailRow>
              <DetailRow label="Underlying asset">
                <span className="data">
                  HYPE (native, ERC-7528 sentinel)
                </span>
              </DetailRow>
              <DetailRow label="Bound vault">None — not bound</DetailRow>
              <DetailRow label="Current assets">
                <span className="text-xs text-faint">— (not deployed)</span>
              </DetailRow>
              <DetailRow label="Contract address">
                <span className="text-xs text-faint">
                  Not deployed on Elysium (chain {ELYSIUM_CHAIN_ID}) — no
                  address exists
                </span>
              </DetailRow>
              <DetailRow label="Protocol dependency">
                Kinetiq kHYPE — StakingManager, StakingAccountant, kHYPE token
                (none deployed on chain {ELYSIUM_CHAIN_ID})
              </DetailRow>
              <DetailRow label="Deployment state">
                Prepared — implemented in the protocol repository; not
                deployed, not registered
              </DetailRow>
              <DetailRow label="Yield">
                <span className="text-xs text-faint">
                  None available — kHYPE yield is inactive until a real
                  Elysium Kinetiq deployment
                </span>
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prepared behavior (verified contract source)</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line">
              <DetailRow label="invest()">
                Forwards native HYPE to the StakingManager and verifies the
                minted kHYPE against the StakingAccountant&apos;s official
                conversion quote (minimum-output protection)
              </DetailRow>
              <DetailRow label="divest()">
                Serves idle HYPE first, then redeems only the needed kHYPE via
                the protocol&apos;s slippage-protected instant-unstake path,
                settling the vault synchronously
              </DetailRow>
              <DetailRow label="divestAll()">
                Full emergency exit — all-or-nothing; if the protocol cannot
                fulfill, the call reverts and the kHYPE position stays intact
              </DetailRow>
              <DetailRow label="totalAssets()">
                Idle HYPE plus kHYPE valued through the StakingAccountant&apos;s
                official rate — value moves only when the official conversion
                rate moves
              </DetailRow>
              <DetailRow label="harvest() / report()">
                Flat no-ops — the official kHYPE interface exposes no
                realized-yield claim, and nothing is fabricated
              </DetailRow>
            </dl>
          </CardContent>
        </Card>
      </div>

      <RiskMetadataDisclaimer className="mt-8" />
      <p className="mt-2 text-xs leading-relaxed text-faint">
        This page describes a prepared contract that is not deployed on
        Elysium testnet (chain {ELYSIUM_CHAIN_ID}). No APY, TVL, or yield is
        shown because none exists: the adapter holds no assets, is bound to no
        vault, and is absent from the on-chain registries. When an official
        Kinetiq deployment lands on Elysium, this entry will be registered and
        activated on-chain before any related UI is enabled.
      </p>
    </div>
  );
}

export default async function StrategyDetailPage({
  params,
}: StrategyDetailPageProps) {
  const { id } = await params;

  if (id === KINETIQ_STRATEGY_ID) {
    return (
      <PageContainer>
        <KinetiqPreparedDetail />
      </PageContainer>
    );
  }

  const config = getLiveStrategyTrack(id);
  const meta = LIVE_STRATEGY_META[id];
  if (!config || !meta) notFound();

  return (
    <PageContainer>
      <LiveStrategyDetail config={config} name={meta.name} behavior={meta.behavior} />
    </PageContainer>
  );
}
