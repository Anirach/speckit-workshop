/**
 * Progress Indicator UI
 * Shows import progress with percentage and file counts
 */

/**
 * Show progress modal with initial state
 * @param {Object} session - Import session object
 */
export function showProgress(session) {
  // Remove existing modal if present
  hideProgress()

  // Create modal HTML
  const modal = document.createElement('div')
  modal.id = 'import-progress'
  modal.className = 'progress-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-labelledby', 'progress-title')
  modal.setAttribute('aria-live', 'polite')

  modal.innerHTML = `
    <div class="progress-content">
      <h2 id="progress-title">Importing Photos</h2>
      <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <p class="progress-text">
        <span class="progress-current">0</span> / <span class="progress-total">${session.total_files}</span> photos
        (<span class="progress-percent">0%</span>)
      </p>
      <p class="progress-details">
        ✓ <span class="imported-count">0</span> imported
        ⊘ <span class="duplicate-count">0</span> duplicates
        ✗ <span class="error-count">0</span> errors
      </p>
    </div>
  `

  document.body.appendChild(modal)

  // Update with initial session data
  updateProgress(session)
}

/**
 * Update progress UI with current import state
 * @param {Object} session - Import session object
 */
export function updateProgress(session) {
  const modal = document.getElementById('import-progress')
  if (!modal) return

  const percent =
    session.total_files > 0 ? Math.round((session.processed_files / session.total_files) * 100) : 0

  // Update progress bar
  const progressBar = modal.querySelector('.progress-bar')
  const progressFill = modal.querySelector('.progress-fill')

  progressFill.style.width = `${percent}%`
  progressBar.setAttribute('aria-valuenow', percent)

  // Update text
  modal.querySelector('.progress-current').textContent = session.processed_files
  modal.querySelector('.progress-total').textContent = session.total_files
  modal.querySelector('.progress-percent').textContent = `${percent}%`

  // Update details
  modal.querySelector('.imported-count').textContent = session.imported_count
  modal.querySelector('.duplicate-count').textContent = session.duplicate_count
  modal.querySelector('.error-count').textContent = session.error_count

  // Update title if completed
  if (session.processed_files === session.total_files) {
    const title = modal.querySelector('#progress-title')
    if (session.error_count > 0) {
      title.textContent = 'Import Completed with Errors'
    } else {
      title.textContent = 'Import Completed Successfully'
    }
  }
}

/**
 * Hide progress modal
 */
export function hideProgress() {
  const modal = document.getElementById('import-progress')
  if (modal) {
    modal.remove()
  }
}

/**
 * Show completion message and auto-hide after delay
 * @param {Object} session - Completed import session
 * @param {number} delay - Auto-hide delay in milliseconds (default 2000)
 */
export function showCompletionMessage(session, delay = 2000) {
  updateProgress(session)

  // Auto-hide after delay
  setTimeout(() => {
    hideProgress()
  }, delay)
}

/**
 * Show error message in progress modal
 * @param {string} errorMessage - Error message to display
 */
export function showProgressError(errorMessage) {
  const modal = document.getElementById('import-progress')
  if (!modal) return

  const title = modal.querySelector('#progress-title')
  title.textContent = 'Import Failed'
  title.style.color = '#f44336'

  const progressText = modal.querySelector('.progress-text')
  progressText.innerHTML = `<strong style="color: #f44336">${errorMessage}</strong>`

  // Add close button
  const content = modal.querySelector('.progress-content')
  const existingButton = content.querySelector('.close-button')

  if (!existingButton) {
    const closeButton = document.createElement('button')
    closeButton.className = 'btn btn-secondary close-button'
    closeButton.textContent = 'Close'
    closeButton.onclick = hideProgress
    content.appendChild(closeButton)
  }
}
