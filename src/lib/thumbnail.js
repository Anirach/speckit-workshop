/**
 * Thumbnail Generation
 * Creates 300x300px thumbnails using Canvas API (browser-based)
 */

import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Generate thumbnail for photo (browser environment)
 * @param {File|Blob} photoFile - Photo file/blob
 * @param {number} size - Thumbnail size (default 300px)
 * @returns {Promise<Blob>} Thumbnail blob
 */
export async function generateThumbnailBlob(photoFile, size = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate scaled dimensions (maintain aspect ratio)
      const scale = Math.min(size / img.width, size / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(img.src)
          resolve(blob)
        },
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image for thumbnail generation'))
    }

    img.src = URL.createObjectURL(photoFile)
  })
}

/**
 * Generate thumbnail and save to storage (Node.js backend)
 * Note: This requires a backend API endpoint to handle file operations
 * @param {string} photoPath - Absolute path to original photo
 * @param {string} outputDir - Directory to save thumbnail (storage/thumbnails)
 * @param {string} hash - File hash (used as filename)
 * @param {number} size - Thumbnail size (default 300px)
 * @returns {Promise<string>} Path to generated thumbnail
 */
export async function generateThumbnail(photoPath, outputDir, hash, size = 300) {
  // This is a placeholder for Node.js backend implementation
  // In browser context, use generateThumbnailBlob instead
  throw new Error(
    'generateThumbnail is not available in browser context. Use generateThumbnailBlob instead.'
  )
}

/**
 * Save thumbnail blob to storage (requires backend API)
 * @param {Blob} blob - Thumbnail blob
 * @param {string} hash - File hash
 * @returns {Promise<string>} Path to saved thumbnail
 */
export async function saveThumbnailBlob(blob, hash) {
  // This will be implemented when we have a backend API
  // For now, return a placeholder path
  return `storage/thumbnails/${hash}.jpg`
}

/**
 * Check if thumbnail exists for hash
 * @param {string} outputDir - Thumbnails directory
 * @param {string} hash - File hash
 * @returns {string|null} Thumbnail path if exists, null otherwise
 */
export function getThumbnailPath(outputDir, hash) {
  const thumbnailPath = join(outputDir, `${hash}.jpg`)

  return existsSync(thumbnailPath) ? thumbnailPath : null
}
