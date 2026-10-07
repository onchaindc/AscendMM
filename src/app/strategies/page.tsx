import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { RiskMetadataDisclaimer } from "@/components/ui/protocol-risk-badge";
import { StrategyDiscovery } from "@/components/strategy/strategy-discovery";

export const metadata: Metadata = {
  title: "Strategies",
  description:
    "Registry-driven discovery of AscendMM strategies on Elysium testnet — deployed idle custody strategies live on-chain, the Kinetiq kHYPE adapter prepared but inactive.",
};

export default function StrategiesPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Strategy registry"
        title="Strategies"
        subtitle="Discovery for AscendMM strategies — deployed contracts read live from Elysium testnet, registry metadata when configured."
      />

      <div className="mt-8">
        <StrategyDiscovery />
      </div>

      <RiskMetadataDisclaimer className="mt-6" />
      <p className="mt-2 text-xs leading-relaxed text-faint">
        The two deployed idle strategies custody-hold their vault&apos;s asset
        and generate no yield — no APY, performance, or dollar TVL is published
        because none exists on-chain. The Kinetiq kHYPE adapter is implemented
        in the protocol repository but is deliberately not deployed and not
        registered on Elysium testnet (chain 99801): kHYPE, the StakingManager,
        and the StakingAccountant have no Elysium addresses, so kHYPE yield is
        not currently available through AscendMM.
      </p>
    </PageContainer>
  );
}
