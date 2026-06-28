"use client";
// app/search/page.tsx
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { LoadingSpinner, ErrorBanner, Badge, MetricCard } from "@/components/ui";
import { fmtBig, fmtRate, fmtMult } from "@/lib/formatters";
import { Search, TrendingUp, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CompanySearchResult } from "@/types/valuation";
import { debounce } from "@/lib/utils";

// Static demo results
const DEMO: CompanySearchResult[] = [
  { ticker: "AAPL",  company_name: "Apple Inc.",            sector: "Technology",      industry: "Consumer Electronics",   exchange: "NASDAQ", market_cap: 2_750_000_000_000 },
  { ticker: "MSFT",  company_name: "Microsoft Corporation", sector: "Technology",      industry: "Software—Infrastructure",exchange: "NASDAQ", market_cap: 3_100_000_000_000 },
  { ticker: "GOOG",  company_name: "Alphabet Inc.",         sector: "Communication",   industry: "Internet Content",       exchange: "NASDAQ", market_cap: 2_180_000_000_000 },
  { ticker: "AMZN",  company_name: "Amazon.com Inc.",       sector: "Consumer Cyclical",industry: "Internet Retail",       exchange: "NASDAQ", market_cap: 1_940_000_000_000 },
  { ticker: "NVDA",  company_name: "NVIDIA Corporation",    sector: "Technology",      industry: "Semiconductors",         exchange: "NASDAQ", market_cap: 2_680_000_000_000 },
  { ticker: "META",  company_name: "Meta Platforms Inc.",   sector: "Communication",   industry: "Internet Content",       exchange: "NASDAQ", market_cap: 1_310_000_000_000 },
  { ticker: "TSLA",  company_name: "Tesla Inc.",            sector: "Consumer Cyclical",industry: "Auto Manufacturers",    exchange: "NASDAQ", market_cap:  780_000_000_000 },
  { ticker: "BRK.B", company_name: "Berkshire Hathaway",   sector: "Financial",       industry: "Insurance—Diversified",  exchange: "NYSE",   market_cap:  890_000_000_000 },
  { ticker: "LLY",   company_name: "Eli Lilly & Co.",      sector: "Healthcare",      industry: "Drug Manufacturers",     exchange: "NYSE",   market_cap:  760_000_000_000 },
  { ticker: "JPM",   company_name: "JPMorgan Chase & Co.", sector: "Financial",       industry: "Banks—Diversified",      exchange: "NYSE",   market_cap:  570_000_000_000 },
  { ticker: "V",     company_name: "Visa Inc.",             sector: "Financial",       industry: "Credit Services",        exchange: "NYSE",   market_cap:  530_000_000_000 },
  { ticker: "XOM",   company_name: "Exxon Mobil Corp.",    sector: "Energy",          industry: "Oil & Gas Integrated",   exchange: "NYSE",   market_cap:  450_000_000_000 },
];

const SECTOR_COLORS: Record<string, string> = {
  Technology:        "badge-blue",
  Communication:     "badge-blue",
  "Consumer Cyclical":"badge-amber",
  Financial:         "badge-green",
  Healthcare:        "badge-green",
  Energy:            "badge-amber",
};

export default function SearchPage() {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState<CompanySearchResult[]>(DEMO);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CompanySearchResult | null>(null);

  const filter = useCallback(
    debounce((q: string) => {
      setLoading(true);
      setTimeout(() => {
        if (!q.trim()) {
          setResults(DEMO);
        } else {
          const lq = q.toLowerCase();
          setResults(
            DEMO.filter(
              (c) =>
                c.ticker.toLowerCase().startsWith(lq) ||
                c.company_name.toLowerCase().includes(lq) ||
                (c.sector ?? "").toLowerCase().includes(lq),
            ),
          );
        }
        setLoading(false);
      }, 150);
    }, 200),
    [],
  );

  useEffect(() => { filter(query); }, [query, filter]);

  return (
    <div className="flex flex-col h-full">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Search bar — hero element */}
        <div className="max-w-2xl mx-auto pt-4">
          <h1 className="text-2xl font-bold text-slate-100 text-center mb-1">Company Search</h1>
          <p className="text-sm text-slate-500 text-center mb-6">
            Search by ticker, company name, or sector to begin a valuation
          </p>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="AAPL · Apple Inc. · Technology…"
              className="w-full input-field pl-10 py-3 text-sm text-slate-100 bg-[#0a1628] border-slate-700 focus:border-blue-500 shadow-panel-lg"
            />
            {loading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Layout: list + preview */}
        <div className="grid grid-cols-12 gap-4 max-w-5xl mx-auto w-full">

          {/* Results list */}
          <div className="col-span-7 panel">
            <div className="panel-header">
              <span className="text-sm font-semibold text-slate-100">
                {results.length} {results.length === 1 ? "company" : "companies"}
              </span>
              <span className="section-label">by market cap ↓</span>
            </div>
            <div className="divide-y divide-slate-800/40">
              {results.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No companies match "{query}"
                </div>
              )}
              {results.map((c) => (
                <button
                  key={c.ticker}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors
                    ${selected?.ticker === c.ticker ? "bg-blue-600/10 border-l-2 border-blue-500" : "hover:bg-slate-800/40 border-l-2 border-transparent"}`}
                >
                  {/* Ticker badge */}
                  <div className="w-14 flex-shrink-0 text-center">
                    <span className="font-data font-semibold text-sm text-slate-100">{c.ticker}</span>
                  </div>
                  {/* Name + sector */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{c.company_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.sector && (
                        <span className={SECTOR_COLORS[c.sector] ?? "badge-slate"}>
                          {c.sector}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{c.exchange}</span>
                    </div>
                  </div>
                  {/* Market cap */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-data text-slate-300">{fmtBig(c.market_cap)}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Mkt Cap</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview panel */}
          <div className="col-span-5">
            {selected ? (
              <div className="panel space-y-0">
                {/* Header */}
                <div className="panel-header">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-data text-slate-100">{selected.ticker}</span>
                      <Badge variant={selected.exchange === "NASDAQ" ? "blue" : "slate"}>{selected.exchange}</Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{selected.company_name}</div>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-slate-800">
                  <MetricCard label="Market Cap" value={fmtBig(selected.market_cap) ?? "—"} />
                  <MetricCard label="Sector"     value={selected.sector ?? "—"} />
                  <MetricCard label="Industry"   value={selected.industry ?? "—"} className="col-span-2" />
                </div>
                {/* CTA buttons */}
                <div className="p-3 space-y-2">
                  <Link href={`/valuation?ticker=${selected.ticker}`} className="btn-primary w-full justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Run Full Valuation
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/dcf?ticker=${selected.ticker}`} className="btn-outline justify-center text-xs py-2">
                      DCF Analysis
                    </Link>
                    <Link href={`/comps?ticker=${selected.ticker}`} className="btn-outline justify-center text-xs py-2">
                      Comparables
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel h-full flex items-center justify-center">
                <div className="text-center px-6">
                  <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Select a company to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
