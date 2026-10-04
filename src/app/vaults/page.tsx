import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { VaultExplorer } from "@/components/vault/vault-explorer";
import { ALL_VAULTS } from "@/lib/vaults";

export const metadata: Metadata = {
  title: "Vaults",
  description:
    "Deploy TEST-ONLY asMMT into the deployed Elysium testnet AscendVault, or explore the upcoming strategy vault lineup.",
};

export default function VaultsPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Liquidity vaults"
        title="Vaults"
        subtitle="Deploy capital into actively managed liquidity strategies."
      />

      <div className="mt-8">
        <VaultExplorer vaults={ALL_VAULTS} />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        The AscendMM Vault entry is live on Elysium Testnet (chain 99801) and
        transacts with the deployed contracts; its underlying asMMT asset is a
        TEST-ONLY mock with no value. The remaining vaults are Phase 1 preview
        entries — not yet deployed.
      </p>
    </PageContainer>
  );
}