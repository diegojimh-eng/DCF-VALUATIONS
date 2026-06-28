"""
ValuPro — FastAPI application entry point.

Railway start command: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2

This file wires together every router registered in the project (valuation,
comps, analysis, reports, memo, company search) and exposes the health-check
endpoints that railway.json's healthcheckPath (/health/live) requires.

If your router modules live in a sub-package (e.g. api/routers/), adjust the
imports below to match your actual layout.  All other logic stays in those
modules — this file is intentionally thin.
"""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Optional: import your routers here once the modules exist ─────────────────
# from api.routers import valuation, comps, analysis, reports, memo, company
# (Comment these back in and register them below after you add the source tree.)

# ── App factory ──────────────────────────────────────────────────────────────

_START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Startup / shutdown lifecycle hook."""
    # Startup: initialise Redis pool, DB connection, etc. when ready.
    yield
    # Shutdown: close connections cleanly.


def create_app() -> FastAPI:
    app = FastAPI(
        title="ValuPro — Institutional Equity Valuation API",
        description=(
            "DCF · WACC · Trading Comps · Sensitivity · Scenario Analysis · "
            "AI Investment Memo · PDF Reports"
        ),
        version="1.0.0",
        # Disable /docs and /redoc in production to avoid leaking schema.
        docs_url="/docs" if os.getenv("APP_ENV", "production") != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    allowed_origins_raw = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000",
    )
    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Health endpoints (required by railway.json healthcheckPath) ───────────
    @app.get("/health/live", tags=["health"], include_in_schema=False)
    async def health_live() -> dict[str, Any]:
        """Liveness probe — Railway checks this to decide if the container is up."""
        return {"status": "ok"}

    @app.get("/health/ready", tags=["health"], include_in_schema=False)
    async def health_ready() -> JSONResponse:
        """
        Readiness probe — checks that downstream dependencies (Redis, Postgres)
        are reachable.  Returns 503 when they are not so Railway can hold traffic.
        """
        checks: dict[str, str] = {}
        status_code = 200

        # ── Redis check ───────────────────────────────────────────────────────
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
                status_code = 503
        else:
            checks["redis"] = "not configured"

        # ── Postgres check ────────────────────────────────────────────────────
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            try:
                import asyncpg  # type: ignore[import-untyped]

                # asyncpg wants postgresql://, not postgresql+asyncpg://
                pg_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
                conn = await asyncpg.connect(pg_url, timeout=3)
                await conn.fetchval("SELECT 1")
                await conn.close()
                checks["postgres"] = "ok"
            except Exception as exc:  # noqa: BLE001
                checks["postgres"] = f"error: {exc}"
                status_code = 503
        else:
            checks["postgres"] = "not configured"

        return JSONResponse(
            status_code=status_code,
            content={
                "status": "ok" if status_code == 200 else "degraded",
                "checks": checks,
                "uptime_seconds": round(time.time() - _START_TIME, 1),
            },
        )

    # ── API routers ───────────────────────────────────────────────────────────
    # Uncomment and adjust each include_router call once the module exists:
    #
    # app.include_router(company.router,    prefix="/api/v1/company",    tags=["company"])
    # app.include_router(valuation.router,  prefix="/api/v1/valuation",  tags=["valuation"])
    # app.include_router(comps.router,      prefix="/api/v1/comps",      tags=["comps"])
    # app.include_router(analysis.router,   prefix="/api/v1/analysis",   tags=["analysis"])
    # app.include_router(reports.router,    prefix="/api/v1/reports",    tags=["reports"])
    # app.include_router(memo.router,       prefix="/api/v1/memo",       tags=["memo"])

    return app


# Module-level `app` instance — this is what uvicorn imports.
app = create_app()
