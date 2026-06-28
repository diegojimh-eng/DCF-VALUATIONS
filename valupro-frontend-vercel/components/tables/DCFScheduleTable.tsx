"use client";
// components/tables/DCFScheduleTable.tsx
import { fmtBig, fmtPct, fmtYear } from "@/lib/formatters";
import type { DCFYearResult } from "@/types/valuation";

interface Props {
  schedule: DCFYearResult[];
  wacc: number;
}

export function DCFScheduleTable({ schedule, wacc }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-3 py-2 w-28">Year</th>
            {schedule.map((r) => (
              <th key={r.year_index} className="text-right px-3 py-2 font-data">
                {fmtYear(r.fiscal_year)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {/* FCFF */}
          <tr className="tr-hover">
            <td className="px-3 py-2 text-slate-400">FCFF</td>
            {schedule.map((r) => (
              <td key={r.year_index} className="data-cell px-3 py-2 text-slate-200">
                {fmtBig(r.fcff)}
              </td>
            ))}
          </tr>
          {/* Discount Factor */}
          <tr className="tr-hover">
            <td className="px-3 py-2 text-slate-400">Discount Factor</td>
            {schedule.map((r) => (
              <td key={r.year_index} className="data-cell px-3 py-2 text-slate-400">
                {r.discount_factor.toFixed(4)}
              </td>
            ))}
          </tr>
          {/* PV of FCFF */}
          <tr className="tr-hover bg-blue-500/5">
            <td className="px-3 py-2 text-blue-400 font-medium">PV of FCFF</td>
            {schedule.map((r) => (
              <td key={r.year_index} className="data-cell px-3 py-2 text-blue-300 font-medium">
                {fmtBig(r.pv_fcff)}
              </td>
            ))}
          </tr>
        </tbody>
        <tfoot className="border-t border-slate-700 bg-slate-800/30">
          <tr>
            <td className="px-3 py-2 text-slate-300 font-semibold">WACC</td>
            <td colSpan={schedule.length} className="px-3 py-2 text-right text-blue-400 font-data font-semibold">
              {fmtPct(wacc, 2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
