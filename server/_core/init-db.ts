import postgres from "postgres";

export async function runMigrations() {
  let client: any;
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log("[Migration] Running database migrations...");
    console.log("[Migration] DATABASE_URL exists:", !!connectionString);
    
    if (!connectionString) {
      console.error("[Migration] DATABASE_URL not set, skipping migrations");
      return;
    }

    // Log connection string (masked for security)
    const maskedUrl = connectionString.replace(/:[^@]*@/, ":***@");
    console.log("[Migration] Connecting to:", maskedUrl);
    
    // Configure postgres connection with shorter initial timeout
    client = postgres(connectionString, {
      connect_timeout: 5000,  // 5 seconds - fail fast
      idle_timeout: 10,
      max_lifetime: 60 * 5,
      socket: {
        keepalive: false,
      },
      ssl: 'require',
    });
    
    // Test connection first with timeout
    try {
      console.log("[Migration] Testing database connection...");
      console.log("[Migration] Sending test query...");
      
      const testPromise = client`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );
      
      const result = await Promise.race([testPromise, timeoutPromise]);
      console.log("[Migration] ✓ Database connection successful");
    } catch (connError: any) {
      console.error("[Migration] ✗ Failed to connect to database");
      console.error("[Migration] Error type:", connError.constructor.name);
      console.error("[Migration] Error message:", connError.message);
      console.error("[Migration] Error code:", connError.code);
      console.error("[Migration] Full error:", JSON.stringify(connError, null, 2));
      if (client) await client.end().catch(() => {});
      return;
    }
    
    // Create tables one by one
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
      
      // Users index
      `CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`,
      
      // Subscription history table
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
      
      // Projects table
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
      
      // Chapters table
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
      
      // Book references table
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
      
      // Exports table
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
      
      // Payments table
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
      
      // Audit logs table
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
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < createTablesSQL.length; i++) {
      const sql = createTablesSQL[i];
      try {
        await client.unsafe(sql);
        successCount++;
        console.log(`[Migration] ✓ Statement ${i + 1}/${createTablesSQL.length}`);
      } catch (error: any) {
        const errorMsg = error.message || JSON.stringify(error);
        if (errorMsg.includes("already exists")) {
          skipCount++;
          console.log(`[Migration] ℹ Statement ${i + 1}/${createTablesSQL.length} (already exists)`);
        } else {
          console.error(`[Migration] ✗ Statement ${i + 1}/${createTablesSQL.length} FAILED:`, errorMsg);
        }
      }
    }

    if (client) {
      try {
        await client.end();
      } catch (closeError: any) {
        console.error("[Migration] Error closing database connection:", closeError.message);
      }
    }
    console.log(`[Migration] ✓ All migrations completed - ${successCount} created, ${skipCount} skipped`);
  } catch (error: any) {
    console.error("[Migration] ✗ Critical migration error:", error);
    if (client) {
      try {
        await client.end().catch(() => {});
      } catch (e) {}
    }
  }
}
