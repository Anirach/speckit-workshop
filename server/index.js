/**
 * Express Backend Server
 * SQLite database API for Photo Album Organizer
 */

import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const app = express()
const PORT = 3451

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
const dbPath = join(projectRoot, 'storage/metadata.db')
const storageDir = join(projectRoot, 'storage')

// Ensure storage directory exists
if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true })
}

let db = null

function getDatabase() {
  if (db) return db

  db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Optimize for performance
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000')
  db.pragma('temp_store = MEMORY')
  
  console.log('✓ SQLite database connected:', dbPath)
  
  return db
}

// Initialize database schema if needed
function initializeSchema() {
  const db = getDatabase()
  
  // Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  
  if (tables.length === 0) {
    console.log('Initializing database schema...')
    const schemaPath = join(projectRoot, 'src/data/schema.sql')
    
    if (existsSync(schemaPath)) {
      const schema = require('fs').readFileSync(schemaPath, 'utf8')
      db.exec(schema)
      console.log('✓ Database schema initialized')
    }
  }
}

// API Routes

// Albums
app.get('/api/albums', (req, res) => {
  try {
    const db = getDatabase()
    const albums = db.prepare(`
      SELECT 
        a.*,
        ao.position,
        p.thumbnail_path as cover_thumbnail_path
      FROM Album a
      LEFT JOIN AlbumOrder ao ON a.id = ao.album_id
      LEFT JOIN Photo p ON a.cover_photo_id = p.id
      ORDER BY 
        CASE 
          WHEN ao.position IS NOT NULL THEN ao.position
          ELSE (a.year * 12 + a.month)
        END DESC
    `).all()
    
    res.json(albums)
  } catch (error) {
    console.error('Error fetching albums:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/albums/:id', (req, res) => {
  try {
    const db = getDatabase()
    const album = db.prepare(`
      SELECT a.*, p.thumbnail_path as cover_thumbnail_path
      FROM Album a
      LEFT JOIN Photo p ON a.cover_photo_id = p.id
      WHERE a.id = ?
    `).get(req.params.id)
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' })
    }
    
    res.json(album)
  } catch (error) {
    console.error('Error fetching album:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/albums', (req, res) => {
  try {
    const db = getDatabase()
    const { title, year, month } = req.body
    
    const result = db.prepare(
      'INSERT INTO Album (title, year, month, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
    ).run(title, year, month)
    
    const album = db.prepare('SELECT * FROM Album WHERE id = ?').get(result.lastInsertRowid)
    res.json(album)
  } catch (error) {
    console.error('Error creating album:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/albums/:id', (req, res) => {
  try {
    const db = getDatabase()
    const updates = []
    const values = []
    
    if (req.body.title !== undefined) {
      updates.push('title = ?')
      values.push(req.body.title)
    }
    if (req.body.photo_count !== undefined) {
      updates.push('photo_count = ?')
      values.push(req.body.photo_count)
    }
    if (req.body.cover_photo_id !== undefined) {
      updates.push('cover_photo_id = ?')
      values.push(req.body.cover_photo_id)
    }
    
    updates.push('updated_at = datetime("now")')
    values.push(req.params.id)
    
    db.prepare(`UPDATE Album SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    
    const album = db.prepare('SELECT * FROM Album WHERE id = ?').get(req.params.id)
    res.json(album)
  } catch (error) {
    console.error('Error updating album:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/albums/:id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM Album WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting album:', error)
    res.status(500).json({ error: error.message })
  }
})

// Photos
app.get('/api/photos', (req, res) => {
  try {
    const db = getDatabase()
    const { album_id } = req.query
    
    let query = 'SELECT * FROM Photo'
    let params = []
    
    if (album_id) {
      query += ' WHERE album_id = ? ORDER BY display_order ASC'
      params.push(album_id)
    }
    
    const photos = db.prepare(query).all(...params)
    res.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/photos/:id', (req, res) => {
  try {
    const db = getDatabase()
    const photo = db.prepare('SELECT * FROM Photo WHERE id = ?').get(req.params.id)
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' })
    }
    
    res.json(photo)
  } catch (error) {
    console.error('Error fetching photo:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/photos', (req, res) => {
  try {
    const db = getDatabase()
    const photo = req.body
    
    const result = db.prepare(`
      INSERT INTO Photo (
        album_id, file_path, file_name, file_hash, file_size, mime_type,
        width, height, date_taken, timezone_offset, camera_model,
        thumbnail_path, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
    `).run(
      photo.album_id, photo.file_path, photo.file_name, photo.file_hash,
      photo.file_size, photo.mime_type, photo.width, photo.height,
      photo.date_taken, photo.timezone_offset, photo.camera_model,
      photo.thumbnail_path, photo.display_order || 0
    )
    
    const newPhoto = db.prepare('SELECT * FROM Photo WHERE id = ?').get(result.lastInsertRowid)
    res.json(newPhoto)
  } catch (error) {
    console.error('Error creating photo:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/photos/:id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM Photo WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    res.status(500).json({ error: error.message })
  }
})

// AlbumOrder
app.get('/api/album-orders', (req, res) => {
  try {
    const db = getDatabase()
    const orders = db.prepare('SELECT * FROM AlbumOrder ORDER BY position ASC').all()
    res.json(orders)
  } catch (error) {
    console.error('Error fetching album orders:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/album-orders/:album_id', (req, res) => {
  try {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM AlbumOrder WHERE album_id = ?').get(req.params.album_id)
    
    if (!order) {
      return res.status(404).json({ error: 'Album order not found' })
    }
    
    res.json(order)
  } catch (error) {
    console.error('Error fetching album order:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/album-orders', (req, res) => {
  try {
    const db = getDatabase()
    const { album_id, position } = req.body
    
    db.prepare(
      'INSERT OR REPLACE INTO AlbumOrder (album_id, position, updated_at) VALUES (?, ?, datetime("now"))'
    ).run(album_id, position)
    
    const order = db.prepare('SELECT * FROM AlbumOrder WHERE album_id = ?').get(album_id)
    res.json(order)
  } catch (error) {
    console.error('Error creating album order:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/album-orders/:album_id', (req, res) => {
  try {
    const db = getDatabase()
    const { position } = req.body
    
    db.prepare(
      'UPDATE AlbumOrder SET position = ?, updated_at = datetime("now") WHERE album_id = ?'
    ).run(position, req.params.album_id)
    
    const order = db.prepare('SELECT * FROM AlbumOrder WHERE album_id = ?').get(req.params.album_id)
    res.json(order)
  } catch (error) {
    console.error('Error updating album order:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/album-orders/:album_id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM AlbumOrder WHERE album_id = ?').run(req.params.album_id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting album order:', error)
    res.status(500).json({ error: error.message })
  }
})

// ImportSessions
app.get('/api/import-sessions', (req, res) => {
  try {
    const db = getDatabase()
    const sessions = db.prepare('SELECT * FROM ImportSession ORDER BY started_at DESC').all()
    res.json(sessions)
  } catch (error) {
    console.error('Error fetching import sessions:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/import-sessions', (req, res) => {
  try {
    const db = getDatabase()
    const session = req.body
    
    const result = db.prepare(`
      INSERT INTO ImportSession (
        status, total_files, processed_files, imported_count,
        duplicate_count, error_count, error_log, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `).run(
      session.status || 'in_progress',
      session.total_files || 0,
      session.processed_files || 0,
      session.imported_count || 0,
      session.duplicate_count || 0,
      session.error_count || 0,
      session.error_log || null
    )
    
    const newSession = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(result.lastInsertRowid)
    res.json(newSession)
  } catch (error) {
    console.error('Error creating import session:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/import-sessions/:id', (req, res) => {
  try {
    const db = getDatabase()
    const updates = []
    const values = []
    
    const fields = ['status', 'processed_files', 'imported_count', 'duplicate_count', 'error_count', 'error_log']
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(req.body[field])
      }
    })
    
    if (req.body.status === 'completed' || req.body.status === 'failed') {
      updates.push('completed_at = datetime("now")')
    }
    
    values.push(req.params.id)
    
    db.prepare(`UPDATE ImportSession SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    
    const session = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(req.params.id)
    res.json(session)
  } catch (error) {
    console.error('Error updating import session:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: dbPath })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Photo Album API Server running on http://localhost:${PORT}`)
  console.log(`📁 Database: ${dbPath}\n`)
  
  initializeSchema()
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹ Shutting down server...')
  if (db) {
    db.close()
    console.log('✓ Database connection closed')
  }
  process.exit(0)
})
