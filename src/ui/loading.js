/**
 * Loading State UI Components
 * Provides spinners and skeleton screens for async operations
 */

/**
 * Show loading spinner overlay
 * @param {string} message - Optional loading message
 * @returns {HTMLElement} Loading overlay element
 */
export function showLoadingSpinner(message = 'Loading...') {
  // Remove existing spinner if present
  hideLoadingSpinner()

  const spinner = document.createElement('div')
  spinner.id = 'loading-spinner'
  spinner.className = 'loading-overlay'
  spinner.setAttribute('role', 'status')
  spinner.setAttribute('aria-live', 'polite')

  spinner.innerHTML = `
    <div class="loading-content">
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading-message">${message}</p>
    </div>
  `

  document.body.appendChild(spinner)
  return spinner
}

/**
 * Hide loading spinner overlay
 */
export function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner')
  if (spinner) {
    spinner.remove()
  }
}

/**
 * Update loading spinner message
 * @param {string} message - New loading message
 */
export function updateLoadingMessage(message) {
  const spinner = document.getElementById('loading-spinner')
  if (spinner) {
    const messageEl = spinner.querySelector('.loading-message')
    if (messageEl) {
      messageEl.textContent = message
    }
  }
}

/**
 * Create skeleton screen for album grid
 * @param {number} count - Number of skeleton cards to show
 * @returns {HTMLElement} Skeleton container
 */
export function createAlbumSkeleton(count = 6) {
  const container = document.createElement('div')
  container.className = 'album-grid skeleton-grid'
  container.setAttribute('aria-label', 'Loading albums')

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div')
    skeleton.className = 'album-card skeleton-card'
    skeleton.innerHTML = `
      <div class="skeleton-cover"></div>
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `
    container.appendChild(skeleton)
  }

  return container
}

/**
 * Create skeleton screen for photo grid
 * @param {number} count - Number of skeleton tiles to show
 * @returns {HTMLElement} Skeleton container
 */
export function createPhotoSkeleton(count = 12) {
  const container = document.createElement('div')
  container.className = 'photo-grid skeleton-grid'
  container.setAttribute('aria-label', 'Loading photos')

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div')
    skeleton.className = 'photo-tile skeleton-tile'
    skeleton.innerHTML = '<div class="skeleton-photo"></div>'
    container.appendChild(skeleton)
  }

  return container
}

/**
 * Show inline loading state in a container
 * @param {HTMLElement} container - Container to show loading in
 * @param {string} type - 'albums' or 'photos'
 * @param {number} count - Number of skeleton items
 */
export function showInlineLoading(container, type = 'albums', count = 6) {
  container.innerHTML = ''

  const skeleton = type === 'photos' ? createPhotoSkeleton(count) : createAlbumSkeleton(count)

  container.appendChild(skeleton)
}

/**
 * Show loading state for a specific element
 * @param {HTMLElement} element - Element to apply loading state to
 */
export function setElementLoading(element) {
  element.classList.add('is-loading')
  element.setAttribute('aria-busy', 'true')
}

/**
 * Remove loading state from element
 * @param {HTMLElement} element - Element to remove loading state from
 */
export function clearElementLoading(element) {
  element.classList.remove('is-loading')
  element.setAttribute('aria-busy', 'false')
}

/**
 * Create a loading button state
 * @param {HTMLButtonElement} button - Button to set loading
 * @param {string} loadingText - Optional text to show while loading
 */
export function setButtonLoading(button, loadingText = 'Loading...') {
  if (button.hasAttribute('data-loading')) return

  const originalText = button.textContent
  button.setAttribute('data-original-text', originalText)
  button.setAttribute('data-loading', 'true')
  button.disabled = true
  button.textContent = loadingText
  button.classList.add('btn-loading')
}

/**
 * Clear loading button state
 * @param {HTMLButtonElement} button - Button to clear loading from
 */
export function clearButtonLoading(button) {
  if (!button.hasAttribute('data-loading')) return

  const originalText = button.getAttribute('data-original-text')
  button.textContent = originalText
  button.removeAttribute('data-original-text')
  button.removeAttribute('data-loading')
  button.disabled = false
  button.classList.remove('btn-loading')
}

/**
 * Wrap an async function with loading state
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Options { spinner: boolean, message: string }
 * @returns {Function} Wrapped function
 */
export function withLoading(asyncFn, options = {}) {
  return async (...args) => {
    const { spinner = true, message = 'Loading...' } = options

    try {
      if (spinner) {
        showLoadingSpinner(message)
      }
      return await asyncFn(...args)
    } finally {
      if (spinner) {
        hideLoadingSpinner()
      }
    }
  }
}
