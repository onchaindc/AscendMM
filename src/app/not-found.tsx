import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export default function NotFound() {
  return (
    <PageContainer className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          This page doesn&apos;t exist yet. 
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you requested is not part of the AscendMM preview. Return to
          the vault explorer to continue.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild>
            <Link href="/vaults">Explore Vaults</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}