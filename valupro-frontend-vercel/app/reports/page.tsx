"use client";
// app/reports/page.tsx
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PanelHeader, Badge, MetricCard } from "@/components/ui";
import { FileText, Download, Eye, Plus, Clock, CheckCircle } from "lucide-react";

const REPORTS = [
  { id: 1, ticker: "AAPL", name: "Apple Inc. — Full Valuation Report",   type: "Full DCF",        date: "Jun 25, 2025", pages: 24, status: "ready",    size: "2.4 MB" },
  { id: 2, ticker: "MSFT", name: "Microsoft — DCF & Sensitivity",         type: "DCF + Sensitivity",date: "Jun 24, 2025", pages: 18, status: "ready",    size: "1.9 MB" },
  { id: 3, ticker: "GOOG", name: "Alphabet — Comps Analysis",             type: "Trading Comps",   date: "Jun 24, 2025", pages: 12, status: "ready",    size: "1.1 MB" },
  { id: 4, ticker: "NVDA", name: "NVIDIA — Bear/Base/Bull Scenarios",     type: "Scenario",        date: "Jun 23, 2025", pages: 16, status: "ready",    size: "1.7 MB" },
  { id: 5, ticker: "META", name: "Meta Platforms — Initiating Coverage", type: "Full DCF",         date: "Jun 22, 2025", pages: 28, status: "ready",    size: "3.1 MB" },
  { id: 6, ticker: "TSLA", name: "Tesla — Scenario Analysis",             type: "Scenario",        date: "Jun 20, 2025", pages: 14, status: "generating",size: "—" },
];

const TYPE_BADGE: Record<string, string> = {
  "Full DCF":         "badge-blue",
  "DCF + Sensitivity":"badge-blue",
  "Trading Comps":    "badge-green",
  "Scenario":         "badge-amber",
};

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<number | null>(1);

  const selReport = REPORTS.find((r) => r.id === selected);

  return (
    <div className="flex flex-col h-full">
      <TopBar>
        <button
          onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}
          disabled={generating}
          className="btn-primary gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {generating ? "Generating…" : "New Report"}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Total Reports"  value="247"        sub="all time" />
          <MetricCard label="This Month"     value="12"         sub="generated" />
          <MetricCard label="Avg Pages"      value="18"         sub="per report" />
          <MetricCard label="Last Generated" value="< 1hr ago"  sub="TSLA" />
        </div>

        {/* Two-column: list + preview */}
        <div className="grid grid-cols-12 gap-4">

          {/* Report list */}
          <div className="col-span-7 panel">
            <PanelHeader title="Report Library" sub="Recent valuations" />
            <div className="divide-y divide-slate-800/40">
              {REPORTS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors
                    ${selected === r.id ? "bg-blue-600/8 border-l-2 border-blue-500" : "hover:bg-slate-800/30 border-l-2 border-transparent"}`}
                >
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 ${r.status === "generating" ? "bg-amber-500/15" : "bg-blue-500/15"}`}>
                    {r.status === "generating"
                      ? <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                      : <FileText className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-data font-semibold text-xs text-slate-200">{r.ticker}</span>
                      <span className={TYPE_BADGE[r.type] ?? "badge-slate"}>{r.type}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{r.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0 text-[10px] text-slate-600 space-y-0.5">
                    <div>{r.date}</div>
                    <div>{r.pages}p · {r.size}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="col-span-5">
            {selReport ? (
              <div className="panel space-y-0">
                <PanelHeader title={selReport.name}>
                  {selReport.status === "ready" && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </PanelHeader>

                {/* Report preview mock */}
                <div className="bg-slate-900 m-3 rounded-sm p-4 font-data text-xs text-slate-400 space-y-2 leading-relaxed border border-slate-800">
                  <div className="text-slate-200 font-bold text-sm">{selReport.ticker} — Investment Analysis</div>
                  <div className="text-slate-500 text-[10px]">{selReport.date} · ValuPro Institutional</div>
                  <div className="border-t border-slate-800 pt-2 space-y-1">
                    <div className="flex justify-between"><span>Fair Value (Base):</span><span className="text-blue-400">$201.40</span></div>
                    <div className="flex justify-between"><span>Fair Value (Blended):</span><span className="text-blue-300">$203.30</span></div>
                    <div className="flex justify-between"><span>WACC:</span><span>9.12%</span></div>
                    <div className="flex justify-between"><span>Terminal Growth:</span><span>2.5%</span></div>
                    <div className="flex justify-between"><span>Signal:</span><span className="text-emerald-400">UNDERVALUED</span></div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 text-slate-600">
                    {selReport.pages} pages · {selReport.size}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {selReport.status === "ready" ? (
                    <>
                      <button className="btn-primary w-full justify-center">
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                      <button className="btn-outline w-full justify-center">
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-400 justify-center py-2">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Generating report…
                    </div>
                  )}
                </div>

                {/* Table of contents */}
                <div className="px-3 pb-3">
                  <div className="section-label mb-2">Contents</div>
                  {["1. Executive Summary", "2. Company Overview", "3. WACC Computation", "4. DCF Model", "5. Terminal Value Analysis", "6. Sensitivity Analysis", "7. Trading Comparables", "8. Scenario Analysis", "9. Investment Thesis"].slice(0, selReport.pages > 20 ? 9 : 6).map((s) => (
                    <div key={s} className="flex items-center gap-2 py-1 text-xs text-slate-500 border-b border-slate-800/40 last:border-0">
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="panel h-full flex items-center justify-center">
                <p className="text-sm text-slate-500">Select a report</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
