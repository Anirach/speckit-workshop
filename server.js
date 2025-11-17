/**
 * Simple Express server for SQLite database operations
 * Provides REST API for photo album organizer
 */

import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Initialize database
const dbPath = join(__dirname, 'storage/metadata.db')
const schemaPath = join(__dirname, 'src/data/schema.sql')

// Ensure storage directory exists
const storageDir = join(__dirname, 'storage')
if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true })
}

let db = null

function initDatabase() {
  db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Optimize for performance
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 30000000000')

  console.log('✓ Database connected')

  // Initialize schema if tables don't exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  if (tables.length === 0) {
    console.log('Initializing database schema...')
    const schema = readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
    console.log('✓ Database schema initialized')
  }
}

initDatabase()

// API Routes

// Get all albums
app.get('/api/albums', (req, res) => {
  try {
    const albums = db.prepare(`
      SELECT 
        a.id,
        a.title,
        a.year,
        a.month,
        a.cover_photo_id,
        a.photo_count,
        a.date_range_start,
        a.date_range_end,
        a.created_at,
        a.updated_at,
        ao.position
      FROM Album a
      LEFT JOIN AlbumOrder ao ON a.id = ao.album_id
      ORDER BY 
        CASE 
          WHEN ao.position IS NOT NULL THEN ao.position
          ELSE (a.year * 12 + a.month)
        END DESC
    `).all()
    
    res.json(albums)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get album by ID
app.get('/api/albums/:id', (req, res) => {
  try {
    const album = db.prepare('SELECT * FROM Album WHERE id = ?').get(req.params.id)
    if (!album) {
      return res.status(404).json({ error: 'Album not found' })
    }
    res.json(album)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create album
app.post('/api/albums', (req, res) => {
  try {
    const { title, year, month } = req.body
    const result = db.prepare('INSERT INTO Album (title, year, month) VALUES (?, ?, ?)').run(title, year, month)
    const album = db.prepare('SELECT * FROM Album WHERE id = ?').get(result.lastInsertRowid)
    res.json(album)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update album order
app.put('/api/albums/:id/order', (req, res) => {
  try {
    const { newPosition } = req.body
    const albumId = parseInt(req.params.id)
    
    // Get current position
    const current = db.prepare('SELECT position FROM AlbumOrder WHERE album_id = ?').get(albumId)
    const oldPosition = current?.position

    db.exec('BEGIN TRANSACTION')

    try {
      if (oldPosition !== undefined) {
        // Update positions
        if (newPosition > oldPosition) {
          db.prepare('UPDATE AlbumOrder SET position = position - 1 WHERE position > ? AND position <= ?')
            .run(oldPosition, newPosition)
        } else if (newPosition < oldPosition) {
          db.prepare('UPDATE AlbumOrder SET position = position + 1 WHERE position >= ? AND position < ?')
            .run(newPosition, oldPosition)
        }
        db.prepare('UPDATE AlbumOrder SET position = ? WHERE album_id = ?').run(newPosition, albumId)
      } else {
        // First time reordering
        db.prepare('UPDATE AlbumOrder SET position = position + 1 WHERE position >= ?').run(newPosition)
        db.prepare('INSERT INTO AlbumOrder (album_id, position) VALUES (?, ?)').run(albumId, newPosition)
      }

      db.exec('COMMIT')
      res.json({ success: true })
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete album
app.delete('/api/albums/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM Album WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get photos in album
app.get('/api/albums/:id/photos', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM Photo WHERE album_id = ? ORDER BY display_order ASC').all(req.params.id)
    res.json(photos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create photo
app.post('/api/photos', (req, res) => {
  try {
    const { album_id, file_path, file_name, file_hash, file_size, mime_type, width, height, date_taken, timezone_offset, camera_model, thumbnail_path, display_order, import_session_id } = req.body
    
    const result = db.prepare(`
      INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, mime_type, width, height, date_taken, timezone_offset, camera_model, thumbnail_path, display_order, import_session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(album_id, file_path, file_name, file_hash, file_size, mime_type, width, height, date_taken, timezone_offset, camera_model, thumbnail_path, display_order, import_session_id)
    
    const photo = db.prepare('SELECT * FROM Photo WHERE id = ?').get(result.lastInsertRowid)
    res.json(photo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete photo
app.delete('/api/photos/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM Photo WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Check for duplicate photo
app.post('/api/photos/check-duplicate', (req, res) => {
  try {
    const { file_hash } = req.body
    const photo = db.prepare('SELECT * FROM Photo WHERE file_hash = ?').get(file_hash)
    res.json({ exists: !!photo, photo })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create import session
app.post('/api/import-sessions', (req, res) => {
  try {
    const { total_files } = req.body
    const result = db.prepare("INSERT INTO ImportSession (status, total_files) VALUES ('in_progress', ?)").run(total_files)
    const session = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(result.lastInsertRowid)
    res.json(session)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update import session
app.put('/api/import-sessions/:id', (req, res) => {
  try {
    const { status, processed_files, imported_count, duplicate_count, error_count, error_log } = req.body
    const updates = []
    const values = []
    
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (processed_files !== undefined) { updates.push('processed_files = ?'); values.push(processed_files) }
    if (imported_count !== undefined) { updates.push('imported_count = ?'); values.push(imported_count) }
    if (duplicate_count !== undefined) { updates.push('duplicate_count = ?'); values.push(duplicate_count) }
    if (error_count !== undefined) { updates.push('error_count = ?'); values.push(error_count) }
    if (error_log !== undefined) { updates.push('error_log = ?'); values.push(error_log) }
    if (status === 'completed') { updates.push('completed_at = CURRENT_TIMESTAMP') }
    
    values.push(req.params.id)
    
    db.prepare(`UPDATE ImportSession SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const session = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(req.params.id)
    res.json(session)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generic query endpoint for complex operations
app.post('/api/query', (req, res) => {
  try {
    const { sql, params = [] } = req.body
    const result = db.prepare(sql).all(...params)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' })
})

// Start server
app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`)
  console.log(`✓ Database: ${dbPath}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing database connection...')
  db.close()
  process.exit(0)
})
