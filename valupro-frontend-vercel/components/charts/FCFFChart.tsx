"use client";
// components/charts/FCFFChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { fmtBig, fmtYear } from "@/lib/formatters";
import type { ValuationSummary } from "@/types/valuation";

interface Props {
  schedule: ValuationSummary["football_field_ranges"] extends unknown[] ? unknown[] : never;
  dcfSchedule: Array<{ fiscal_year: number; fcff: number; pv_fcff: number }>;
}

interface SimpleProps {
  data: Array<{ year: number; fcff: number; pv_fcff: number }>;
}

export function FCFFChart({ data }: SimpleProps) {
  const chartData = data.map((d) => ({
    name: fmtYear(d.year),
    FCFF:    d.fcff    / 1e9,
    "PV FCFF": d.pv_fcff / 1e9,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(0)}B`}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: "2px", fontSize: 11 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number) => [`$${v.toFixed(1)}B`, ""]}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "#64748b", paddingTop: 8 }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="FCFF"     fill="#3b82f6" radius={[1, 1, 0, 0]} opacity={0.8} />
        <Bar dataKey="PV FCFF"  fill="#1d4ed8" radius={[1, 1, 0, 0]} opacity={0.9} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Scenario line chart ────────────────────────────────────────────────────────
import { LineChart, Line } from "recharts";

interface ScenarioChartProps {
  bear: number[];
  base: number[];
  bull: number[];
  years: number[];
}

export function ScenarioFCFFChart({ bear, base, bull, years }: ScenarioChartProps) {
  const data = years.map((y, i) => ({
    name: fmtYear(y),
    Bear: (bear[i] ?? 0) / 1e9,
    Base: (base[i] ?? 0) / 1e9,
    Bull: (bull[i] ?? 0) / 1e9,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}B`} width={44} />
        <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: "2px", fontSize: 11 }} formatter={(v: number) => [`$${v.toFixed(1)}B`, ""]} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#64748b" }} iconType="plainline" />
        <Line type="monotone" dataKey="Bear" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="Base" stroke="#3b82f6" strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
