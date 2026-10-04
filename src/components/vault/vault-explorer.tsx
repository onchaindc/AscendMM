"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { Vault, VaultType } from "@/lib/types";
import { VaultTable } from "@/components/vault/vault-table";
import { VaultCard } from "@/components/vault/vault-card";

const FILTERS: Array<{ value: "All" | VaultType; label: string }> = [
  { value: "All", label: "All" },
  { value: "Volatile", label: "Volatile" },
  { value: "Stable", label: "Stable" },
  { value: "Single-Sided", label: "Single-Sided" },
];

/**
 * Vault explorer: filter chips + responsive presentation.
 * Desktop shows the dense table; below `md` the same vaults render as cards.
 */
export function VaultExplorer({ vaults }: { vaults: Vault[] }) {
  const [filter, setFilter] = React.useState<"All" | VaultType>("All");

  const filtered =
    filter === "All" ? vaults : vaults.filter((v) => v.type === filter);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter vaults by type"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "border-accent/40 bg-accent-muted text-accent"
                  : "border-line bg-transparent text-muted hover:border-line-strong hover:bg-surface-2 hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-faint" aria-live="polite">
          {filtered.length} vault{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-surface">
        <div className="hidden md:block">
          <VaultTable vaults={filtered} />
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-2 md:hidden">
          {filtered.map((vault) => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No vaults match this filter yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
