import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export async function runMigrations() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("[Migration] DATABASE_URL not set, skipping migrations");
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("[Migration] Running database migrations...");
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    console.log("[Migration] ✓ Migrations completed successfully");

    await client.end();
  } catch (error) {
    console.error("[Migration] Failed to run migrations:", error);
    // Don't throw - let the app continue, the tables might already exist
  }
}
