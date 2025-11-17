/**
 * Photo Album Organizer - Main Entry Point
 * Application initialization logic
 */

import { initNavigation, registerRoute, navigateTo } from './ui/navigation.js'
import { handleError } from './lib/errors.js'

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

    // Check if database exists
    // Note: Database operations are Node.js only, so we'll need a backend API
    // For now, just initialize UI

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

  // Render album list
  main.innerHTML = `
    <div id="album-list-container">
      <div class="page-header">
        <h1>My Photo Albums</h1>
        <button id="import-button" class="btn btn-primary">Import Photos</button>
      </div>
      <div id="album-list" class="album-grid" role="list" aria-label="Photo albums">
        <!-- Album cards will be rendered here -->
        <div class="empty-state">
          <p>No albums yet. Import photos to get started!</p>
        </div>
      </div>
    </div>
  `

  // Attach import button handler
  const importButton = document.getElementById('import-button')
  if (importButton) {
    importButton.addEventListener('click', handleImportClick)
  }

  // TODO: Load and render albums from database
}

/**
 * Handle album detail route (/album/:id)
 * @param {Object} params - Route parameters
 */
async function handleAlbumDetailRoute(params) {
  console.log('Route: Album Detail', params)

  const albumId = params.id

  // Clear main content
  const main = document.getElementById('main-content')
  if (!main) {
    console.error('Main content element not found')
    return
  }

  // Render photo grid
  main.innerHTML = `
    <div id="album-detail-container">
      <div class="page-header">
        <button id="back-button" class="btn btn-secondary">← Back to Albums</button>
        <h1 id="album-title">Album ${albumId}</h1>
        <button id="delete-album-button" class="btn btn-danger">Delete Album</button>
      </div>
      <div id="photo-grid" class="photo-grid" role="list" aria-label="Album photos">
        <!-- Photo tiles will be rendered here -->
        <div class="empty-state">
          <p>No photos in this album.</p>
        </div>
      </div>
    </div>
  `

  // Attach back button handler
  const backButton = document.getElementById('back-button')
  if (backButton) {
    backButton.addEventListener('click', () => navigateTo('/'))
  }

  // TODO: Load and render photos from database
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
