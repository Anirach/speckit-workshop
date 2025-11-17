/**
 * Confirmation Modal Component
 * Shows confirmation dialog for destructive actions
 */

/**
 * Show confirmation modal and return user's choice
 * @param {string} title - Modal title (e.g., "Delete Album?")
 * @param {string} message - Detailed message
 * @returns {Promise<boolean>} True if confirmed, false if canceled
 */
export function showConfirmation(title, message) {
  return new Promise(resolve => {
    // Create modal elements
    const modal = document.createElement('div')
    modal.id = 'confirm-modal'
    modal.className = 'modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-labelledby', 'modal-title')
    modal.setAttribute('aria-modal', 'true')

    modal.innerHTML = `
      <div class="modal-content">
        <h2 id="modal-title">${escapeHtml(title)}</h2>
        <p id="modal-message">${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
          <button id="modal-confirm" class="btn btn-danger">Delete</button>
        </div>
      </div>
    `

    // Append to body
    document.body.appendChild(modal)

    // Focus management - save previously focused element
    const previouslyFocused = document.activeElement

    // Get button elements
    const cancelBtn = modal.querySelector('#modal-cancel')
    const confirmBtn = modal.querySelector('#modal-confirm')

    // Focus confirm button by default
    confirmBtn.focus()

    // Handle cancel
    const handleCancel = () => {
      cleanup()
      resolve(false)
    }

    // Handle confirm
    const handleConfirm = () => {
      cleanup()
      resolve(true)
    }

    // Handle escape key
    const handleKeydown = e => {
      if (e.key === 'Escape') {
        handleCancel()
      } else if (e.key === 'Tab') {
        // Trap focus within modal
        trapFocus(e, modal)
      }
    }

    // Handle click outside modal
    const handleBackdropClick = e => {
      if (e.target === modal) {
        handleCancel()
      }
    }

    // Attach event listeners
    cancelBtn.addEventListener('click', handleCancel)
    confirmBtn.addEventListener('click', handleConfirm)
    document.addEventListener('keydown', handleKeydown)
    modal.addEventListener('click', handleBackdropClick)

    // Cleanup function
    function cleanup() {
      document.removeEventListener('keydown', handleKeydown)
      modal.removeEventListener('click', handleBackdropClick)
      modal.remove()

      // Restore focus to previously focused element
      if (previouslyFocused) {
        previouslyFocused.focus()
      }
    }
  })
}

/**
 * Trap focus within modal for accessibility
 * @param {KeyboardEvent} e - Keyboard event
 * @param {HTMLElement} modal - Modal element
 */
function trapFocus(e, modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (e.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
