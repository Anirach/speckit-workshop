/**
 * Album List UI Component
 * Displays grid of album cards with drag-and-drop reordering
 */

import { navigateTo } from './navigation.js'
import {
  initializeDragDrop,
  attachDragHandlers as attachDragHandlersInternal
} from './drag-drop.js'
import { importPhotosParallel } from '../services/import-service.js'
import { updateProgress, showCompletionMessage, showProgressError } from './progress.js'
import { deleteAlbumWithConfirmation } from '../services/delete-service.js'

/**
 * Render album list grid
 * @param {Array} albums - Array of album objects
 */
export function renderAlbumList(albums) {
  const container = document.getElementById('album-list')

  if (!container) {
    console.error('Album list container not found')
    return
  }

  // Clear existing content
  container.innerHTML = ''

  // Handle empty state
  if (!albums || albums.length === 0) {
    renderEmptyState(container)
    return
  }

  // Set ARIA attributes
  container.setAttribute('role', 'list')
  container.setAttribute('aria-label', 'Photo albums')

  // Initialize drag-and-drop for container
  initializeDragDrop(container)

  // Create album cards
  albums.forEach(album => {
    const card = createAlbumCard(album)
    attachDragHandlers(card) // Attach drag handlers to each card
    container.appendChild(card)
  })
}

/**
 * Create a single album card element
 * @param {object} album - Album data
 * @returns {HTMLElement} Album card element
 */
export function createAlbumCard(album) {
  const card = document.createElement('div')
  card.className = 'album-card'
  card.setAttribute('data-album-id', album.id)
  card.setAttribute('role', 'listitem')
  card.setAttribute('tabindex', '0')

  // Create cover image
  const cover = document.createElement('div')
  cover.className = 'album-cover'

  if (album.cover_thumbnail_path) {
    const img = document.createElement('img')
    img.src = album.cover_thumbnail_path
    img.alt = `${album.title} album cover`
    img.loading = 'lazy'
    cover.appendChild(img)
  } else {
    // Empty album placeholder
    const placeholder = document.createElement('div')
    placeholder.className = 'album-placeholder'
    placeholder.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    `
    cover.appendChild(placeholder)
  }

  // Create album info
  const info = document.createElement('div')
  info.className = 'album-info'

  const title = document.createElement('h3')
  title.className = 'album-title'
  title.textContent = album.title

  const count = document.createElement('p')
  count.className = 'album-count'
  count.textContent = `${album.photo_count} photo${album.photo_count !== 1 ? 's' : ''}`

  // Add date range if available
  if (album.date_range_start && album.date_range_end) {
    const dateRange = document.createElement('p')
    dateRange.className = 'album-date-range'

    const startDate = new Date(album.date_range_start)
    const endDate = new Date(album.date_range_end)

    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    dateRange.textContent = start === end ? start : `${start} - ${end}`
    info.appendChild(title)
    info.appendChild(count)
    info.appendChild(dateRange)
  } else {
    info.appendChild(title)
    info.appendChild(count)
  }

  // Add delete button
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'album-delete-btn'
  deleteBtn.setAttribute('aria-label', `Delete ${album.title}`)
  deleteBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
    </svg>
  `
  deleteBtn.addEventListener('click', async e => {
    e.stopPropagation() // Prevent navigation to album
    await handleAlbumDelete(album)
  })

  // Assemble card
  card.appendChild(cover)
  card.appendChild(info)
  card.appendChild(deleteBtn)

  // Add click handler to navigate to album
  card.addEventListener('click', e => {
    // Don't navigate if dragging
    if (card.classList.contains('dragging')) {
      return
    }
    e.preventDefault()
    navigateTo(`/album/${album.id}`)
  })

  // Add keyboard navigation
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigateTo(`/album/${album.id}`)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      handleAlbumDelete(album)
    }
  })

  return card
}

/**
 * Render empty state when no albums exist
 * @param {HTMLElement} container - Container element
 */
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      <svg class="empty-icon" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <h2 class="empty-title">No Albums Yet</h2>
      <p class="empty-description">
        Import photos to automatically create albums organized by date.
      </p>
      <button class="btn btn-primary import-button" aria-label="Import photos">
        Import Photos
      </button>
    </div>
  `

  // Add import button handler
  const importButton = container.querySelector('.import-button')
  if (importButton) {
    importButton.addEventListener('click', handleImportClick)
  }
}

/**
 * Attach drag-and-drop handlers to album card
 * @param {HTMLElement} cardElement - Album card element
 */
export function attachDragHandlers(cardElement) {
  attachDragHandlersInternal(cardElement)
}

/**
 * Handle album deletion
 * @param {object} album - Album to delete
 */
async function handleAlbumDelete(album) {
  try {
    const deleted = await deleteAlbumWithConfirmation(album.id)

    if (deleted) {
      // Remove album card from DOM
      const card = document.querySelector(`[data-album-id="${album.id}"]`)
      if (card) {
        card.remove()
      }

      // Check if there are any albums left
      const remainingCards = document.querySelectorAll('.album-card')
      if (remainingCards.length === 0) {
        // Show empty state
        const container = document.getElementById('album-list')
        if (container) {
          renderEmptyState(container)
        }
      }
    }
  } catch (error) {
    console.error('Failed to delete album:', error)
    alert(`Failed to delete album: ${error.message}`)
  }
}

/**
 * Handle import button click - trigger file picker
 */
async function handleImportClick() {
  // Create file input element
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/jpeg,image/png,image/heic,image/heif'
  fileInput.multiple = true

  fileInput.addEventListener('change', async e => {
    const files = Array.from(e.target.files)

    if (files.length === 0) {
      return
    }

    // Validate file formats
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
      return validTypes.includes(file.type)
    })

    if (validFiles.length === 0) {
      alert('No valid photo files selected. Supported formats: JPEG, PNG, HEIC')
      return
    }

    if (validFiles.length < files.length) {
      const skipped = files.length - validFiles.length
      alert(
        `${skipped} file(s) skipped (unsupported format). Importing ${validFiles.length} photos.`
      )
    }

    // Start import
    await importPhotosWithProgress(validFiles)
  })

  // Trigger file picker
  fileInput.click()
}

/**
 * Import photos with progress UI
 * @param {File[]} files - Array of File objects
 */
async function importPhotosWithProgress(files) {
  try {
    // Import photos with progress tracking
    const session = await importPhotosParallel(
      files,
      updatedSession => {
        updateProgress(updatedSession)
      },
      'storage/photos',
      'storage/thumbnails',
      5 // Batch size: 5 photos in parallel
    )

    // Show completion message
    showCompletionMessage(session, 3000)

    // Refresh album list after import
    setTimeout(() => {
      window.location.reload() // Simple refresh for now
    }, 3000)
  } catch (error) {
    console.error('Import failed:', error)
    showProgressError(error.message || 'Import failed. Please try again.')
  }
}

/**
 * Add import button to existing album list
 * This can be called to add an import button even when albums exist
 */
export function addImportButton() {
  const container = document.getElementById('album-list')
  if (!container) return

  // Check if button already exists
  const existingButton = container.querySelector('.floating-import-button')
  if (existingButton) return

  // Create floating import button
  const button = document.createElement('button')
  button.className = 'btn btn-primary floating-import-button'
  button.setAttribute('aria-label', 'Import photos')
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    Import Photos
  `
  button.addEventListener('click', handleImportClick)

  container.appendChild(button)
}
