/**
 * Database Connection Manager
 * Provides singleton connection to SQLite database with auto-close
 */

import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../..')
const dbPath = join(projectRoot, 'storage/metadata.db')

let db = null

/**
 * Get database connection (singleton)
 * @returns {Database} SQLite database instance
 */
export function getDatabase() {
  if (db) {
    return db
  }

  if (!existsSync(dbPath)) {
    throw new Error(
      'Database not found. Run "npm run db:init" to initialize the database.'
    )
  }

  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
  })

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Optimize for performance
  db.pragma('journal_mode = WAL') // Write-Ahead Logging
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000') // ~40MB cache

  console.log('✓ Database connection established')

  return db
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('✓ Database connection closed')
  }
}

/**
 * Auto-close database on process exit
 */
process.on('exit', () => {
  closeDatabase()
})

process.on('SIGINT', () => {
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDatabase()
  process.exit(0)
})

/**
 * Run a transaction
 * @param {Function} fn - Function to execute within transaction
 * @returns {*} Result of the transaction function
 */
export function transaction(fn) {
  const database = getDatabase()
  const txn = database.transaction(fn)
  return txn()
}

/**
 * Execute a prepared statement
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Statement result
 */
export function query(sql, params = []) {
  const database = getDatabase()
  return database.prepare(sql).all(params)
}

/**
 * Execute a single-row query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Single row or null
 */
export function queryOne(sql, params = []) {
  const database = getDatabase()
  return database.prepare(sql).get(params)
}

/**
 * Execute an insert/update/delete statement
 * @param {string} sql - SQL statement
 * @param {Array} params - Statement parameters
 * @returns {Object} Statement info (changes, lastInsertRowid)
 */
export function execute(sql, params = []) {
  const database = getDatabase()
  return database.prepare(sql).run(params)
}
