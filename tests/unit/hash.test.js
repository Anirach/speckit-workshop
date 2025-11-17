/**
 * Unit Tests: File Hash Utilities
 * Tests SHA-256 hash calculation and consistency
 * Framework: Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as hash from '../../src/lib/hash.js'

describe('Hash Utilities Unit Tests', () => {
  describe('calculateFileHash (T085)', () => {
    it('should calculate SHA-256 hash as 64-character hex string', async () => {
      const content = 'test content'
      const file = new File([content], 'test.txt', { type: 'text/plain' })

      const result = await hash.calculateFileHash(file)

      expect(result).toMatch(/^[a-f0-9]{64}$/)
      expect(result.length).toBe(64)
    })

    it('should produce consistent hash for same content', async () => {
      const content = 'consistent content'
      const file1 = new File([content], 'file1.txt', { type: 'text/plain' })
      const file2 = new File([content], 'file2.txt', { type: 'text/plain' })

      const hash1 = await hash.calculateFileHash(file1)
      const hash2 = await hash.calculateFileHash(file2)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different content', async () => {
      const file1 = new File(['content A'], 'fileA.txt', { type: 'text/plain' })
      const file2 = new File(['content B'], 'fileB.txt', { type: 'text/plain' })

      const hash1 = await hash.calculateFileHash(file1)
      const hash2 = await hash.calculateFileHash(file2)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash binary file content correctly', async () => {
      const buffer = new Uint8Array([0, 1, 2, 3, 4, 5])
      const file = new File([buffer], 'binary.bin', { type: 'application/octet-stream' })

      const result = await hash.calculateFileHash(file)

      expect(result).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' })

      const result = await hash.calculateFileHash(file)

      expect(result).toMatch(/^[a-f0-9]{64}$/)
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') // SHA-256 of empty string
    })

    it('should handle large files efficiently', async () => {
      const largeContent = 'x'.repeat(1024 * 1024) // 1MB of 'x'
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' })

      const startTime = performance.now()
      const result = await hash.calculateFileHash(file)
      const endTime = performance.now()

      expect(result).toMatch(/^[a-f0-9]{64}$/)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('bufferToHex', () => {
    it('should convert ArrayBuffer to hex string', () => {
      const buffer = new Uint8Array([0, 15, 255])

      const result = hash.bufferToHex(buffer)

      expect(result).toBe('000fff')
    })

    it('should produce lowercase hex characters', () => {
      const buffer = new Uint8Array([171, 205, 239])

      const result = hash.bufferToHex(buffer)

      expect(result).toMatch(/^[a-f0-9]+$/)
      expect(result).toBe('abcdef')
    })
  })

  describe('compareHashes', () => {
    it('should return true for identical hashes', () => {
      const hash1 = 'abc123def456'
      const hash2 = 'abc123def456'

      const result = hash.compareHashes(hash1, hash2)

      expect(result).toBe(true)
    })

    it('should return false for different hashes', () => {
      const hash1 = 'abc123def456'
      const hash2 = 'xyz789uvw012'

      const result = hash.compareHashes(hash1, hash2)

      expect(result).toBe(false)
    })

    it('should be case-sensitive', () => {
      const hash1 = 'abc123def456'
      const hash2 = 'ABC123DEF456'

      const result = hash.compareHashes(hash1, hash2)

      expect(result).toBe(false)
    })
  })

  describe('validateHash', () => {
    it('should validate correct SHA-256 hash format', () => {
      const validHash = 'a'.repeat(64)

      const result = hash.validateHash(validHash)

      expect(result).toBe(true)
    })

    it('should reject hash with incorrect length', () => {
      const shortHash = 'abc123'

      const result = hash.validateHash(shortHash)

      expect(result).toBe(false)
    })

    it('should reject hash with invalid characters', () => {
      const invalidHash = 'g'.repeat(64) // 'g' is not a hex character

      const result = hash.validateHash(invalidHash)

      expect(result).toBe(false)
    })

    it('should reject uppercase hash', () => {
      const uppercaseHash = 'A'.repeat(64)

      const result = hash.validateHash(uppercaseHash)

      expect(result).toBe(false)
    })
  })

  describe('hashBatch', () => {
    it('should calculate hashes for multiple files', async () => {
      const files = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' }),
        new File(['content3'], 'file3.txt', { type: 'text/plain' })
      ]

      const results = await hash.hashBatch(files)

      expect(results).toHaveLength(3)
      results.forEach(hash => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/)
      })
    })

    it('should detect duplicates in batch', async () => {
      const files = [
        new File(['same content'], 'file1.txt', { type: 'text/plain' }),
        new File(['same content'], 'file2.txt', { type: 'text/plain' }),
        new File(['different'], 'file3.txt', { type: 'text/plain' })
      ]

      const results = await hash.hashBatch(files)

      expect(results[0]).toBe(results[1]) // Same content = same hash
      expect(results[0]).not.toBe(results[2]) // Different content
    })
  })
})
