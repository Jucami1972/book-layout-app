import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    
    // Try multiple paths where migrations might be located
    let migrationsPath = path.join(__dirname, "../../drizzle/migrations");
    
    // In production (compiled), they might be in dist/
    if (process.env.NODE_ENV === "production") {
      migrationsPath = path.join(__dirname, "../drizzle/migrations");
    }
    
    console.log(`[Migration] Looking for migrations in: ${migrationsPath}`);
    
    try {
      await migrate(db, { migrationsFolder: migrationsPath });
      console.log("[Migration] ✓ Migrations completed successfully");
    } catch (migrationError: any) {
      if (migrationError.message.includes("Can't find")) {
        console.warn("[Migration] Migrations folder not found in bundle, skipping auto-migrations");
        console.warn("[Migration] Tables might already exist in the database");
      } else {
        throw migrationError;
      }
    }

    await client.end();
  } catch (error) {
    console.error("[Migration] Failed to run migrations:", error);
    // Don't throw - let the app continue, the tables might already exist
  }
}
