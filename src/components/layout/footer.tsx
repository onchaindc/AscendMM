import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/vaults", label: "Vaults" },
  { href: "/strategies", label: "Strategies" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-[15px] font-semibold tracking-tight text-fg">
              Ascend<span className="text-accent">MM</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Professional liquidity and market-making infrastructure for the
              Elysium ecosystem.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Product
            </p>
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Status
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Live on Elysium Testnet (chain 99801). The deployed AscendVault
              accepts the TEST-ONLY asMMT mock asset — a safe environment to
              test deposits and redemptions end to end. Remaining interfaces
              are Phase 1 previews with demo data.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} AscendMM. Elysium Testnet.
          </p>
          <p className="text-xs text-faint">
            Elysium Testnet · TEST-ONLY asMMT (mock asset, no value) · Nothing on this site is financial advice
          </p>
        </div>
      </div>
    </footer>
  );
}
