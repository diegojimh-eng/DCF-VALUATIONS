"""
reports/renderer.py
--------------------
ValuationReportRenderer — the single entry point for Phase 9.

Accepts raw backend objects (from Phases 2–7) and orchestrates:
  1. Rendering all 7 Matplotlib charts → PNG bytes
  2. Formatting all display tables
  3. Building and returning the complete PDF

Usage:
    renderer = ValuationReportRenderer()
    pdf_bytes = renderer.render(
        ticker=ticker,
        valuation_result=val_result,
        scenario_results=scen_results,
        scenario_analysis=scenario_analysis,
        sensitivity_matrix=sensitivity,
        comps_result=comps_result,
        company_name="Apple Inc.",
        current_price=175.50,
    )
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from typing import Any

from reports.charts import (
    revenue_chart,
    ebitda_chart,
    fcff_chart,
    dcf_waterfall_chart,
    ev_bridge_chart,
    sensitivity_heatmap,
    football_field_chart,
)
from reports.pdf_report import ValuationPDFBuilder
from logger import get_logger

log = get_logger(__name__)


# ── ReportData ─────────────────────────────────────────────────────────────────

@dataclass
class ReportData:
    """
    All data needed to build the PDF report.
    Holds pre-rendered chart bytes and formatted table rows.
    """
    # Identity
    ticker: str
    company_name: str = ""
    current_price: float | None = None
    price_vs_intrinsic: str | None = None

    # Valuation outputs
    enterprise_value: float = 0.0
    equity_value: float = 0.0
    net_debt: float = 0.0
    minority_interest: float = 0.0
    shares_outstanding: float = 0.0
    base_fair_value_per_share: float = 0.0
    bear_fvps: float = 0.0
    bull_fvps: float = 0.0
    blended_fvps: float = 0.0
    wacc: float = 0.0
    ke: float = 0.0
    kd: float = 0.0
    terminal_growth_rate: float = 0.0
    pv_tv_pct: float = 0.0
    warnings: list[str] = field(default_factory=list)

    # Child objects (typed loosely to avoid circular imports)
    wacc_result: Any = None
    terminal_value_result: Any = None
    scenario_analysis: Any = None
    sensitivity_matrix: Any = None
    comps_result: Any = None

    # Pre-rendered chart PNG bytes
    chart_revenue: bytes | None = None
    chart_ebitda: bytes | None = None
    chart_fcff: bytes | None = None
    chart_dcf_waterfall: bytes | None = None
    chart_ev_bridge: bytes | None = None
    chart_sensitivity: bytes | None = None
    chart_football_field: bytes | None = None

    # Formatted table rows (list of list of str for ReportLab)
    forecast_table: list[list[str]] = field(default_factory=list)
    dcf_schedule_table: list[list[str]] = field(default_factory=list)


# ── Renderer ───────────────────────────────────────────────────────────────────

class ValuationReportRenderer:
    """
    Orchestrates all chart rendering and PDF generation for Phase 9.
    """

    def render(
        self,
        ticker: str,
        *,
        # Phase 4 outputs
        valuation_result: Any,           # ValuationResult (has .base, .bear, .bull, .wacc_result)
        # Phase 3 outputs
        scenario_results: Any,           # ScenarioResults (has .base, .bear, .bull: ForecastOutput)
        # Phase 7 outputs
        scenario_analysis: Any,          # ScenarioAnalysis
        sensitivity_matrix: Any,         # SensitivityMatrix
        # Phase 6 outputs
        comps_result: Any | None = None, # CompsResult
        # Context
        company_name: str = "",
        current_price: float | None = None,
    ) -> bytes:
        """
        Render the full PDF report.

        Args:
            ticker:            Company ticker symbol.
            valuation_result:  Phase 4 ValuationResult.
            scenario_results:  Phase 3 ScenarioResults.
            scenario_analysis: Phase 7 ScenarioAnalysis.
            sensitivity_matrix: Phase 7 SensitivityMatrix.
            comps_result:      Phase 6 CompsResult (optional).
            company_name:      Full company name for cover page.
            current_price:     Current market price.

        Returns:
            PDF as raw bytes.
        """
        log.info("report.render.start", ticker=ticker)

        base_dcf = valuation_result.base
        bear_dcf = valuation_result.bear
        bull_dcf = valuation_result.bull

        # ── Build ReportData ───────────────────────────────────────────────
        data = ReportData(
            ticker=ticker,
            company_name=company_name,
            current_price=current_price,
            price_vs_intrinsic=valuation_result.football_field.price_vs_intrinsic(),
            enterprise_value=base_dcf.enterprise_value,
            equity_value=base_dcf.equity_value,
            net_debt=base_dcf.net_debt,
            minority_interest=base_dcf.minority_interest,
            shares_outstanding=base_dcf.shares_outstanding,
            base_fair_value_per_share=base_dcf.fair_value_per_share,
            bear_fvps=bear_dcf.fair_value_per_share,
            bull_fvps=bull_dcf.fair_value_per_share,
            blended_fvps=valuation_result.football_field.blended_fair_value or 0.0,
            wacc=base_dcf.wacc,
            ke=base_dcf.wacc_result.ke,
            kd=base_dcf.wacc_result.kd_aftertax,
            terminal_growth_rate=base_dcf.terminal_growth_rate,
            pv_tv_pct=base_dcf.pv_tv_pct_of_ev,
            warnings=list(base_dcf.warnings),
            wacc_result=base_dcf.wacc_result,
            terminal_value_result=base_dcf.terminal_value_result,
            scenario_analysis=scenario_analysis,
            sensitivity_matrix=sensitivity_matrix,
            comps_result=comps_result,
        )

        # ── Render charts ───────────────────────────────────────────────────
        log.info("report.charts.start", ticker=ticker)

        bear_years = scenario_results.bear.years
        base_years = scenario_results.base.years
        bull_years = scenario_results.bull.years

        try:
            data.chart_revenue = revenue_chart(bear_years, base_years, bull_years)
        except Exception as e:
            log.warning("report.chart.revenue.failed", error=str(e))

        try:
            data.chart_ebitda = ebitda_chart(bear_years, base_years, bull_years)
        except Exception as e:
            log.warning("report.chart.ebitda.failed", error=str(e))

        try:
            pv_list = [r.pv_fcff for r in base_dcf.dcf_schedule]
            data.chart_fcff = fcff_chart(
                bear_years, base_years, bull_years, pv_fcff=pv_list
            )
        except Exception as e:
            log.warning("report.chart.fcff.failed", error=str(e))

        try:
            data.chart_dcf_waterfall = dcf_waterfall_chart(
                dcf_schedule=base_dcf.dcf_schedule,
                pv_terminal_value=base_dcf.pv_terminal_value,
                enterprise_value=base_dcf.enterprise_value,
            )
        except Exception as e:
            log.warning("report.chart.waterfall.failed", error=str(e))

        try:
            data.chart_ev_bridge = ev_bridge_chart(
                enterprise_value=base_dcf.enterprise_value,
                net_debt=base_dcf.net_debt,
                minority_interest=base_dcf.minority_interest,
                preferred_equity=base_dcf.preferred_equity,
                equity_value=base_dcf.equity_value,
                shares_outstanding=base_dcf.shares_outstanding,
                fair_value_per_share=base_dcf.fair_value_per_share,
            )
        except Exception as e:
            log.warning("report.chart.ev_bridge.failed", error=str(e))

        try:
            sm = sensitivity_matrix
            data.chart_sensitivity = sensitivity_heatmap(
                wacc_values=sm.wacc_values,
                growth_values=sm.growth_values,
                fvps_matrix=sm.fvps_matrix(),
                base_wacc=sm.base_wacc,
                base_growth=sm.base_growth_rate,
            )
        except Exception as e:
            log.warning("report.chart.sensitivity.failed", error=str(e))

        try:
            ff_ranges = [r.model_dump() for r in valuation_result.football_field.ranges]
            data.chart_football_field = football_field_chart(
                ranges=ff_ranges,
                current_price=current_price,
            )
        except Exception as e:
            log.warning("report.chart.football_field.failed", error=str(e))

        # ── Build display tables ────────────────────────────────────────────
        data.forecast_table    = self._fmt_forecast_table(base_years)
        data.dcf_schedule_table = self._fmt_dcf_schedule(base_dcf.dcf_schedule)

        # ── Generate PDF ────────────────────────────────────────────────────
        log.info("report.pdf.start", ticker=ticker)
        pdf_bytes = ValuationPDFBuilder().build(data)

        log.info("report.render.complete", ticker=ticker,
                 pdf_kb=len(pdf_bytes) // 1024)
        return pdf_bytes

    # ── Table formatters ───────────────────────────────────────────────────

    @staticmethod
    def _fmt_forecast_table(years: list) -> list[list[str]]:
        rows = []
        for y in years:
            try:
                rev = getattr(y, "revenue", None) or (y["revenue"] if isinstance(y, dict) else 0)
                gr  = getattr(y, "revenue_growth_rate", 0.0) or 0.0
                eb  = getattr(y, "ebitda", None) or 0.0
                em  = getattr(y, "ebitda_margin", 0.0) or 0.0
                ei  = getattr(y, "ebit", None) or 0.0
                fy  = getattr(y, "fiscal_year", 0) or 0
                rows.append([
                    f"FY{fy}",
                    f"${rev/1e9:.2f}B",
                    f"{gr*100:.1f}%",
                    f"${eb/1e9:.2f}B",
                    f"{em*100:.1f}%",
                    f"${ei/1e9:.2f}B",
                ])
            except Exception:
                continue
        return rows

    @staticmethod
    def _fmt_dcf_schedule(schedule: list) -> list[list[str]]:
        rows = []
        for row in schedule:
            try:
                fy = getattr(row, "fiscal_year", 0)
                fc = getattr(row, "fcff", 0.0)
                df = getattr(row, "discount_factor", 0.0)
                pv = getattr(row, "pv_fcff", 0.0)
                rows.append([
                    f"FY{fy}",
                    f"${fc/1e9:.2f}B",
                    f"{df:.5f}",
                    f"${pv/1e9:.2f}B",
                ])
            except Exception:
                continue
        return rows


# ── Standalone builder for testing / mock data ─────────────────────────────────

def build_report_from_mock(ticker: str = "AAPL") -> bytes:
    """
    Build a complete PDF report from synthetic AAPL-scale data.
    No external API calls or API keys needed.
    Used for: unit tests, /reports/{ticker}/demo endpoint, CI smoke tests.
    """
    import warnings
    warnings.filterwarnings("ignore")
    import matplotlib
    matplotlib.use("Agg")

    # Constants — all computed before any class definitions
    _WACC    = 0.0912
    _G       = 0.025
    _FCFF    = [99e9 * 1.08 ** (i + 1) for i in range(10)]
    _YEARS   = list(range(2024, 2034))
    _ND      = 74.8e9
    _SHR     = 15.671e9
    _PV_LIST = [_FCFF[i] / (1 + _WACC) ** (i + 1) for i in range(10)]
    _SUM_PV  = sum(_PV_LIST)
    _TV_G    = _FCFF[-1] * (1 + _G) / (_WACC - _G)
    _PV_TV   = _TV_G / (1 + _WACC) ** 10
    _EV      = _SUM_PV + _PV_TV
    _EQ      = _EV - _ND
    _FVPS    = _EQ / _SHR
    _WV      = [0.070, 0.075, 0.080, 0.085, 0.090, 0.095, 0.100, 0.105, 0.110]
    _GV      = [0.015, 0.020, 0.025, 0.030, 0.035]

    # Mock objects — use regular classes, not dataclasses (avoids Python 3.12 scoping issues)
    class _FY:
        def __init__(self, i, mult=1.0):
            self.fiscal_year = _YEARS[i]; self.revenue = 400e9 * 1.08 ** (i + 1)
            self.revenue_growth_rate = 0.08; self.ebitda = 120e9 * 1.09 ** (i + 1)
            self.ebitda_margin = 0.30; self.ebit = 110e9 * 1.09 ** (i + 1)
            self.fcff = _FCFF[i] * mult

    class _Row:
        def __init__(self, i):
            self.year_index = i + 1; self.fiscal_year = _YEARS[i]
            self.fcff = _FCFF[i]; self.discount_factor = 1 / (1 + _WACC) ** (i + 1)
            self.pv_fcff = _PV_LIST[i]

    class _WR:
        beta_used = 1.25; risk_free_rate = 0.043; equity_risk_premium = 0.055
        ke = 0.1119; kd_pretax = 0.0408; kd_aftertax = 0.0306
        market_cap = 2.75e12; gross_debt = 104.8e9; cash_and_equivalents = 30e9
        net_debt = 74.8e9; total_capital = 2.75e12 + 104.8e9
        equity_weight = 0.963; debt_weight = 0.037; wacc = 0.0912; tax_rate = 0.25

    class _TVR:
        method_used = "gordon_growth"; terminal_growth_rate = 0.025; wacc = 0.0912
        fcff_terminal = 99e9 * 1.08 ** 10; ebitda_terminal = 251e9
        tv_gordon_growth = _TV_G; tv_exit_multiple = None; tv_final = _TV_G
        pv_terminal_value = _PV_TV; pv_terminal_value_pct = _PV_TV / _EV

    class _SV:
        def __init__(self, s, m):
            self.scenario = s; self.label = s + " Case"
            self.enterprise_value = _EV * m; self.equity_value = _EQ * m
            self.fair_value_per_share = _FVPS * m; self.sum_pv_fcff = _SUM_PV * m
            self.pv_terminal_value = _PV_TV * m; self.pv_tv_pct = _PV_TV / _EV
            self.wacc = 0.0912; self.terminal_growth_rate = 0.025
            self.revenue_growth_y1 = 0.08; self.revenue_growth_y10 = 0.06
            self.ebitda_margin_avg = 0.30
            self.fcff_y1 = _FCFF[0] * m; self.fcff_y10 = _FCFF[-1] * m
            self.net_debt = _ND; self.shares_outstanding = _SHR; self.warnings = []

    class _SD:
        def __init__(self, m):
            self.ev_delta = _EV * (m - 1); self.ev_delta_pct = m - 1
            self.equity_delta = _EQ * (m - 1); self.equity_delta_pct = m - 1
            self.fvps_delta = _FVPS * (m - 1); self.fvps_delta_pct = m - 1

    class _TI:
        def __init__(self, a, bm, um):
            self.assumption = a; self.bear_price = _FVPS * bm; self.bull_price = _FVPS * um
            self.base_price = _FVPS; self.bear_delta = _FVPS * (bm - 1)
            self.bull_delta = _FVPS * (um - 1); self.total_range = _FVPS * (um - bm)

    class _SA:
        bear = _SV("Bear", 0.78); base = _SV("Base", 1.0); bull = _SV("Bull", 1.24)
        bear_vs_base = _SD(0.78); bull_vs_base = _SD(1.24)
        blended = {"fair_value_per_share": _FVPS * 1.005,
                   "enterprise_value": _EV, "equity_value": _EQ,
                   "weights": {"bear": 0.25, "base": 0.50, "bull": 0.25}}
        tornado = [_TI("Revenue Growth + EBITDA Margin", 0.78, 1.24),
                   _TI("WACC (\u00b1100 bps)", 0.86, 1.15),
                   _TI("Terminal Growth (\u00b150 bps)", 0.93, 1.08)]

    class _SM:
        wacc_values = _WV; growth_values = _GV; base_wacc = 0.0912; base_growth_rate = 0.025
        base_fair_value_per_share = _FVPS; base_enterprise_value = _EV; base_equity_value = _EQ

        def _cell(self, w, g):
            if w - g < 0.005: return 0.0
            pv_f = sum(_FCFF[i] / (1 + w) ** (i + 1) for i in range(10))
            tv_c = _FCFF[-1] * (1 + g) / (w - g)
            return max(0.0, (pv_f + tv_c / (1 + w) ** 10 - _ND) / _SHR)

        def fvps_matrix(self):
            return [[self._cell(w, g) for g in _GV] for w in _WV]

        def fvps_range(self):
            vals = [v for row in self.fvps_matrix() for v in row if v > 0]
            return (min(vals), max(vals)) if vals else (0.0, 0.0)

    # Build chart inputs
    base_yrs = [_FY(i)       for i in range(10)]
    bear_yrs = [_FY(i, 0.75) for i in range(10)]
    bull_yrs = [_FY(i, 1.25) for i in range(10)]
    sched    = [_Row(i)      for i in range(10)]
    sm       = _SM()

    ff_ranges = [
        {"method": "DCF \u2014 Bear",              "low": _FVPS*0.73, "high": _FVPS*0.84, "midpoint": _FVPS*0.78},
        {"method": "DCF \u2014 Base",              "low": _FVPS*0.92, "high": _FVPS*1.08, "midpoint": _FVPS},
        {"method": "DCF \u2014 Bull",              "low": _FVPS*1.16, "high": _FVPS*1.34, "midpoint": _FVPS*1.24},
        {"method": "Sensitivity (WACC \u00d7 g)",  "low": _FVPS*0.80, "high": _FVPS*1.22, "midpoint": _FVPS},
        {"method": "Comps \u2014 EV/EBITDA",       "low": _FVPS*0.85, "high": _FVPS*1.18, "midpoint": _FVPS},
    ]

    # Build ReportData directly
    d = ReportData(
        ticker=ticker, company_name=f"Apple Inc. (Demo \u2014 {ticker})",
        current_price=175.50, price_vs_intrinsic="UNDERVALUED",
        enterprise_value=_EV, equity_value=_EQ, net_debt=_ND,
        minority_interest=0.0, shares_outstanding=_SHR,
        base_fair_value_per_share=_FVPS, bear_fvps=_FVPS*0.78,
        bull_fvps=_FVPS*1.24, blended_fvps=_FVPS*1.005,
        wacc=_WACC, ke=0.1119, kd=0.0306, terminal_growth_rate=_G,
        pv_tv_pct=_PV_TV/_EV,
        warnings=[f"Terminal value represents {_PV_TV/_EV*100:.1f}% of EV."],
        wacc_result=_WR(), terminal_value_result=_TVR(),
        scenario_analysis=_SA(), sensitivity_matrix=sm, comps_result=None,
    )

    # Render all 7 charts
    from reports.charts.forecast import revenue_chart, ebitda_chart, fcff_chart
    from reports.charts.waterfall import dcf_waterfall_chart, ev_bridge_chart
    from reports.charts.valuation_charts import sensitivity_heatmap, football_field_chart

    d.chart_revenue       = revenue_chart(bear_yrs, base_yrs, bull_yrs)
    d.chart_ebitda        = ebitda_chart(bear_yrs, base_yrs, bull_yrs)
    d.chart_fcff          = fcff_chart(bear_yrs, base_yrs, bull_yrs, pv_fcff=_PV_LIST)
    d.chart_dcf_waterfall = dcf_waterfall_chart(sched, _PV_TV, _EV)
    d.chart_ev_bridge     = ev_bridge_chart(_EV, _ND, 0.0, 0.0, _EQ, _SHR, _FVPS)
    d.chart_sensitivity   = sensitivity_heatmap(_WV, _GV, sm.fvps_matrix(), _WACC, _G)
    d.chart_football_field= football_field_chart(ff_ranges, 175.50)

    d.forecast_table = [
        [f"FY{_YEARS[i]}", f"${400e9*1.08**(i+1)/1e9:.1f}B", "8.0%",
         f"${120e9*1.09**(i+1)/1e9:.1f}B", "30.0%",
         f"${110e9*1.09**(i+1)/1e9:.1f}B"] for i in range(10)
    ]
    d.dcf_schedule_table = [
        [f"FY{_YEARS[i]}", f"${_FCFF[i]/1e9:.2f}B",
         f"{1/(1+_WACC)**(i+1):.5f}", f"${_PV_LIST[i]/1e9:.2f}B"]
        for i in range(10)
    ]

    from reports.pdf_report import ValuationPDFBuilder
    return ValuationPDFBuilder().build(d)
