import { eq, and, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  projects,
  chapters,
  exports,
  InsertProject,
  InsertChapter,
  InsertExport,
  subscriptionHistory,
  book_references,
  auditLogs,
} from "../drizzle/schema";

export let database: ReturnType<typeof drizzle>;

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationsDone = false;

export async function getDb() {
  if (!_db) {
    try {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        console.warn("[DB] DATABASE_URL not set - database operations will fail");
        return null;
      }
      
      console.log("[DB] Initializing database connection (3s timeout)...");
      
      // Create client with very aggressive timeouts
      const client = postgres(connectionString, {
        connect_timeout: 2000,  // 2 seconds only
        idle_timeout: 5,
        max_lifetime: 60,
        statement_timeout: 2000,
      });
      
      // Test connection immediately with timeout
      try {
        console.log("[DB] Testing connection...");
        const testResult = await Promise.race([
          client`SELECT 1`,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 2500)
          )
        ]);
        console.log("[DB] ✓ Connection successful");
        
        _db = drizzle(client);
        
        // Run migrations in background
        if (!_migrationsDone) {
          _migrationsDone = true;
          runMigrationsInBackground(client).catch(() => {});
        }
      } catch (testError: any) {
        console.error("[DB] ✗ Connection failed:", testError.message);
        console.error("[DB] DATABASE_URL:", connectionString.substring(0, 50) + "...");
        try {
          await client.end().catch(() => {});
        } catch (e) {}
        // Don't throw - return null to allow app to continue
        return null;
      }
      
    } catch (error: any) {
      console.error("[DB] Setup error:", error.message);
      return null;
    }
  }
  return _db;
}

// Run migrations in background without blocking
async function runMigrationsInBackground(client: any) {
  console.log("[DB] Starting background migrations...");
  try {
    await Promise.race([
      runMigrationsInternal(client),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Migrations timeout')), 15000)
      )
    ]);
    console.log("[DB] ✓ Migrations completed");
  } catch (error: any) {
    console.warn("[DB] ⚠ Migrations failed (non-blocking):", error.message);
  }
}

// Wrapper with timeout for database operations
async function withDbTimeout<T>(operation: (db: any) => Promise<T>, timeoutMs = 5000): Promise<T> {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable - check DATABASE_URL and network connectivity");
  
  return Promise.race([
    operation(db),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), timeoutMs)
    )
  ]);
}

async function runMigrationsInternal(client: any) {
  const createTablesSQL = [
    // Users table
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY,
      "email" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "passwordHash" text NOT NULL,
      "planType" text NOT NULL DEFAULT 'FREE',
      "planActive" boolean NOT NULL DEFAULT true,
      "subscriptionStartDate" timestamp,
      "subscriptionEndDate" timestamp,
      "stripeCustomerId" text,
      "stripeSubscriptionId" text,
      "resetPasswordToken" text,
      "resetPasswordExpiry" timestamp,
      "emailVerified" boolean NOT NULL DEFAULT false,
      "emailVerificationToken" text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      "lastSignedIn" timestamp
    )`,
    `CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`,
    `CREATE TABLE IF NOT EXISTS "subscriptionHistory" (
      "id" serial PRIMARY KEY,
      "userId" integer NOT NULL,
      "oldPlan" text,
      "newPlan" text NOT NULL,
      "reason" text NOT NULL,
      "effectiveDate" timestamp NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "subscriptionHistory_userId_idx" ON "subscriptionHistory" ("userId")`,
    `CREATE TABLE IF NOT EXISTS "projects" (
      "id" serial PRIMARY KEY,
      "userId" integer NOT NULL,
      "title" text NOT NULL,
      "subtitle" text,
      "author" text,
      "genre" text,
      "publicationType" text NOT NULL DEFAULT 'both',
      "pageSize" text NOT NULL DEFAULT '6x9',
      "customWidth" integer,
      "customHeight" integer,
      "marginTop" integer NOT NULL DEFAULT 19,
      "marginBottom" integer NOT NULL DEFAULT 19,
      "marginLeft" integer NOT NULL DEFAULT 19,
      "marginRight" integer NOT NULL DEFAULT 19,
      "marginGutter" integer NOT NULL DEFAULT 6,
      "fontFamily" text NOT NULL DEFAULT 'Georgia',
      "fontSize" integer NOT NULL DEFAULT 11,
      "lineHeight" integer NOT NULL DEFAULT 160,
      "coverImageUrl" text,
      "coverImageKey" text,
      "biography" text,
      "dedication" text,
      "acknowledgments" text,
      "isbn" text,
      "publisher" text,
      "printingInfo" text,
      "copyright" text,
      "autoNumberChapters" boolean NOT NULL DEFAULT true,
      "chapterNumberFormat" text DEFAULT 'Capítulo {n}',
      "templateId" text,
      "status" text NOT NULL DEFAULT 'draft',
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "projects_userId_idx" ON "projects" ("userId")`,
    `CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status")`,
    `CREATE TABLE IF NOT EXISTS "chapters" (
      "id" serial PRIMARY KEY,
      "projectId" integer NOT NULL,
      "parentId" integer,
      "title" text NOT NULL,
      "content" text NOT NULL,
      "orderIndex" integer NOT NULL,
      "level" integer NOT NULL DEFAULT 1,
      "type" text NOT NULL DEFAULT 'chapter',
      "startOnNewPage" boolean NOT NULL DEFAULT true,
      "includeInToc" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "chapters_projectId_idx" ON "chapters" ("projectId")`,
    `CREATE INDEX IF NOT EXISTS "chapters_orderIndex_idx" ON "chapters" ("orderIndex")`,
    `CREATE TABLE IF NOT EXISTS "book_references" (
      "id" serial PRIMARY KEY,
      "projectId" integer NOT NULL,
      "chapterId" integer,
      "type" text DEFAULT 'book',
      "author" text,
      "title" text NOT NULL,
      "year" integer,
      "publisher" text,
      "url" text,
      "notes" text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "book_references_projectId_idx" ON "book_references" ("projectId")`,
    `CREATE INDEX IF NOT EXISTS "book_references_chapterId_idx" ON "book_references" ("chapterId")`,
    `CREATE TABLE IF NOT EXISTS "exports" (
      "id" serial PRIMARY KEY,
      "projectId" integer NOT NULL,
      "userId" integer NOT NULL,
      "format" text NOT NULL,
      "fileUrl" text NOT NULL,
      "fileKey" text NOT NULL,
      "fileSize" integer,
      "status" text NOT NULL DEFAULT 'processing',
      "errorMessage" text,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "exports_userId_idx" ON "exports" ("userId")`,
    `CREATE INDEX IF NOT EXISTS "exports_projectId_idx" ON "exports" ("projectId")`,
    `CREATE INDEX IF NOT EXISTS "exports_status_idx" ON "exports" ("status")`,
    `CREATE TABLE IF NOT EXISTS "payments" (
      "id" serial PRIMARY KEY,
      "userId" integer NOT NULL,
      "stripePaymentId" text NOT NULL UNIQUE,
      "amount" real NOT NULL,
      "currency" text NOT NULL DEFAULT 'USD',
      "status" text NOT NULL DEFAULT 'PENDING',
      "planType" text NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments" ("userId")`,
    `CREATE INDEX IF NOT EXISTS "payments_stripePaymentId_idx" ON "payments" ("stripePaymentId")`,
    `CREATE TABLE IF NOT EXISTS "auditLogs" (
      "id" serial PRIMARY KEY,
      "userId" integer,
      "action" text NOT NULL,
      "resourceType" text,
      "resourceId" integer,
      "details" text,
      "ipAddress" text,
      "userAgent" text,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "auditLogs_userId_idx" ON "auditLogs" ("userId")`,
    `CREATE INDEX IF NOT EXISTS "auditLogs_action_idx" ON "auditLogs" ("action")`,
    `CREATE INDEX IF NOT EXISTS "auditLogs_createdAt_idx" ON "auditLogs" ("createdAt")`,
  ];
  
  for (let i = 0; i < createTablesSQL.length; i++) {
    try {
      await client.unsafe(createTablesSQL[i]);
      console.log(`[DB] ✓ Statement ${i + 1}/${createTablesSQL.length}`);
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString?.() || JSON.stringify(error);
      if (!errorMsg.includes("already exists") && !errorMsg.includes("duplicate key")) {
        console.error(`[DB] ✗ Statement ${i + 1}/${createTablesSQL.length} failed`);
        console.error(`[DB]   Error:`, errorMsg);
        console.error(`[DB]   SQL:`, createTablesSQL[i].substring(0, 100) + "...");
      } else {
        console.log(`[DB] ℹ Statement ${i + 1}/${createTablesSQL.length} (already exists)`);
      }
    }
  }
}

// ============ Project Functions ============


export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projects).values(project);
  // Get the last inserted project by email (or use a different unique identifier)
  const result = await db.select().from(projects).where(eq(projects.id, project.id!)).limit(1);
  return result[0]?.id || 0;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProject(projectId: number, updates: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  
  if (Object.keys(cleanUpdates).length === 0) {
    return; // Nothing to update
  }
  
  await db.update(projects).set(cleanUpdates).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete associated chapters first
  await db.delete(chapters).where(eq(chapters.projectId, projectId));
  // Delete associated exports
  await db.delete(exports).where(eq(exports.projectId, projectId));
  // Delete project
  await db.delete(projects).where(eq(projects.id, projectId));
}

// ============ Chapter Functions ============

export async function createChapter(chapter: InsertChapter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(chapters).values(chapter);
  // Get the last inserted chapter
  const result = await db.select().from(chapters).where(eq(chapters.id, chapter.id!)).limit(1);
  return result[0]?.id || 0;
}

export async function getProjectChapters(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(chapters).where(eq(chapters.projectId, projectId)).orderBy(chapters.orderIndex);
}

export async function getChapterById(chapterId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateChapter(chapterId: number, updates: Partial<InsertChapter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(chapters).set(updates).where(eq(chapters.id, chapterId));
}

export async function deleteChapter(chapterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(chapters).where(eq(chapters.id, chapterId));
}

export async function reorderChapters(projectId: number, chapterOrders: { id: number; orderIndex: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update each chapter's order
  for (const { id, orderIndex } of chapterOrders) {
    await db.update(chapters).set({ orderIndex }).where(and(eq(chapters.id, id), eq(chapters.projectId, projectId)));
  }
}

// ============ Export Functions ============

export async function createExport(exportRecord: InsertExport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(exports).values(exportRecord);
  // Get the last inserted export
  const result = await db.select().from(exports).where(eq(exports.id, exportRecord.id!)).limit(1);
  return result[0]?.id || 0;
}

export async function getProjectExports(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(exports).where(eq(exports.projectId, projectId)).orderBy(desc(exports.createdAt));
}

export async function updateExport(exportId: number, updates: Partial<InsertExport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(exports).set(updates).where(eq(exports.id, exportId));
}

// ============ SaaS User Functions ============

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  planType: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  planActive: boolean;
}) {
  return withDbTimeout(async (db) => {
    await db.insert(users).values({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      planType: data.planType,
      planActive: data.planActive,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the created user by email
    const result = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!result[0]) throw new Error("Failed to create user");

    return {
      id: result[0].id,
      email: data.email,
      name: data.name,
      planType: data.planType,
      planActive: data.planActive,
    };
  });
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserByEmail(email: string) {
  return withDbTimeout(async (db) => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }, 8000).catch(() => null); // Return null on timeout instead of throwing
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.resetPasswordToken, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateUser(userId: number, data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function countUserProjects(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  return result[0]?.count || 0;
}

export async function countProjectChapters(projectId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(chapters)
    .where(eq(chapters.projectId, projectId));

  return result[0]?.count || 0;
}

// ============ Subscription History Functions ============

export async function createSubscriptionHistory(data: {
  userId: number;
  oldPlan: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY' | null;
  newPlan: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  reason: 'UPGRADE' | 'DOWNGRADE' | 'CANCELED' | 'RENEWAL' | 'MANUAL_CHANGE';
  effectiveDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  await db.insert(subscriptionHistory).values({
    userId: data.userId,
    oldPlan: data.oldPlan,
    newPlan: data.newPlan,
    reason: data.reason,
    effectiveDate: data.effectiveDate,
    createdAt: now,
  });

  // Return the created record (we'll just return the userId as a simple identifier)
  return data.userId;
}

// Alias for backward compatibility
export async function recordSubscriptionChange(data: {
  userId: number;
  oldPlan: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY' | null;
  newPlan: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  reason: 'UPGRADE' | 'DOWNGRADE' | 'CANCELED' | 'RENEWAL' | 'MANUAL_CHANGE';
  effectiveDate: Date;
  createdAt?: Date;
}) {
  return createSubscriptionHistory({
    userId: data.userId,
    oldPlan: data.oldPlan,
    newPlan: data.newPlan,
    reason: data.reason,
    effectiveDate: data.effectiveDate,
  });
}

// ============ Audit Log Functions ============

export async function createAuditLog(data: {
  userId: number | null;
  action: string;
  resourceType?: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return; // Don't throw, just skip

  try {
    const now = new Date();
    await db.insert(auditLogs).values({
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details ? JSON.stringify(data.details) : undefined,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: now,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
