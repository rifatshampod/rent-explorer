
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

import { ChoroplethLayer } from "./ChoroplethLayer";
import { ListingsLayer } from "./ListingsLayer";
import {
  BASEMAP_ATTRIBUTION,
  BASEMAP_URL,
  MAP_CENTER,
  MAP_ZOOM,
} from "../config";
import type { AreaStatsResponse, BBox, Listing } from "../types";

interface Props {
  listings: Listing[];
  areaStats: AreaStatsResponse | undefined;
  choroplethOpacity: number;
  onBoundsChange: (bbox: BBox) => void;
}

/**
 * ViewportReporter — a child that lives INSIDE MapContainer so it can access the
 * map via hooks. Reports the current bounds once on mount and on every moveend.
 */
function ViewportReporter({ onBoundsChange }: { onBoundsChange: (b: BBox) => void }) {
  const map = useMap();

  const emit = () => {
    const b = map.getBounds();
    onBoundsChange({
      minLng: b.getWest(),
      minLat: b.getSouth(),
      maxLng: b.getEast(),
      maxLat: b.getNorth(),
    });
  };

  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({ moveend: emit });
  return null;
}

export function MapView({
  listings,
  areaStats,
  choroplethOpacity,
  onBoundsChange,
}: Props) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      style={{ height: "100%", width: "100%" }}
    >
      {/* 1. Grayscale base (includes its own place labels). */}
      <TileLayer attribution={BASEMAP_ATTRIBUTION} url={BASEMAP_URL} />

      {/* 2. Choropleth fill — faint background price tint. */}
      {areaStats && (
        <ChoroplethLayer stats={areaStats} fillOpacity={choroplethOpacity} />
      )}

      {/* 3. Listing points — the primary layer, clustered, on top. */}
      <ListingsLayer listings={listings} areaStats={areaStats} />

      <ViewportReporter onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}
