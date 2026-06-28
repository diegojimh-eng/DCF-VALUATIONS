"use client";
// components/tables/PeerCompsTable.tsx
import { fmtBig, fmtMult, fmtPct } from "@/lib/formatters";
import type { PeerTableRow } from "@/types/valuation";

interface Props {
  rows: PeerTableRow[];
  subjectTicker?: string;
}

export function PeerCompsTable({ rows, subjectTicker }: Props) {
  const COLS = [
    { key: "company_name",    label: "Company",         align: "left"  },
    { key: "market_cap",      label: "Mkt Cap",         align: "right" },
    { key: "enterprise_value",label: "EV",              align: "right" },
    { key: "ev_revenue",      label: "EV/Rev",          align: "right" },
    { key: "ev_ebitda",       label: "EV/EBITDA",       align: "right" },
    { key: "ev_ebit",         label: "EV/EBIT",         align: "right" },
    { key: "pe_ratio",        label: "P/E",             align: "right" },
    { key: "pb_ratio",        label: "P/B",             align: "right" },
    { key: "ebitda_margin",   label: "EBITDA Mg.",      align: "right" },
    { key: "revenue_growth_1y",label: "Rev Gr. YoY",   align: "right" },
  ] as const;

  function cell(row: PeerTableRow, key: string): string {
    const v = (row as Record<string, unknown>)[key];
    if (v == null) return "—";
    if (key === "company_name") return String(v);
    if (key === "market_cap" || key === "enterprise_value") return fmtBig(v as number);
    if (key === "ebitda_margin" || key === "revenue_growth_1y") return fmtPct(v as number);
    return fmtMult(v as number);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800">
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.map((row) => {
            const isSubject = row.ticker === subjectTicker;
            const isExcluded = row.is_excluded;
            return (
              <tr
                key={row.ticker}
                className={`tr-hover ${isSubject ? "bg-blue-500/8 border-l-2 border-blue-500" : ""} ${isExcluded ? "opacity-40" : ""}`}
              >
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold font-data ${isSubject ? "text-blue-300" : "text-slate-200"}`}>
                      {row.ticker}
                    </span>
                    <span className="text-slate-500 truncate max-w-[120px]">{row.company_name}</span>
                    {isExcluded && (
                      <span className="badge-red text-[9px]">Excl.</span>
                    )}
                    {isSubject && (
                      <span className="badge-blue text-[9px]">Subject</span>
                    )}
                  </div>
                </td>
                {COLS.slice(1).map((c) => (
                  <td key={c.key} className="data-cell px-3 py-2 text-slate-300">
                    {cell(row, c.key)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
