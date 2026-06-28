"use client";
import { useState, useCallback } from "react";
import { companyApi } from "@/lib/api";
import type { CompanyProfile, CompanySearchResult, LoadingState } from "@/types/valuation";

export function useCompanySearch() {
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); setState("idle"); return; }
    setState("loading");
    setError(null);
    try {
      const data = await companyApi.search(query);
      setResults(data);
      setState("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setState("error");
    }
  }, []);

  return { results, state, error, search };
}

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (ticker: string) => {
    setState("loading");
    setError(null);
    try {
      const data = await companyApi.profile(ticker);
      setProfile(data);
      setState("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
      setState("error");
    }
  }, []);

  return { profile, state, error, fetch };
}
