// types/valuation.ts
// Full TypeScript types matching the Phase 2–7 backend Pydantic models.

// ── Company ──────────────────────────────────────────────────────────────────

export interface CompanyProfile {
  ticker: string;
  company_name: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  currency?: string;
  market_cap?: number;
  enterprise_value?: number;
  shares_outstanding?: number;
  description?: string;
  website?: string;
  ceo?: string;
  employees?: number;
  ipo_date?: string;
  country?: string;
  logo_url?: string;
}

export interface MarketData {
  ticker: string;
  current_price?: number;
  market_cap?: number;
  enterprise_value?: number;
  shares_outstanding?: number;
  beta?: number;
  pe_ratio_ttm?: number;
  pb_ratio?: number;
  ev_ebitda?: number;
  dividend_yield?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  avg_volume?: number;
  source_provider: string;
}

export interface CompanySearchResult {
  ticker: string;
  company_name: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  market_cap?: number;
}

// ── WACC ──────────────────────────────────────────────────────────────────────

export interface WACCResult {
  beta_used: number;
  risk_free_rate: number;
  equity_risk_premium: number;
  tax_rate: number;
  ke: number;
  kd_pretax: number;
  kd_aftertax: number;
  market_cap: number;
  gross_debt: number;
  cash_and_equivalents: number;
  net_debt: number;
  total_capital: number;
  equity_weight: number;
  debt_weight: number;
  wacc: number;
  used_beta_default: boolean;
  used_kd_override: boolean;
  used_ke_override: boolean;
  used_wacc_override: boolean;
  formula?: string;
}

// ── DCF ───────────────────────────────────────────────────────────────────────

export interface DCFYearResult {
  year_index: number;
  fiscal_year: number;
  fcff: number;
  discount_factor: number;
  pv_fcff: number;
}

export interface TerminalValueResult {
  method_used: string;
  terminal_growth_rate: number;
  wacc: number;
  fcff_terminal: number;
  ebitda_terminal?: number;
  tv_gordon_growth?: number;
  tv_exit_multiple?: number;
  tv_final: number;
  pv_terminal_value: number;
  pv_terminal_value_pct: number;
}

export interface ValuationOutput {
  ticker: string;
  scenario: string;
  wacc_result: WACCResult;
  terminal_value_result: TerminalValueResult;
  dcf_schedule: DCFYearResult[];
  sum_pv_fcff: number;
  pv_terminal_value: number;
  enterprise_value: number;
  net_debt: number;
  minority_interest: number;
  preferred_equity: number;
  equity_value: number;
  shares_outstanding: number;
  fair_value_per_share: number;
  pv_fcff_pct_of_ev: number;
  pv_tv_pct_of_ev: number;
  wacc: number;
  terminal_growth_rate: number;
  forecast_years: number;
  warnings: string[];
  formula_display?: string;
}

export interface ValuationRange {
  method: string;
  low: number;
  high: number;
  midpoint: number;
  current_price?: number;
}

export interface ValuationSummary {
  ticker: string;
  fair_value: { bear: number; base: number; bull: number; blended?: number };
  enterprise_value: { bear: number; base: number; bull: number };
  equity_value: { bear: number; base: number; bull: number };
  wacc: number;
  ke: number;
  kd_aftertax: number;
  terminal_growth_rate: number;
  pv_tv_pct_base: number;
  sensitivity_range: [number, number];
  football_field_ranges: ValuationRange[];
  price_vs_intrinsic?: string;
  wacc_formula?: string;
  dcf_formula_base?: string;
  tv_formula?: string;
  warnings: string[];
}

// ── Sensitivity ───────────────────────────────────────────────────────────────

export interface SensitivityCell {
  wacc: number;
  terminal_growth_rate: number;
  enterprise_value: number;
  equity_value: number;
  fair_value_per_share: number;
  ev_vs_base_pct?: number;
  fvps_vs_base_pct?: number;
  is_base_case: boolean;
}

export interface SensitivityMatrix {
  ticker: string;
  valuation_date: string;
  wacc_values: number[];
  growth_values: number[];
  base_wacc: number;
  base_growth_rate: number;
  base_enterprise_value: number;
  base_equity_value: number;
  base_fair_value_per_share: number;
  net_debt: number;
  shares_outstanding: number;
  enterprise_value_matrix: number[][];
  equity_value_matrix: number[][];
  fair_value_matrix: number[][];
  ev_pct_vs_base_matrix: (number | null)[][];
  fvps_range: [number, number];
  ev_range: [number, number];
}

// ── Scenario ──────────────────────────────────────────────────────────────────

export interface ScenarioValuation {
  scenario: "bear" | "base" | "bull" | "custom";
  label: string;
  enterprise_value: number;
  equity_value: number;
  fair_value_per_share: number;
  sum_pv_fcff: number;
  pv_terminal_value: number;
  pv_tv_pct: number;
  wacc: number;
  terminal_growth_rate: number;
  revenue_growth_y1: number;
  revenue_growth_y10: number;
  ebitda_margin_avg: number;
  fcff_y1: number;
  fcff_y10: number;
  net_debt: number;
  shares_outstanding: number;
  warnings: string[];
}

export interface ScenarioDelta {
  ev_delta: number;
  ev_delta_pct: number;
  equity_delta: number;
  equity_delta_pct: number;
  fvps_delta: number;
  fvps_delta_pct: number;
}

export interface TornadoItem {
  assumption: string;
  bear_price: number;
  bull_price: number;
  base_price: number;
  bear_delta: number;
  bull_delta: number;
  total_range: number;
}

export interface ScenarioAnalysis {
  ticker: string;
  valuation_date: string;
  bear: ScenarioValuation;
  base: ScenarioValuation;
  bull: ScenarioValuation;
  bear_vs_base: ScenarioDelta;
  bull_vs_base: ScenarioDelta;
  blended: {
    fair_value_per_share: number;
    enterprise_value: number;
    equity_value: number;
    weights: { bear: number; base: number; bull: number };
  };
  scenario_range: [number, number];
  current_price?: number;
  price_vs_base?: string;
  price_vs_blended?: string;
  tornado: TornadoItem[];
}

export interface AnalysisReport {
  ticker: string;
  valuation_date: string;
  sensitivity: SensitivityMatrix;
  scenarios: ScenarioAnalysis;
  warnings: string[];
}

// ── Comps ─────────────────────────────────────────────────────────────────────

export interface MultipleStats {
  median: number;
  mean: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  iqr: number;
  n_clean: number;
  n_excluded: number;
  excluded_tickers: string[];
}

export interface CompsImplied {
  at_median: { ev?: number; equity: number; price: number; formula?: string };
  at_mean:   { ev?: number; equity: number; price: number };
  at_q1:     { price: number };
  at_q3:     { price: number };
}

export interface CompsMultiple {
  stats: MultipleStats;
  implied: CompsImplied;
  is_reliable: boolean;
  clean_tickers: string[];
  price_range: [number, number];
}

export interface PeerTableRow {
  ticker: string;
  company_name: string;
  market_cap?: number;
  enterprise_value?: number;
  ev_revenue?: number;
  ev_ebitda?: number;
  ev_ebit?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  revenue_growth_1y?: number;
  ebitda_margin?: number;
  is_excluded: boolean;
  exclusion_reasons: string[];
}

export interface CompsResult {
  ticker: string;
  valuation_date: string;
  current_price?: number;
  n_peers_raw: number;
  implied_price: { central?: number; low?: number; high?: number };
  summary_table: Array<{
    multiple: string;
    median: number;
    mean: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
    n_peers: number;
    n_excluded: number;
    implied_price_median: number;
    implied_price_mean: number;
    implied_price_q1: number;
    implied_price_q3: number;
    is_reliable: boolean;
  }>;
  multiples: Record<string, CompsMultiple>;
  peer_table: PeerTableRow[];
  football_field_ranges: ValuationRange[];
  warnings: string[];
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

export type Scenario = "bear" | "base" | "bull";
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface ApiError {
  detail: string;
  status?: number;
}
