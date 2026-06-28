# =============================================================================
# ValuPro Backend — Production Dockerfile
# Multi-stage build: separate build deps from runtime image.
# Runs as non-root user (uid 1000).
# Railway reads $PORT from the environment; CMD uses it via shell form.
# =============================================================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build-time system deps (gcc for some C-extension wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the dependency manifest first so Docker can cache this layer.
COPY pyproject.toml ./

# Install all project dependencies into an isolated prefix so we can copy
# just the installed packages into the final image (no build tools).
RUN pip install --no-cache-dir --prefix=/install ".[dev]" || \
    pip install --no-cache-dir --prefix=/install .

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Runtime system libs (libpq for asyncpg, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN addgroup --system --gid 1000 appgroup \
 && adduser  --system --uid 1000 --ingroup appgroup --no-create-home appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Copy application source code
COPY . .

# Own files as non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Railway injects $PORT at runtime; use shell form CMD so the variable expands.
EXPOSE 8080
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2
