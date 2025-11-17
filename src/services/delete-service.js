/**
 * Delete Service
 * Handles photo and album deletion with user confirmation
 */

import { deletePhoto } from './photo-service.js'
import { deleteAlbum, getAlbumById } from './album-service.js'
import { showConfirmation } from '../ui/modal.js'
import { AppError } from '../lib/errors.js'

/**
 * Delete a photo with user confirmation
 * @param {number} photoId - Photo ID to delete
 * @param {string} photoName - Photo filename for display
 * @returns {Promise<boolean>} True if deleted, false if canceled
 */
export async function deletePhotoWithConfirmation(photoId, photoName) {
  try {
    const confirmed = await showConfirmation(
      'Delete Photo?',
      `This will permanently delete "${photoName}". This action cannot be undone.`
    )

    if (!confirmed) {
      return false
    }

    await deletePhoto(photoId)
    return true
  } catch (error) {
    throw new AppError(`Failed to delete photo ${photoName}`, 'DELETE_FAILED', error)
  }
}

/**
 * Delete an album with user confirmation
 * @param {number} albumId - Album ID to delete
 * @returns {Promise<boolean>} True if deleted, false if canceled
 */
export async function deleteAlbumWithConfirmation(albumId) {
  try {
    // Get album details for confirmation message
    const album = await getAlbumById(albumId)

    if (!album) {
      throw new AppError('Album not found', 'NOT_FOUND')
    }

    const photoText = album.photo_count === 1 ? 'photo' : 'photos'
    const confirmed = await showConfirmation(
      'Delete Album?',
      `This will permanently delete "${album.title}" and all ${album.photo_count} ${photoText}. This action cannot be undone.`
    )

    if (!confirmed) {
      return false
    }

    await deleteAlbum(albumId)
    return true
  } catch (error) {
    throw new AppError(`Failed to delete album ${albumId}`, 'DELETE_FAILED', error)
  }
}
