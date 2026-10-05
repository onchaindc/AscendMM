import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { VaultExplorer } from "@/components/vault/vault-explorer";
import { ALL_VAULTS } from "@/lib/vaults";

export const metadata: Metadata = {
  title: "Vaults",
  description:
    "Deposit native HYPE or TEST-ONLY asMMT into the deployed Elysium testnet AscendMM vaults, or explore the upcoming strategy vault lineup.",
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
        The AscendMM Vault and the AscendMM HYPE Vault entries are live on
        Elysium Testnet (chain 99801) and transact with the deployed contracts;
        the asMMT asset is a TEST-ONLY mock with no value, and the HYPE vault
        holds native HYPE (no ERC-20 approval — deposits carry HYPE as
        transaction value). The remaining vaults are Phase 1 preview entries —
        not yet deployed.
      </p>
    </PageContainer>
  );
}