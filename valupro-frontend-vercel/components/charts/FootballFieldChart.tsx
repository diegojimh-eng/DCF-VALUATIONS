"use client";
// components/charts/FootballFieldChart.tsx
import { fmtPrice } from "@/lib/formatters";
import type { ValuationRange } from "@/types/valuation";

interface Props {
  ranges: ValuationRange[];
  currentPrice?: number;
  height?: number;
}

const METHOD_COLORS: Record<string, string> = {
  "DCF — Bear":       "bg-amber-500/30 border-amber-500/50",
  "DCF — Base":       "bg-blue-500/30 border-blue-500/50",
  "DCF — Bull":       "bg-emerald-500/30 border-emerald-500/50",
  "DCF — Full Range": "bg-slate-600/30 border-slate-500/50",
  "Sensitivity (WACC × g)": "bg-purple-500/20 border-purple-500/40",
};

const DEFAULT_COLOR = "bg-slate-600/30 border-slate-500/50";

export function FootballFieldChart({ ranges, currentPrice }: Props) {
  if (!ranges.length) return null;

  // Find global min/max for scale
  const allVals = ranges.flatMap((r) => [r.low, r.high]);
  if (currentPrice) allVals.push(currentPrice);
  const scale_min = Math.min(...allVals) * 0.92;
  const scale_max = Math.max(...allVals) * 1.08;
  const span = scale_max - scale_min;

  const pct = (v: number) => `${(((v - scale_min) / span) * 100).toFixed(2)}%`;

  return (
    <div className="space-y-2.5 px-4 py-3">
      {ranges.map((r) => {
        const color = METHOD_COLORS[r.method] ?? DEFAULT_COLOR;
        const leftPct  = ((r.low  - scale_min) / span) * 100;
        const widthPct = ((r.high - r.low)     / span) * 100;
        return (
          <div key={r.method} className="flex items-center gap-3">
            {/* Method label */}
            <div className="w-36 flex-shrink-0 text-right">
              <span className="text-xs text-slate-400 leading-none">{r.method}</span>
            </div>

            {/* Bar track */}
            <div className="flex-1 relative h-7 bg-slate-800/40 rounded-sm overflow-visible">
              {/* Range bar */}
              <div
                className={`absolute top-1 bottom-1 rounded-sm border ${color}`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "2px" }}
              />
              {/* Midpoint tick */}
              <div
                className="absolute top-0 bottom-0 w-px bg-slate-300/40"
                style={{ left: pct(r.midpoint) }}
              />
              {/* Current price line */}
              {currentPrice && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10"
                  style={{ left: pct(currentPrice) }}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-blue-400 whitespace-nowrap">
                    {fmtPrice(currentPrice)}
                  </div>
                </div>
              )}
            </div>

            {/* Range values */}
            <div className="w-28 flex-shrink-0 flex justify-between">
              <span className="text-xs font-data text-slate-400">{fmtPrice(r.low)}</span>
              <span className="text-xs font-data text-slate-300 font-medium">{fmtPrice(r.high)}</span>
            </div>
          </div>
        );
      })}

      {/* X-axis labels */}
      <div className="flex items-center gap-3 mt-1">
        <div className="w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          <span className="text-[10px] text-slate-600">{fmtPrice(scale_min)}</span>
          <span className="text-[10px] text-slate-600">{fmtPrice((scale_min + scale_max) / 2)}</span>
          <span className="text-[10px] text-slate-600">{fmtPrice(scale_max)}</span>
        </div>
        <div className="w-28 flex-shrink-0" />
      </div>
    </div>
  );
}
