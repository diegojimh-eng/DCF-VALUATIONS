"use client";
// components/charts/SensitivityHeatmap.tsx
import { useState } from "react";
import { fmtPrice, fmtBig, heatLevel } from "@/lib/formatters";
import { Tabs } from "@/components/ui";
import type { SensitivityMatrix } from "@/types/valuation";

interface Props { matrix: SensitivityMatrix; }

type View = "fvps" | "ev" | "equity";

export function SensitivityHeatmap({ matrix }: Props) {
  const [view, setView] = useState<View>("fvps");

  const { wacc_values, growth_values, grid, base_wacc, base_growth_rate } = matrix;

  // Select data matrix and formatter based on view
  const dataMatrix =
    view === "fvps"   ? matrix.fair_value_matrix :
    view === "ev"     ? matrix.enterprise_value_matrix :
    matrix.equity_value_matrix;

  const fmt = (v: number) => view === "fvps" ? fmtPrice(v) : fmtBig(v);

  // Global min/max (excluding zeros) for heat colouring
  const flat = dataMatrix.flat().filter((v) => v > 0);
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  return (
    <div>
      <div className="panel-header border-b-0 pb-0">
        <Tabs
          tabs={[
            { id: "fvps",   label: "Fair Value / Share" },
            { id: "ev",     label: "Enterprise Value" },
            { id: "equity", label: "Equity Value" },
          ]}
          active={view}
          onChange={(id) => setView(id as View)}
        />
      </div>

      <div className="overflow-x-auto p-4">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              {/* Corner */}
              <th className="pr-3 pb-2 text-left">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">WACC ↓ / g →</div>
              </th>
              {growth_values.map((g) => (
                <th key={g} className="px-2 pb-2 text-center font-data text-slate-400 min-w-[72px]">
                  {(g * 100).toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wacc_values.map((w, wi) => (
              <tr key={w}>
                {/* WACC label */}
                <td className="pr-3 py-0.5 text-right font-data text-slate-400 whitespace-nowrap">
                  {(w * 100).toFixed(1)}%
                </td>
                {growth_values.map((g, gi) => {
                  const val      = dataMatrix[wi]?.[gi] ?? 0;
                  const isBase   = Math.abs(w - base_wacc) < 0.0001 && Math.abs(g - base_growth_rate) < 0.0001;
                  const heatCls  = heatLevel(val, min, max, isBase);
                  return (
                    <td
                      key={g}
                      className={`px-2 py-1 text-center rounded-sm font-data transition-colors ${heatCls}`}
                    >
                      {val > 0 ? fmt(val) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
          <span>Low</span>
          {["heat-min", "heat-low", "heat-mid", "heat-high", "heat-max"].map((c) => (
            <div key={c} className={`w-8 h-3 rounded-sm ${c}`} />
          ))}
          <span>High</span>
          <span className="ml-4">■ Base case</span>
        </div>
      </div>
    </div>
  );
}
