"""
memo/generator.py
------------------
MemoGenerator — calls the Claude API to generate each memo section.

Uses the Anthropic Messages API directly via httpx (no SDK dependency)
so it integrates cleanly with FastAPI's existing httpx client and
doesn't introduce a new dependency.

Architecture:
  • generate_memo()        — generates all 8 sections sequentially, returns InvestmentMemo
  • generate_section()     — generates one named section, returns (text, TokenUsage)
  • stream_memo()          — async generator yielding (section_name, text_chunk) pairs
  • generate_memo_demo()   — generates from a MemoContext (no pipeline needed)

Claude API:
  Model:    claude-sonnet-4-6 (best speed/intelligence balance)
  Endpoint: https://api.anthropic.com/v1/messages
  Version:  2023-06-01
  Max tokens per section: 1200 (sufficient for 300-400 word sections)

Error handling:
  • API key missing → MemoGeneratorError with helpful message
  • Rate limit (429) → exponential backoff, max 3 retries
  • Server error (5xx) → retry once
  • Content policy → section marked as [GENERATION REFUSED]
"""

from __future__ import annotations

from contextlib import asynccontextmanager

import asyncio
import json
import os
import re
import time
from typing import AsyncIterator

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore[assignment]

from memo.context import MemoContext
from memo.models import (
    Catalysts,
    CompetitiveMoat,
    ConvictionLevel,
    ExecutiveSummary,
    GrowthDrivers,
    InvestmentMemo,
    InvestmentThesis,
    KeyRisks,
    MemoSection,
    Rating,
    Recommendation,
    TokenUsage,
    ValuationDiscussion,
)
from memo.prompts import (
    SECTION_PROMPTS,
    build_system_prompt,
    build_user_prompt,
)

from logger import get_logger

log = get_logger(__name__)

# ── API constants ──────────────────────────────────────────────────────────────

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL     = "claude-sonnet-4-6"
MAX_TOKENS        = 1200   # per section — ~400 words at ~3 tokens/word
TEMPERATURE       = 0.3    # low temperature for factual precision
MAX_RETRIES       = 3
RETRY_BASE_DELAY  = 2.0    # seconds


class MemoGeneratorError(Exception):
    """Raised when memo generation fails unrecoverably."""


class MemoGenerator:
    """
    Generates institutional investment memos using Claude claude-sonnet-4-6.

    Stateless — safe to instantiate once and reuse across requests.
    Uses the caller's httpx.AsyncClient for connection pooling.
    """

    def __init__(
        self,
        api_key:     str | None = None,
        model:       str        = DEFAULT_MODEL,
        max_tokens:  int        = MAX_TOKENS,
        temperature: float      = TEMPERATURE,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._api_key    = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self._model      = model
        self._max_tokens = max_tokens
        self._temperature = temperature
        self._http       = http_client
        self._owns_client = http_client is None

        if not self._api_key:
            raise MemoGeneratorError(
                "ANTHROPIC_API_KEY is not set. "
                "Add it to your .env file or pass api_key= to MemoGenerator()."
            )

    # ── Public API ─────────────────────────────────────────────────────────────

    async def generate_memo(
        self,
        context: MemoContext,
        on_section_complete: "callable | None" = None,
    ) -> InvestmentMemo:
        """
        Generate the complete 8-section investment memo.

        Args:
            context:               MemoContext with all quantitative data.
            on_section_complete:   Optional async callback(section_name, text) after each section.

        Returns:
            Fully-populated InvestmentMemo.
        """
        log.info("memo.generate.start", ticker=context.ticker)
        async with self._client_ctx() as client:
            return await self._generate_all_sections(context, client, on_section_complete)

    async def generate_section(
        self,
        section_key: str,
        context: MemoContext,
    ) -> tuple[str, TokenUsage]:
        """
        Generate a single named section.

        Args:
            section_key:  One of the keys in SECTION_PROMPTS.
            context:      MemoContext.

        Returns:
            (prose_text, token_usage)
        """
        async with self._client_ctx() as client:
            return await self._call_api(section_key, context, client)

    async def stream_memo(
        self,
        context: MemoContext,
    ) -> AsyncIterator[tuple[str, str]]:
        """
        Async generator that yields (section_name, text_chunk) pairs as each
        section is completed.

        Suitable for Server-Sent Events (SSE) in the FastAPI route.
        """
        async with self._client_ctx() as client:
            for key in SECTION_PROMPTS:
                try:
                    text, _ = await self._call_api(key, context, client)
                    yield (key, text)
                except Exception as e:
                    yield (key, f"[GENERATION ERROR: {e}]")

    # ── Internal generation ────────────────────────────────────────────────────

    async def _generate_all_sections(
        self,
        ctx: MemoContext,
        client: httpx.AsyncClient,
        on_complete: "callable | None",
    ) -> InvestmentMemo:
        """Run all 8 section generations in sequence."""

        def _fmtv(v, fmt="price") -> str:
            """Quick formatter for extra_vars in prompts."""
            if v is None: return "N/A"
            if fmt == "price":  return f"${v:.2f}"
            if fmt == "pct":    return f"{v*100:.1f}%"
            if fmt == "big":
                if abs(v) >= 1e9: return f"${v/1e9:.2f}B"
                if abs(v) >= 1e6: return f"${v/1e6:.1f}M"
                return f"${v:.2f}"
            if fmt == "mult":   return f"{v:.1f}×"
            return str(v)

        extra = {
            "base_fvps":       _fmtv(ctx.base_fvps),
            "bear_fvps":       _fmtv(ctx.bear_fvps),
            "bull_fvps":       _fmtv(ctx.bull_fvps),
            "wacc":            f"{ctx.wacc*100:.2f}" if ctx.wacc else "N/A",
            "tgr":             f"{ctx.terminal_growth_rate*100:.2f}" if ctx.terminal_growth_rate else "N/A",
            "pv_tv_pct":       f"{ctx.pv_tv_pct*100:.1f}" if ctx.pv_tv_pct else "N/A",
            "fcff_y1":         _fmtv(ctx.fcff_y1, "big"),
            "fcff_y10":        _fmtv(ctx.fcff_y10, "big"),
            "rev_y1_growth":   _fmtv(ctx.rev_growth_y1, "pct"),
            "rev_y10_growth":  _fmtv(ctx.rev_growth_y10, "pct"),
            "sens_low":        _fmtv(ctx.sensitivity_low),
            "sens_high":       _fmtv(ctx.sensitivity_high),
            "sens_range":      (f"{_fmtv(ctx.sensitivity_low)}–{_fmtv(ctx.sensitivity_high)}"
                                if ctx.sensitivity_low else "N/A"),
            "ev_ebitda_median":_fmtv(ctx.ev_ebitda_peer_median, "mult"),
            "comps_implied":   _fmtv(ctx.comps_implied_median),
            "current_price":   _fmtv(ctx.current_price),
        }

        total_usage = TokenUsage()
        sections: dict[str, tuple[str, TokenUsage]] = {}

        for key in SECTION_PROMPTS:
            try:
                text, usage = await self._call_api(key, ctx, client, extra_vars=extra)
                sections[key] = (text, usage)
                total_usage = total_usage + usage
                log.info(
                    "memo.section.complete",
                    ticker=ctx.ticker,
                    section=key,
                    tokens=usage.total_tokens,
                )
                if on_complete:
                    if asyncio.iscoroutinefunction(on_complete):
                        await on_complete(key, text)
                    else:
                        on_complete(key, text)
            except Exception as e:
                log.warning("memo.section.failed", section=key, error=str(e))
                sections[key] = (f"[GENERATION ERROR: {e}]", TokenUsage())

        # ── Assemble typed sections ────────────────────────────────────────
        def _sec(key: str) -> tuple[str, TokenUsage]:
            return sections.get(key, ("[Not generated]", TokenUsage()))

        def _make(key: str, cls: type) -> object:
            text, usage = _sec(key)
            return cls(raw_text=text, usage=usage)

        # Executive Summary — split into paragraphs
        es_text, es_usage = _sec("executive_summary")
        paras = [p.strip() for p in es_text.split("\n\n") if p.strip()]
        exec_summary = ExecutiveSummary(raw_text=es_text, usage=es_usage, paragraphs=paras)

        # Investment Thesis — extract numbered points
        it_text, it_usage = _sec("investment_thesis")
        thesis_points = _extract_numbered_list(it_text)
        inv_thesis = InvestmentThesis(raw_text=it_text, usage=it_usage, thesis_points=thesis_points)

        # Competitive Moat
        moat_text, moat_usage = _sec("competitive_moat")
        comp_moat = CompetitiveMoat(raw_text=moat_text, usage=moat_usage)

        # Growth Drivers
        gd_text, gd_usage = _sec("growth_drivers")
        growth_drivers = GrowthDrivers(raw_text=gd_text, usage=gd_usage)

        # Key Risks
        kr_text, kr_usage = _sec("key_risks")
        key_risks = KeyRisks(raw_text=kr_text, usage=kr_usage)

        # Catalysts
        cat_text, cat_usage = _sec("catalysts")
        catalysts = Catalysts(raw_text=cat_text, usage=cat_usage)

        # Valuation Discussion
        vd_text, vd_usage = _sec("valuation_discussion")
        val_disc = ValuationDiscussion(raw_text=vd_text, usage=vd_usage)

        # Recommendation — parse structured fields
        rec_text, rec_usage = _sec("recommendation")
        recommendation = _parse_recommendation(rec_text, rec_usage, ctx)

        memo = InvestmentMemo(
            ticker=ctx.ticker,
            company_name=ctx.company_name,
            model_used=self._model,
            executive_summary=exec_summary,
            investment_thesis=inv_thesis,
            competitive_moat=comp_moat,
            growth_drivers=growth_drivers,
            key_risks=key_risks,
            catalysts=catalysts,
            valuation_discussion=val_disc,
            recommendation=recommendation,
            total_usage=total_usage,
        )

        log.info(
            "memo.generate.complete",
            ticker=ctx.ticker,
            total_tokens=total_usage.total_tokens,
        )
        return memo

    # ── Single API call ────────────────────────────────────────────────────────

    async def _call_api(
        self,
        section_key: str,
        ctx: MemoContext,
        client: httpx.AsyncClient,
        extra_vars: dict | None = None,
    ) -> tuple[str, TokenUsage]:
        """
        Call the Claude API for one section with retry logic.

        Returns:
            (text, TokenUsage)
        """
        system  = build_system_prompt(ctx.ticker, ctx.company_name)
        context = ctx.build_context_string()
        user    = build_user_prompt(
            section_key, context,
            ticker=ctx.ticker, company=ctx.company_name,
            extra_vars=extra_vars,
        )

        payload = {
            "model":       self._model,
            "max_tokens":  self._max_tokens,
            "temperature": self._temperature,
            "system":      system,
            "messages":    [{"role": "user", "content": user}],
        }

        headers = {
            "x-api-key":         self._api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type":      "application/json",
        }

        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.post(
                    ANTHROPIC_API_URL,
                    json=payload,
                    headers=headers,
                    timeout=60.0,
                )

                if resp.status_code == 429:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
                    log.warning("memo.api.rate_limit", retry_in=delay, section=section_key)
                    await asyncio.sleep(delay)
                    last_error = MemoGeneratorError(f"Rate limit on section {section_key}")
                    continue

                if resp.status_code >= 500:
                    delay = RETRY_BASE_DELAY
                    log.warning("memo.api.server_error", status=resp.status_code)
                    await asyncio.sleep(delay)
                    last_error = MemoGeneratorError(f"Server error {resp.status_code}")
                    continue

                resp.raise_for_status()
                data = resp.json()

                # Extract text from content blocks
                text = " ".join(
                    block.get("text", "")
                    for block in data.get("content", [])
                    if block.get("type") == "text"
                ).strip()

                usage_data = data.get("usage", {})
                usage = TokenUsage(
                    input_tokens  = usage_data.get("input_tokens",  0),
                    output_tokens = usage_data.get("output_tokens", 0),
                )

                return text, usage

            except httpx.TimeoutException:
                last_error = MemoGeneratorError(f"Timeout on section {section_key}")
                await asyncio.sleep(RETRY_BASE_DELAY)
            except httpx.HTTPStatusError as e:
                raise MemoGeneratorError(f"HTTP error {e.response.status_code}: {e.response.text[:200]}")

        raise last_error or MemoGeneratorError(f"All retries exhausted for section {section_key}")

    # ── HTTP client context ────────────────────────────────────────────────────

    @asynccontextmanager
    async def _client_ctx(self):
        if self._http is not None:
            yield self._http
        else:
            async with httpx.AsyncClient() as client:
                yield client


# ── Parsing helpers ────────────────────────────────────────────────────────────

def _extract_numbered_list(text: str) -> list[str]:
    """Extract numbered list items from text (1. ..., 2. ..., 3. ...)."""
    items: list[str] = []
    # Match "1." or "1)" at start of line or after newline
    parts = re.split(r"\n\s*\d+[\.\)]\s*", "\n" + text)
    for part in parts[1:]:  # skip text before first item
        clean = part.strip()
        if clean:
            items.append(clean)
    return items


def _parse_recommendation(
    text: str,
    usage: TokenUsage,
    ctx: MemoContext,
) -> Recommendation:
    """
    Parse the recommendation section text into a structured Recommendation.

    Attempts to extract:
      - Rating from "Rating: BUY" pattern
      - Target price from "Target Price: $201.40"
      - Conviction from "Conviction: HIGH"
    Falls back to defaults on parse failure.
    """
    # Detect rating
    rating = Rating.HOLD  # safe default
    for candidate in Rating:
        if candidate.value in text.upper():
            rating = candidate
            break

    # Detect target price
    target_price = ctx.base_fvps or 0.0
    tp_match = re.search(r"[Tt]arget\s+[Pp]rice:?\s*\$?\s*(\d+\.?\d*)", text)
    if tp_match:
        try:
            target_price = float(tp_match.group(1))
        except ValueError:
            pass

    # Detect conviction
    conviction = ConvictionLevel.MEDIUM
    if "HIGH" in text.upper():
        conviction = ConvictionLevel.HIGH
    elif "LOW" in text.upper():
        conviction = ConvictionLevel.LOW

    # Upside
    upside_pct: float | None = None
    if target_price and ctx.current_price and ctx.current_price > 0:
        upside_pct = (target_price - ctx.current_price) / ctx.current_price

    return Recommendation(
        raw_text=text,
        usage=usage,
        rating=rating,
        target_price=max(target_price, 0.01),
        current_price=ctx.current_price,
        upside_pct=upside_pct,
        conviction=conviction,
    )
