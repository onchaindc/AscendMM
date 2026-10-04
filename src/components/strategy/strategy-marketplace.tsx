"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { RiskLevel, Strategy, Vault } from "@/lib/types";
import { StrategyCard } from "@/components/strategy/strategy-card";

type RiskFilter = "All" | RiskLevel;
type SortValue = "return" | "managed" | "vaults";

const RISK_FILTERS: RiskFilter[] = ["All", "Low", "Moderate", "Elevated"];

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "return", label: "Highest return" },
  { value: "managed", label: "Most managed" },
  { value: "vaults", label: "Most vaults" },
];

interface StrategyMarketplaceProps {
  strategies: Strategy[];
  vaults: Vault[];
}

/** Strategy grid with a light risk filter and sort control. */
export function StrategyMarketplace({ strategies, vaults }: StrategyMarketplaceProps) {
  const [riskFilter, setRiskFilter] = React.useState<RiskFilter>("All");
  const [sort, setSort] = React.useState<SortValue>("return");

  const visible = React.useMemo(() => {
    const filtered =
      riskFilter === "All"
        ? strategies
        : strategies.filter((s) => s.risk === riskFilter);

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "return":
          return b.return30d - a.return30d;
        case "managed":
          return b.tvlManaged - a.tvlManaged;
        case "vaults":
          return b.vaultCount - a.vaultCount;
      }
    });

    return sorted;
  }, [strategies, riskFilter, sort]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter strategies by risk"
        >
          {RISK_FILTERS.map((risk) => (
            <button
              key={risk}
              type="button"
              onClick={() => setRiskFilter(risk)}
              aria-pressed={riskFilter === risk}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                riskFilter === risk
                  ? "border-accent/40 bg-accent-muted text-accent"
                  : "border-line text-muted hover:border-line-strong hover:bg-surface-2 hover:text-fg",
              )}
            >
              {risk === "All" ? "All risk" : risk}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="strategy-sort" className="text-xs text-faint">
            Sort
          </label>
          <select
            id="strategy-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-fg transition-colors hover:border-line-strong focus:border-accent/50 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            vaults={vaults.filter((v) => strategy.vaultIds.includes(v.id))}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-5 rounded-lg border border-line bg-surface p-10 text-center text-sm text-muted">
          No strategies match this risk filter yet.
        </div>
      ) : null}
    </div>
  );
}
