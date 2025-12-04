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

export async function getDb() {
  if (!_db) {
    try {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL environment variable not set");
      }
      const client = postgres(connectionString);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
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
