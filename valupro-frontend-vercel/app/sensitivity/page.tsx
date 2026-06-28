"use client";
// app/sensitivity/page.tsx
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MetricCard, PanelHeader, Badge, Tabs } from "@/components/ui";
import { SensitivityHeatmap } from "@/components/charts/SensitivityHeatmap";
import { ScenarioComparisonTable } from "@/components/tables/ScenarioComparisonTable";
import { ScenarioFCFFChart } from "@/components/charts/FCFFChart";
import { fmtPrice, fmtBig, fmtPct } from "@/lib/formatters";
import type { SensitivityMatrix, ScenarioAnalysis } from "@/types/valuation";

// ── Demo sensitivity matrix (9 WACC × 5 growth) ───────────────────────────────

const WACC_VALS  = [0.070, 0.075, 0.080, 0.085, 0.090, 0.095, 0.100, 0.105, 0.110];
const G_VALS     = [0.015, 0.020, 0.025, 0.030, 0.035];
const BASE_WACC  = 0.0912;
const BASE_G     = 0.025;

// Generate realistic FVPS values: higher at low WACC+high g, lower at high WACC+low g
function fvps(w: number, g: number): number {
  const spread = w - g;
  if (spread < 0.005) return 0;
  const tv_mult = (1 + g) / spread;
  const fcff_n  = 193_931_000_000;
  const tv      = fcff_n * tv_mult;
  const pv_tv   = tv / (1 + w) ** 10;
  const pv_fcff = 99_000_000_000 * (1 - (1 / (1 + w)) ** 10) / w * 1.04;
  const ev      = pv_fcff + pv_tv;
  return Math.max(0, (ev - 74_800_000_000) / 15_671_000_000);
}

const FVPS_GRID   = WACC_VALS.map((w) => G_VALS.map((g) => fvps(w, g)));
const EV_GRID     = WACC_VALS.map((w) => G_VALS.map((g) => fvps(w, g) * 15_671_000_000 + 74_800_000_000));
const EQ_GRID     = WACC_VALS.map((w) => G_VALS.map((g) => Math.max(0, fvps(w, g) * 15_671_000_000)));
const BASE_FVPS   = fvps(BASE_WACC, BASE_G);
const BASE_EV     = BASE_FVPS * 15_671_000_000 + 74_800_000_000;

const MATRIX: SensitivityMatrix = {
  ticker: "AAPL",
  valuation_date: new Date().toISOString(),
  wacc_values:  WACC_VALS,
  growth_values: G_VALS,
  base_wacc: BASE_WACC,
  base_growth_rate: BASE_G,
  base_enterprise_value: BASE_EV,
  base_equity_value: BASE_FVPS * 15_671_000_000,
  base_fair_value_per_share: BASE_FVPS,
  net_debt: 74_800_000_000,
  shares_outstanding: 15_671_000_000,
  enterprise_value_matrix: EV_GRID,
  equity_value_matrix: EQ_GRID,
  fair_value_matrix: FVPS_GRID,
  ev_pct_vs_base_matrix: FVPS_GRID.map((row) => row.map((v) => (v - BASE_FVPS) / BASE_FVPS)),
  fvps_range: [
    Math.min(...FVPS_GRID.flat().filter((v) => v > 0)),
    Math.max(...FVPS_GRID.flat()),
  ],
  ev_range: [
    Math.min(...EV_GRID.flat().filter((v) => v > 0)),
    Math.max(...EV_GRID.flat()),
  ],
};

// ── Demo scenario analysis ────────────────────────────────────────────────────

const makeScenario = (mult: number, scenario: "bear"|"base"|"bull") => {
  const fvps_val = BASE_FVPS * mult;
  const ev_val   = fvps_val * 15_671_000_000 + 74_800_000_000;
  const eq_val   = fvps_val * 15_671_000_000;
  return {
    scenario,
    label: { bear: "Bear Case", base: "Base Case", bull: "Bull Case" }[scenario],
    enterprise_value:   ev_val,
    equity_value:       eq_val,
    fair_value_per_share: fvps_val,
    sum_pv_fcff:        eq_val * 0.28,
    pv_terminal_value:  eq_val * 0.72,
    pv_tv_pct:          0.718,
    wacc:               BASE_WACC,
    terminal_growth_rate: BASE_G,
    revenue_growth_y1:  0.06 * mult,
    revenue_growth_y10: 0.04 * mult,
    ebitda_margin_avg:  0.30 + (mult - 1) * 0.05,
    fcff_y1:            99_000_000_000 * mult,
    fcff_y10:           193_931_000_000 * mult,
    net_debt:           74_800_000_000,
    shares_outstanding: 15_671_000_000,
    warnings:           [],
  };
};

const SCENARIO_ANALYSIS: ScenarioAnalysis = {
  ticker: "AAPL",
  valuation_date: new Date().toISOString(),
  bear: makeScenario(0.785, "bear"),
  base: makeScenario(1.000, "base"),
  bull: makeScenario(1.240, "bull"),
  bear_vs_base: {
    ev_delta: -635_000_000_000, ev_delta_pct: -0.213,
    equity_delta: -635_000_000_000, equity_delta_pct: -0.218,
    fvps_delta: -43.2, fvps_delta_pct: -0.215,
  },
  bull_vs_base: {
    ev_delta: +716_000_000_000, ev_delta_pct: +0.240,
    equity_delta: +716_000_000_000, equity_delta_pct: +0.246,
    fvps_delta: +48.3, fvps_delta_pct: +0.240,
  },
  blended: {
    fair_value_per_share: BASE_FVPS * (0.25 * 0.785 + 0.50 * 1.00 + 0.25 * 1.24),
    enterprise_value: BASE_EV,
    equity_value: BASE_FVPS * 15_671_000_000,
    weights: { bear: 0.25, base: 0.50, bull: 0.25 },
  },
  scenario_range: [BASE_FVPS * 0.785, BASE_FVPS * 1.24],
  current_price: 175.50,
  price_vs_base: "UNDERVALUED",
  price_vs_blended: "UNDERVALUED",
  tornado: [
    { assumption: "Revenue Growth + EBITDA Margin", bear_price: BASE_FVPS * 0.785, bull_price: BASE_FVPS * 1.240, base_price: BASE_FVPS, bear_delta: BASE_FVPS * -0.215, bull_delta: BASE_FVPS * 0.240, total_range: BASE_FVPS * 0.455 },
    { assumption: "WACC (±100 bps)",                bear_price: BASE_FVPS * 0.870, bull_price: BASE_FVPS * 1.150, base_price: BASE_FVPS, bear_delta: BASE_FVPS * -0.130, bull_delta: BASE_FVPS * 0.150, total_range: BASE_FVPS * 0.280 },
    { assumption: "Terminal Growth Rate (±50 bps)", bear_price: BASE_FVPS * 0.930, bull_price: BASE_FVPS * 1.075, base_price: BASE_FVPS, bear_delta: BASE_FVPS * -0.070, bull_delta: BASE_FVPS * 0.075, total_range: BASE_FVPS * 0.145 },
  ],
};

const YEARS = [2024,2025,2026,2027,2028,2029,2030,2031,2032,2033];
const BASE_FCFFS = YEARS.map((_, i) => 99_000_000_000 * 1.08 ** (i + 1));
const BEAR_FCFFS = BASE_FCFFS.map((f) => f * 0.785);
const BULL_FCFFS = BASE_FCFFS.map((f) => f * 1.24);

export default function SensitivityPage() {
  const [tab, setTab] = useState("heatmap");

  return (
    <div className="flex flex-col h-full">
      <TopBar ticker="AAPL">
        <Badge variant="blue">9×5 grid</Badge>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <MetricCard label="Base FVPS"       value={fmtPrice(BASE_FVPS)} accent />
          <MetricCard label="Sensitivity Low"  value={fmtPrice(MATRIX.fvps_range[0])} sub="High WACC, Low g" />
          <MetricCard label="Sensitivity High" value={fmtPrice(MATRIX.fvps_range[1])} sub="Low WACC, High g" />
          <MetricCard label="Bear Scenario"    value={fmtPrice(SCENARIO_ANALYSIS.bear.fair_value_per_share)} sub="-21.5% vs Base" deltaUp={false} delta="-21.5%" />
          <MetricCard label="Bull Scenario"    value={fmtPrice(SCENARIO_ANALYSIS.bull.fair_value_per_share)} sub="+24.0% vs Base" deltaUp delta="+24.0%" />
        </div>

        {/* Tabs */}
        <div className="panel">
          <div className="border-b border-slate-800">
            <Tabs
              tabs={[
                { id: "heatmap",  label: "WACC × g Heatmap" },
                { id: "scenarios",label: "Scenario Comparison" },
                { id: "tornado",  label: "Tornado Chart" },
                { id: "fcff",     label: "Scenario FCFF" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab === "heatmap" && <SensitivityHeatmap matrix={MATRIX} />}

          {tab === "scenarios" && <ScenarioComparisonTable data={SCENARIO_ANALYSIS} />}

          {tab === "tornado" && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500 mb-4">
                Bars show the impact of each assumption on the Base Case fair value per share.
                Sorted by total range (largest first).
              </p>
              {SCENARIO_ANALYSIS.tornado.map((item) => {
                const base    = item.base_price;
                const allVals = [item.bear_price, item.bull_price];
                const scaleMin = Math.min(...allVals) * 0.95;
                const scaleMax = Math.max(...allVals) * 1.05;
                const span     = scaleMax - scaleMin;
                const bearLeft  = ((item.bear_price - scaleMin) / span) * 100;
                const bullLeft  = ((item.bull_price  - scaleMin) / span) * 100;
                const basePct   = ((base            - scaleMin) / span) * 100;
                return (
                  <div key={item.assumption} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{item.assumption}</span>
                      <span className="font-data text-slate-500">Range: {fmtPrice(item.bear_price)} – {fmtPrice(item.bull_price)}</span>
                    </div>
                    <div className="relative h-8 bg-slate-800/40 rounded-sm">
                      {/* Bear side */}
                      <div className="absolute top-1 bottom-1 bg-amber-500/25 rounded-l-sm"
                           style={{ left: `${bearLeft}%`, right: `${100 - basePct}%` }} />
                      {/* Bull side */}
                      <div className="absolute top-1 bottom-1 bg-emerald-500/25 rounded-r-sm"
                           style={{ left: `${basePct}%`, right: `${100 - bullLeft}%` }} />
                      {/* Base line */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400/80"
                           style={{ left: `${basePct}%` }} />
                      {/* Labels */}
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <span className="text-[10px] font-data text-amber-300">{fmtPrice(item.bear_price)}</span>
                        <span className="text-[10px] font-data text-emerald-300">{fmtPrice(item.bull_price)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "fcff" && (
            <div className="p-4">
              <ScenarioFCFFChart
                bear={BEAR_FCFFS}
                base={BASE_FCFFS}
                bull={BULL_FCFFS}
                years={YEARS}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
