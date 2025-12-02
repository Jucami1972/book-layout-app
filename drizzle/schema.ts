/**
 * BookMaster SaaS - Complete Database Schema
 * Using Drizzle ORM with MySQL
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";

// ============================================
// 1️⃣ USERS TABLE (SaaS Core)
// ============================================
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),

    // Subscription & Plan
    planType: mysqlEnum("planType", ["FREE", "PRO_MONTHLY", "PRO_YEARLY"])
      .default("FREE")
      .notNull(),
    planActive: boolean("planActive").default(true).notNull(),
    subscriptionStartDate: timestamp("subscriptionStartDate"),
    subscriptionEndDate: timestamp("subscriptionEndDate"),

    // Stripe Integration
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),

    // Password Recovery
    resetPasswordToken: varchar("resetPasswordToken", { length: 255 }),
    resetPasswordExpiry: timestamp("resetPasswordExpiry"),

    // Email Verification
    emailVerified: boolean("emailVerified").default(false).notNull(),
    emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    planTypeIdx: index("planType_idx").on(table.planType),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// 2️⃣ SUBSCRIPTION HISTORY TABLE
// ============================================
export const subscriptionHistory = mysqlTable(
  "subscriptionHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    oldPlan: mysqlEnum("oldPlan", ["FREE", "PRO_MONTHLY", "PRO_YEARLY"]),
    newPlan: mysqlEnum("newPlan", ["FREE", "PRO_MONTHLY", "PRO_YEARLY"]).notNull(),
    reason: mysqlEnum("reason", [
      "UPGRADE",
      "DOWNGRADE",
      "CANCELED",
      "RENEWAL",
      "MANUAL_CHANGE",
    ]).notNull(),
    effectiveDate: timestamp("effectiveDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    fk: foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete(
      "cascade"
    ),
  })
);

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

// ============================================
// 3️⃣ PROJECTS TABLE (Books)
// ============================================
export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    subtitle: varchar("subtitle", { length: 500 }),
    author: varchar("author", { length: 255 }),
    genre: varchar("genre", { length: 100 }),
    publicationType: mysqlEnum("publicationType", [
      "print",
      "digital",
      "both",
    ])
      .default("both")
      .notNull(),

    // Page configuration (in mm)
    pageSize: varchar("pageSize", { length: 50 }).default("6x9").notNull(),
    customWidth: int("customWidth"),
    customHeight: int("customHeight"),

    // Margins
    marginTop: int("marginTop").default(19).notNull(),
    marginBottom: int("marginBottom").default(19).notNull(),
    marginLeft: int("marginLeft").default(19).notNull(),
    marginRight: int("marginRight").default(19).notNull(),
    marginGutter: int("marginGutter").default(6).notNull(),

    // Typography
    fontFamily: varchar("fontFamily", { length: 100 }).default("Georgia").notNull(),
    fontSize: int("fontSize").default(11).notNull(),
    lineHeight: int("lineHeight").default(160).notNull(),

    // Cover Configuration
    coverImageUrl: varchar("coverImageUrl", { length: 500 }),
    coverImageKey: varchar("coverImageKey", { length: 500 }),
    coverTitleX: int("coverTitleX"),
    coverTitleY: int("coverTitleY"),
    coverAuthorX: int("coverAuthorX"),
    coverAuthorY: int("coverAuthorY"),
    coverTitleFontSize: int("coverTitleFontSize").default(48),
    coverAuthorFontSize: int("coverAuthorFontSize").default(24),
    coverTitleColor: varchar("coverTitleColor", { length: 20 }).default("#FFFFFF"),
    coverAuthorColor: varchar("coverAuthorColor", { length: 20 }).default("#FFFFFF"),

    // Front Matter Content
    biography: text("biography"),
    dedication: text("dedication"),
    acknowledgments: text("acknowledgments"),
    isbn: varchar("isbn", { length: 20 }),
    publisher: varchar("publisher", { length: 255 }),
    printingInfo: text("printingInfo"),
    copyright: text("copyright"),

    // Chapter numbering
    autoNumberChapters: boolean("autoNumberChapters").default(true).notNull(),
    chapterNumberFormat: varchar("chapterNumberFormat", {
      length: 50,
    }).default("Capítulo {n}"),

    // Template & Custom Styles
    templateId: varchar("templateId", { length: 100 }),
    customStyles: json("customStyles"),

    // Status
    status: mysqlEnum("status", [
      "draft",
      "formatting",
      "ready",
      "published",
    ])
      .default("draft")
      .notNull(),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.status),
    fk: foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete(
      "cascade"
    ),
  })
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================
// 4️⃣ CHAPTERS TABLE
// ============================================
export const chapters = mysqlTable(
  "chapters",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull(),
    parentId: int("parentId"), // For hierarchy
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(), // HTML content
    orderIndex: int("orderIndex").notNull(),
    level: int("level").default(1).notNull(), // 1=part, 2=chapter, 3=subchapter
    type: mysqlEnum("type", [
      "frontmatter",
      "part",
      "chapter",
      "subchapter",
      "backmatter",
    ])
      .default("chapter")
      .notNull(),

    // Chapter settings
    startOnNewPage: boolean("startOnNewPage").default(true).notNull(),
    includeInToc: boolean("includeInToc").default(true).notNull(),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table): any => ({
    projectIdIdx: index("projectId_idx").on(table.projectId),
    parentIdIdx: index("parentId_idx").on(table.parentId),
    orderIdx: index("orderIndex_idx").on(table.orderIndex),
    fk_project: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
    fk_parent: foreignKey({
      columns: [table.parentId],
      foreignColumns: [chapters.id],
    }).onDelete("set null"),
  })
);

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

// ============================================
// 5️⃣ REFERENCES TABLE (Bibliography)
// ============================================
export const references = mysqlTable(
  "references",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull(),
    chapterId: int("chapterId"), // NULL = global reference
    type: mysqlEnum("type", [
      "book",
      "article",
      "website",
      "thesis",
      "other",
    ]).default("book"),
    author: varchar("author", { length: 500 }),
    title: varchar("title", { length: 500 }).notNull(),
    year: int("year"),
    publisher: varchar("publisher", { length: 255 }),
    url: varchar("url", { length: 500 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("projectId_idx").on(table.projectId),
    chapterIdIdx: index("chapterId_idx").on(table.chapterId),
    fk_project: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
    fk_chapter: foreignKey({
      columns: [table.chapterId],
      foreignColumns: [chapters.id],
    }).onDelete("set null"),
  })
);

export type Reference = typeof references.$inferSelect;
export type InsertReference = typeof references.$inferInsert;

// ============================================
// 6️⃣ EXPORTS TABLE (Export History)
// ============================================
export const exports = mysqlTable(
  "exports",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull(),
    userId: int("userId").notNull(),
    format: mysqlEnum("format", ["pdf", "epub", "docx"]).notNull(),
    fileUrl: text("fileUrl").notNull(),
    fileKey: varchar("fileKey", { length: 500 }).notNull(),
    fileSize: int("fileSize"),
    status: mysqlEnum("status", [
      "processing",
      "completed",
      "failed",
    ])
      .default("processing")
      .notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    projectIdIdx: index("projectId_idx").on(table.projectId),
    statusIdx: index("status_idx").on(table.status),
    fk_user: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    fk_project: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
  })
);

export type Export = typeof exports.$inferSelect;
export type InsertExport = typeof exports.$inferInsert;

// ============================================
// 7️⃣ AUDIT_LOGS TABLE
// ============================================
export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resourceType", { length: 50 }),
    resourceId: int("resourceId"),
    details: json("details"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    actionIdx: index("action_idx").on(table.action),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
