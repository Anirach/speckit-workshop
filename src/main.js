/**
 * Photo Album Organizer - Main Entry Point
 * Application initialization logic
 */

import { initNavigation, registerRoute, navigateTo } from './ui/navigation.js'
import { handleError } from './lib/errors.js'
import { renderAlbumList } from './ui/album-list.js'
import { renderPhotoGrid, cleanupPhotoGrid } from './ui/photo-grid.js'
import { getAllAlbums, getAlbumById } from './services/album-service.js'
import { getPhotosInAlbum } from './services/photo-service.js'

/**
 * Initialize application
 */
async function init() {
  try {
    console.log('Photo Album Organizer - Initializing...')

    // Initialize navigation system
    initNavigation()

    // Register routes
    registerRoute('/', handleAlbumListRoute)
    registerRoute('/album/:id', handleAlbumDetailRoute)

    console.log('✓ Application initialized')
  } catch (error) {
    const userMessage = handleError(error, { context: 'Application initialization' })
    showError(userMessage)
  }
}

/**
 * Handle album list route (/)
 */
async function handleAlbumListRoute() {
  console.log('Route: Album List')

  // Clear main content
  const main = document.getElementById('main-content')
  if (!main) {
    console.error('Main content element not found')
    return
  }

  // Render container structure
  main.innerHTML = `
    <div id="album-list-container">
      <div class="page-header">
        <h1>My Photo Albums</h1>
        <button id="import-button" class="btn btn-primary" aria-label="Import photos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import Photos
        </button>
      </div>
      <div id="album-list" class="album-grid">
        <!-- Album cards will be rendered here -->
      </div>
    </div>
  `

  // Attach import button handler
  const importButton = document.getElementById('import-button')
  if (importButton) {
    importButton.addEventListener('click', handleImportClick)
  }

  // Load and render albums from database
  try {
    const albums = await getAllAlbums()
    renderAlbumList(albums)
  } catch (error) {
    const userMessage = handleError(error, { context: 'Loading albums' })
    showError(userMessage)

    // Show error state in UI
    const albumList = document.getElementById('album-list')
    if (albumList) {
      albumList.innerHTML = `
        <div class="error-state">
          <p>Failed to load albums. Please try again.</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `
    }
  }
}

/**
 * Handle album detail route (/album/:id)
 * @param {Object} params - Route parameters
 */
async function handleAlbumDetailRoute(params) {
  console.log('Route: Album Detail', params)

  const albumId = parseInt(params.id, 10)

  // Clear main content
  const main = document.getElementById('main-content')
  if (!main) {
    console.error('Main content element not found')
    return
  }

  // Cleanup previous photo grid observer
  cleanupPhotoGrid()

  // Render container structure (will be populated by renderPhotoGrid)
  main.innerHTML = `
    <div id="photo-grid-container">
      <!-- Photo grid will be rendered here -->
    </div>
  `

  // Load album and photos from database
  try {
    const album = await getAlbumById(albumId)

    if (!album) {
      showError('Album not found')
      navigateTo('/')
      return
    }

    const photos = await getPhotosInAlbum(albumId)

    // Render photo grid with album info
    renderPhotoGrid(photos, album)
  } catch (error) {
    const userMessage = handleError(error, { context: 'Loading album photos' })
    showError(userMessage)

    // Show error state in UI
    const container = document.getElementById('photo-grid-container')
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <p>Failed to load album. Please try again.</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `
    }
  }
}

/**
 * Handle import button click
 */
function handleImportClick() {
  console.log('Import photos clicked')
  // TODO: Implement file picker and import workflow
  showError('Photo import not yet implemented. Coming soon!')
}

/**
 * Show error message to user
 * @param {string} message - User-friendly error message
 */
function showError(message) {
  // Simple error display for now
  // TODO: Replace with proper toast notification component
  const errorDiv = document.createElement('div')
  errorDiv.className = 'error-toast'
  errorDiv.textContent = message
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 9999;
  `

  document.body.appendChild(errorDiv)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove()
  }, 5000)
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

export { init }
