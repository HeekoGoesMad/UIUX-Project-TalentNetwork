import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let database: Database | undefined;

const globalForDb = globalThis as unknown as { __talentNetworkDb?: Database };

export function getDb(): Database {
  if (globalForDb.__talentNetworkDb) return globalForDb.__talentNetworkDb;
  if (database) {
    globalForDb.__talentNetworkDb = database;
    return database;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database.");
  }

  database = drizzle(
    postgres(connectionString, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    }),
    { schema },
  );
  globalForDb.__talentNetworkDb = database;
  return database;
}

export { schema };
