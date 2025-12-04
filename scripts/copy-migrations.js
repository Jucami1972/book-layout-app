#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyMigrations() {
  try {
    // Get the project root (parent of scripts folder)
    const projectRoot = path.dirname(__dirname);
    const source = path.join(projectRoot, "drizzle");
    const dest = path.join(projectRoot, "dist", "drizzle");
    
    console.log(`Copying migrations from ${source} to ${dest}`);
    await fs.copy(source, dest, { overwrite: true });
    console.log("✓ Migrations copied successfully");
  } catch (error) {
    console.error("Failed to copy migrations:", error);
    process.exit(1);
  }
}

copyMigrations();
