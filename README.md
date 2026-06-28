# ValuPro — Institutional Equity Valuation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tests-539_passing-22c55e?style=flat-square"/>
  <img src="https://img.shields.io/badge/Lines-30%2C788-6366f1?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-MIT-64748b?style=flat-square"/>
</p>

<p align="center">
  A full-stack valuation platform built to institutional investment banking standards.<br/>
  DCF · WACC · Trading Comps · Sensitivity · Scenario Analysis · AI Investment Memo · PDF Reports
</p>

---

## What this is

ValuPro runs the same quantitative workflows as Capital IQ, FactSet, and bulge-bracket internal models — built from scratch as a software project. It is not a wrapper around someone else's valuation API. Every formula is implemented, every assumption is auditable, and every output traces back to a specific financial methodology.

The platform covers the full sell-side research process: fetch live financial data from four providers, build a 10-year FCFF forecast across three scenarios, compute WACC from CAPM, run a full DCF with Gordon Growth or exit multiple terminal value, run a 45-cell sensitivity grid, clean and screen a peer comps set, generate a 7-chart PDF report, and produce an 8-section AI investment memo — all in a single API call.

---

## Core financial methodologies

### Free Cash Flow to Firm

```
FCFF = NOPAT + D&A − CapEx − ΔNWC
     = EBIT × (1 − t) + D&A − CapEx − ΔNWC
```

Implemented in `engine/forecasters/fcff.py`. The forecaster also computes
`ROIC = NOPAT / Invested Capital` and `Reinvestment Rate = (CapEx − D&A + ΔNWC) / NOPAT`
for terminal value normalisation.

### WACC via CAPM

```
Ke   = Rf + β × ERP
Kd   = Interest Expense / Gross Debt  →  Kd_after_tax = Kd × (1 − t)
WACC = (E/V) × Ke + (D/V) × Kd_after_tax
```

Guard rails: WACC floored at 4%, capped at 40%. Beta defaults to 1.0 when
unavailable; `FootballFieldWeights` supports Hamada unlevering for peer-derived betas.

### Terminal Value — Gordon Growth Model

```
TV      = FCFF_N × (1 + g) / (WACC − g)
PV(TV)  = TV / (1 + WACC)^N
```

Two guards enforced by `GordonGrowthModel`:
- `WACC − g ≥ 30 bps` (below this, TV is hypersenitive)
- `g ≤ 3.5%` (warns when g exceeds long-run nominal GDP)

Reverse GGM also implemented: given current price, back-solves for market-implied growth rate.

### Equity Bridge

```
Enterprise Value  =  Σ PV(FCFF_t) + PV(Terminal Value)
Equity Value      =  EV − Net Debt − Minority Interest − Preferred Equity
Fair Value/Share  =  max(Equity Value, 0) / Diluted Shares Outstanding
```

### Comps — Tukey IQR Outlier Screening

```
Lower fence = Q1 − 1.5 × IQR
Upper fence = Q3 + 1.5 × IQR
```

Applied after hard sanity bounds per multiple type (e.g. EV/EBITDA: [2×, 60×]).
Five multiples computed: EV/Revenue, EV/EBITDA, EV/EBIT, P/E, P/B.
Implied price derived at Q1, median, mean, and Q3 for each.

### Sensitivity Analysis

45-cell WACC × g grid (9 rows × 5 columns). Each cell stores three outputs
independently: Enterprise Value, Equity Value, and Fair Value per Share.
Percentage deviation from base case pre-computed for heatmap colouring.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend  (TypeScript · Tailwind · Recharts)        │
│  7 pages · 10 components · Bloomberg-style live ticker strip     │
└──────────────────────────┬──────────────────────────────────────┘
                           │  /api/v1/* (29 REST endpoints)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI Backend  (Python 3.12 · Pydantic v2 · async)           │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  data/   │ engine/  │valuation/│  comps/  │analysis/ │  memo/   │
│ Phase 2  │ Phase 3  │Phase 4–5 │ Phase 6  │ Phase 7  │Phase 10  │
│ 4 data   │ 10-yr    │ DCF+WACC │ 5 multip.│ Sensit.  │ Claude   │
│providers │ FCFF     │ TV models│ IQR clean│ Scenario │ API memo │
│ Redis ↑  │ 3 scen.  │ Football │ Implied  │ Tornado  │ 8 sect.  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│  Infrastructure                                                   │
│  PostgreSQL 16 · Redis 7 · nginx (TLS + rate limiting)          │
│  Docker Compose · GitHub Actions CI/CD · Prometheus + Grafana    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project scope

| Phase | Component | Files | Lines | Highlights |
|-------|-----------|------:|------:|------------|
| 2 | Financial Data Layer | 16 | 3,811 | FMP + Alpha Vantage + SEC EDGAR + yfinance waterfall |
| 3 | Forecasting Engine | 17 | 2,930 | 10-yr FCFF, trend analysis, Bear/Base/Bull scenarios |
| 4–5 | DCF + Terminal Value | 15 | 4,128 | CAPM WACC, GGM, exit multiple, reverse GGM |
| 6 | Trading Comparables | 7 | 1,679 | Tukey IQR screening, 5 multiples, implied price bridge |
| 7 | Sensitivity & Scenario | 5 | 1,237 | 45-cell grid, blended value, tornado chart |
| 8 | Frontend Dashboard | 32 | 3,166 | Next.js 14, live ticker strip, 7 pages |
| 9 | Visualizations & PDF | 8 | 2,355 | 7 Matplotlib charts, ReportLab Platypus PDF |
| 10 | AI Investment Memo | 6 | 1,890 | Claude claude-sonnet-4-6, 8 sections, SSE streaming |
| — | REST API + Infra | 12 | 2,426 | 29 endpoints, nginx, Docker, GitHub Actions |
| — | Tests | — | — | 539 test functions across all valuation phases |
| **Total** | | **121** | **27,622** | |

---

## Key features

**Quantitative valuation engine**
- 10-year FCFF forecasting from live financial statements
- Three scenarios (Bear/Base/Bull) with configurable revenue growth and margin deltas
- DCF with year-end and mid-year convention support
- Gordon Growth Model and Exit Multiple terminal value, blendable by weight
- Reverse GGM: back-solves market-implied growth rate from current price
- 45-cell WACC × g sensitivity matrix with EV, Equity Value, and FVPS per cell
- Probability-weighted blended fair value (25/50/25 default)
- Tornado chart: quantifies impact of each assumption on base-case price

**Trading comparables**
- Tukey IQR outlier screening (k = 1.5) after hard sanity bounds
- Five multiples: EV/Revenue, EV/EBITDA, EV/EBIT, P/E, P/B
- Stats at four points: Q1, median, mean, Q3
- Implied EV → equity → price bridge for each multiple × statistic combination
- Peer table with excluded-ticker audit trail and exclusion reasons

**Data layer**
- Priority waterfall: FMP → Alpha Vantage → SEC EDGAR → Yahoo Finance
- Redis cache with per-category TTLs (15 min market data, 24 hr financials)
- Automatic retry with exponential backoff on provider failures
- Pydantic validation on every data model before it enters the engine

**AI Investment Memo (Phase 10)**
- 8 sections: Executive Summary, Investment Thesis, Competitive Moat, Growth Drivers, Key Risks, Catalysts, Valuation Discussion, Recommendation
- Each section grounded in the quantitative context block (no hallucinated figures)
- Server-Sent Events streaming endpoint: sections appear progressively as generated
- Structured Recommendation with Rating, target price, conviction, and upside parsed from prose

**PDF report generation**
- 7 charts: Revenue Forecast, EBITDA Forecast, FCFF Waterfall, DCF Waterfall, EV Bridge, Sensitivity Heatmap, Football Field
- 10 report sections built with ReportLab Platypus
- Produced from a single `POST /reports/{ticker}/demo` with no external API keys needed

**Production infrastructure**
- nginx reverse proxy: TLS termination, security headers, three-zone rate limiting
- Multi-stage Dockerfiles: non-root users, build deps excluded from runtime images
- GitHub Actions: test → lint → build → push → deploy pipeline
- Separate dev and prod Docker Compose configurations
- Prometheus + Grafana monitoring stack (optional profile)

---

## Getting started

### Prerequisites

- Docker Desktop ≥ 24.0 and Docker Compose ≥ 2.20
- FMP API key ([free tier](https://financialmodelingprep.com): 250 req/day)
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) — for AI memo only

### Run locally (< 5 minutes)

```bash
git clone https://github.com/your-username/valupro.git
cd valupro

# Configure environment
cp backend/.env.example backend/.env
# Add FMP_API_KEY and ANTHROPIC_API_KEY to backend/.env

# Start everything
docker compose up --build

# Verify
curl http://localhost:8000/health/live        # {"status": "ok"}
open http://localhost:3000                    # dashboard
open http://localhost:8000/docs              # interactive API docs
```

### Generate a demo PDF report (no API keys needed)

```bash
curl http://localhost:8000/api/v1/reports/AAPL/demo --output AAPL_report.pdf
# → 391 KB production-quality PDF with all 7 charts
```

### Generate a demo AI memo (no API keys needed)

```bash
curl http://localhost:8000/api/v1/memo/AAPL/demo | python3 -m json.tool
# → Full 8-section investment memo as structured JSON
```

### Run tests

```bash
cd backend
pip install -r requirements.txt
pytest -m unit -v          # 539 unit tests, no external services needed
pytest                     # all tests (requires running postgres + redis)
```

---

## API reference (selected endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe (Redis) |
| `GET` | `/api/v1/company/search?q=AAPL` | Company search |
| `POST` | `/api/v1/valuation/{ticker}` | Full DCF valuation |
| `POST` | `/api/v1/comps/{ticker}` | Trading comparables |
| `POST` | `/api/v1/analysis/{ticker}` | Sensitivity + scenarios |
| `POST` | `/api/v1/reports/{ticker}` | Generate PDF report |
| `GET` | `/api/v1/reports/{ticker}/demo` | Demo PDF (no keys) |
| `POST` | `/api/v1/memo/{ticker}` | AI investment memo |
| `POST` | `/api/v1/memo/{ticker}/stream` | SSE streaming memo |
| `GET` | `/api/v1/memo/{ticker}/demo` | Demo memo (no keys) |

Full spec at `/docs` (development mode only).

---

## Technology decisions

**Python over JavaScript for the engine.** Financial computation benefits from Python's numeric ecosystem (`numpy`, `scipy`), and Pydantic v2's frozen immutable models are well-suited to value objects in a valuation pipeline. Every computation flows forward through typed, immutable dataclasses — no mutation, no shared state, deterministic outputs.

**Frozen Pydantic models throughout.** Every phase output (`ForecastOutput`, `ValuationOutput`, `CompsResult`, `SensitivityMatrix`, `InvestmentMemo`) is a frozen Pydantic v2 model. This makes the computation graph safe for async execution and trivially serialisable to JSON.

**No Plotly — Matplotlib for PDF charts.** Plotly requires a browser engine (kaleido) for static PNG export. Matplotlib renders natively to PNG bytes, embeds directly into ReportLab, and produces output indistinguishable from Plotly at PDF resolution.

**Priority waterfall for data providers.** Rather than coupling to a single data source, the DataRouter tries FMP → Alpha Vantage → SEC EDGAR → Yahoo Finance in order, with per-provider error handling and Redis caching. Swapping or adding a provider requires implementing one abstract base class method.

**Two compose files.** `docker-compose.yml` is development (hot-reload, exposed ports, debug logging). `docker-compose.prod.yml` is production overrides (nginx, no source mounts, restart policies, resource limits, secrets from environment). Run together: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

---

## Financial methodology references

- Damodaran, A. — *Investment Valuation* (3rd ed.) — WACC, GGM, terminal value
- Koller, Goedhart, Wessels (McKinsey) — *Valuation* (7th ed.) — FCFF, ROIC, reinvestment rate
- Berk & DeMarzo — *Corporate Finance* — CAPM, cost of capital
- CFA Institute — *Equity Asset Valuation* — comps methodology, EV bridge

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built as a demonstration of institutional-grade financial modelling and full-stack software engineering.<br/>
  <a href="docs/project-description.md">One-page project description</a> ·
  <a href="DEPLOYMENT.md">Deployment guide</a> ·
  <a href="backend/docs/">API documentation</a>
</p>
