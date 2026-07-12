/**
 * hooks/useListings.ts — fetches listings for the current viewport + filters,
 * with debouncing so panning/zooming doesn't spam the API.
 *
 * HOW THE DEBOUNCE WORKS:
 *   The map reports a new bbox on every move. We don't want a request per
 *   frame, so we hold the bbox in a local state that only updates after the
 *   input has been "quiet" for MAP_MOVE_DEBOUNCE_MS. react-query then refetches
 *   only when that debounced bbox (or the filters) actually change.
 *
 *   Trade-off: a small delay (~300ms) after the user stops moving before points
 *   update, in exchange for far fewer requests and no flicker. For a map UX
 *   that's the right balance; the number is a single tunable in config.ts.
 */

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getListings } from "../api/client";
import { MAP_MOVE_DEBOUNCE_MS } from "../config";
import type { BBox, Filters, ListingsResponse } from "../types";

/** Generic debounce: returns `value` only after it has stopped changing. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // cancel if value changes again first
  }, [value, delayMs]);
  return debounced;
}

export function useListings(bbox: BBox | null, filters: Filters) {
  // Debounce the viewport; filters change deliberately (a click), so they don't
  // need debouncing and are used directly.
  const debouncedBbox = useDebounced(bbox, MAP_MOVE_DEBOUNCE_MS);

  return useQuery<ListingsResponse>({
    // The key includes everything the result depends on, so react-query caches
    // per (bbox + filters) and refetches exactly when one changes.
    queryKey: ["listings", debouncedBbox, filters],
    queryFn: () => getListings(debouncedBbox, filters),
    // Keep showing the previous points while the next set loads — avoids the map
    // flashing empty on every pan.
    placeholderData: keepPreviousData,
  });
}
