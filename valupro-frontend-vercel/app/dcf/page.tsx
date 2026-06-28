"use client";
// app/dcf/page.tsx
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MetricCard, PanelHeader, Badge, Tabs } from "@/components/ui";
import { DCFScheduleTable } from "@/components/tables/DCFScheduleTable";
import { FCFFChart } from "@/components/charts/FCFFChart";
import { fmtBig, fmtPrice, fmtRate, fmtPct } from "@/lib/formatters";

// ── Demo data ─────────────────────────────────────────────────────────────────

const WACC = 0.0912;
const G    = 0.025;

const SCHEDULE = Array.from({ length: 10 }, (_, i) => {
  const growth = 1.08 ** (i + 1);
  const fcff   = 99_000_000_000 * growth;
  const df     = 1 / (1 + WACC) ** (i + 1);
  return {
    year_index:     i + 1,
    fiscal_year:    2024 + i,
    fcff,
    discount_factor: df,
    pv_fcff:        fcff * df,
  };
});

const SUM_PV  = SCHEDULE.reduce((a, r) => a + r.pv_fcff, 0);
const TV      = SCHEDULE[9].fcff * (1 + G) / (WACC - G);
const PV_TV   = TV / (1 + WACC) ** 10;
const EV      = SUM_PV + PV_TV;
const NET_DEBT = 74_800_000_000;
const EQUITY  = EV - NET_DEBT;
const SHARES  = 15_671_000_000;
const FVPS    = EQUITY / SHARES;

const CHART_DATA = SCHEDULE.map((r) => ({
  year:    r.fiscal_year,
  fcff:    r.fcff,
  pv_fcff: r.pv_fcff,
}));

export default function DCFPage() {
  const [tab, setTab] = useState("schedule");

  return (
    <div className="flex flex-col h-full">
      <TopBar ticker="AAPL">
        <Badge variant="blue">Gordon Growth</Badge>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Header KPIs */}
        <div className="grid grid-cols-6 gap-3">
          <MetricCard label="Σ PV(FCFF)"         value={fmtBig(SUM_PV)}   sub={`${fmtPct(SUM_PV / EV)} of EV`} />
          <MetricCard label="PV(Terminal Value)"  value={fmtBig(PV_TV)}    sub={`${fmtPct(PV_TV / EV)} of EV`} accent />
          <MetricCard label="Enterprise Value"    value={fmtBig(EV)} />
          <MetricCard label="− Net Debt"          value={fmtBig(NET_DEBT)}  sub="Deducted" />
          <MetricCard label="Equity Value"        value={fmtBig(EQUITY)} />
          <MetricCard label="Fair Value / Share"  value={fmtPrice(FVPS)}   accent />
        </div>

        {/* EV bridge visual */}
        <div className="panel">
          <PanelHeader title="Enterprise Value Bridge" sub="DCF method · Year-end convention" />
          <div className="p-4 flex items-center gap-0 text-sm">
            {[
              { label: "Σ PV(FCFF)",  value: fmtBig(SUM_PV),  color: "bg-blue-600",    width: `${(SUM_PV / EV * 100).toFixed(0)}%` },
              { label: "PV(TV)",      value: fmtBig(PV_TV),   color: "bg-blue-400",    width: `${(PV_TV  / EV * 100).toFixed(0)}%` },
            ].map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-1" style={{ width: bar.width }}>
                <div className={`${bar.color} h-8 w-full rounded-sm`} />
                <div className="text-[10px] text-slate-400 text-center">{bar.label}</div>
                <div className="text-[10px] font-data text-slate-300 text-center">{bar.value}</div>
              </div>
            ))}
            <div className="mx-4 text-slate-600 text-lg">=</div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="bg-slate-700 h-8 w-full rounded-sm border-2 border-blue-400" />
              <div className="text-[10px] text-blue-400 font-semibold">Enterprise Value</div>
              <div className="text-[10px] font-data text-blue-300">{fmtBig(EV)}</div>
            </div>
          </div>
        </div>

        {/* Tabs: schedule / chart / terminal value */}
        <div className="panel">
          <div className="border-b border-slate-800">
            <Tabs
              tabs={[
                { id: "schedule",  label: "PV Schedule" },
                { id: "chart",     label: "FCFF Chart" },
                { id: "terminal",  label: "Terminal Value" },
                { id: "formula",   label: "Formula Audit" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab === "schedule" && (
            <DCFScheduleTable schedule={SCHEDULE} wacc={WACC} />
          )}

          {tab === "chart" && (
            <div className="p-4">
              <FCFFChart data={CHART_DATA} />
            </div>
          )}

          {tab === "terminal" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="section-label">Method</div>
                  <div className="text-slate-200 font-semibold">Gordon Growth Model</div>
                  <div className="text-slate-500 text-xs">TV = FCFF_N × (1+g) / (WACC−g)</div>
                </div>
                <div className="space-y-2">
                  <div className="section-label">WACC − g Spread</div>
                  <div className="text-slate-200 font-data font-semibold">{fmtRate(WACC - G)}</div>
                  <div className="text-slate-500 text-xs">{">"} 300 bps — adequate</div>
                </div>
                <div className="space-y-2">
                  <div className="section-label">TV / FCFF_N</div>
                  <div className="text-slate-200 font-data font-semibold">
                    {(TV / SCHEDULE[9].fcff).toFixed(1)}×
                  </div>
                  <div className="text-slate-500 text-xs">Terminal multiple</div>
                </div>
              </div>
              <pre className="text-xs font-data text-slate-400 bg-slate-900 rounded-sm p-4 leading-relaxed">
{`TV  = FCFF₁₀ × (1 + g) / (WACC − g)
    = ${fmtBig(SCHEDULE[9].fcff)} × (1 + ${fmtRate(G)}) / (${fmtRate(WACC)} − ${fmtRate(G)})
    = ${fmtBig(TV)}

PV(TV) = TV / (1 + WACC)^10
       = ${fmtBig(TV)} / (1 + ${fmtRate(WACC)})^10
       = ${fmtBig(PV_TV)}`}
              </pre>
            </div>
          )}

          {tab === "formula" && (
            <div className="p-4">
              <pre className="text-xs font-data text-slate-400 leading-loose whitespace-pre-wrap">
{`DCF Valuation — AAPL
────────────────────────────────────────────────────
Σ PV(FCFF)           = ${fmtBig(SUM_PV).padStart(22)}
+ PV(Terminal Value) = ${fmtBig(PV_TV).padStart(22)}
────────────────────────────────────────────────────
Enterprise Value     = ${fmtBig(EV).padStart(22)}
− Net Debt           = ${fmtBig(NET_DEBT).padStart(22)}
────────────────────────────────────────────────────
Equity Value         = ${fmtBig(EQUITY).padStart(22)}
÷ Shares Outstanding = ${(SHARES / 1e9).toFixed(2) + "B"}
────────────────────────────────────────────────────
Fair Value / Share   = ${fmtPrice(FVPS).padStart(22)}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
