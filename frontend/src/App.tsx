
import { useMemo, useState } from "react";

import { MapView } from "./components/MapView";
import { FilterPanel } from "./components/FilterPanel";
import { Legend } from "./components/Legend";
import { SummaryPanel } from "./components/SummaryPanel";
import { useAreaStats } from "./hooks/useAreaStats";
import { useListings } from "./hooks/useListings";
import { buildChoroplethScale } from "./lib/colorScale";
import { CHOROPLETH_DEFAULT_OPACITY } from "./config";
import type { BBox, Filters } from "./types";

const EMPTY_FILTERS: Filters = {
  rentMin: null,
  rentMax: null,
  rooms: null,
  propertyType: null,
};

export default function App() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [bbox, setBbox] = useState<BBox | null>(null);
  // Live choropleth fill opacity, controlled by the side-panel slider.
  const [choroplethOpacity, setChoroplethOpacity] = useState(
    CHOROPLETH_DEFAULT_OPACITY,
  );

  // Choropleth data (fetched once) and the per-viewport listings.
  const areaStatsQuery = useAreaStats();
  const listingsQuery = useListings(bbox, filters);

  const listings = listingsQuery.data?.listings ?? [];

  // Build the shared color scale once from the area medians, and hand the SAME
  // scale to the Legend (the map builds its fill from the same function).
  const scale = useMemo(() => {
    const values =
      areaStatsQuery.data?.features.map((f) =>
        f.properties.median_eur_per_m2 === null
          ? null
          : Number(f.properties.median_eur_per_m2),
      ) ?? [];
    return buildChoroplethScale(values);
  }, [areaStatsQuery.data]);

  return (
    // Full-viewport map with the controls floating OVER it. The map is the
    // whole canvas; the panel is a detached card, so the map is visible on all
    // sides of the card.
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* --- Map (full bleed, behind everything) --- */}
      <MapView
        listings={listings}
        areaStats={areaStatsQuery.data}
        choroplethOpacity={choroplethOpacity}
        onBoundsChange={setBbox}
      />

      {/* --- Floating control card (middle-right, height fits content) --- */}
      <aside className="filter-card">
        <div>
          <h2 style={{ margin: "0 0 4px" }}>Rent Explorer</h2>
          <div style={{ fontSize: 13, color: "#666" }}>Helsinki metro rentals</div>
        </div>

        <FilterPanel filters={filters} onChange={setFilters} />

        <SummaryPanel listings={listings} isLoading={listingsQuery.isFetching} />

        {/* Loading / error surfaces for the choropleth. */}
        {areaStatsQuery.isLoading && <div>Loading area stats…</div>}
        {areaStatsQuery.isError && (
          <div style={{ color: "#c62828" }}>Failed to load area stats.</div>
        )}
        {areaStatsQuery.data && (
          <div style={{ display: "grid", gap: 8 }}>
            <Legend scale={scale} />
            {/* Live opacity control: lets the user dial the choropleth from
                subtle (see the basemap through it) to solid (pure color). */}
            <label style={{ display: "grid", gap: 2, fontSize: 13 }}>
              Choropleth opacity: {Math.round(choroplethOpacity * 100)}%
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={choroplethOpacity}
                onChange={(e) => setChoroplethOpacity(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {listingsQuery.isError && (
          <div style={{ color: "#c62828" }}>Failed to load listings.</div>
        )}
      </aside>
    </div>
  );
}
