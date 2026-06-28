"use client";
// app/comps/page.tsx
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MetricCard, PanelHeader, Badge, Tabs } from "@/components/ui";
import { PeerCompsTable } from "@/components/tables/PeerCompsTable";
import { FootballFieldChart } from "@/components/charts/FootballFieldChart";
import { fmtBig, fmtPrice, fmtMult, fmtPct } from "@/lib/formatters";
import type { CompsResult, PeerTableRow } from "@/types/valuation";

// ── Demo data ─────────────────────────────────────────────────────────────────

const PEERS: PeerTableRow[] = [
  { ticker: "MSFT", company_name: "Microsoft",    market_cap: 3_100e9, enterprise_value: 3_000e9, ev_revenue: 12.5, ev_ebitda: 26.8, ev_ebit: 30.2, pe_ratio: 35.1, pb_ratio: 13.2, ebitda_margin: 0.50, revenue_growth_1y: 0.16, is_excluded: false, exclusion_reasons: [] },
  { ticker: "GOOG", company_name: "Alphabet",     market_cap: 2_180e9, enterprise_value: 2_050e9, ev_revenue: 5.8,  ev_ebitda: 18.3, ev_ebit: 22.0, pe_ratio: 27.4, pb_ratio: 6.5,  ebitda_margin: 0.32, revenue_growth_1y: 0.09, is_excluded: false, exclusion_reasons: [] },
  { ticker: "META", company_name: "Meta",         market_cap: 1_310e9, enterprise_value: 1_220e9, ev_revenue: 7.2,  ev_ebitda: 20.1, ev_ebit: 24.5, pe_ratio: 30.0, pb_ratio: 7.8,  ebitda_margin: 0.37, revenue_growth_1y: 0.16, is_excluded: false, exclusion_reasons: [] },
  { ticker: "AMZN", company_name: "Amazon",       market_cap: 1_940e9, enterprise_value: 2_010e9, ev_revenue: 3.1,  ev_ebitda: 22.5, ev_ebit: 35.0, pe_ratio: 62.0, pb_ratio: 10.1, ebitda_margin: 0.14, revenue_growth_1y: 0.12, is_excluded: false, exclusion_reasons: [] },
  { ticker: "NVDA", company_name: "Nvidia",       market_cap: 2_680e9, enterprise_value: 2_670e9, ev_revenue: 25.0, ev_ebitda: 45.0, ev_ebit: 50.0, pe_ratio: 65.0, pb_ratio: 30.0, ebitda_margin: 0.55, revenue_growth_1y: 1.22, is_excluded: true,  exclusion_reasons: ["ev_ebitda: IQR outlier (45.0×)"] },
  { ticker: "CRM",  company_name: "Salesforce",   market_cap: 290e9,   enterprise_value: 280e9,   ev_revenue: 6.8,  ev_ebitda: 24.0, ev_ebit: 28.0, pe_ratio: 55.0, pb_ratio: 3.9,  ebitda_margin: 0.28, revenue_growth_1y: 0.11, is_excluded: false, exclusion_reasons: [] },
  { ticker: "ORCL", company_name: "Oracle",       market_cap: 380e9,   enterprise_value: 420e9,   ev_revenue: 6.0,  ev_ebitda: 18.0, ev_ebit: 20.0, pe_ratio: 22.0, pb_ratio: 7.0,  ebitda_margin: 0.33, revenue_growth_1y: 0.09, is_excluded: false, exclusion_reasons: [] },
  { ticker: "ADBE", company_name: "Adobe",        market_cap: 235e9,   enterprise_value: 230e9,   ev_revenue: 9.5,  ev_ebitda: 28.0, ev_ebit: 32.0, pe_ratio: 40.0, pb_ratio: 14.0, ebitda_margin: 0.34, revenue_growth_1y: 0.10, is_excluded: false, exclusion_reasons: [] },
  { ticker: "AAPL", company_name: "Apple Inc.",   market_cap: 2_750e9, enterprise_value: 2_820e9, ev_revenue: 7.4,  ev_ebitda: 22.4, ev_ebit: 24.7, pe_ratio: 28.6, pb_ratio: 46.2, ebitda_margin: 0.33, revenue_growth_1y: 0.02, is_excluded: false, exclusion_reasons: [] },
];

const STATS = [
  { multiple: "EV/Revenue",  median: 7.15,  mean: 8.24,  q1: 5.90,  q3: 10.50, n_peers: 7, implied_price_median: 198.20, implied_price_q1: 155.40, implied_price_q3: 241.80 },
  { multiple: "EV/EBITDA",   median: 22.50, mean: 23.95, q1: 19.15, q3: 27.40, n_peers: 7, implied_price_median: 202.30, implied_price_q1: 165.20, implied_price_q3: 239.80 },
  { multiple: "EV/EBIT",     median: 27.10, mean: 29.33, q1: 23.00, q3: 31.10, n_peers: 7, implied_price_median: 195.60, implied_price_q1: 158.30, implied_price_q3: 230.10 },
  { multiple: "P/E",         median: 32.55, mean: 36.91, q1: 26.70, q3: 42.20, n_peers: 7, implied_price_median: 199.50, implied_price_q1: 163.60, implied_price_q3: 258.80 },
  { multiple: "P/B",         median: 9.65,  mean: 10.07, q1: 6.75,  q3: 13.60, n_peers: 7, implied_price_median: 38.20,  implied_price_q1: 26.70,  implied_price_q3: 53.90  },
];

const FOOTBALL: Array<{method:string;low:number;high:number;midpoint:number}> = [
  { method: "Comps — EV/Revenue",  low: 155, high: 242, midpoint: 198 },
  { method: "Comps — EV/EBITDA",   low: 165, high: 240, midpoint: 202 },
  { method: "Comps — EV/EBIT",     low: 158, high: 230, midpoint: 196 },
  { method: "Comps — P/E",         low: 164, high: 259, midpoint: 200 },
];

export default function CompsPage() {
  const [tab, setTab] = useState("peers");

  return (
    <div className="flex flex-col h-full">
      <TopBar ticker="AAPL">
        <Badge variant="slate">7 peers · 1 excluded</Badge>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Summary KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <MetricCard label="EV/EBITDA Median" value={fmtMult(22.50)} sub="7 clean peers" accent />
          <MetricCard label="Implied (Median)"  value={fmtPrice(202.30)} sub="EV/EBITDA basis" />
          <MetricCard label="Implied Range"     value={`${fmtPrice(155)} – ${fmtPrice(260)}`} sub="Q1–Q3 across multiples" />
          <MetricCard label="Current Price"     value={fmtPrice(175.50)} sub="Market price" />
          <MetricCard label="Upside (Median)"   value="+15.3%" sub="vs EV/EBITDA median" deltaUp />
        </div>

        {/* Tabs */}
        <div className="panel">
          <div className="border-b border-slate-800">
            <Tabs
              tabs={[
                { id: "peers",    label: "Peer Companies" },
                { id: "stats",    label: "Multiple Statistics" },
                { id: "football", label: "Implied Value Ranges" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab === "peers" && (
            <PeerCompsTable rows={PEERS} subjectTicker="AAPL" />
          )}

          {tab === "stats" && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-2.5">Multiple</th>
                    <th className="text-right px-4 py-2.5">Min</th>
                    <th className="text-right px-4 py-2.5 text-blue-400">Q1</th>
                    <th className="text-right px-4 py-2.5 font-bold text-white">Median</th>
                    <th className="text-right px-4 py-2.5 text-slate-300">Mean</th>
                    <th className="text-right px-4 py-2.5 text-blue-400">Q3</th>
                    <th className="text-right px-4 py-2.5">Max</th>
                    <th className="text-right px-4 py-2.5">n</th>
                    <th className="text-right px-4 py-2.5 border-l border-slate-800">Price (Q1)</th>
                    <th className="text-right px-4 py-2.5 font-bold text-white">Price (Med)</th>
                    <th className="text-right px-4 py-2.5">Price (Q3)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {STATS.map((r) => (
                    <tr key={r.multiple} className={r.multiple === "EV/EBITDA" ? "bg-blue-500/5" : "tr-hover"}>
                      <td className="px-4 py-2.5 font-semibold text-slate-200">
                        {r.multiple}
                        {r.multiple === "EV/EBITDA" && <span className="badge-blue ml-2">Primary</span>}
                      </td>
                      <td className="data-cell px-4 py-2.5 text-slate-500">{fmtMult((r.q1 + r.median) / 2 * 0.6)}</td>
                      <td className="data-cell px-4 py-2.5 text-blue-400">{fmtMult(r.q1)}</td>
                      <td className="data-cell px-4 py-2.5 text-white font-bold">{fmtMult(r.median)}</td>
                      <td className="data-cell px-4 py-2.5 text-slate-300">{fmtMult(r.mean)}</td>
                      <td className="data-cell px-4 py-2.5 text-blue-400">{fmtMult(r.q3)}</td>
                      <td className="data-cell px-4 py-2.5 text-slate-500">{fmtMult(r.q3 * 1.4)}</td>
                      <td className="data-cell px-4 py-2.5 text-slate-600">{r.n_peers}</td>
                      <td className="data-cell px-4 py-2.5 text-slate-400 border-l border-slate-800">{fmtPrice(r.implied_price_q1)}</td>
                      <td className="data-cell px-4 py-2.5 text-white font-bold">{fmtPrice(r.implied_price_median)}</td>
                      <td className="data-cell px-4 py-2.5 text-slate-400">{fmtPrice(r.implied_price_q3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "football" && (
            <>
              <FootballFieldChart ranges={FOOTBALL} currentPrice={175.50} />
              <div className="px-4 pb-3 text-xs text-slate-500">
                Bars represent Q1–Q3 range of implied share price. Midpoint = median-implied price.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
