
import { GeoJSON } from "react-leaflet";
import type { Layer } from "leaflet";
import type { Feature } from "geojson";

import { buildChoroplethScale } from "../lib/colorScale";
import type { AreaStatsResponse } from "../types";

interface Props {
  stats: AreaStatsResponse;
  fillOpacity: number;
}

export function ChoroplethLayer({ stats, fillOpacity }: Props) {
  // Area medians arrive as numeric-strings; coerce for the scale domain.
  const values = stats.features.map((f) =>
    f.properties.median_eur_per_m2 === null
      ? null
      : Number(f.properties.median_eur_per_m2),
  );
  const scale = buildChoroplethScale(values);

  const styleForFeature = (feature?: Feature) => {
    const median = feature?.properties?.median_eur_per_m2;
    const value = median === null || median === undefined ? null : Number(median);
    return {
      fillColor: scale.color(value),
      fillOpacity,
      color: "#999", // faint border so the grid recedes
      weight: 0.5,
    };
  };

  // Hover-only tooltip (not permanent) — detail on demand, no visual clutter.
  const onEachFeature = (feature: Feature, layer: Layer) => {
    const p = feature.properties as AreaStatsResponse["features"][number]["properties"];
    const median =
      p.median_eur_per_m2 === null ? "—" : Number(p.median_eur_per_m2).toFixed(1);
    layer.bindTooltip(
      `${p.area_name}: median €/m² ${median} · ${p.listing_count} listings`,
      { sticky: true },
    );
  };

  return (
    <GeoJSON
      key={`${stats.features.length}-${fillOpacity}`}
      data={stats as unknown as GeoJSON.FeatureCollection}
      style={styleForFeature}
      onEachFeature={onEachFeature}
    />
  );
}
