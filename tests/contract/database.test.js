/**
 * Contract Tests: Database Operations
 * Tests SQLite database queries and operations
 * Framework: Web Test Runner
 */

import { expect } from '@esm-bundle/chai'
import { getDatabase, closeDatabase, execute, query, queryOne } from '../../src/lib/database.js'

describe('Database Contract Tests', () => {
  let db

  before(() => {
    db = getDatabase()
  })

  after(() => {
    closeDatabase()
  })

  describe('Album Table Queries (T037)', () => {
    it('should query all albums with ordering', () => {
      // Insert test albums
      execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['January 2024', 2024, 1, 5]
      )
      execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['February 2024', 2024, 2, 3]
      )

      // Query all albums
      const albums = query(
        'SELECT * FROM Album ORDER BY year DESC, month DESC'
      )

      expect(albums).to.be.an('array')
      expect(albums.length).to.be.at.least(2)
      expect(albums[0].title).to.equal('February 2024')
      expect(albums[1].title).to.equal('January 2024')

      // Cleanup
      execute('DELETE FROM Album WHERE title LIKE ?', ['%2024'])
    })

    it('should query album by ID', () => {
      // Insert test album
      const result = execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['Test Album', 2024, 3, 0]
      )

      const albumId = result.lastInsertRowid

      // Query by ID
      const album = queryOne('SELECT * FROM Album WHERE id = ?', [albumId])

      expect(album).to.exist
      expect(album.id).to.equal(albumId)
      expect(album.title).to.equal('Test Album')
      expect(album.year).to.equal(2024)
      expect(album.month).to.equal(3)

      // Cleanup
      execute('DELETE FROM Album WHERE id = ?', [albumId])
    })

    it('should enforce unique year-month constraint', () => {
      execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['March 2024', 2024, 3, 0]
      )

      // Attempt duplicate
      expect(() => {
        execute(
          'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
          ['Duplicate March', 2024, 3, 0]
        )
      }).to.throw()

      // Cleanup
      execute('DELETE FROM Album WHERE year = ? AND month = ?', [2024, 3])
    })
  })

  describe('Photo Table Queries (T038)', () => {
    let albumId

    beforeEach(() => {
      // Create test album
      const result = execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['Test Album', 2024, 4, 0]
      )
      albumId = result.lastInsertRowid
    })

    afterEach(() => {
      // Cleanup
      execute('DELETE FROM Photo WHERE album_id = ?', [albumId])
      execute('DELETE FROM Album WHERE id = ?', [albumId])
    })

    it('should query photos by album_id with ordering', () => {
      // Insert test photos
      execute(
        `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
         mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, '/path/1.jpg', '1.jpg', 'hash1', 1000, 'image/jpeg', '2024-04-01', 0]
      )
      execute(
        `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
         mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, '/path/2.jpg', '2.jpg', 'hash2', 2000, 'image/jpeg', '2024-04-02', 1]
      )

      // Query photos
      const photos = query(
        'SELECT * FROM Photo WHERE album_id = ? ORDER BY display_order',
        [albumId]
      )

      expect(photos).to.be.an('array')
      expect(photos).to.have.lengthOf(2)
      expect(photos[0].file_name).to.equal('1.jpg')
      expect(photos[1].file_name).to.equal('2.jpg')
    })

    it('should enforce unique file_hash constraint', () => {
      execute(
        `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
         mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, '/path/test.jpg', 'test.jpg', 'unique_hash', 1000, 'image/jpeg', '2024-04-01', 0]
      )

      // Attempt duplicate hash
      expect(() => {
        execute(
          `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
           mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [albumId, '/path/dup.jpg', 'dup.jpg', 'unique_hash', 2000, 'image/jpeg', '2024-04-02', 1]
        )
      }).to.throw()
    })
  })

  describe('AlbumOrder Table Operations (T057)', () => {
    let album1Id, album2Id

    beforeEach(() => {
      const r1 = execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['Album 1', 2024, 5, 0]
      )
      album1Id = r1.lastInsertRowid

      const r2 = execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['Album 2', 2024, 6, 0]
      )
      album2Id = r2.lastInsertRowid
    })

    afterEach(() => {
      execute('DELETE FROM AlbumOrder WHERE album_id IN (?, ?)', [album1Id, album2Id])
      execute('DELETE FROM Album WHERE id IN (?, ?)', [album1Id, album2Id])
    })

    it('should insert and update album positions', () => {
      // Insert positions
      execute('INSERT INTO AlbumOrder (album_id, position) VALUES (?, ?)', [album1Id, 0])
      execute('INSERT INTO AlbumOrder (album_id, position) VALUES (?, ?)', [album2Id, 1])

      // Query positions
      const orders = query('SELECT * FROM AlbumOrder ORDER BY position')
      expect(orders).to.have.lengthOf(2)
      expect(orders[0].album_id).to.equal(album1Id)
      expect(orders[1].album_id).to.equal(album2Id)

      // Update position
      execute('UPDATE AlbumOrder SET position = ? WHERE album_id = ?', [5, album1Id])

      const updated = queryOne('SELECT * FROM AlbumOrder WHERE album_id = ?', [album1Id])
      expect(updated.position).to.equal(5)
    })

    it('should enforce unique position constraint', () => {
      execute('INSERT INTO AlbumOrder (album_id, position) VALUES (?, ?)', [album1Id, 0])

      expect(() => {
        execute('INSERT INTO AlbumOrder (album_id, position) VALUES (?, ?)', [album2Id, 0])
      }).to.throw()
    })
  })

  describe('ImportSession Table (T078)', () => {
    it('should create and update import session', () => {
      // Create session
      const result = execute(
        `INSERT INTO ImportSession (status, total_files, processed_files, 
         imported_count, duplicate_count, error_count) VALUES (?, ?, ?, ?, ?, ?)`,
        ['in_progress', 100, 0, 0, 0, 0]
      )

      const sessionId = result.lastInsertRowid

      // Verify creation
      const session = queryOne('SELECT * FROM ImportSession WHERE id = ?', [sessionId])
      expect(session.status).to.equal('in_progress')
      expect(session.total_files).to.equal(100)

      // Update session
      execute(
        `UPDATE ImportSession SET processed_files = ?, imported_count = ?, 
         status = ? WHERE id = ?`,
        [50, 45, 'in_progress', sessionId]
      )

      const updated = queryOne('SELECT * FROM ImportSession WHERE id = ?', [sessionId])
      expect(updated.processed_files).to.equal(50)
      expect(updated.imported_count).to.equal(45)

      // Complete session
      execute(
        "UPDATE ImportSession SET status = ?, completed_at = datetime('now') WHERE id = ?",
        ['completed', sessionId]
      )

      const completed = queryOne('SELECT * FROM ImportSession WHERE id = ?', [sessionId])
      expect(completed.status).to.equal('completed')
      expect(completed.completed_at).to.exist

      // Cleanup
      execute('DELETE FROM ImportSession WHERE id = ?', [sessionId])
    })
  })

  describe('Cascade Deletion (T104)', () => {
    it('should cascade delete photos when album is deleted', () => {
      // Create album
      const albumResult = execute(
        'INSERT INTO Album (title, year, month, photo_count) VALUES (?, ?, ?, ?)',
        ['Delete Test', 2024, 7, 0]
      )
      const albumId = albumResult.lastInsertRowid

      // Add photos
      execute(
        `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
         mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, '/path/a.jpg', 'a.jpg', 'hash_a', 1000, 'image/jpeg', '2024-07-01', 0]
      )
      execute(
        `INSERT INTO Photo (album_id, file_path, file_name, file_hash, file_size, 
         mime_type, date_taken, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, '/path/b.jpg', 'b.jpg', 'hash_b', 2000, 'image/jpeg', '2024-07-02', 1]
      )

      // Verify photos exist
      const photosBefore = query('SELECT * FROM Photo WHERE album_id = ?', [albumId])
      expect(photosBefore).to.have.lengthOf(2)

      // Delete album
      execute('DELETE FROM Album WHERE id = ?', [albumId])

      // Verify photos are cascade deleted
      const photosAfter = query('SELECT * FROM Photo WHERE album_id = ?', [albumId])
      expect(photosAfter).to.have.lengthOf(0)
    })
  })
})
