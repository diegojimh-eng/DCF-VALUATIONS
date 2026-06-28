"""
main.py — ValuPro FastAPI entry point
======================================
This file lives at the repository ROOT and is what Railway runs:

    uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2

It is intentionally self-contained: it imports ONLY from the Python
standard library and from packages listed in pyproject.toml
(fastapi, uvicorn, pydantic, etc.).  It does NOT import from the
sub-packages (memo.*, reports.*, engine.*, data.*, ...) that are not
yet present in this repository.  Once you push those modules, uncomment
the router blocks below to wire them in.

Health endpoints
-----------------
GET /health/live   → {"status": "ok"}            (Railway healthcheckPath)
GET /health/ready  → {"status": "ok"|"degraded"} (checks Redis + Postgres)

Both endpoints are always registered.  The app starts and passes the
Railway healthcheck even with no other routers present.
"""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Startup timestamp — used by /health/ready to report uptime
# ---------------------------------------------------------------------------
_START: float = time.monotonic()


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown hooks)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    # ── Startup ──────────────────────────────────────────────────────────────
    # Place one-time init here: connection pools, warmup calls, etc.
    # Example (uncomment when the modules exist):
    #   from data.cache import init_redis
    #   app.state.redis = await init_redis(os.environ["REDIS_URL"])
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    # Close connection pools here.
    # Example:
    #   await app.state.redis.aclose()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
def _build_app() -> FastAPI:
    env = os.getenv("APP_ENV", "production").lower()
    is_dev = env in ("development", "dev", "local")

    app = FastAPI(
        title="ValuPro — Institutional Equity Valuation API",
        description=(
            "DCF · WACC · Trading Comps · Sensitivity · "
            "Scenario Analysis · AI Investment Memo · PDF Reports"
        ),
        version="1.0.0",
        # Interactive docs only in non-production environments
        docs_url="/docs" if is_dev else None,
        redoc_url="/redoc" if is_dev else None,
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Health endpoints ──────────────────────────────────────────────────────
    # /health/live is the Railway healthcheckPath in railway.json.
    # It must return 200 as soon as the process is up.

    @app.get("/health/live", tags=["health"], include_in_schema=False)
    async def health_live() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready", tags=["health"], include_in_schema=False)
    async def health_ready() -> JSONResponse:
        """
        Readiness probe.  Checks Redis and Postgres if their URLs are set.
        Returns 503 (degraded) when a configured dependency is unreachable.
        """
        checks: dict[str, str] = {}
        ok = True

        # Redis
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                import redis.asyncio as aioredis  # type: ignore[import-untyped]
                r = aioredis.from_url(redis_url, socket_connect_timeout=2)
                await r.ping()
                await r.aclose()
                checks["redis"] = "ok"
            except Exception as exc:  # noqa: BLE001
                checks["redis"] = f"error: {exc}"
                ok = False
        else:
            checks["redis"] = "not configured"

        # Postgres
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            try:
                import asyncpg  # type: ignore[import-untyped]
                pg = db_url.replace("postgresql+asyncpg://", "postgresql://")
                conn = await asyncpg.connect(pg, timeout=3)
                await conn.fetchval("SELECT 1")
                await conn.close()
                checks["postgres"] = "ok"
            except Exception as exc:  # noqa: BLE001
                checks["postgres"] = f"error: {exc}"
                ok = False
        else:
            checks["postgres"] = "not configured"

        uptime = round(time.monotonic() - _START, 1)
        return JSONResponse(
            status_code=200 if ok else 503,
            content={
                "status": "ok" if ok else "degraded",
                "uptime_seconds": uptime,
                "checks": checks,
            },
        )

    # ── API routers ───────────────────────────────────────────────────────────
    # These are commented out because the sub-packages don't exist in the repo
    # yet.  Uncomment each block when you push the corresponding source tree.
    #
    # from api.routers.company    import router as company_router
    # from api.routers.valuation  import router as valuation_router
    # from api.routers.comps      import router as comps_router
    # from api.routers.analysis   import router as analysis_router
    # from api.routers.reports    import router as reports_router
    # from api.routers.memo       import router as memo_router
    #
    # app.include_router(company_router,   prefix="/api/v1/company",   tags=["company"])
    # app.include_router(valuation_router, prefix="/api/v1/valuation", tags=["valuation"])
    # app.include_router(comps_router,     prefix="/api/v1/comps",     tags=["comps"])
    # app.include_router(analysis_router,  prefix="/api/v1/analysis",  tags=["analysis"])
    # app.include_router(reports_router,   prefix="/api/v1/reports",   tags=["reports"])
    # app.include_router(memo_router,      prefix="/api/v1/memo",      tags=["memo"])

    # ── Root ─────────────────────────────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, Any]:
        return {
            "service": "ValuPro API",
            "version": "1.0.0",
            "status": "running",
            "health": "/health/live",
        }

    return app


# ---------------------------------------------------------------------------
# Module-level `app` — this is what `uvicorn main:app` imports.
# ---------------------------------------------------------------------------
app = _build_app()
