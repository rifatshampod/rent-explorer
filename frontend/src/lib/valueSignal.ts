import type { AreaFeature, Listing } from "../types";

export type ValueSignal = "good" | "high" | "par" | null;

export const VALUE_COLORS: Record<"good" | "high" | "par" | "unknown", string> = {
  good: "#2e7d32", // green  — cheaper than area median
  high: "#c62828", // red    — pricier than area median
  par: "#616161", // grey   — at the median
  unknown: "#0b6cff", // blue — no comparison available
};

/** Compute the value signal for a listing given its area. */
export function valueSignal(listing: Listing, area: AreaFeature | null): ValueSignal {
  const value = listing.eur_per_m2;
  // Area medians arrive as numeric-strings over the wire; coerce.
  const median =
    area && area.properties.median_eur_per_m2 !== null
      ? Number(area.properties.median_eur_per_m2)
      : null;

  if (value === null || median === null) return null;
  if (value < median) return "good";
  if (value > median) return "high";
  return "par";
}

/** Map a signal to its pin color. */
export function signalColor(signal: ValueSignal): string {
  if (signal === null) return VALUE_COLORS.unknown;
  return VALUE_COLORS[signal];
}
