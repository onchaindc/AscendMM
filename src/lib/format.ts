/**
 * Formatting helpers for financial values.
 * Kept framework-free so both server and client components can use them.
 */

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsdCompact(value: number): string {
  return usdCompact.format(value);
}

export function formatUsdCents(value: number): string {
  return usdCents.format(value);
}

export function formatCompact(value: number): string {
  return numberCompact.format(value);
}

/** Signed percentage, e.g. "+2.14%" / "-0.31%" */
export function formatDelta(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Unsigned percentage, e.g. "18.42%" */
export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

/** Tone class for signed financial values. */
export function deltaTone(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

/** Shortens an address for display, e.g. "0x3f9c…d5e7". */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/**
 * Formats a raw on-chain bigint amount (18 decimals) as a human string,
 * e.g. 1234500000000000000000n → "1,234.5". Returns an em dash for undefined.
 */
export function formatTokenAmount(value: bigint | undefined, decimals = 18): string {
  if (value === undefined) return "—";
  const whole = value / 10n ** BigInt(decimals);
  const fraction = value % 10n ** BigInt(decimals);
  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")
    .slice(0, 6);
  const wholeStr = whole.toLocaleString("en-US");
  return fractionStr ? `${wholeStr}.${fractionStr}` : wholeStr;
}
