import { d as defineEventHandler, c as setResponseStatus } from '../../nitro/nitro.mjs';
import { sql } from 'drizzle-orm';
import { d as db } from '../../_/client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'bcryptjs';
import 'jose';
import 'drizzle-orm/postgres-js';
import 'postgres';
import 'drizzle-orm/pg-core';

const health_get = defineEventHandler(async (_event) => {
  try {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    return {
      status: "ok",
      db: "connected",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    setResponseStatus(_event, 503);
    return {
      status: "error",
      db: "disconnected",
      message: err instanceof Error ? err.message : "Database unreachable",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
});

export { health_get as default };
//# sourceMappingURL=health.get.mjs.map
