// lib/api.ts
// Typed API client for all ValuPro backend endpoints.
// All requests go through Next.js rewrites → FastAPI at NEXT_PUBLIC_API_URL.

import type {
  AnalysisReport,
  CompanyProfile,
  CompanySearchResult,
  CompsResult,
  MarketData,
  ValuationSummary,
} from "@/types/valuation";

const BASE = "/api/v1";

// ── Shared fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Company endpoints ─────────────────────────────────────────────────────────

export const companyApi = {
  search: (query: string) =>
    apiFetch<CompanySearchResult[]>(`/company/search?q=${encodeURIComponent(query)}`),

  profile: (ticker: string) =>
    apiFetch<CompanyProfile>(`/company/${ticker}/profile`),

  marketData: (ticker: string) =>
    apiFetch<MarketData>(`/company/${ticker}/market-data`),

  peers: (ticker: string) =>
    apiFetch<CompanySearchResult[]>(`/company/${ticker}/peers`),
};

// ── Valuation endpoints ───────────────────────────────────────────────────────

export interface ValuationRequest {
  forecast?: {
    revenue_constant_growth_rate?: number;
    ebitda_margin?: number;
    effective_tax_rate?: number;
    historical_years_for_trend?: number;
  };
  wacc?: {
    risk_free_rate?: number;
    equity_risk_premium?: number;
    wacc_override?: number;
  };
  terminal_value?: {
    method?: "gordon_growth" | "exit_multiple" | "average";
    terminal_growth_rate?: number;
    exit_ebitda_multiple?: number;
  };
  bear_revenue_growth_delta?: number;
  bear_ebitda_margin_delta?: number;
  bull_revenue_growth_delta?: number;
  bull_ebitda_margin_delta?: number;
  sensitivity_wacc_steps?: number;
  sensitivity_growth_steps?: number;
}

export const valuationApi = {
  run: (ticker: string, req: ValuationRequest = {}) =>
    apiFetch<ValuationSummary>(`/valuation/${ticker}`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  wacc: (ticker: string, req: Record<string, unknown> = {}) =>
    apiFetch<Record<string, unknown>>(`/valuation/${ticker}/wacc`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ── Analysis endpoints ────────────────────────────────────────────────────────

export interface AnalysisRequest {
  wacc?: { risk_free_rate?: number; equity_risk_premium?: number; wacc_override?: number };
  terminal_value?: { method?: string; terminal_growth_rate?: number };
  scenario_deltas?: {
    bear_revenue_growth_delta?: number;
    bear_ebitda_margin_delta?: number;
    bull_revenue_growth_delta?: number;
    bull_ebitda_margin_delta?: number;
  };
  sensitivity?: {
    wacc_steps?: number;
    growth_steps?: number;
    wacc_step_size?: number;
    growth_step_size?: number;
  };
  weights?: { bear?: number; base?: number; bull?: number };
  build_tornado?: boolean;
}

export const analysisApi = {
  full: (ticker: string, req: AnalysisRequest = {}) =>
    apiFetch<AnalysisReport>(`/analysis/${ticker}`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  sensitivity: (ticker: string, req: AnalysisRequest = {}) =>
    apiFetch<AnalysisReport["sensitivity"]>(`/analysis/${ticker}/sensitivity`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  scenarios: (ticker: string, req: AnalysisRequest = {}) =>
    apiFetch<AnalysisReport["scenarios"]>(`/analysis/${ticker}/scenarios`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ── Comps endpoints ───────────────────────────────────────────────────────────

export interface CompsRequest {
  max_peers?: number;
  iqr_multiplier?: number;
}

export const compsApi = {
  run: (ticker: string, req: CompsRequest = {}) =>
    apiFetch<CompsResult>(`/comps/${ticker}`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ── Memo endpoints (Phase 10) ─────────────────────────────────────────────────

export interface MemoRequest {
  risk_free_rate?: number;
  equity_risk_premium?: number;
  wacc_override?: number;
  terminal_growth_rate?: number;
  tv_method?: "gordon_growth" | "exit_multiple" | "average";
  bear_revenue_delta?: number;
  bull_revenue_delta?: number;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  include_comps?: boolean;
  anthropic_api_key?: string;
}

export interface MemoSection {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface InvestmentMemo {
  ticker: string;
  company_name: string;
  analyst: string;
  model_used: string;
  generated_at: string;
  sections: {
    executive_summary: MemoSection;
    investment_thesis: MemoSection;
    competitive_moat: MemoSection;
    growth_drivers: MemoSection;
    key_risks: MemoSection;
    catalysts: MemoSection;
    valuation_discussion: MemoSection;
    recommendation: MemoSection & {
      rating: string;
      target_price: number;
      current_price?: number;
      upside_pct?: number;
      conviction: string;
      time_horizon: string;
    };
  };
  total_usage: { input_tokens: number; output_tokens: number; total_tokens: number };
  warnings: string[];
}

export const memoApi = {
  generate: (ticker: string, req: MemoRequest = {}) =>
    apiFetch<InvestmentMemo>(`/memo/${ticker}`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  demo: (ticker = "AAPL") =>
    apiFetch<InvestmentMemo>(`/memo/${ticker}/demo`),

  streamUrl: (ticker: string) => `${BASE}/memo/${ticker}/stream`,

  downloadPdf: async (ticker: string, req: MemoRequest = {}): Promise<Blob> => {
    const res = await fetch(`${BASE}/memo/${ticker}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
    return res.blob();
  },
};

// ── Reports endpoints ─────────────────────────────────────────────────────────

export const reportsApi = {
  downloadPdf: async (ticker: string, req: Record<string, unknown> = {}): Promise<Blob> => {
    const res = await fetch(`${BASE}/reports/${ticker}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Report generation failed: ${res.status}`);
    return res.blob();
  },

  demo: async (ticker = "AAPL"): Promise<Blob> => {
    const res = await fetch(`${BASE}/reports/${ticker}/demo`);
    if (!res.ok) throw new Error(`Demo report failed: ${res.status}`);
    return res.blob();
  },
};
