/**
 * BookMaster SaaS - PostgreSQL Schema for Production
 * Compatible with Supabase
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ============================================
// USERS TABLE (SaaS Core)
// ============================================
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("passwordHash").notNull(),
    planType: text("planType").default("FREE").notNull(),
    planActive: boolean("planActive").default(true).notNull(),
    subscriptionStartDate: timestamp("subscriptionStartDate"),
    subscriptionEndDate: timestamp("subscriptionEndDate"),
    stripeCustomerId: text("stripeCustomerId"),
    stripeSubscriptionId: text("stripeSubscriptionId"),
    resetPasswordToken: text("resetPasswordToken"),
    resetPasswordExpiry: timestamp("resetPasswordExpiry"),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    emailVerificationToken: text("emailVerificationToken"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// SUBSCRIPTION HISTORY TABLE
// ============================================
export const subscriptionHistory = pgTable(
  "subscriptionHistory",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    oldPlan: text("oldPlan"),
    newPlan: text("newPlan").notNull(),
    reason: text("reason").notNull(),
    effectiveDate: timestamp("effectiveDate").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("subscriptionHistory_userId_idx").on(table.userId),
  })
);

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

// ============================================
// PROJECTS TABLE (Books)
// ============================================
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    author: text("author"),
    genre: text("genre"),
    publicationType: text("publicationType").default("both").notNull(),
    pageSize: text("pageSize").default("6x9").notNull(),
    customWidth: integer("customWidth"),
    customHeight: integer("customHeight"),
    marginTop: integer("marginTop").default(19).notNull(),
    marginBottom: integer("marginBottom").default(19).notNull(),
    marginLeft: integer("marginLeft").default(19).notNull(),
    marginRight: integer("marginRight").default(19).notNull(),
    marginGutter: integer("marginGutter").default(6).notNull(),
    fontFamily: text("fontFamily").default("Georgia").notNull(),
    fontSize: integer("fontSize").default(11).notNull(),
    lineHeight: integer("lineHeight").default(160).notNull(),
    coverImageUrl: text("coverImageUrl"),
    coverImageKey: text("coverImageKey"),
    biography: text("biography"),
    dedication: text("dedication"),
    acknowledgments: text("acknowledgments"),
    isbn: text("isbn"),
    publisher: text("publisher"),
    printingInfo: text("printingInfo"),
    copyright: text("copyright"),
    autoNumberChapters: boolean("autoNumberChapters").default(true).notNull(),
    chapterNumberFormat: text("chapterNumberFormat").default("Capítulo {n}"),
    templateId: text("templateId"),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("projects_userId_idx").on(table.userId),
    statusIdx: index("projects_status_idx").on(table.status),
  })
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================
// CHAPTERS TABLE
// ============================================
export const chapters = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId").notNull(),
    parentId: integer("parentId"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    orderIndex: integer("orderIndex").notNull(),
    level: integer("level").default(1).notNull(),
    type: text("type").default("chapter").notNull(),
    startOnNewPage: boolean("startOnNewPage").default(true).notNull(),
    includeInToc: boolean("includeInToc").default(true).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("chapters_projectId_idx").on(table.projectId),
    orderIdx: index("chapters_orderIndex_idx").on(table.orderIndex),
  })
);

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

// ============================================
// REFERENCES TABLE (Bibliography)
// ============================================
export const references = pgTable(
  "references",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId").notNull(),
    chapterId: integer("chapterId"),
    type: text("type").default("book"),
    author: text("author"),
    title: text("title").notNull(),
    year: integer("year"),
    publisher: text("publisher"),
    url: text("url"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("references_projectId_idx").on(table.projectId),
    chapterIdIdx: index("references_chapterId_idx").on(table.chapterId),
  })
);

export type Reference = typeof references.$inferSelect;
export type InsertReference = typeof references.$inferInsert;

// ============================================
// EXPORTS TABLE (Export History)
// ============================================
export const exports = pgTable(
  "exports",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId").notNull(),
    userId: integer("userId").notNull(),
    format: text("format").notNull(),
    fileUrl: text("fileUrl").notNull(),
    fileKey: text("fileKey").notNull(),
    fileSize: integer("fileSize"),
    status: text("status").default("processing").notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("exports_userId_idx").on(table.userId),
    projectIdIdx: index("exports_projectId_idx").on(table.projectId),
    statusIdx: index("exports_status_idx").on(table.status),
  })
);

export type Export = typeof exports.$inferSelect;
export type InsertExport = typeof exports.$inferInsert;

// ============================================
// PAYMENTS TABLE
// ============================================
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    stripePaymentId: text("stripePaymentId").notNull().unique(),
    amount: real("amount").notNull(),
    currency: text("currency").default("USD").notNull(),
    status: text("status").default("PENDING").notNull(),
    planType: text("planType").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("payments_userId_idx").on(table.userId),
    stripePaymentIdIdx: index("payments_stripePaymentId_idx").on(table.stripePaymentId),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============================================
// AUDIT LOGS TABLE
// ============================================
export const auditLogs = pgTable(
  "auditLogs",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId"),
    action: text("action").notNull(),
    resourceType: text("resourceType"),
    resourceId: integer("resourceId"),
    details: text("details"), // JSON string
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("auditLogs_userId_idx").on(table.userId),
    actionIdx: index("auditLogs_action_idx").on(table.action),
    createdAtIdx: index("auditLogs_createdAt_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

