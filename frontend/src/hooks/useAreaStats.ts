/**
 * hooks/useAreaStats.ts — fetches the choropleth data (/areas/stats).
 *
 * This data doesn't depend on the map viewport or filters (it's the whole-city
 * per-area medians), so it's fetched once and cached. react-query handles the
 * caching, loading, and error state for us.
 */

import { useQuery } from "@tanstack/react-query";

import { getAreaStats } from "../api/client";
import type { AreaStatsResponse } from "../types";

export function useAreaStats() {
  return useQuery<AreaStatsResponse>({
    queryKey: ["areaStats"],
    queryFn: getAreaStats,
    // Area medians are static for the session; no need to refetch on window focus.
    staleTime: Infinity,
  });
}
