/**
 * Import Service
 * Handles photo import workflow with progress tracking
 */

import { getDatabase } from '../lib/database.js'
import { AppError } from '../lib/errors.js'
import { extractMetadata } from '../lib/exif.js'
import { calculateFileHash } from '../lib/hash.js'
import { copyPhotoToStorage, isSupportedFormat } from '../lib/file-system.js'
import {
  exifToISO,
  parseYearMonth,
  formatYearMonth,
  getFileModificationDate
} from '../lib/date-utils.js'
import { getOrCreateAlbum } from './album-service.js'
import { createPhoto, findPhotoByHash } from './photo-service.js'
import { generateThumbnailBlob, saveThumbnailBlob } from '../lib/thumbnail.js'

/**
 * Start a new import session
 * @param {number} totalFiles - Total number of files selected for import
 * @returns {Promise<Object>} Import session object
 */
export async function startImport(totalFiles) {
  try {
    const db = getDatabase()

    const query = `
      INSERT INTO ImportSession (
        status,
        total_files,
        processed_files,
        imported_count,
        duplicate_count,
        error_count
      ) VALUES (?, ?, ?, ?, ?, ?)
    `

    const result = db.prepare(query).run(
      'in_progress',
      totalFiles,
      0, // processed_files
      0, // imported_count
      0, // duplicate_count
      0 // error_count
    )

    // Return newly created session
    return db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(result.lastInsertRowid)
  } catch (error) {
    throw new AppError('Failed to start import session', 'DATABASE_ERROR', error)
  }
}

/**
 * Process a single photo file during import
 * @param {File} file - File object from file input
 * @param {number} sessionId - Import session ID
 * @param {string} storageDir - Base storage directory (e.g., 'storage/photos')
 * @param {string} thumbnailsDir - Thumbnails directory (e.g., 'storage/thumbnails')
 * @returns {Promise<Object>} Result object with status and details
 */
export async function processPhoto(file, sessionId, storageDir, thumbnailsDir) {
  try {
    // Validate file format
    if (!isSupportedFormat(file.name)) {
      return {
        status: 'error',
        reason: 'unsupported_format',
        fileName: file.name,
        error: 'Unsupported format. Supported: JPEG, PNG, HEIC, WebP'
      }
    }

    // Create a temporary path for the file (in browser context, we'll use File object)
    // For Node.js backend, we'd need to handle file upload differently
    const tempPath = file.path || file.name

    // Calculate file hash for duplicate detection
    const fileHash = await calculateFileHash(tempPath)

    // Check for duplicates
    const existingPhoto = await findPhotoByHash(fileHash)
    if (existingPhoto) {
      return {
        status: 'duplicate',
        fileName: file.name,
        existingPhotoId: existingPhoto.id
      }
    }

    // Extract EXIF metadata
    const metadata = await extractMetadata(tempPath)

    // Determine date taken (with fallback to file modification date)
    let dateTaken
    if (metadata.dateTaken && metadata.dateTaken !== null) {
      dateTaken = exifToISO(metadata.dateTaken, metadata.timezoneOffset)
    } else {
      // Fallback to file modification date
      dateTaken = getFileModificationDate(tempPath)
    }

    // Parse year and month for album grouping
    const { year, month } = parseYearMonth(dateTaken)

    // Get or create album for this year-month
    const album = await getOrCreateAlbum(year, month)

    // Copy file to storage
    const yearMonth = formatYearMonth(year, month)
    const fileInfo = await copyPhotoToStorage(tempPath, storageDir, yearMonth)

    // Generate thumbnail
    const thumbnailBlob = await generateThumbnailBlob(file)
    const thumbnailPath = await saveThumbnailBlob(thumbnailBlob, fileHash)

    // Create photo record in database
    const photo = await createPhoto({
      albumId: album.id,
      filePath: fileInfo.filePath,
      fileName: fileInfo.fileName,
      fileHash,
      fileSize: fileInfo.fileSize,
      mimeType: fileInfo.mimeType,
      width: metadata.width,
      height: metadata.height,
      dateTaken,
      timezoneOffset: metadata.timezoneOffset,
      cameraModel: metadata.cameraModel,
      thumbnailPath,
      displayOrder: 0,
      importSessionId: sessionId
    })

    return {
      status: 'success',
      fileName: file.name,
      photoId: photo.id,
      albumId: album.id
    }
  } catch (error) {
    return {
      status: 'error',
      reason: 'processing_failed',
      fileName: file.name,
      error: error.message
    }
  }
}

/**
 * Update import session counters
 * @param {number} sessionId - Import session ID
 * @param {Object} result - Result from processPhoto
 * @returns {Promise<Object>} Updated session object
 */
export async function updateImportProgress(sessionId, result) {
  try {
    const db = getDatabase()

    // Get current session
    const session = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(sessionId)

    if (!session) {
      throw new AppError('Import session not found', 'NOT_FOUND')
    }

    // Update counters based on result
    let importedCount = session.imported_count
    let duplicateCount = session.duplicate_count
    let errorCount = session.error_count
    const errorLog = session.error_log ? JSON.parse(session.error_log) : []

    if (result.status === 'success') {
      importedCount++
    } else if (result.status === 'duplicate') {
      duplicateCount++
    } else if (result.status === 'error') {
      errorCount++
      errorLog.push({
        fileName: result.fileName,
        reason: result.reason,
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }

    const processedFiles = session.processed_files + 1

    // Update session
    const updateQuery = `
      UPDATE ImportSession
      SET 
        processed_files = ?,
        imported_count = ?,
        duplicate_count = ?,
        error_count = ?,
        error_log = ?
      WHERE id = ?
    `

    db.prepare(updateQuery).run(
      processedFiles,
      importedCount,
      duplicateCount,
      errorCount,
      JSON.stringify(errorLog),
      sessionId
    )

    // Return updated session
    return db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(sessionId)
  } catch (error) {
    throw new AppError(
      `Failed to update import progress for session ${sessionId}`,
      'DATABASE_ERROR',
      error
    )
  }
}

/**
 * Complete import session
 * @param {number} sessionId - Import session ID
 * @param {string} status - Final status ('completed' or 'failed')
 * @returns {Promise<Object>} Completed session object
 */
export async function completeImport(sessionId, status = 'completed') {
  try {
    const db = getDatabase()

    const query = `
      UPDATE ImportSession
      SET 
        status = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    db.prepare(query).run(status, sessionId)

    // Return completed session
    return db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(sessionId)
  } catch (error) {
    throw new AppError(`Failed to complete import session ${sessionId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Get import session by ID
 * @param {number} sessionId - Import session ID
 * @returns {Promise<Object|null>} Import session object or null
 */
export async function getImportSession(sessionId) {
  try {
    const db = getDatabase()

    const session = db.prepare('SELECT * FROM ImportSession WHERE id = ?').get(sessionId)
    return session || null
  } catch (error) {
    throw new AppError(`Failed to retrieve import session ${sessionId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Import multiple photos with progress tracking
 * @param {File[]} files - Array of File objects
 * @param {Function} onProgress - Progress callback (session) => void
 * @param {string} storageDir - Base storage directory
 * @param {string} thumbnailsDir - Thumbnails directory
 * @returns {Promise<Object>} Completed import session
 */
export async function importPhotos(
  files,
  onProgress,
  storageDir = 'storage/photos',
  thumbnailsDir = 'storage/thumbnails'
) {
  // Start import session
  const session = await startImport(files.length)

  try {
    // Process files sequentially (can be parallelized with Web Workers later)
    for (const file of files) {
      const result = await processPhoto(file, session.id, storageDir, thumbnailsDir)
      const updatedSession = await updateImportProgress(session.id, result)

      // Call progress callback
      if (onProgress) {
        onProgress(updatedSession)
      }
    }

    // Complete import
    const completedSession = await completeImport(session.id, 'completed')
    return completedSession
  } catch (error) {
    // Mark session as failed
    await completeImport(session.id, 'failed')
    throw new AppError('Import failed', 'IMPORT_ERROR', error)
  }
}

/**
 * Import multiple photos in parallel (batch processing)
 * @param {File[]} files - Array of File objects
 * @param {Function} onProgress - Progress callback (session) => void
 * @param {string} storageDir - Base storage directory
 * @param {string} thumbnailsDir - Thumbnails directory
 * @param {number} batchSize - Number of files to process in parallel (default 5)
 * @returns {Promise<Object>} Completed import session
 */
export async function importPhotosParallel(
  files,
  onProgress,
  storageDir = 'storage/photos',
  thumbnailsDir = 'storage/thumbnails',
  batchSize = 5
) {
  // Start import session
  const session = await startImport(files.length)

  try {
    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(file => processPhoto(file, session.id, storageDir, thumbnailsDir))
      )

      // Update progress for each result
      for (const result of results) {
        const updatedSession = await updateImportProgress(session.id, result)

        // Call progress callback after each file
        if (onProgress) {
          onProgress(updatedSession)
        }
      }
    }

    // Complete import
    const completedSession = await completeImport(session.id, 'completed')
    return completedSession
  } catch (error) {
    // Mark session as failed
    await completeImport(session.id, 'failed')
    throw new AppError('Import failed', 'IMPORT_ERROR', error)
  }
}
