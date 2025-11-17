#!/usr/bin/env node
/**
 * Database Initialization Script
 * Executes schema.sql to create database tables and triggers
 */

import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const schemaPath = join(projectRoot, 'src/data/schema.sql')
const dbPath = join(projectRoot, 'storage/metadata.db')
const storageDir = join(projectRoot, 'storage')

// Ensure storage directory exists
if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true })
  console.log('✓ Created storage directory')
}

// Ensure photos directory exists
const photosDir = join(storageDir, 'photos')
if (!existsSync(photosDir)) {
  mkdirSync(photosDir, { recursive: true })
  console.log('✓ Created storage/photos directory')
}

// Ensure thumbnails directory exists
const thumbnailsDir = join(storageDir, 'thumbnails')
if (!existsSync(thumbnailsDir)) {
  mkdirSync(thumbnailsDir, { recursive: true })
  console.log('✓ Created storage/thumbnails directory')
}

try {
  // Read schema file
  const schema = readFileSync(schemaPath, 'utf-8')
  console.log('✓ Read schema.sql')

  // Create/open database
  const db = new Database(dbPath)
  console.log('✓ Opened database at storage/metadata.db')

  // Execute schema
  db.exec(schema)
  console.log('✓ Created tables and triggers')

  // Verify tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
  console.log(`✓ Verified ${tables.length} tables:`, tables.map(t => t.name).join(', '))

  db.close()
  console.log('\n✅ Database initialized successfully!')
} catch (error) {
  console.error('❌ Database initialization failed:', error.message)
  process.exit(1)
}
