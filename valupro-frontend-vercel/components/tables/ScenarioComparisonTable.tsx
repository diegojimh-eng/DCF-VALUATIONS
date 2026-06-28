"use client";
// components/tables/ScenarioComparisonTable.tsx
import { fmtBig, fmtPrice, fmtPct, fmtRate, fmtDeltaPct, deltaClass } from "@/lib/formatters";
import type { ScenarioAnalysis } from "@/types/valuation";

interface Props { data: ScenarioAnalysis; }

export function ScenarioComparisonTable({ data }: Props) {
  const { bear, base, bull, bear_vs_base, bull_vs_base } = data;

  const rows: Array<{
    label: string;
    bear: string; base: string; bull: string;
    bearDelta?: string; bullDelta?: string;
    bearUp?: boolean; bullUp?: boolean;
    divider?: boolean;
  }> = [
    { label: "Enterprise Value",   bear: fmtBig(bear.enterprise_value), base: fmtBig(base.enterprise_value), bull: fmtBig(bull.enterprise_value),   bearDelta: fmtDeltaPct(bear_vs_base.ev_delta_pct),    bullDelta: fmtDeltaPct(bull_vs_base.ev_delta_pct),    bearUp: bear_vs_base.ev_delta_pct >= 0,    bullUp: bull_vs_base.ev_delta_pct >= 0 },
    { label: "Equity Value",       bear: fmtBig(bear.equity_value),     base: fmtBig(base.equity_value),     bull: fmtBig(bull.equity_value),        bearDelta: fmtDeltaPct(bear_vs_base.equity_delta_pct), bullDelta: fmtDeltaPct(bull_vs_base.equity_delta_pct), bearUp: bear_vs_base.equity_delta_pct >= 0, bullUp: bull_vs_base.equity_delta_pct >= 0 },
    { label: "Fair Value / Share", bear: fmtPrice(bear.fair_value_per_share), base: fmtPrice(base.fair_value_per_share), bull: fmtPrice(bull.fair_value_per_share), bearDelta: fmtDeltaPct(bear_vs_base.fvps_delta_pct), bullDelta: fmtDeltaPct(bull_vs_base.fvps_delta_pct), bearUp: false, bullUp: true },
    { label: "", bear: "", base: "", bull: "", divider: true },
    { label: "WACC",               bear: fmtRate(bear.wacc),            base: fmtRate(base.wacc),            bull: fmtRate(bull.wacc) },
    { label: "Terminal Growth",    bear: fmtRate(bear.terminal_growth_rate), base: fmtRate(base.terminal_growth_rate), bull: fmtRate(bull.terminal_growth_rate) },
    { label: "Rev Growth (Y1)",    bear: fmtPct(bear.revenue_growth_y1), base: fmtPct(base.revenue_growth_y1), bull: fmtPct(bull.revenue_growth_y1) },
    { label: "Rev Growth (Y10)",   bear: fmtPct(bear.revenue_growth_y10), base: fmtPct(base.revenue_growth_y10), bull: fmtPct(bull.revenue_growth_y10) },
    { label: "Avg EBITDA Margin",  bear: fmtPct(bear.ebitda_margin_avg), base: fmtPct(base.ebitda_margin_avg), bull: fmtPct(bull.ebitda_margin_avg) },
    { label: "PV(TV) % of EV",    bear: fmtPct(bear.pv_tv_pct),        base: fmtPct(base.pv_tv_pct),        bull: fmtPct(bull.pv_tv_pct) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-3 py-2 w-36">Metric</th>
            <th className="text-right px-3 py-2 text-amber-400">Bear</th>
            <th className="text-right px-3 py-2 text-xs text-slate-500">vs Base</th>
            <th className="text-right px-3 py-2 text-blue-400">Base</th>
            <th className="text-right px-3 py-2 text-emerald-400">Bull</th>
            <th className="text-right px-3 py-2 text-xs text-slate-500">vs Base</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.map((r, i) =>
            r.divider ? (
              <tr key={i}><td colSpan={6} className="py-1"><div className="border-t border-slate-800" /></td></tr>
            ) : (
              <tr key={i} className="tr-hover">
                <td className="px-3 py-2 text-slate-400">{r.label}</td>
                <td className="data-cell px-3 py-2 text-amber-300">{r.bear}</td>
                <td className={`data-cell px-3 py-2 text-xs ${r.bearDelta ? deltaClass(r.bearUp ? 1 : -1) : "text-slate-600"}`}>
                  {r.bearDelta ?? "—"}
                </td>
                <td className="data-cell px-3 py-2 text-slate-100 font-semibold">{r.base}</td>
                <td className="data-cell px-3 py-2 text-emerald-300">{r.bull}</td>
                <td className={`data-cell px-3 py-2 text-xs ${r.bullDelta ? deltaClass(r.bullUp ? 1 : -1) : "text-slate-600"}`}>
                  {r.bullDelta ?? "—"}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
