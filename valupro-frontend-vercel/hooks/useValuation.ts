"use client";
import { useState, useCallback } from "react";
import { valuationApi, type ValuationRequest } from "@/lib/api";
import type { ValuationSummary, LoadingState } from "@/types/valuation";

export function useValuation() {
  const [data, setData] = useState<ValuationSummary | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (ticker: string, req: ValuationRequest = {}) => {
    setState("loading");
    setError(null);
    try {
      const result = await valuationApi.run(ticker, req);
      setData(result);
      setState("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Valuation failed");
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setState("idle");
    setError(null);
  }, []);

  return { data, state, error, run, reset };
}
