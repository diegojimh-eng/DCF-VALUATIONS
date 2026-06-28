# =============================================================================
# ValuPro Backend — Dockerfile
#
# Designed for Railway (DOCKERFILE builder, dockerfilePath=Dockerfile).
# Railway injects PORT at runtime; CMD expands it via shell form.
#
# Two-stage build:
#   stage 1 (builder) — installs C-extension build tools + compiles wheels
#   stage 2 (runtime) — copies only the installed packages, no build tooling
#
# HOW TO DEPLOY
# -------------
# Commit this file to the repo root alongside main.py, then push to main.
# Railway picks it up automatically on next push.
# =============================================================================

# ── Stage 1 : builder ────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# gcc + libpq-dev are needed to compile asyncpg, hiredis, and psycopg2 wheels
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy the dependency manifest first for Docker layer-cache efficiency.
# pyproject.toml defines all runtime deps under [project] dependencies.
COPY pyproject.toml ./

# Install runtime deps only (skip [dev] extras — no pytest/ruff in prod).
# --prefix=/install isolates installed packages so we can copy them cleanly.
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir --prefix=/install \
      fastapi \
      "uvicorn[standard]" \
      pydantic \
      pydantic-settings \
      httpx \
      asyncpg \
      "sqlalchemy[asyncio]" \
      alembic \
      "redis[asyncio]" \
      hiredis \
      numpy \
      matplotlib \
      reportlab \
      Pillow \
      structlog \
      python-dateutil \
      tenacity \
      "python-jose[cryptography]" \
      "passlib[bcrypt]" \
      slowapi \
      uvloop \
      httptools

# ── Stage 2 : runtime ────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# libpq5  — asyncpg shared-library dependency at runtime
# curl    — used by Railway's internal health-check probe
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libpq5 \
      curl \
 && rm -rf /var/lib/apt/lists/*

# Non-root user — principle of least privilege
RUN addgroup --system --gid 1000 appgroup \
 && adduser  --system --uid 1000 --ingroup appgroup --no-create-home appuser

# Copy pre-built packages from builder stage
COPY --from=builder /install /usr/local

WORKDIR /app

# Copy application source (everything in the repo root)
COPY --chown=appuser:appgroup . .

USER appuser

# Port is provided by Railway at runtime via $PORT env var.
# Shell-form CMD (not exec-form) is required so $PORT expands correctly.
EXPOSE 8080
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2
