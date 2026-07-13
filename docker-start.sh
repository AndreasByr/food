#!/bin/sh
set -e

# Run Drizzle migrations before starting the Nitro server.
# drizzle-kit migrate reads DATABASE_URL from the environment and
# drizzle.config.ts from the working directory.
echo "Running database migrations..."
npx drizzle-kit migrate

echo "Starting Nitro server..."
exec node .output/server/index.mjs
