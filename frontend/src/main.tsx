/**
 * main.tsx — the app entry point.
 *
 * Two things happen here:
 *   1. Leaflet's CSS is imported globally (required — without it the map tiles
 *      and controls render unstyled/broken).
 *   2. The app is wrapped in QueryClientProvider so every component can use the
 *      react-query hooks (useListings / useAreaStats).
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Leaflet's stylesheet — MUST be imported for the map to display correctly.
import "leaflet/dist/leaflet.css";
// Our global styles (choropleth label overrides, full-height layout).
import "./index.css";

import App from "./App";

// One QueryClient for the whole app. Defaults are fine for this scope; we set a
// modest retry so a flaky request doesn't hammer the API.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
