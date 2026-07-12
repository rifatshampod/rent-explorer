import { API_URL } from "../config";
import type {
  AreaStatsResponse,
  BBox,
  Filters,
  Listing,
  ListingsResponse,
  RawListing,
} from "../types";

/** Coerce a wire value that may be a numeric-string | number | null to number|null. */
function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Turn a RawListing (mixed string/number numeric fields) into a clean Listing
 * with real numbers everywhere*/
function cleanListing(raw: RawListing): Listing {
  return {
    listing_id: raw.listing_id,
    rooms: raw.rooms,
    size_m2: num(raw.size_m2),
    rent_eur: raw.rent_eur,
    property_type: raw.property_type,
    listed_date: raw.listed_date,
    latitude: raw.latitude,
    longitude: raw.longitude,
    eur_per_m2: num(raw.eur_per_m2),
    distance_m: raw.distance_m !== undefined ? num(raw.distance_m) ?? undefined : undefined,
  };
}

/** Small typed fetch helper with a clear error on non-2xx. */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    // Surface the status so react-query's error state is meaningful.
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return (await res.json()) as T;
}


function buildListingsQuery(bbox: BBox | null, filters: Filters): string {
  const p = new URLSearchParams();
  if (bbox) {
    p.set("min_lng", String(bbox.minLng));
    p.set("min_lat", String(bbox.minLat));
    p.set("max_lng", String(bbox.maxLng));
    p.set("max_lat", String(bbox.maxLat));
  }
  if (filters.rentMin !== null) p.set("rent_min", String(filters.rentMin));
  if (filters.rentMax !== null) p.set("rent_max", String(filters.rentMax));
  if (filters.rooms !== null) p.set("rooms", String(filters.rooms));
  if (filters.propertyType !== null) p.set("property_type", filters.propertyType);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** GET /listings with the current viewport bbox and attribute filters. */
export async function getListings(
  bbox: BBox | null,
  filters: Filters,
): Promise<ListingsResponse> {
  const raw = await getJson<{ count: number; listings: RawListing[] }>(
    `/listings${buildListingsQuery(bbox, filters)}`,
  );
  return { count: raw.count, listings: raw.listings.map(cleanListing) };
}

/** GET /areas/stats — GeoJSON for the choropleth. Medians already come as
 *  numbers-or-null in properties; no per-listing coercion needed here. */
export async function getAreaStats(): Promise<AreaStatsResponse> {
  return getJson<AreaStatsResponse>("/areas/stats");
}

/** GET /listings/near — radius search */
export async function getListingsNear(
  lat: number,
  lng: number,
  radiusM: number,
): Promise<ListingsResponse> {
  const p = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_m: String(radiusM),
  });
  const raw = await getJson<{ count: number; listings: RawListing[] }>(
    `/listings/near?${p.toString()}`,
  );
  return { count: raw.count, listings: raw.listings.map(cleanListing) };
}
