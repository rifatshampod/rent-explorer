
import { signalColor, valueSignal } from "../lib/valueSignal";
import type { AreaFeature, Listing } from "../types";

interface Props {
  listing: Listing;
  /** The area this listing falls in (from areaLookup), or null if unknown. */
  area: AreaFeature | null;
}

/** Format a number or null as a compact string with a fallback dash. */
function fmt(value: number | null | undefined, suffix = ""): string {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

// Human-readable labels for each value signal (the pin color's meaning).
const BADGE_LABEL = {
  good: "Good value (below area median)",
  high: "Above area median",
  par: "At area median",
} as const;

export function ListingPopup({ listing, area }: Props) {
  const areaMedian =
    area && area.properties.median_eur_per_m2 !== null
      ? Number(area.properties.median_eur_per_m2)
      : null;

  const value = listing.eur_per_m2;

  // Same shared signal that colors the pin, so badge and pin always agree.
  const signal = valueSignal(listing, area);
  const badge =
    signal !== null
      ? { label: BADGE_LABEL[signal], color: signalColor(signal) }
      : null;

  return (
    <div style={{ minWidth: 180, lineHeight: 1.5 }}>
      <strong>{listing.listing_id}</strong>
      <div>Rent: {fmt(listing.rent_eur, " €")}</div>
      <div>Size: {fmt(listing.size_m2, " m²")}</div>
      <div>€/m²: {fmt(value)}</div>
      <div>Rooms: {fmt(listing.rooms)}</div>
      <div>Type: {listing.property_type ?? "—"}</div>
      {area && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
          Area: {area.properties.area_name} (median €/m² {fmt(areaMedian)})
        </div>
      )}
      {badge && (
        <div
          style={{
            marginTop: 6,
            padding: "2px 6px",
            borderRadius: 4,
            color: "#fff",
            background: badge.color,
            fontSize: 12,
            display: "inline-block",
          }}
        >
          {badge.label}
        </div>
      )}
    </div>
  );
}
