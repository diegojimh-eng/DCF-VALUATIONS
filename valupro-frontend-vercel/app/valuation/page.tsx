"use client";
// app/valuation/page.tsx
import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar }             from "@/components/layout/TopBar";
import { MetricCard, PanelHeader, LoadingSpinner, Badge, Select } from "@/components/ui";
import { FootballFieldChart } from "@/components/charts/FootballFieldChart";
import { fmtBig, fmtPrice, fmtRate, fmtPct } from "@/lib/formatters";
import { Play, Info } from "lucide-react";
import type { ValuationSummary } from "@/types/valuation";

const DEMO: ValuationSummary = {
  ticker: "AAPL",
  fair_value: { bear: 158.20, base: 201.40, bull: 249.80, blended: 203.30 },
  enterprise_value: { bear: 2_405_000_000_000, base: 2_982_000_000_000, bull: 3_686_000_000_000 },
  equity_value:     { bear: 2_330_000_000_000, base: 2_907_000_000_000, bull: 3_611_000_000_000 },
  wacc: 0.0912, ke: 0.1119, kd_aftertax: 0.0292,
  terminal_growth_rate: 0.025, pv_tv_pct_base: 0.718,
  sensitivity_range: [164.80, 248.30],
  football_field_ranges: [
    { method: "DCF — Bear",           low: 148, high: 172, midpoint: 160 },
    { method: "DCF — Base",           low: 191, high: 215, midpoint: 203 },
    { method: "DCF — Bull",           low: 235, high: 266, midpoint: 250 },
    { method: "DCF — Full Range",     low: 148, high: 266, midpoint: 207 },
    { method: "Sensitivity (WACC×g)", low: 164, high: 248, midpoint: 206 },
    { method: "Comps — EV/EBITDA",    low: 180, high: 225, midpoint: 202 },
  ],
  price_vs_intrinsic: "UNDERVALUED",
  wacc_formula: "Ke = 4.3% + 1.25 × 5.5% = 11.19%\nKd = 4.08% → 3.06% (after-tax)\nWACC = (97.4%) × 11.19% + (2.6%) × 3.06% = 9.12%",
  warnings: ["Terminal value represents 71.8% of EV."],
};

const SIGNAL_STYLE: Record<string, string> = {
  UNDERVALUED: "text-emerald-400",
  OVERVALUED:  "text-red-400",
  "FAIRLY VALUED": "text-amber-400",
};

// ── Inner component that uses useSearchParams ─────────────────────────────────
function ValuationContent() {
  const searchParams = useSearchParams();
  const paramTicker  = searchParams.get("ticker") ?? "AAPL";

  const [ticker, setTicker]     = useState(paramTicker.toUpperCase());
  const [inputTicker, setInput] = useState(paramTicker.toUpperCase());
  const [tvMethod, setTvMethod] = useState("gordon_growth");
  const [rfRate, setRfRate]     = useState("4.3");
  const [erp, setErp]           = useState("5.5");
  const [tgr, setTgr]           = useState("2.5");
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState<ValuationSummary>(DEMO);

  const run = useCallback(() => {
    setLoading(true);
    setTicker(inputTicker.toUpperCase());
    setTimeout(() => { setData(DEMO); setLoading(false); }, 1200);
  }, [inputTicker]);

  const currentPrice = 175.50;

  return (
    <div className="flex flex-col h-full">
      <TopBar ticker={data.ticker} onRefresh={run} isLoading={loading}>
        <Badge variant={data.price_vs_intrinsic === "UNDERVALUED" ? "green" : data.price_vs_intrinsic === "OVERVALUED" ? "red" : "amber"}>
          {data.price_vs_intrinsic}
        </Badge>
      </TopBar>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-12 h-full">
          {/* Assumptions panel */}
          <aside className="col-span-3 border-r border-slate-800/70 flex flex-col">
            <div className="panel-header border-b border-slate-800/70">
              <span className="text-xs font-semibold text-slate-300">Assumptions</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <label className="section-label">Ticker</label>
                <div className="flex gap-1.5">
                  <input
                    value={inputTicker}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && run()}
                    className="input-field font-data font-bold uppercase flex-1"
                    placeholder="AAPL"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="section-label">WACC Assumptions</div>
                {[
                  { label: "Risk-Free Rate (%)", val: rfRate, set: setRfRate },
                  { label: "Equity Risk Premium (%)", val: erp, set: setErp },
                ].map(({ label, val, set }) => (
                  <div key={label} className="space-y-0.5">
                    <label className="text-[10px] text-slate-500">{label}</label>
                    <input type="number" value={val} onChange={(e) => set(e.target.value)}
                           step="0.1" className="input-field text-xs py-1.5 font-data" />
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="section-label">Terminal Value</div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-500">Method</label>
                  <Select value={tvMethod} onChange={setTvMethod} options={[
                    { value: "gordon_growth", label: "Gordon Growth" },
                    { value: "exit_multiple", label: "Exit Multiple" },
                    { value: "average",       label: "50/50 Average" },
                  ]} className="w-full" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-500">Terminal Growth (%)</label>
                  <input type="number" value={tgr} onChange={(e) => setTgr(e.target.value)}
                         step="0.1" className="input-field text-xs py-1.5 font-data" />
                </div>
              </div>

              <button onClick={run} disabled={loading} className="btn-primary w-full justify-center">
                <Play className="w-3.5 h-3.5" />
                {loading ? "Running DCF…" : "Run Valuation"}
              </button>

              {data.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {data.warnings.map((w, i) => (
                    <div key={i} className="flex gap-1.5 text-[10px] text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded-sm p-2">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="col-span-9 flex flex-col overflow-hidden">
            <div className="grid grid-cols-6 border-b border-slate-800/70 divide-x divide-slate-800/70">
              {[
                { label: "Fair Value (Base)",   value: fmtPrice(data.fair_value.base), accent: true },
                { label: "Fair Value (Blended)", value: fmtPrice(data.fair_value.blended) },
                { label: "EV (Base)",            value: fmtBig(data.enterprise_value.base) },
                { label: "WACC",                 value: fmtRate(data.wacc) },
                { label: "Ke (CAPM)",            value: fmtRate(data.ke) },
                { label: "PV(TV) %",             value: fmtPct(data.pv_tv_pct_base) },
              ].map((k) => (
                <MetricCard key={k.label} {...k} className="rounded-none border-0 border-r-0" />
              ))}
            </div>

            <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-4 text-xs">
              <span className="text-slate-500">Current: <span className="font-data text-slate-300">{fmtPrice(currentPrice)}</span></span>
              <span className="text-slate-500">Upside:
                <span className={`font-data font-semibold ml-1 ${SIGNAL_STYLE[data.price_vs_intrinsic ?? ""]}`}>
                  {fmtPct((data.fair_value.base - currentPrice) / currentPrice)}
                </span>
              </span>
              <span className="text-slate-500">Signal:
                <span className={`font-semibold ml-1 ${SIGNAL_STYLE[data.price_vs_intrinsic ?? ""]}`}>
                  {data.price_vs_intrinsic}
                </span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && <LoadingSpinner label="Running DCF valuation…" />}

              {!loading && (
                <>
                  <div className="panel">
                    <PanelHeader title="Valuation Range — Football Field" sub="Bear · Base · Bull · Sensitivity · Comps">
                      <span className="section-label">Per Share</span>
                    </PanelHeader>
                    <FootballFieldChart ranges={data.football_field_ranges} currentPrice={currentPrice} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(["bear", "base", "bull"] as const).map((s) => {
                      const fv = data.fair_value[s];
                      const ev = data.enterprise_value[s];
                      const eq = data.equity_value[s];
                      const colors = { bear: "border-amber-500/30 bg-amber-500/5", base: "border-blue-500/30 bg-blue-500/5", bull: "border-emerald-500/30 bg-emerald-500/5" }[s];
                      const textColors = { bear: "text-amber-300", base: "text-blue-300", bull: "text-emerald-300" }[s];
                      return (
                        <div key={s} className={`panel border ${colors} p-4`}>
                          <div className={`section-label ${textColors}`}>{s} case</div>
                          <div className={`text-2xl font-bold font-data mt-1 ${textColors}`}>{fmtPrice(fv)}</div>
                          <div className="mt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">EV</span>
                              <span className="font-data text-slate-300">{fmtBig(ev)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Equity</span>
                              <span className="font-data text-slate-300">{fmtBig(eq)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {data.wacc_formula && (
                    <div className="panel">
                      <PanelHeader title="WACC Formula Audit" />
                      <pre className="p-4 text-xs font-data text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {data.wacc_formula}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export wraps content in Suspense (required for useSearchParams on Vercel)
export default function ValuationPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><LoadingSpinner label="Loading…" /></div>}>
      <ValuationContent />
    </Suspense>
  );
}
