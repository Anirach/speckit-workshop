/**
 * File System Operations
 * Copy, delete, hash, and directory management
 */

import {
  copyFileSync,
  unlinkSync,
  existsSync,
  statSync,
  mkdirSync,
  readdirSync
} from 'fs'
import { join, basename } from 'path'

/**
 * Copy photo file to storage
 * @param {string} sourcePath - Absolute path to user-selected photo
 * @param {string} storageDir - Base storage directory (storage/photos)
 * @param {string} yearMonth - Year-month folder (e.g., "2024-01")
 * @returns {Promise<Object>} File info object
 */
export async function copyPhotoToStorage(sourcePath, storageDir, yearMonth) {
  if (!existsSync(sourcePath)) {
    throw new Error(`File not found: ${sourcePath}`)
  }

  // Ensure year-month directory exists
  const targetDir = join(storageDir, yearMonth)
  ensureDirectory(targetDir)

  // Copy file with original filename
  const fileName = basename(sourcePath)
  const targetPath = join(targetDir, fileName)

  // Handle duplicate filename (add suffix)
  let finalPath = targetPath
  let counter = 1
  while (existsSync(finalPath)) {
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
    const ext = fileName.match(/\.[^.]+$/)?.[0] || ''
    finalPath = join(targetDir, `${nameWithoutExt}_${counter}${ext}`)
    counter++
  }

  copyFileSync(sourcePath, finalPath)

  // Get file info
  const stats = statSync(finalPath)
  const mimeType = detectMimeType(fileName)

  return {
    filePath: finalPath,
    fileName: basename(finalPath),
    fileSize: stats.size,
    mimeType
  }
}

/**
 * Delete photo file from storage
 * @param {string} filePath - Absolute path to photo
 */
export function deletePhoto(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`File not found, skipping deletion: ${filePath}`)
    return
  }

  unlinkSync(filePath)
}

/**
 * Delete thumbnail file
 * @param {string} thumbnailPath - Absolute path to thumbnail
 */
export function deleteThumbnail(thumbnailPath) {
  if (existsSync(thumbnailPath)) {
    unlinkSync(thumbnailPath)
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Absolute path to file
 * @returns {boolean} True if exists
 */
export function fileExists(filePath) {
  return existsSync(filePath)
}

/**
 * Ensure directory exists (create if needed)
 * @param {string} dirPath - Absolute path to directory
 */
export function ensureDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * List files in directory matching pattern
 * @param {string} dirPath - Absolute path to directory
 * @param {string} pattern - Optional glob pattern (e.g., "*.jpg")
 * @returns {string[]} Array of absolute file paths
 */
export function listFiles(dirPath, pattern = null) {
  if (!existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  const files = readdirSync(dirPath)

  let filteredFiles = files
  if (pattern) {
    const regex = new RegExp(
      pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
    )
    filteredFiles = files.filter((f) => regex.test(f))
  }

  return filteredFiles.map((f) => join(dirPath, f))
}

/**
 * Detect MIME type from file extension
 * @param {string} fileName - Filename
 * @returns {string} MIME type
 */
function detectMimeType(fileName) {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0]

  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.heic': 'image/heic',
    '.heif': 'image/heif'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Validate photo file format
 * @param {string} fileName - Filename
 * @returns {boolean} True if supported format
 */
export function isSupportedFormat(fileName) {
  const mimeType = detectMimeType(fileName)
  const supported = [
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif'
  ]
  return supported.includes(mimeType)
}
