// The three property types in the dataset.
export type PropertyType = "apartment" | "studio" | "townhouse";

export interface RawListing {
  listing_id: string;
  rooms: number | null;
  size_m2: string | number | null; // numeric -> string over the wire
  rent_eur: number | null;
  property_type: PropertyType | null;
  listed_date: string | null;
  latitude: number;
  longitude: number;
  eur_per_m2: string | number | null; // numeric -> string over the wire
  distance_m?: string | number; // only present on /listings/near
}

// The cleaned shape used everywhere in the UI: all numeric fields are numbers.
export interface Listing {
  listing_id: string;
  rooms: number | null;
  size_m2: number | null;
  rent_eur: number | null;
  property_type: PropertyType | null;
  listed_date: string | null;
  latitude: number;
  longitude: number;
  eur_per_m2: number | null;
  distance_m?: number;
}

// Envelope returned by /listings and /listings/near.
export interface ListingsResponse {
  count: number;
  listings: Listing[];
}

// --- /areas/stats : a GeoJSON FeatureCollection of polygons ---------------
export interface AreaStatsProperties {
  area_code: string;
  area_name: string;
  listing_count: number;
  median_rent: number | null;
  median_eur_per_m2: number | null;
}

export interface AreaFeature {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: AreaStatsProperties;
}

export interface AreaStatsResponse {
  type: "FeatureCollection";
  features: AreaFeature[];
}

// The filter state owned by App and turned into query params.
export interface Filters {
  rentMin: number | null;
  rentMax: number | null;
  rooms: number | null;
  propertyType: PropertyType | null;
}

// A map viewport bounding box (what the map reports on move).
export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}
