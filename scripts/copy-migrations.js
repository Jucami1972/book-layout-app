#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyMigrations() {
  try {
    const source = path.join(__dirname, "drizzle");
    const dest = path.join(__dirname, "dist", "drizzle");
    
    console.log(`Copying migrations from ${source} to ${dest}`);
    await fs.copy(source, dest, { overwrite: true });
    console.log("✓ Migrations copied successfully");
  } catch (error) {
    console.error("Failed to copy migrations:", error);
    process.exit(1);
  }
}

copyMigrations();
