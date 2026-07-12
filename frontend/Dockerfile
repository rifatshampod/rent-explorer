# ---------------------------------------------------------------------------
# Frontend image — runs the Vite DEV server.
#
# WHY dev-server (not a production build behind nginx) for this practice build:
#   - hot reload while iterating,
#   - one fewer moving part (no separate build + static-serve stage).
#   For a real deployment you'd do a multi-stage build: `npm run build` then
#   serve the static dist/ with nginx. Noted as the production path.
#
# node:20-alpine — small, current LTS Node.
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Install deps first (own layer) so source edits don't reinstall every build.
# Copy only package.json (no lockfile committed in this practice build) and let
# npm resolve; `npm install` is fine here.
COPY package.json ./
RUN npm install

# Copy the rest of the app.
COPY . .

EXPOSE 5173

# --host makes Vite listen on 0.0.0.0 so the published port is reachable from
# the host (see vite.config.ts note).
CMD ["npm", "run", "dev", "--", "--host"]
