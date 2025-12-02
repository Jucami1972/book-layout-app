import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('Running migrations...');
  
  try {
    // Create projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        author VARCHAR(255),
        genre VARCHAR(100),
        publicationType ENUM('print', 'digital', 'both') NOT NULL DEFAULT 'both',
        pageSize VARCHAR(50) NOT NULL DEFAULT '6x9',
        customWidth INT,
        customHeight INT,
        marginTop INT NOT NULL DEFAULT 19,
        marginBottom INT NOT NULL DEFAULT 19,
        marginLeft INT NOT NULL DEFAULT 19,
        marginRight INT NOT NULL DEFAULT 19,
        marginGutter INT NOT NULL DEFAULT 6,
        fontFamily VARCHAR(100) NOT NULL DEFAULT 'Georgia',
        fontSize INT NOT NULL DEFAULT 11,
        lineHeight INT NOT NULL DEFAULT 160,
        templateId VARCHAR(100),
        customStyles JSON,
        coverImageUrl TEXT,
        coverImageKey VARCHAR(500),
        status ENUM('draft', 'formatting', 'ready', 'published') NOT NULL DEFAULT 'draft',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Projects table created');

    // Create chapters table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        orderIndex INT NOT NULL,
        type ENUM('frontmatter', 'chapter', 'backmatter') NOT NULL DEFAULT 'chapter',
        startOnNewPage BOOLEAN NOT NULL DEFAULT TRUE,
        includeInToc BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Chapters table created');

    // Create exports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        userId INT NOT NULL,
        format ENUM('pdf', 'epub') NOT NULL,
        fileUrl TEXT NOT NULL,
        fileKey VARCHAR(500) NOT NULL,
        fileSize INT,
        status ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
        errorMessage TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Exports table created');

    // Create templates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        genre VARCHAR(100),
        previewImageUrl TEXT,
        styles JSON NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Templates table created');

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
