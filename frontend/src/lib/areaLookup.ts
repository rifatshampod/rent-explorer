
import type { AreaFeature, AreaStatsResponse } from "../types";

interface AreaBox {
  feature: AreaFeature;
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** Pre-compute each area's bounding box once from its polygon coordinates. */
export function buildAreaIndex(stats: AreaStatsResponse | undefined): AreaBox[] {
  if (!stats) return [];
  return stats.features.map((feature) => {
    // Polygon geometry: coordinates[0] is the outer ring of [lng, lat] pairs.
    const ring = (feature.geometry as GeoJSON.Polygon).coordinates[0];
    const lngs = ring.map((c) => c[0]);
    const lats = ring.map((c) => c[1]);
    return {
      feature,
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  });
}

/** Return the area feature containing (lat, lng), or null if none. */
export function findArea(
  index: AreaBox[],
  lat: number,
  lng: number,
): AreaFeature | null {
  for (const a of index) {
    if (lng >= a.minLng && lng <= a.maxLng && lat >= a.minLat && lat <= a.maxLat) {
      return a.feature;
    }
  }
  return null;
}
