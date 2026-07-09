import { sql } from 'drizzle-orm';
import { db } from '../db/client';

/**
 * Health check endpoint — used by Coolify for container health monitoring.
 *
 * Returns 200 with basic status info when the DB is reachable.
 * Returns 503 when the DB is unreachable.
 */
export default defineEventHandler(async (_event) => {
  try {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    return {
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    setResponseStatus(_event, 503);
    return {
      status: 'error',
      db: 'disconnected',
      message: err instanceof Error ? err.message : 'Database unreachable',
      timestamp: new Date().toISOString(),
    };
  }
});
