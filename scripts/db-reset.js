#!/usr/bin/env node
/**
 * Database Reset Script
 * Drops all tables and re-executes schema.sql
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const schemaPath = join(projectRoot, 'src/data/schema.sql')
const dbPath = join(projectRoot, 'storage/metadata.db')

if (!existsSync(dbPath)) {
  console.log('⚠️  Database does not exist. Run "npm run db:init" first.')
  process.exit(1)
}

try {
  const db = new Database(dbPath)
  console.log('✓ Opened database')

  // Get all tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()

  console.log(`Found ${tables.length} tables:`, tables.map(t => t.name).join(', '))

  // Drop all triggers first
  const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all()
  for (const trigger of triggers) {
    db.exec(`DROP TRIGGER IF EXISTS ${trigger.name}`)
  }
  console.log(`✓ Dropped ${triggers.length} triggers`)

  // Drop all tables
  for (const table of tables) {
    db.exec(`DROP TABLE IF EXISTS ${table.name}`)
  }
  console.log(`✓ Dropped ${tables.length} tables`)

  // Re-execute schema
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
  console.log('✓ Re-created tables and triggers from schema.sql')

  db.close()
  console.log('\n✅ Database reset successfully!')
  console.log('⚠️  WARNING: All data has been permanently deleted.')
} catch (error) {
  console.error('❌ Database reset failed:', error.message)
  process.exit(1)
}
