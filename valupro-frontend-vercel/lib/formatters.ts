// lib/formatters.ts
// Financial number formatting utilities used across all pages.
// All functions are pure and dependency-free.

/** Format full dollar value as $B/$M/$T with 1–2 decimal places */
export function fmtBig(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3)  return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/** Format as share price: $123.45 */
export function fmtPrice(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

/** Format as percentage: 12.3% */
export function fmtPct(value?: number | null, decimals = 1): string {
  if (value == null || isNaN(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format as multiple: 18.5× */
export function fmtMult(value?: number | null, decimals = 1): string {
  if (value == null || isNaN(value)) return "—";
  return `${value.toFixed(decimals)}×`;
}

/** Format as basis points: 95 bps */
export function fmtBps(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  return `${(value * 10000).toFixed(0)} bps`;
}

/** Format as plain decimal ratio: 0.0912 → 9.12% */
export function fmtRate(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

/** Format as compact integer: 15,671,000,000 → 15.67B (shares) */
export function fmtShares(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return `${Math.round(value).toLocaleString()}`;
}

/** Format delta with explicit + sign */
export function fmtDelta(value?: number | null, decimals = 2): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toFixed(decimals)}`;
}

/** Format percent delta with explicit + sign */
export function fmtDeltaPct(value?: number | null): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

/** Classify a numeric delta for colour coding */
export function deltaClass(value?: number | null): string {
  if (value == null) return "text-slate-400";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

/** Heat level (0–4) for sensitivity cell colouring */
export function heatLevel(
  value: number,
  min: number,
  max: number,
  isBase: boolean,
): string {
  if (isBase) return "ring-1 ring-blue-400/60 bg-blue-500/10 text-blue-300";
  if (min === max) return "heat-mid";
  const pct = (value - min) / (max - min);
  if (pct >= 0.8) return "heat-max";
  if (pct >= 0.55) return "heat-high";
  if (pct >= 0.35) return "heat-mid";
  if (pct >= 0.1)  return "heat-low";
  return "heat-min";
}

/** Format a fiscal year label */
export function fmtYear(year: number): string {
  return `FY${year}`;
}
