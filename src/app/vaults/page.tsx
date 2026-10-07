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
        Testnet and transact with the deployed contracts. Total assets are
        read from the vaults themselves; asMMT is a testnet asset with no
        value, and the HYPE vault carries deposits directly as transaction
        value. Additional registered vaults appear here once a VaultRegistry address
        is configured for this environment.
      </p>
    </PageContainer>
  );
}
