"use client";
// components/ui/index.tsx
// All primitive UI components used across every page.

import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaUp?: boolean;
  accent?: boolean;
  className?: string;
}

export function MetricCard({ label, value, sub, delta, deltaUp, accent, className }: MetricCardProps) {
  return (
    <div className={cn("metric-card", accent && "border-blue-500/30", className)}>
      <div className="section-label">{label}</div>
      <div className={cn("text-xl font-bold font-data tabular-nums leading-tight", accent ? "text-blue-300" : "text-slate-100")}>
        {value}
      </div>
      {(delta || sub) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {delta != null && (
            <span className={cn("text-xs font-data flex items-center gap-0.5",
              deltaUp === true  ? "text-emerald-400" :
              deltaUp === false ? "text-red-400" :
              "text-slate-400"
            )}>
              {deltaUp === true && <TrendingUp className="w-3 h-3" />}
              {deltaUp === false && <TrendingDown className="w-3 h-3" />}
              {deltaUp == null && <Minus className="w-3 h-3" />}
              {delta}
            </span>
          )}
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = "blue" | "green" | "amber" | "red" | "slate";

export function Badge({ children, variant = "slate" }: { children: ReactNode; variant?: BadgeVariant }) {
  const cls = { blue: "badge-blue", green: "badge-green", amber: "badge-amber", red: "badge-red", slate: "badge-slate" }[variant];
  return <span className={cls}>{children}</span>;
}

// ── PanelHeader ───────────────────────────────────────────────────────────────

export function PanelHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────

export function LoadingSpinner({ size = "md", label }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const sz = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <Loader2 className={cn(sz, "animate-spin text-blue-400")} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

// ── ErrorBanner ───────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-sm text-sm">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-300 font-medium">Something went wrong</p>
        <p className="text-red-400/80 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "bg-navy-900 border border-slate-700 text-slate-200 text-xs rounded-sm px-2 py-1",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center border-b border-slate-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
            active === t.id
              ? "text-blue-400 border-blue-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="section-label">{label}</label>}
      <input {...props} className={cn("input-field", className)} />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="border-t border-slate-800 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-slate-800" />
      <span className="section-label">{label}</span>
      <div className="flex-1 border-t border-slate-800" />
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

export function Tooltip({ children, tip }: { children: ReactNode; tip: string }) {
  return (
    <span title={tip} className="cursor-help">
      {children}
    </span>
  );
}
