-- BookMaster SaaS - PostgreSQL Schema Creation Script
-- Execute this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  planType TEXT NOT NULL DEFAULT 'FREE',
  planActive BOOLEAN NOT NULL DEFAULT true,
  subscriptionStartDate TIMESTAMP,
  subscriptionEndDate TIMESTAMP,
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  resetPasswordToken TEXT,
  resetPasswordExpiry TIMESTAMP,
  emailVerified BOOLEAN NOT NULL DEFAULT false,
  emailVerificationToken TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  lastSignedIn TIMESTAMP
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create subscriptionHistory table
CREATE TABLE IF NOT EXISTS subscriptionHistory (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  oldPlan TEXT,
  newPlan TEXT NOT NULL,
  reason TEXT NOT NULL,
  effectiveDate TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptionHistory_userId_idx ON subscriptionHistory(userId);

-- Create projects table (Books)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  genre TEXT,
  publicationType TEXT NOT NULL DEFAULT 'both',
  pageSize TEXT NOT NULL DEFAULT '6x9',
  customWidth INTEGER,
  customHeight INTEGER,
  marginTop INTEGER NOT NULL DEFAULT 19,
  marginBottom INTEGER NOT NULL DEFAULT 19,
  marginLeft INTEGER NOT NULL DEFAULT 19,
  marginRight INTEGER NOT NULL DEFAULT 19,
  marginGutter INTEGER NOT NULL DEFAULT 6,
  fontFamily TEXT NOT NULL DEFAULT 'Georgia',
  fontSize INTEGER NOT NULL DEFAULT 11,
  lineHeight INTEGER NOT NULL DEFAULT 160,
  coverImageUrl TEXT,
  coverImageKey TEXT,
  biography TEXT,
  dedication TEXT,
  acknowledgments TEXT,
  isbn TEXT,
  publisher TEXT,
  printingInfo TEXT,
  copyright TEXT,
  autoNumberChapters BOOLEAN NOT NULL DEFAULT true,
  chapterNumberFormat TEXT DEFAULT 'Capítulo {n}',
  templateId TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_userId_idx ON projects(userId);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  parentId INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  orderIndex INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'chapter',
  startOnNewPage BOOLEAN NOT NULL DEFAULT true,
  includeInToc BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chapters_projectId_idx ON chapters(projectId);
CREATE INDEX IF NOT EXISTS chapters_orderIndex_idx ON chapters(orderIndex);

-- Create references table (Bibliography)
CREATE TABLE IF NOT EXISTS book_references (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  chapterId INTEGER,
  type TEXT DEFAULT 'book',
  author TEXT,
  title TEXT NOT NULL,
  year INTEGER,
  publisher TEXT,
  url TEXT,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS book_references_projectId_idx ON book_references(projectId);
CREATE INDEX IF NOT EXISTS book_references_chapterId_idx ON book_references(chapterId);

-- Create exports table (Export History)
CREATE TABLE IF NOT EXISTS exports (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  format TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileKey TEXT NOT NULL,
  fileSize INTEGER,
  status TEXT NOT NULL DEFAULT 'processing',
  errorMessage TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exports_userId_idx ON exports(userId);
CREATE INDEX IF NOT EXISTS exports_projectId_idx ON exports(projectId);
CREATE INDEX IF NOT EXISTS exports_status_idx ON exports(status);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  stripePaymentId TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  planType TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_userId_idx ON payments(userId);
CREATE INDEX IF NOT EXISTS payments_stripePaymentId_idx ON payments(stripePaymentId);

-- Create auditLogs table
CREATE TABLE IF NOT EXISTS auditLogs (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  action TEXT NOT NULL,
  resourceType TEXT,
  resourceId INTEGER,
  details TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auditLogs_userId_idx ON auditLogs(userId);
CREATE INDEX IF NOT EXISTS auditLogs_action_idx ON auditLogs(action);
CREATE INDEX IF NOT EXISTS auditLogs_createdAt_idx ON auditLogs(createdAt);

-- Grant permissions if needed
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
