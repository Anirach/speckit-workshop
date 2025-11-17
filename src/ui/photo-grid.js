/**
 * Photo Grid UI Component
 * Displays grid of photo thumbnails with lazy loading
 */

import { navigateTo } from './navigation.js'
import { deletePhotoWithConfirmation } from '../services/delete-service.js'

// IntersectionObserver for lazy loading
let imageObserver = null

/**
 * Initialize lazy loading observer
 */
function initLazyLoading() {
  if (imageObserver) return

  const options = {
    root: null,
    rootMargin: '200px', // Start loading 200px before entering viewport
    threshold: 0.01
  }

  imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        const src = img.getAttribute('data-src')

        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      }
    })
  }, options)
}

/**
 * Render photo grid from array of photos
 * @param {Array} photos - Array of photo objects
 * @param {object} album - Album data (for header)
 */
export function renderPhotoGrid(photos, album) {
  const container = document.getElementById('photo-grid-container')

  if (!container) {
    console.error('Photo grid container not found')
    return
  }

  // Clear existing content
  container.innerHTML = ''

  // Add album header with back button
  const header = createAlbumHeader(album)
  container.appendChild(header)

  // Create grid container
  const grid = document.createElement('div')
  grid.id = 'photo-grid'
  grid.className = 'photo-grid'
  grid.setAttribute('role', 'list')
  grid.setAttribute('aria-label', `Photos in ${album.title}`)

  // Handle empty album
  if (!photos || photos.length === 0) {
    const emptyState = document.createElement('div')
    emptyState.className = 'empty-state'
    emptyState.innerHTML = `
      <p>No photos in this album yet.</p>
    `
    grid.appendChild(emptyState)
    container.appendChild(grid)
    return
  }

  // Initialize lazy loading
  initLazyLoading()

  // Create photo tiles
  photos.forEach(photo => {
    const tile = createPhotoTile(photo)
    grid.appendChild(tile)
  })

  container.appendChild(grid)
}

/**
 * Create album header with back button and info
 * @param {object} album - Album data
 * @returns {HTMLElement} Header element
 */
function createAlbumHeader(album) {
  const header = document.createElement('div')
  header.className = 'album-header'

  const backButton = document.createElement('button')
  backButton.className = 'btn btn-back'
  backButton.setAttribute('aria-label', 'Back to albums')
  backButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Back to Albums
  `
  backButton.addEventListener('click', () => {
    navigateTo('/')
  })

  const info = document.createElement('div')
  info.className = 'album-header-info'

  const title = document.createElement('h1')
  title.className = 'album-header-title'
  title.textContent = album.title

  const count = document.createElement('p')
  count.className = 'album-header-count'
  count.textContent = `${album.photo_count} photo${album.photo_count !== 1 ? 's' : ''}`

  info.appendChild(title)
  info.appendChild(count)

  header.appendChild(backButton)
  header.appendChild(info)

  return header
}

/**
 * Create a single photo tile element
 * @param {object} photo - Photo data
 * @returns {HTMLElement} Photo tile element
 */
export function createPhotoTile(photo) {
  const tile = document.createElement('div')
  tile.className = 'photo-tile'
  tile.setAttribute('data-photo-id', photo.id)
  tile.setAttribute('role', 'listitem')
  tile.setAttribute('tabindex', '0')

  // Create image element with lazy loading
  const img = document.createElement('img')
  img.className = 'photo-tile-img lazy'
  img.alt = `Photo taken on ${formatPhotoDate(photo.date_taken)}`
  img.width = 300
  img.height = 300

  // Use lazy loading via IntersectionObserver
  if (photo.thumbnail_path) {
    img.setAttribute('data-src', photo.thumbnail_path)
    // Show placeholder while loading
    img.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E'

    // Start observing for lazy load
    if (imageObserver) {
      imageObserver.observe(img)
    }
  } else {
    // No thumbnail - show placeholder
    img.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo preview%3C/text%3E%3C/svg%3E'
  }

  // Create overlay with photo info
  const overlay = document.createElement('div')
  overlay.className = 'photo-overlay'

  const dateSpan = document.createElement('span')
  dateSpan.className = 'photo-date'
  dateSpan.textContent = formatPhotoDate(photo.date_taken)

  overlay.appendChild(dateSpan)

  // Add camera info if available
  if (photo.camera_model) {
    const cameraSpan = document.createElement('span')
    cameraSpan.className = 'photo-camera'
    cameraSpan.textContent = photo.camera_model
    overlay.appendChild(cameraSpan)
  }

  // Add delete button
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'photo-delete-btn'
  deleteBtn.setAttribute('aria-label', `Delete ${photo.file_name}`)
  deleteBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
    </svg>
  `
  deleteBtn.addEventListener('click', async e => {
    e.stopPropagation() // Prevent photo viewer from opening
    await handlePhotoDelete(photo)
  })

  overlay.appendChild(deleteBtn)

  // Assemble tile
  tile.appendChild(img)
  tile.appendChild(overlay)

  // Add click handler (for future photo viewer)
  tile.addEventListener('click', () => {
    console.log('Photo viewer - to be implemented', photo)
    // TODO: Open full-size photo viewer
  })

  // Keyboard navigation
  tile.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      console.log('Photo viewer - to be implemented', photo)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      handlePhotoDelete(photo)
    }
  })

  return tile
}

/**
 * Format photo date for display
 * @param {string} dateString - ISO8601 date string
 * @returns {string} Formatted date
 */
function formatPhotoDate(dateString) {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return 'Unknown date'
  }
}

/**
 * Handle photo deletion
 * @param {object} photo - Photo to delete
 */
async function handlePhotoDelete(photo) {
  try {
    const deleted = await deletePhotoWithConfirmation(photo.id, photo.file_name)

    if (deleted) {
      // Remove photo tile from DOM
      const tile = document.querySelector(`[data-photo-id="${photo.id}"]`)
      if (tile) {
        tile.remove()
      }

      // Update photo count in header
      const countElement = document.querySelector('.album-header-count')
      if (countElement) {
        const currentText = countElement.textContent
        const currentCount = parseInt(currentText.match(/\d+/)?.[0] || 0)
        const newCount = currentCount - 1

        if (newCount === 0) {
          // No photos left - navigate back to album list
          navigateTo('/')
        } else {
          countElement.textContent = `${newCount} photo${newCount !== 1 ? 's' : ''}`
        }
      }
    }
  } catch (error) {
    console.error('Failed to delete photo:', error)
    alert(`Failed to delete photo: ${error.message}`)
  }
}

/**
 * Cleanup lazy loading observer
 */
export function cleanupPhotoGrid() {
  if (imageObserver) {
    imageObserver.disconnect()
    imageObserver = null
  }
}
