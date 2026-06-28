"use client";
// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Calculator,
  BarChart2,
  Layers,
  FileText,
  Settings,
  Activity,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/search",      label: "Company Search",icon: Search          },
  { href: "/valuation",   label: "Valuation",    icon: TrendingUp      },
  { href: "/dcf",         label: "DCF Analysis", icon: Calculator       },
  { href: "/comps",       label: "Comparables",  icon: BarChart2        },
  { href: "/sensitivity", label: "Sensitivity",  icon: Layers           },
  { href: "/reports",     label: "Reports",      icon: FileText         },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-[200px] flex-shrink-0 bg-[#070d1e] border-r border-slate-800/70 flex flex-col">
      {/* Logo */}
      <div className="h-12 flex items-center gap-2.5 px-4 border-b border-slate-800/70">
        <div className="w-7 h-7 rounded-sm bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight leading-none">ValuPro</div>
          <div className="text-[9px] text-slate-500 tracking-widest uppercase leading-none mt-0.5">
            Institutional
          </div>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-3 pt-4 pb-1">
        <span className="section-label">Workspace</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-sm text-sm transition-all duration-100
                ${active
                  ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 -ml-px"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent -ml-px"
                }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800/70">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-2 py-1.5 text-slate-500 hover:text-slate-300 rounded-sm hover:bg-white/5 transition-colors text-xs"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </Link>
        <div className="mt-2 px-2">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest">Phase 7 Complete</div>
          <div className="text-[9px] text-slate-700">22,544 lines · 105 files</div>
        </div>
      </div>
    </aside>
  );
}
