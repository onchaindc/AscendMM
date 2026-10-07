import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { RiskMetadataDisclaimer } from "@/components/ui/protocol-risk-badge";
import { VaultDiscovery } from "@/components/vault/vault-discovery";

export const metadata: Metadata = {
  title: "Vaults",
  description:
    "Registry-driven discovery of the deployed AscendMM vaults on Elysium testnet — native HYPE and ERC-20 tracks with live on-chain state.",
};

export default function VaultsPage() {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Vault registry"
        title="Vaults"
        subtitle="Discovery for the deployed AscendMM vaults on Elysium testnet — live on-chain state, registry metadata when configured."
      />

      <div className="mt-8">
        <VaultDiscovery />
      </div>

      <RiskMetadataDisclaimer className="mt-6" />
      <p className="mt-2 text-xs leading-relaxed text-faint">
        The native HYPE vault and the ERC-20 asMMT vault are live on Elysium
        Testnet (chain 99801) and transact with the deployed contracts. Total
        assets are read from the vaults themselves; the asMMT asset is a
        TEST-ONLY mock with no value, and the HYPE vault holds native HYPE (no
        ERC-20 approval — deposits carry HYPE as transaction value). No APY,
        performance, or dollar TVL is published: none of it exists on-chain.
        Additional registered vaults appear here once a VaultRegistry address
        is configured for this environment.
      </p>
    </PageContainer>
  );
}
