/**
 * Unit Tests: Import Service
 * Tests duplicate detection, EXIF parsing, hash calculation
 * Framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as importService from '../../src/services/import-service.js'
import * as db from '../../src/lib/database.js'
import * as hashLib from '../../src/lib/hash.js'
import * as exifLib from '../../src/lib/exif.js'
import * as fileSystem from '../../src/lib/file-system.js'

vi.mock('../../src/lib/database.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  transaction: vi.fn((fn) => fn())
}))

vi.mock('../../src/lib/hash.js', () => ({
  calculateFileHash: vi.fn()
}))

vi.mock('../../src/lib/exif.js', () => ({
  extractExifData: vi.fn()
}))

vi.mock('../../src/lib/file-system.js', () => ({
  copyToStorage: vi.fn(),
  generateThumbnail: vi.fn()
}))

describe('ImportService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkDuplicate (T085)', () => {
    it('should detect duplicate photo by file hash', async () => {
      const mockPhoto = {
        id: 1,
        file_hash: 'abc123def456',
        file_name: 'existing.jpg'
      }

      db.queryOne.mockReturnValue(mockPhoto)

      const result = await importService.checkDuplicate('abc123def456')

      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('file_hash'),
        ['abc123def456']
      )
      expect(result).toEqual(mockPhoto)
    })

    it('should return null when no duplicate exists', async () => {
      db.queryOne.mockReturnValue(null)

      const result = await importService.checkDuplicate('newHash123')

      expect(result).toBeNull()
    })
  })

  describe('calculateHash (T085)', () => {
    it('should calculate SHA-256 hash for file', async () => {
      const mockHash = 'abc123def456789'
      hashLib.calculateFileHash.mockResolvedValue(mockHash)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await importService.calculateHash(file)

      expect(hashLib.calculateFileHash).toHaveBeenCalledWith(file)
      expect(result).toBe(mockHash)
    })

    it('should handle hash calculation errors', async () => {
      hashLib.calculateFileHash.mockRejectedValue(new Error('Hash failed'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(importService.calculateHash(file)).rejects.toThrow('Hash failed')
    })
  })

  describe('extractMetadata (T086)', () => {
    it('should extract EXIF data with timezone preservation', async () => {
      const mockExif = {
        dateTaken: '2024-01-15T14:30:22+08:00',
        width: 4032,
        height: 3024,
        make: 'Canon',
        model: 'EOS R5'
      }

      exifLib.extractExifData.mockResolvedValue(mockExif)

      const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
      const result = await importService.extractMetadata(file)

      expect(exifLib.extractExifData).toHaveBeenCalledWith(file)
      expect(result.dateTaken).toContain('+08:00')
      expect(result.width).toBe(4032)
    })

    it('should handle missing EXIF data gracefully', async () => {
      exifLib.extractExifData.mockResolvedValue({
        dateTaken: null,
        width: null,
        height: null
      })

      const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
      const result = await importService.extractMetadata(file)

      expect(result.dateTaken).toBeNull()
    })

    it('should use file modification date as fallback', async () => {
      exifLib.extractExifData.mockResolvedValue({
        dateTaken: null
      })

      const file = new File(['jpeg'], 'photo.jpg', {
        type: 'image/jpeg',
        lastModified: new Date('2024-01-15').getTime()
      })

      const result = await importService.extractMetadata(file)

      expect(result.dateTaken).toContain('2024-01-15')
    })
  })

  describe('importPhoto (T086)', () => {
    it('should import photo with complete workflow', async () => {
      const mockHash = 'abc123'
      const mockExif = {
        dateTaken: '2024-01-15T14:30:22+08:00',
        width: 4032,
        height: 3024
      }

      hashLib.calculateFileHash.mockResolvedValue(mockHash)
      exifLib.extractExifData.mockResolvedValue(mockExif)
      db.queryOne.mockReturnValue(null) // No duplicate
      fileSystem.copyToStorage.mockResolvedValue('/storage/photos/abc123.jpg')
      fileSystem.generateThumbnail.mockResolvedValue('/storage/thumbnails/abc123.jpg')
      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      const file = new File(['jpeg'], 'test.jpg', { type: 'image/jpeg' })
      const albumId = 1

      const result = await importService.importPhoto(file, albumId)

      expect(hashLib.calculateFileHash).toHaveBeenCalled()
      expect(exifLib.extractExifData).toHaveBeenCalled()
      expect(db.queryOne).toHaveBeenCalled() // Duplicate check
      expect(fileSystem.copyToStorage).toHaveBeenCalled()
      expect(fileSystem.generateThumbnail).toHaveBeenCalled()
      expect(db.execute).toHaveBeenCalled() // Insert photo
      expect(result.lastInsertRowid).toBe(1)
    })

    it('should skip duplicate photo imports', async () => {
      const mockHash = 'duplicate123'
      const existingPhoto = { id: 5, file_hash: mockHash }

      hashLib.calculateFileHash.mockResolvedValue(mockHash)
      db.queryOne.mockReturnValue(existingPhoto)

      const file = new File(['jpeg'], 'test.jpg', { type: 'image/jpeg' })

      const result = await importService.importPhoto(file, 1)

      expect(fileSystem.copyToStorage).not.toHaveBeenCalled()
      expect(result).toEqual({ duplicate: true, existingPhoto })
    })
  })

  describe('bulkImport (T086)', () => {
    it('should import multiple files with progress tracking', async () => {
      const files = [
        new File(['1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'photo2.jpg', { type: 'image/jpeg' })
      ]

      hashLib.calculateFileHash.mockResolvedValue('hash123')
      exifLib.extractExifData.mockResolvedValue({ dateTaken: '2024-01-15' })
      db.queryOne.mockReturnValue(null)
      fileSystem.copyToStorage.mockResolvedValue('/storage/photos/hash123.jpg')
      fileSystem.generateThumbnail.mockResolvedValue('/storage/thumbnails/hash123.jpg')
      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      const onProgress = vi.fn()
      const result = await importService.bulkImport(files, 1, onProgress)

      expect(result.imported).toBe(2)
      expect(result.duplicates).toBe(0)
      expect(onProgress).toHaveBeenCalledTimes(2)
    })

    it('should track duplicates and errors', async () => {
      const files = [
        new File(['1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'duplicate.jpg', { type: 'image/jpeg' }),
        new File(['3'], 'error.jpg', { type: 'image/jpeg' })
      ]

      hashLib.calculateFileHash
        .mockResolvedValueOnce('hash1')
        .mockResolvedValueOnce('duplicateHash')
        .mockRejectedValueOnce(new Error('Hash error'))

      db.queryOne
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 1, file_hash: 'duplicateHash' })

      fileSystem.copyToStorage.mockResolvedValue('/storage/photos/hash1.jpg')
      fileSystem.generateThumbnail.mockResolvedValue('/storage/thumbnails/hash1.jpg')
      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      const result = await importService.bulkImport(files, 1)

      expect(result.imported).toBe(1)
      expect(result.duplicates).toBe(1)
      expect(result.errors).toBe(1)
    })
  })

  describe('createImportSession (T088)', () => {
    it('should create import session record', () => {
      db.execute.mockReturnValue({ lastInsertRowid: 1 })

      const result = importService.createImportSession(50)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('ImportSession'),
        expect.arrayContaining([50])
      )
      expect(result.lastInsertRowid).toBe(1)
    })
  })

  describe('updateImportSession (T088)', () => {
    it('should update import session progress', () => {
      db.execute.mockReturnValue({ changes: 1 })

      importService.updateImportSession(1, {
        processed_count: 25,
        imported_count: 20,
        duplicate_count: 3,
        error_count: 2
      })

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ImportSession'),
        expect.arrayContaining([25, 20, 3, 2, 1])
      )
    })

    it('should mark session as completed', () => {
      db.execute.mockReturnValue({ changes: 1 })

      importService.completeImportSession(1)

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.arrayContaining(['completed', 1])
      )
    })
  })
})
