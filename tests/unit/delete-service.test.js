/**
 * Unit Tests: Delete Service
 * Tests photo and album deletion logic with cascade behavior
 * Framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as deleteService from '../../src/services/delete-service.js'
import * as db from '../../src/lib/database.js'
import * as fileSystem from '../../src/lib/file-system.js'

vi.mock('../../src/lib/database.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  transaction: vi.fn((fn) => fn())
}))

vi.mock('../../src/lib/file-system.js', () => ({
  deleteFile: vi.fn()
}))

describe('DeleteService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deletePhoto (T110)', () => {
    it('should delete photo and associated files', async () => {
      const mockPhoto = {
        id: 1,
        file_path: '/storage/photos/abc123.jpg',
        thumbnail_path: '/storage/thumbnails/abc123.jpg',
        file_hash: 'abc123'
      }

      db.queryOne.mockReturnValue(mockPhoto)
      db.execute.mockReturnValue({ changes: 1 })
      fileSystem.deleteFile.mockResolvedValue(true)

      const result = await deleteService.deletePhoto(1)

      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      )
      expect(fileSystem.deleteFile).toHaveBeenCalledWith('/storage/photos/abc123.jpg')
      expect(fileSystem.deleteFile).toHaveBeenCalledWith('/storage/thumbnails/abc123.jpg')
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [1]
      )
      expect(result.deleted).toBe(true)
    })

    it('should handle non-existent photo gracefully', async () => {
      db.queryOne.mockReturnValue(null)

      const result = await deleteService.deletePhoto(999)

      expect(fileSystem.deleteFile).not.toHaveBeenCalled()
      expect(result.deleted).toBe(false)
    })

    it('should continue deletion even if file removal fails', async () => {
      const mockPhoto = {
        id: 1,
        file_path: '/storage/photos/abc123.jpg',
        thumbnail_path: '/storage/thumbnails/abc123.jpg'
      }

      db.queryOne.mockReturnValue(mockPhoto)
      fileSystem.deleteFile.mockRejectedValue(new Error('File not found'))
      db.execute.mockReturnValue({ changes: 1 })

      const result = await deleteService.deletePhoto(1)

      expect(db.execute).toHaveBeenCalled() // Database deletion still proceeds
      expect(result.deleted).toBe(true)
    })
  })

  describe('deleteAlbum (T111)', () => {
    it('should delete album and cascade delete photos', async () => {
      const mockAlbum = { id: 1, name: 'Test Album', photo_count: 3 }
      const mockPhotos = [
        { id: 1, file_path: '/storage/photos/1.jpg', thumbnail_path: '/storage/thumbnails/1.jpg' },
        { id: 2, file_path: '/storage/photos/2.jpg', thumbnail_path: '/storage/thumbnails/2.jpg' },
        { id: 3, file_path: '/storage/photos/3.jpg', thumbnail_path: '/storage/thumbnails/3.jpg' }
      ]

      db.queryOne.mockReturnValue(mockAlbum)
      db.query.mockReturnValue(mockPhotos)
      db.execute.mockReturnValue({ changes: 1 })
      fileSystem.deleteFile.mockResolvedValue(true)

      const result = await deleteService.deleteAlbum(1)

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      )
      expect(fileSystem.deleteFile).toHaveBeenCalledTimes(6) // 3 photos + 3 thumbnails
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Album'),
        [1]
      )
      expect(result.deleted).toBe(true)
      expect(result.photosDeleted).toBe(3)
    })

    it('should handle empty album deletion', async () => {
      const mockAlbum = { id: 1, name: 'Empty Album', photo_count: 0 }

      db.queryOne.mockReturnValue(mockAlbum)
      db.query.mockReturnValue([])
      db.execute.mockReturnValue({ changes: 1 })

      const result = await deleteService.deleteAlbum(1)

      expect(fileSystem.deleteFile).not.toHaveBeenCalled()
      expect(result.deleted).toBe(true)
      expect(result.photosDeleted).toBe(0)
    })

    it('should verify cascade deletion from database trigger', async () => {
      const mockAlbum = { id: 1, photo_count: 2 }
      const mockPhotos = [
        { id: 1, file_path: '/storage/photos/1.jpg' },
        { id: 2, file_path: '/storage/photos/2.jpg' }
      ]

      db.queryOne.mockReturnValue(mockAlbum)
      db.query.mockReturnValue(mockPhotos)
      db.execute.mockReturnValue({ changes: 1 })
      fileSystem.deleteFile.mockResolvedValue(true)

      await deleteService.deleteAlbum(1)

      // Database trigger should handle cascade deletion of Photo records
      // Service only needs to delete the Album record
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Album'),
        [1]
      )
    })
  })

  describe('bulkDeletePhotos (T110)', () => {
    it('should delete multiple photos in transaction', async () => {
      const photoIds = [1, 2, 3]
      const mockPhotos = [
        { id: 1, file_path: '/storage/photos/1.jpg', thumbnail_path: '/storage/thumbnails/1.jpg' },
        { id: 2, file_path: '/storage/photos/2.jpg', thumbnail_path: '/storage/thumbnails/2.jpg' },
        { id: 3, file_path: '/storage/photos/3.jpg', thumbnail_path: '/storage/thumbnails/3.jpg' }
      ]

      db.query.mockReturnValue(mockPhotos)
      db.execute.mockReturnValue({ changes: 3 })
      fileSystem.deleteFile.mockResolvedValue(true)

      const result = await deleteService.bulkDeletePhotos(photoIds)

      expect(db.query).toHaveBeenCalled()
      expect(fileSystem.deleteFile).toHaveBeenCalledTimes(6)
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Photo'),
        expect.anything()
      )
      expect(result.deleted).toBe(3)
    })

    it('should track partial deletion failures', async () => {
      const photoIds = [1, 2]
      const mockPhotos = [
        { id: 1, file_path: '/storage/photos/1.jpg' },
        { id: 2, file_path: '/storage/photos/2.jpg' }
      ]

      db.query.mockReturnValue(mockPhotos)
      fileSystem.deleteFile
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Delete failed'))
      db.execute.mockReturnValue({ changes: 2 })

      const result = await deleteService.bulkDeletePhotos(photoIds)

      expect(result.deleted).toBe(2) // Database deletion succeeds
      expect(result.fileErrors).toBe(1) // One file error tracked
    })
  })

  describe('verifyDeletion', () => {
    it('should confirm photo no longer exists in database', async () => {
      db.queryOne.mockReturnValue(null)

      const exists = await deleteService.verifyDeletion(1)

      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      )
      expect(exists).toBe(false)
    })

    it('should detect failed deletion', async () => {
      db.queryOne.mockReturnValue({ id: 1 })

      const exists = await deleteService.verifyDeletion(1)

      expect(exists).toBe(true)
    })
  })
})
