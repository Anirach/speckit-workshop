/**
 * Photo Service
 * Handles photo CRUD operations and business logic
 */

import { getDatabase } from '../lib/database.js'
import { AppError } from '../lib/errors.js'
import { deletePhoto as deletePhotoFile, deleteThumbnail } from '../lib/file-system.js'

/**
 * Get all photos in an album ordered by display_order
 * @param {number} albumId - Album ID
 * @returns {Promise<Array>} Array of photo objects
 */
export async function getPhotosInAlbum(albumId) {
  try {
    const db = getDatabase()

    const query = `
      SELECT 
        id,
        album_id,
        file_path,
        file_name,
        file_hash,
        file_size,
        mime_type,
        width,
        height,
        date_taken,
        timezone_offset,
        camera_model,
        thumbnail_path,
        display_order,
        import_session_id,
        created_at,
        updated_at
      FROM Photo
      WHERE album_id = ?
      ORDER BY display_order ASC, date_taken DESC
    `

    const photos = db.prepare(query).all(albumId)
    return photos
  } catch (error) {
    throw new AppError(`Failed to retrieve photos for album ${albumId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Get a single photo by ID
 * @param {number} photoId - Photo ID
 * @returns {Promise<object|null>} Photo object or null if not found
 */
export async function getPhotoById(photoId) {
  try {
    const db = getDatabase()

    const query = `
      SELECT 
        id,
        album_id,
        file_path,
        file_name,
        file_hash,
        file_size,
        mime_type,
        width,
        height,
        date_taken,
        timezone_offset,
        camera_model,
        thumbnail_path,
        display_order,
        import_session_id,
        created_at,
        updated_at
      FROM Photo
      WHERE id = ?
    `

    const photo = db.prepare(query).get(photoId)
    return photo || null
  } catch (error) {
    throw new AppError(`Failed to retrieve photo ${photoId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Create a new photo record
 * @param {object} photoData - Photo data
 * @returns {Promise<object>} Newly created photo
 */
export async function createPhoto(photoData) {
  try {
    const db = getDatabase()

    const {
      albumId,
      filePath,
      fileName,
      fileHash,
      fileSize,
      mimeType,
      width,
      height,
      dateTaken,
      timezoneOffset,
      cameraModel,
      thumbnailPath,
      displayOrder = 0,
      importSessionId
    } = photoData

    const query = `
      INSERT INTO Photo (
        album_id,
        file_path,
        file_name,
        file_hash,
        file_size,
        mime_type,
        width,
        height,
        date_taken,
        timezone_offset,
        camera_model,
        thumbnail_path,
        display_order,
        import_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = db
      .prepare(query)
      .run(
        albumId,
        filePath,
        fileName,
        fileHash,
        fileSize,
        mimeType,
        width,
        height,
        dateTaken,
        timezoneOffset,
        cameraModel,
        thumbnailPath,
        displayOrder,
        importSessionId
      )

    // Return newly created photo
    return db.prepare('SELECT * FROM Photo WHERE id = ?').get(result.lastInsertRowid)
  } catch (error) {
    throw new AppError(`Failed to create photo ${photoData.fileName}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Check if a photo with the given hash already exists
 * Used for duplicate detection during import
 * @param {string} fileHash - SHA-256 file hash
 * @returns {Promise<object|null>} Existing photo or null
 */
export async function findPhotoByHash(fileHash) {
  try {
    const db = getDatabase()

    const photo = db.prepare('SELECT * FROM Photo WHERE file_hash = ?').get(fileHash)

    return photo || null
  } catch (error) {
    throw new AppError('Failed to check for duplicate photo', 'DATABASE_ERROR', error)
  }
}

/**
 * Delete a photo by ID
 * @param {number} photoId - Photo ID to delete
 * @returns {Promise<object>} Deleted photo data (for cleanup)
 */
export async function deletePhoto(photoId) {
  try {
    const db = getDatabase()

    // Get photo data before deletion (for file cleanup)
    const photo = await getPhotoById(photoId)

    if (!photo) {
      throw new AppError('Photo not found', 'NOT_FOUND')
    }

    // Delete from database (triggers will update album)
    db.prepare('DELETE FROM Photo WHERE id = ?').run(photoId)

    // Delete physical files
    try {
      deletePhotoFile(photo.file_path)
      if (photo.thumbnail_path) {
        deleteThumbnail(photo.thumbnail_path)
      }
    } catch (fileError) {
      console.warn('Failed to delete photo files:', fileError)
      // Continue - database record is already deleted
    }

    return photo
  } catch (error) {
    throw new AppError(`Failed to delete photo ${photoId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Update photo display order within album
 * @param {number} photoId - Photo ID
 * @param {number} newOrder - New display order
 * @returns {Promise<void>}
 */
export async function updatePhotoOrder(photoId, newOrder) {
  try {
    const db = getDatabase()

    db.prepare('UPDATE Photo SET display_order = ? WHERE id = ?').run(newOrder, photoId)
  } catch (error) {
    throw new AppError(`Failed to update photo order for photo ${photoId}`, 'DATABASE_ERROR', error)
  }
}
