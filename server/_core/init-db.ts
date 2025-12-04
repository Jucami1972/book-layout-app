import postgres from "postgres";

// All SQL migrations embedded inline to avoid file system dependencies
const migrations = [
  `-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
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
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

-- Create subscriptionHistory table
CREATE TABLE IF NOT EXISTS "subscriptionHistory" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "oldPlan" text,
  "newPlan" text NOT NULL,
  "reason" text NOT NULL,
  "effectiveDate" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "subscriptionHistory_userId_idx" ON "subscriptionHistory" ("userId");

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
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
);

CREATE INDEX IF NOT EXISTS "projects_userId_idx" ON "projects" ("userId");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status");

-- Create chapters table
CREATE TABLE IF NOT EXISTS "chapters" (
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
);

CREATE INDEX IF NOT EXISTS "chapters_projectId_idx" ON "chapters" ("projectId");
CREATE INDEX IF NOT EXISTS "chapters_orderIndex_idx" ON "chapters" ("orderIndex");

-- Create book_references table
CREATE TABLE IF NOT EXISTS "book_references" (
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
);

CREATE INDEX IF NOT EXISTS "book_references_projectId_idx" ON "book_references" ("projectId");
CREATE INDEX IF NOT EXISTS "book_references_chapterId_idx" ON "book_references" ("chapterId");

-- Create exports table
CREATE TABLE IF NOT EXISTS "exports" (
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
);

CREATE INDEX IF NOT EXISTS "exports_userId_idx" ON "exports" ("userId");
CREATE INDEX IF NOT EXISTS "exports_projectId_idx" ON "exports" ("projectId");
CREATE INDEX IF NOT EXISTS "exports_status_idx" ON "exports" ("status");

-- Create payments table
CREATE TABLE IF NOT EXISTS "payments" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "stripePaymentId" text NOT NULL UNIQUE,
  "amount" real NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "status" text NOT NULL DEFAULT 'PENDING',
  "planType" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments" ("userId");
CREATE INDEX IF NOT EXISTS "payments_stripePaymentId_idx" ON "payments" ("stripePaymentId");

-- Create auditLogs table
CREATE TABLE IF NOT EXISTS "auditLogs" (
  "id" serial PRIMARY KEY,
  "userId" integer,
  "action" text NOT NULL,
  "resourceType" text,
  "resourceId" integer,
  "details" text,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "auditLogs_userId_idx" ON "auditLogs" ("userId");
CREATE INDEX IF NOT EXISTS "auditLogs_action_idx" ON "auditLogs" ("action");
CREATE INDEX IF NOT EXISTS "auditLogs_createdAt_idx" ON "auditLogs" ("createdAt");`
];

export async function runMigrations() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("[Migration] DATABASE_URL not set, skipping migrations");
      return;
    }

    console.log("[Migration] Running database migrations...");
    
    // Configure postgres connection with longer timeouts for migrations
    const client = postgres(connectionString, {
      connect_timeout: 15000, // 15 seconds for initial connection
      idle_timeout: 60, // 60 seconds idle timeout
      max_lifetime: 60 * 30, // 30 minutes max lifetime
    });
    
    for (const migration of migrations) {
      try {
        // Split by semicolon and execute each statement
        const statements = migration.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await client.unsafe(statement);
          }
        }
        console.log("[Migration] ✓ Migration executed successfully");
      } catch (error: any) {
        // Ignore errors if tables already exist
        if (error.message.includes("already exists")) {
          console.log("[Migration] ℹ Tables already exist, skipping");
        } else if (error.message.includes("CONNECT_TIMEOUT") || error.message.includes("timeout")) {
          console.warn("[Migration] Connection timeout, tables might already exist or will be created on next restart");
          break; // Stop trying if we can't connect
        } else {
          console.warn("[Migration] Warning:", error.message);
        }
      }
    }

    await client.end();
    console.log("[Migration] ✓ All migrations completed");
  } catch (error) {
    console.error("[Migration] Failed to run migrations:", error);
    // Don't throw - let the app continue
  }
}
