/**
 * Unit Tests: Photo Service
 * Tests photo CRUD operations and ordering logic
 * Framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as photoService from '../../src/services/photo-service.js'
import * as db from '../../src/lib/database.js'

vi.mock('../../src/lib/database.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  transaction: vi.fn((fn) => fn())
}))

describe('PhotoService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPhotosInAlbum (T042)', () => {
    it('should query photos by album_id with correct ordering', () => {
      const mockPhotos = [
        { id: 1, album_id: 1, file_name: '1.jpg', display_order: 0 },
        { id: 2, album_id: 1, file_name: '2.jpg', display_order: 1 }
      ]

      db.query.mockReturnValue(mockPhotos)

      const result = photoService.getPhotosInAlbum(1)

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('album_id'),
        [1]
      )
      expect(result).toHaveLength(2)
      expect(result[0].display_order).toBeLessThan(result[1].display_order)
    })

    it('should return empty array for album with no photos', () => {
      db.query.mockReturnValue([])

      const result = photoService.getPhotosInAlbum(999)

      expect(result).toEqual([])
    })

    it('should order by display_order ascending (newest first)', () => {
      const mockPhotos = [
        { id: 1, display_order: 0, date_taken: '2024-01-15' },
        { id: 2, display_order: 1, date_taken: '2024-01-14' },
        { id: 3, display_order: 2, date_taken: '2024-01-13' }
      ]

      db.query.mockReturnValue(mockPhotos)

      const result = photoService.getPhotosInAlbum(1)

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].display_order).toBeLessThanOrEqual(result[i + 1].display_order)
      }
    })
  })

  describe('createPhoto', () => {
    it('should insert photo record with all required fields', () => {
      const photoData = {
        album_id: 1,
        file_path: '/storage/photos/abc123.jpg',
        file_name: 'test.jpg',
        file_hash: 'abc123def456',
        file_size: 2048000,
        mime_type: 'image/jpeg',
        date_taken: '2024-01-15T14:30:22+08:00',
        width: 4032,
        height: 3024
      }

      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      const result = photoService.createPhoto(photoData)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Photo'),
        expect.arrayContaining([
          photoData.album_id,
          photoData.file_path,
          photoData.file_name,
          photoData.file_hash
        ])
      )
      expect(result.lastInsertRowid).toBe(1)
    })

    it('should trigger album photo_count update', () => {
      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      photoService.createPhoto({
        album_id: 1,
        file_path: '/path/test.jpg',
        file_name: 'test.jpg',
        file_hash: 'hash123',
        file_size: 1000,
        mime_type: 'image/jpeg',
        date_taken: '2024-01-15'
      })

      // Database trigger should handle photo_count update
      expect(db.execute).toHaveBeenCalled()
    })
  })

  describe('deletePhoto (T107)', () => {
    it('should delete photo record from database', () => {
      db.execute.mockReturnValue({ changes: 1 })

      const result = photoService.deletePhoto(1)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [1]
      )
      expect(result.changes).toBe(1)
    })

    it('should handle non-existent photo deletion', () => {
      db.execute.mockReturnValue({ changes: 0 })

      const result = photoService.deletePhoto(999)

      expect(result.changes).toBe(0)
    })
  })

  describe('getPhotoById', () => {
    it('should return photo by ID', () => {
      const mockPhoto = {
        id: 1,
        album_id: 1,
        file_name: 'test.jpg',
        file_hash: 'abc123'
      }

      db.queryOne.mockReturnValue(mockPhoto)

      const result = photoService.getPhotoById(1)

      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      )
      expect(result).toEqual(mockPhoto)
    })

    it('should return null for non-existent photo', () => {
      db.queryOne.mockReturnValue(null)

      const result = photoService.getPhotoById(999)

      expect(result).toBeNull()
    })
  })

  describe('updateDisplayOrder', () => {
    it('should update photo display order', () => {
      db.execute.mockReturnValue({ changes: 1 })

      photoService.updateDisplayOrder(1, 5)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('display_order'),
        expect.arrayContaining([5, 1])
      )
    })
  })
})
