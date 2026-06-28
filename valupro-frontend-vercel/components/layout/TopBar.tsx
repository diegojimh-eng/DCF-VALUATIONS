"use client";
// components/layout/TopBar.tsx
import { Search, ChevronRight, Bell, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LABELS: Record<string, string> = {
  dashboard:   "Dashboard",
  search:      "Company Search",
  valuation:   "Valuation Overview",
  dcf:         "DCF Analysis",
  comps:       "Trading Comparables",
  sensitivity: "Sensitivity Analysis",
  reports:     "Reports",
};

interface TopBarProps {
  ticker?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function TopBar({ ticker, onRefresh, isLoading, children }: TopBarProps) {
  const path  = usePathname();
  const seg   = path.split("/").filter(Boolean);
  const page  = seg[0] ?? "dashboard";
  const label = LABELS[page] ?? page;

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-slate-800/70 bg-[#070d1e]/80 backdrop-blur-sm flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
          ValuPro
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-700" />
        <span className="text-slate-200 font-medium">{label}</span>
        {ticker && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-blue-400 font-semibold font-data">{ticker}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {children}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-ghost py-1 px-2 h-7 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Running…" : "Refresh"}</span>
          </button>
        )}
        <button className="btn-ghost w-7 h-7 p-0 flex items-center justify-center relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>
      </div>
    </header>
  );
}
