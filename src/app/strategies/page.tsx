import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { StrategyMarketplace } from "@/components/strategy/strategy-marketplace";
import { MOCK_STRATEGIES, MOCK_VAULTS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Strategies",
  description:
    "Explore the engines managing AscendMM liquidity. Preview data only.",
};

export default function StrategiesPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Strategy marketplace"
        title="Strategies"
        subtitle="Explore the engines managing AscendMM liquidity."
      />

      <div className="mt-8">
        {/* ⚠️ Mock strategies + vaults. Replaced by API/contract data later. */}
        <StrategyMarketplace strategies={MOCK_STRATEGIES} vaults={MOCK_VAULTS} />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        Returns and managed capital shown are illustrative examples. No
        strategy is executing on-chain in this phase.
      </p>
    </PageContainer>
  );
}