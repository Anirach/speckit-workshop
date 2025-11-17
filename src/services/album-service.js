/**
 * Album Service
 * Handles album CRUD operations and business logic
 */

import { query, queryOne, execute } from '../lib/database.js'
import { AppError } from '../lib/errors.js'
import { deletePhoto as deletePhotoFile, deleteThumbnail } from '../lib/file-system.js'

/**
 * Get all albums ordered by custom position or date
 * @returns {Promise<Array>} Array of album objects with metadata
 */
export async function getAllAlbums() {
  try {
    // Get all albums from IndexedDB
    const albums = await query('Album', {
      orderBy: (a, b) => {
        // Sort by year-month descending (newest first)
        const aScore = a.year * 12 + a.month
        const bScore = b.year * 12 + b.month
        return bScore - aScore
      }
    })

    return albums
  } catch (error) {
    throw new AppError('Failed to retrieve albums', 'DATABASE_ERROR', error)
  }
}

/**
 * Get a single album by ID with metadata
 * @param {number} albumId - Album ID
 * @returns {Promise<object|null>} Album object or null if not found
 */
export async function getAlbumById(albumId) {
  try {
    const album = await queryOne('Album', albumId)
    return album || null
  } catch (error) {
    throw new AppError(`Failed to retrieve album ${albumId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Get or create an album for a given year and month
 * Used during photo import
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {Promise<object>} Album object (existing or newly created)
 */
export async function getOrCreateAlbum(year, month) {
  try {
    // Check if album exists
    const existing = await queryOne('Album', {
      where: (album) => album.year === year && album.month === month
    })

    if (existing) {
      return existing
    }

    // Create new album
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    const title = `${monthNames[month - 1]} ${year}`

    const now = new Date().toISOString()
    const album = {
      title,
      year,
      month,
      cover_photo_id: null,
      photo_count: 0,
      date_range_start: null,
      date_range_end: null,
      created_at: now,
      updated_at: now
    }

    const result = await execute('Album', 'add', album)
    album.id = result.lastInsertRowid

    return album
  } catch (error) {
    throw new AppError(
      `Failed to get or create album for ${year}-${month}`,
      'DATABASE_ERROR',
      error
    )
  }
}

/**
 * Update album order positions
 * Used for drag-and-drop reordering
 * @param {number} albumId - Album to reorder
 * @param {number} newPosition - New position (0-based)
 * @returns {Promise<void>}
 */
export async function updateAlbumOrder(albumId, newPosition) {
  try {
    // Get current position
    const current = await queryOne('AlbumOrder', albumId)
    const oldPosition = current?.position

    if (oldPosition !== undefined && oldPosition !== newPosition) {
      // Get all album orders
      const orders = await query('AlbumOrder')

      // Shift positions
      if (newPosition > oldPosition) {
        // Moving down: shift albums between [oldPosition+1, newPosition] left by 1
        for (const order of orders) {
          if (order.position > oldPosition && order.position <= newPosition) {
            order.position -= 1
            await execute('AlbumOrder', 'put', order)
          }
        }
      } else if (newPosition < oldPosition) {
        // Moving up: shift albums between [newPosition, oldPosition-1] right by 1
        for (const order of orders) {
          if (order.position >= newPosition && order.position < oldPosition) {
            order.position += 1
            await execute('AlbumOrder', 'put', order)
          }
        }
      }

      // Update target album position
      current.position = newPosition
      current.updated_at = new Date().toISOString()
      await execute('AlbumOrder', 'put', current)
    } else if (oldPosition === undefined) {
      // First time reordering - create AlbumOrder record
      const orders = await query('AlbumOrder')
      
      // Shift existing albums at/after newPosition
      for (const order of orders) {
        if (order.position >= newPosition) {
          order.position += 1
          await execute('AlbumOrder', 'put', order)
        }
      }

      // Insert new order record
      await execute('AlbumOrder', 'add', {
        album_id: albumId,
        position: newPosition,
        updated_at: new Date().toISOString()
      })
    }
  } catch (error) {
    throw new AppError(`Failed to update album order for album ${albumId}`, 'DATABASE_ERROR', error)
  }
}

/**
 * Delete an album and all its photos
 * @param {number} albumId - Album ID to delete
 * @returns {Promise<void>}
 */
export async function deleteAlbum(albumId) {
  try {
    // Get all photos in album before deletion (for file cleanup)
    const photos = await query('Photo', {
      where: (photo) => photo.album_id === albumId
    })

    // Delete album from database
    await execute('Album', 'delete', albumId)

    // Delete all photos in this album
    for (const photo of photos) {
      await execute('Photo', 'delete', photo.id)
      
      // Delete physical files
      try {
        await deletePhotoFile(photo.file_path)
        if (photo.thumbnail_path) {
          await deleteThumbnail(photo.thumbnail_path)
        }
      } catch (fileError) {
        console.warn(`Failed to delete files for photo ${photo.id}:`, fileError)
        // Continue with next photo
      }
    }

    // Delete album order if exists
    try {
      await execute('AlbumOrder', 'delete', albumId)
    } catch (err) {
      // Ignore if doesn't exist
    }
  } catch (error) {
    throw new AppError(`Failed to delete album ${albumId}`, 'DATABASE_ERROR', error)
  }
}
