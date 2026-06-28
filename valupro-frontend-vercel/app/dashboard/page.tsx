"use client";
// app/dashboard/page.tsx
import { TopBar }     from "@/components/layout/TopBar";
import { MetricCard, Badge, PanelHeader, EmptyState } from "@/components/ui";
import { FootballFieldChart }  from "@/components/charts/FootballFieldChart";
import { fmtBig, fmtPrice, fmtPct, fmtRate } from "@/lib/formatters";
import { TrendingUp, BarChart2, FileText, Search, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Mock data (replaced by real API calls in production) ──────────────────────

const KPI = [
  { label: "Valuations Run",     value: "247",        sub: "last 30 days",  delta: "+18%",  deltaUp: true  },
  { label: "Active Reports",     value: "12",         sub: "in workspace",  delta: "+3",    deltaUp: true  },
  { label: "Avg Base FVPS Upside",value: "+14.2%",   sub: "vs current price",delta: null,  deltaUp: true  },
  { label: "Data Freshness",     value: "< 15 min",   sub: "last sync",     delta: null,    deltaUp: null  },
];

const RECENT: Array<{ticker:string;name:string;fvps:number;current:number;upside:number;time:string}> = [
  { ticker: "AAPL", name: "Apple Inc.",       fvps: 201.40, current: 175.50, upside:  0.148, time: "2h ago"  },
  { ticker: "MSFT", name: "Microsoft Corp.",  fvps: 445.20, current: 421.90, upside:  0.055, time: "4h ago"  },
  { ticker: "GOOG", name: "Alphabet Inc.",    fvps: 198.80, current: 175.30, upside:  0.134, time: "6h ago"  },
  { ticker: "NVDA", name: "NVIDIA Corp.",     fvps: 1020.0, current: 1085.0, upside: -0.059, time: "1d ago"  },
  { ticker: "META", name: "Meta Platforms",   fvps: 548.60, current: 502.30, upside:  0.092, time: "1d ago"  },
];

const FOOTBALL_MOCK = [
  { method: "DCF — Bear",          low: 155, high: 175, midpoint: 165 },
  { method: "DCF — Base",          low: 175, high: 215, midpoint: 196 },
  { method: "DCF — Bull",          low: 215, high: 255, midpoint: 235 },
  { method: "Sensitivity (WACC × g)", low: 148, high: 262, midpoint: 205 },
  { method: "Comps — EV/EBITDA",   low: 168, high: 232, midpoint: 200 },
  { method: "Comps — P/E",         low: 172, high: 225, midpoint: 199 },
];

const QUICK_ACTIONS = [
  { label: "New Valuation",   icon: TrendingUp, href: "/valuation",   color: "blue"   },
  { label: "Search Company",  icon: Search,     href: "/search",      color: "slate"  },
  { label: "Run Comparables", icon: BarChart2,  href: "/comps",       color: "slate"  },
  { label: "Generate Report", icon: FileText,   href: "/reports",     color: "slate"  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Welcome strip ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Good morning</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thursday, June 26, 2025 · US Markets Open · S&P 500 +0.68%
            </p>
          </div>
          <Link href="/valuation" className="btn-primary">
            <TrendingUp className="w-3.5 h-3.5" />
            New Valuation
          </Link>
        </div>

        {/* ── KPI grid ── */}
        <div className="grid grid-cols-4 gap-3">
          {KPI.map((k) => (
            <MetricCard key={k.label} {...k} />
          ))}
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Recent Valuations (8 cols) */}
          <div className="col-span-8 panel">
            <PanelHeader title="Recent Valuations" sub="Last 30 days">
              <Link href="/valuation" className="btn-ghost text-xs py-1 px-2 gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </PanelHeader>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-2">Company</th>
                  <th className="text-right px-4 py-2">Fair Value</th>
                  <th className="text-right px-4 py-2">Current</th>
                  <th className="text-right px-4 py-2">Upside</th>
                  <th className="text-right px-4 py-2">Signal</th>
                  <th className="text-right px-4 py-2 text-slate-600">
                    <Clock className="w-3 h-3 inline" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {RECENT.map((r) => (
                  <tr key={r.ticker} className="tr-hover">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-data text-slate-100">{r.ticker}</span>
                        <span className="text-slate-500">{r.name}</span>
                      </div>
                    </td>
                    <td className="data-cell px-4 py-2.5 text-slate-100">{fmtPrice(r.fvps)}</td>
                    <td className="data-cell px-4 py-2.5 text-slate-400">{fmtPrice(r.current)}</td>
                    <td className={`data-cell px-4 py-2.5 font-semibold ${r.upside >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {r.upside >= 0 ? "+" : ""}{fmtPct(r.upside)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant={r.upside > 0.10 ? "green" : r.upside < -0.05 ? "red" : "amber"}>
                        {r.upside > 0.10 ? "BUY" : r.upside < -0.05 ? "SELL" : "HOLD"}
                      </Badge>
                    </td>
                    <td className="data-cell px-4 py-2.5 text-slate-600">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column (4 cols) */}
          <div className="col-span-4 space-y-4">

            {/* Quick actions */}
            <div className="panel">
              <PanelHeader title="Quick Actions" />
              <div className="p-3 grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(({ label, icon: Icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex flex-col items-center gap-2 py-3 rounded-sm bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Data health */}
            <div className="panel">
              <PanelHeader title="Data Sources" />
              <div className="p-3 space-y-2">
                {[
                  { name: "FMP (Primary)",    status: "ok",   latency: "142ms" },
                  { name: "Alpha Vantage",    status: "ok",   latency: "268ms" },
                  { name: "SEC EDGAR",        status: "ok",   latency: "891ms" },
                  { name: "Yahoo Finance",    status: "warn", latency: "1.2s"  },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === "ok" ? "bg-emerald-400" : "bg-amber-400 animate-pulse-dot"}`} />
                      <span className="text-xs text-slate-400">{s.name}</span>
                    </div>
                    <span className="text-xs font-data text-slate-600">{s.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Football field for most recent ── */}
        <div className="panel">
          <PanelHeader
            title="AAPL — Valuation Range Summary"
            sub="Bear / Base / Bull DCF + Comps · Current: $175.50"
          >
            <Badge variant="blue">AAPL</Badge>
          </PanelHeader>
          <FootballFieldChart ranges={FOOTBALL_MOCK} currentPrice={175.50} />
        </div>

      </div>
    </div>
  );
}
