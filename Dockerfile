# syntax=docker.io/docker/dockerfile:1

# Multi-stage build for the Foodora Nuxt node-server.
# Produces a small runtime image that serves the web/PWA surface from .output/server/index.mjs.

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Enable Corepack and pin pnpm to the version used in the project.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Disable Nuxt telemetry during build.
ENV NUXT_TELEMETRY_DISABLED=1

# Copy dependency manifests and install exactly the pinned versions.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source.
COPY . .

# Build the node-server output (default Nuxt preset). This embeds the SPA/PWA
# assets and compiles the Nitro server routes under .output/.
RUN pnpm build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Runtime environment (injected/overridden by Coolify at deploy time).
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_ACCESS_TTL=${JWT_ACCESS_TTL:-900}
ENV JWT_REFRESH_TTL=${JWT_REFRESH_TTL:-604800}

# Copy the built artifacts and production node_modules from the builder.
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the default Nitro node-server port.
EXPOSE 3000

# Start the Nitro server.
CMD ["node", ".output/server/index.mjs"]
