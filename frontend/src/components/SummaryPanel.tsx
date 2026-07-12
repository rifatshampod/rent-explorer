
import { useMemo } from "react";

import type { Listing } from "../types";

interface Props {
  listings: Listing[];
  isLoading: boolean;
}

/** Median of a numeric array (returns null for an empty array). */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function SummaryPanel({ listings, isLoading }: Props) {
  // Recompute only when the listing set changes.
  const medianEurPerM2 = useMemo(() => {
    const values = listings
      .map((l) => l.eur_per_m2)
      .filter((v): v is number => v !== null);
    return median(values);
  }, [listings]);

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <h3 style={{ margin: "0 0 4px" }}>Current view</h3>
      <div>Listings visible: {listings.length}</div>
      <div>
        Median €/m²:{" "}
        {medianEurPerM2 === null ? "—" : medianEurPerM2.toFixed(1)}
      </div>
      {isLoading && <div style={{ color: "#888", fontSize: 12 }}>updating…</div>}
    </div>
  );
}
