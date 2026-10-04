"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import type { PerformancePoint } from "@/lib/types";

type Range = "30D" | "90D";

const RANGES: Range[] = ["30D", "90D"];

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PerformancePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const change = point.value - 100;
  return (
    <div className="chart-tooltip rounded-md px-3 py-2">
      <p className="text-[11px] text-faint">{point.label}</p>
      <p className="data mt-0.5 text-sm font-medium text-fg">
        Index {point.value.toFixed(2)}
      </p>
      <p
        className={cn(
          "data text-xs",
          change >= 0 ? "text-positive" : "text-negative",
        )}
      >
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}%
      </p>
    </div>
  );
}

interface VaultPerformanceChartProps {
  series: PerformancePoint[];
}

/** Historical vault performance (normalized index). Mock data for now. */
export function VaultPerformanceChart({ series }: VaultPerformanceChartProps) {
  const [range, setRange] = React.useState<Range>("90D");

  const data = React.useMemo(
    () => (range === "90D" ? series : series.slice(-31)),
    [series, range],
  );

  const first = data[0]?.value ?? 100;
  const last = data[data.length - 1]?.value ?? 100;
  const change = ((last - first) / first) * 100;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
            Index (100 = start)
          </p>
          <span
            className={cn(
              "data text-sm font-medium",
              change >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-md border border-line p-0.5"
          role="group"
          aria-label="Chart range"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                range === r
                  ? "bg-surface-3 text-fg"
                  : "text-faint hover:text-fg",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--color-line)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              minTickGap={48}
            />
            <YAxis
              tick={{ fill: "var(--color-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--color-line-strong)" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              fill="url(#perfFill)"
              dot={false}
              activeDot={{ r: 3, fill: "var(--color-accent)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-faint">
        Series shown is simulated preview data — live vault performance will be
        indexed from Elysium once contracts deploy.
      </p>
    </div>
  );
}
