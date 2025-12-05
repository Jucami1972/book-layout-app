// Migration is now handled in db.ts on first connection
export async function runMigrations() {
  console.log("[Migration] Migrations will run on first database query");
}
