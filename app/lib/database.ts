import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return neon(databaseUrl);
}
