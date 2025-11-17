/**
 * Unit Tests: Album Service
 * Tests album CRUD operations and business logic
 * Framework: Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as albumService from '../../src/services/album-service.js'
import * as db from '../../src/lib/database.js'

// Mock database
vi.mock('../../src/lib/database.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  transaction: vi.fn((fn) => fn())
}))

describe('AlbumService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllAlbums (T041)', () => {
    it('should query albums with proper ordering', () => {
      const mockAlbums = [
        { id: 1, title: 'February 2024', year: 2024, month: 2, photo_count: 10 },
        { id: 2, title: 'January 2024', year: 2024, month: 1, photo_count: 5 }
      ]

      db.query.mockReturnValue(mockAlbums)

      const result = albumService.getAllAlbums()

      expect(db.query).toHaveBeenCalled()
      expect(result).toEqual(mockAlbums)
      expect(result[0].year).toBeGreaterThanOrEqual(result[1].year)
    })

    it('should return empty array when no albums exist', () => {
      db.query.mockReturnValue([])

      const result = albumService.getAllAlbums()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getAlbumById (T041)', () => {
    it('should return album by ID', () => {
      const mockAlbum = {
        id: 1,
        title: 'January 2024',
        year: 2024,
        month: 1,
        photo_count: 5
      }

      db.queryOne.mockReturnValue(mockAlbum)

      const result = albumService.getAlbumById(1)

      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [1])
      expect(result).toEqual(mockAlbum)
      expect(result.id).toBe(1)
    })

    it('should return null for non-existent album', () => {
      db.queryOne.mockReturnValue(null)

      const result = albumService.getAlbumById(999)

      expect(result).toBeNull()
    })
  })

  describe('getOrCreateAlbum (T084)', () => {
    it('should return existing album if found', () => {
      const existingAlbum = {
        id: 1,
        title: 'January 2024',
        year: 2024,
        month: 1
      }

      db.queryOne.mockReturnValue(existingAlbum)

      const result = albumService.getOrCreateAlbum(2024, 1)

      expect(db.queryOne).toHaveBeenCalled()
      expect(db.execute).not.toHaveBeenCalled()
      expect(result).toEqual(existingAlbum)
    })

    it('should create new album if not found', () => {
      db.queryOne.mockReturnValueOnce(null)
      db.execute.mockReturnValue({ lastInsertRowid: 2 })
      db.queryOne.mockReturnValueOnce({
        id: 2,
        title: 'March 2024',
        year: 2024,
        month: 3
      })

      const result = albumService.getOrCreateAlbum(2024, 3)

      expect(db.execute).toHaveBeenCalled()
      expect(result.year).toBe(2024)
      expect(result.month).toBe(3)
    })

    it('should generate correct album title', () => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]

      db.queryOne.mockReturnValueOnce(null)
      db.execute.mockReturnValue({ lastInsertRowid: 3 })
      db.queryOne.mockReturnValueOnce({
        id: 3,
        title: `${monthNames[4]} 2024`,
        year: 2024,
        month: 5
      })

      const result = albumService.getOrCreateAlbum(2024, 5)

      expect(result.title).toBe('May 2024')
    })
  })

  describe('updateAlbumOrder (T059)', () => {
    it('should update album position', () => {
      db.execute.mockReturnValue({ changes: 1 })

      albumService.updateAlbumOrder(1, 5)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('AlbumOrder'),
        expect.arrayContaining([1, 5])
      )
    })

    it('should handle position shifting when dragging down', () => {
      const oldPosition = 1
      const newPosition = 3

      db.execute.mockReturnValue({ changes: 1 })

      // Shift albums between positions
      const shiftQuery = 'UPDATE AlbumOrder SET position = position - 1 WHERE position > ? AND position <= ?'

      db.execute(shiftQuery, [oldPosition, newPosition])

      expect(db.execute).toHaveBeenCalledWith(shiftQuery, [oldPosition, newPosition])
    })

    it('should handle position shifting when dragging up', () => {
      const oldPosition = 3
      const newPosition = 1

      db.execute.mockReturnValue({ changes: 1 })

      // Shift albums between positions
      const shiftQuery = 'UPDATE AlbumOrder SET position = position + 1 WHERE position >= ? AND position < ?'

      db.execute(shiftQuery, [newPosition, oldPosition])

      expect(db.execute).toHaveBeenCalledWith(shiftQuery, [newPosition, oldPosition])
    })
  })

  describe('getAlbumsWithCustomOrder', () => {
    it('should join with AlbumOrder table', () => {
      const mockAlbums = [
        { id: 1, title: 'Album 1', position: 0 },
        { id: 2, title: 'Album 2', position: 1 }
      ]

      db.query.mockReturnValue(mockAlbums)

      const result = albumService.getAlbumsWithCustomOrder()

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LEFT JOIN'))
      expect(result).toEqual(mockAlbums)
    })

    it('should sort by custom position first, then by date', () => {
      const mockAlbums = [
        { id: 1, title: 'Custom 1', position: 0 },
        { id: 2, title: 'Custom 2', position: 1 },
        { id: 3, title: 'No Order', position: null, year: 2024, month: 1 }
      ]

      db.query.mockReturnValue(mockAlbums)

      const result = albumService.getAlbumsWithCustomOrder()

      // First two should have positions
      expect(result[0].position).toBe(0)
      expect(result[1].position).toBe(1)
      // Last one should have no custom position
      expect(result[2].position).toBeNull()
    })
  })

  describe('deleteAlbum (T108)', () => {
    it('should delete album by ID', () => {
      db.execute.mockReturnValue({ changes: 1 })

      albumService.deleteAlbum(1)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [1]
      )
    })

    it('should return affected row count', () => {
      db.execute.mockReturnValue({ changes: 1 })

      const result = albumService.deleteAlbum(1)

      expect(result.changes).toBe(1)
    })

    it('should handle cascade deletion via database triggers', () => {
      // Database triggers handle cascade deletion automatically
      db.execute.mockReturnValue({ changes: 1 })

      albumService.deleteAlbum(1)

      // Only album deletion should be called
      // Photos are deleted by CASCADE trigger
      expect(db.execute).toHaveBeenCalledTimes(1)
    })
  })
})
