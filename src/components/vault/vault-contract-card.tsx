import { ShieldAlert, CircleCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { shortenAddress } from "@/lib/format";
import { elysiumExplorerAddressUrl } from "@/lib/elysium";
import type { VaultContractInfo } from "@/lib/types";

function ContractRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="data text-sm text-fg">{shortenAddress(value, 6)}</span>
        <CopyButton value={value} label={`Copy ${label}`} />
      </span>
    </div>
  );
}

function ContractLinkRow({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <a
          href={elysiumExplorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="data text-sm text-accent transition-colors hover:text-accent-hover"
        >
          {shortenAddress(address, 6)}
        </a>
        <CopyButton value={address} label={`Copy ${label}`} />
      </span>
    </div>
  );
}

/**
 * Contract reference for the vault. The live testnet vault shows its real,
 * explorer-linked addresses; preview entries keep the "not deployed" state.
 */
export function VaultContractCard({ contract }: { contract: VaultContractInfo }) {
  const isLive = contract.status.startsWith("Live");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-line">
          {isLive ? (
            <ContractLinkRow label="Vault contract" address={contract.vaultAddress} />
          ) : (
            <ContractRow label="Vault contract" value={contract.vaultAddress} />
          )}
          <ContractRow label="Underlying asset" value={contract.underlyingAddress} />
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-muted">Network</span>
            <span className="text-sm text-fg">{contract.network}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-muted">Standard</span>
            <span className="text-sm text-fg">{contract.standard}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <span className="text-sm text-muted">Contract status</span>
            {isLive ? (
              <Badge variant="positive" className="gap-1.5">
                <CircleCheck className="size-3" />
                {contract.status}
              </Badge>
            ) : (
              <Badge variant="muted" className="gap-1.5 border-line-strong">
                <ShieldAlert className="size-3 text-warning" />
                {contract.status}
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          {isLive
            ? "Live contract addresses on Elysium Testnet. asMMT is a testnet asset with no value."
            : "Addresses shown are placeholders for this preview entry. Verified contract addresses will appear here once the vault is deployed to Elysium Testnet."}
        </p>
      </CardContent>
    </Card>
  );
}
