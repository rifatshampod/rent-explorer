
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Initial map view: centre of the Helsinki metro area and a zoom that shows the
// whole 12-area region. Derived from the data's coordinate extent
// (lng ~24.64–25.12, lat ~60.15–60.30).
export const MAP_CENTER: [number, number] = [60.22, 24.94]; // [lat, lng]
export const MAP_ZOOM = 11;

// The property types that exist in the dataset
export const PROPERTY_TYPES = ["apartment", "studio", "townhouse"] as const;

// How long to wait after the map stops moving before refetching listings
export const MAP_MOVE_DEBOUNCE_MS = 300;

// --- Basemap ---------------------------------------------------------------
export const BASEMAP_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Default choropleth fill opacity.
export const CHOROPLETH_DEFAULT_OPACITY = 0.3;
