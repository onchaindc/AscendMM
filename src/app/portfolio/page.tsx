import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track your asMMT balance and asMMV shares in the deployed Elysium testnet vault.",
};

export default function PortfolioPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Capital"
        title="Your Portfolio"
        subtitle="Your asMMT balance and asMMV position in the deployed Elysium testnet vault."
      />

      <div className="mt-8">
        <PortfolioView />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        Live on-chain data from Elysium Testnet (chain 99801). asMMT is a
        TEST-ONLY mock asset with no value. Historical cost-basis and PnL
        tracking will be added with the protocol indexer.
      </p>
    </PageContainer>
  );
}
