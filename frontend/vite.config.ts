import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the React dev server.
//   - port 5173 is Vite's default and is the origin the backend's CORS config
//     already allows, so no extra setup is needed to call the API.
//   - host: true makes the dev server listen on 0.0.0.0, which is required when
//     it runs INSIDE a Docker container (otherwise it only binds localhost
//     inside the container and the port mapping can't reach it).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Allow the container-network hostname used when a headless browser running
    // in another container reaches this dev server (dev-only convenience).
    allowedHosts: ["host.docker.internal", "localhost"],
  },
});
